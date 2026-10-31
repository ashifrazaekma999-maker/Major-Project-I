import express from 'express';
import { store } from '../dataStore.js';
import {
  hashPassword,
  verifyPassword,
  hashPin,
  verifyPin,
  generateToken,
  getClientIp
} from '../authUtils.js';
import { telemetryService } from '../services/telemetryService.js';

const router = express.Router();
export const activeSessions = new Map();

// Rate limiting state for login attempts: ip -> { count, firstAttempt }
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 10;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.lastActivity && (now - new Date(session.lastActivity).getTime() > SESSION_TIMEOUT_MS)) {
      activeSessions.delete(token);
      store.logAudit('SESSION_EXPIRED', session.user, { reason: 'Inactivity timeout (30m)' }, session.ip || '127.0.0.1');
    }
  }
}, 60 * 1000);

export function authenticateOfficer(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    // Check inactivity timeout
    const now = Date.now();
    if (session.lastActivity && (now - new Date(session.lastActivity).getTime() > SESSION_TIMEOUT_MS)) {
      activeSessions.delete(token);
      return null;
    }
    // Update last activity
    session.lastActivity = new Date().toISOString();
    return session.user;
  }

  return null;
}

// Middleware: Require Authenticated Officer
export function requireAuth(req, res, next) {
  const officer = authenticateOfficer(req);
  if (!officer) {
    return res.status(401).json({
      success: false,
      error: 'HTTP 401 Unauthorized: Valid officer session token required.'
    });
  }
  req.officer = officer;
  next();
}

/**
 * GET /api/auth/demo-officers
 * Returns list of seeded test accounts WITHOUT passwords or PINs.
 */
router.get('/demo-officers', (req, res) => {
  const officers = Array.from(store.users.values()).map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    department: u.department,
    departmentName: u.departmentName,
    avatar: u.avatar,
    status: u.status || 'ACTIVE'
  }));
  res.json({
    success: true,
    officers,
    notice: 'Test-only accounts. Standard test credential: Password@123 / PIN: 2618 (or 1234 for ADMIN)'
  });
});

/**
 * POST /api/auth/login
 * Validates credentials, checks approval status, issues secure session token
 */
router.post('/login', async (req, res) => {
  const { officerId, name, password, captchaAnswer, captchaExpected, pin } = req.body;
  const trustProxy = process.env.TRUST_PROXY === 'true';
  const ip = getClientIp(req, trustProxy);
  const userAgent = req.headers['user-agent'] || '';

  // Rate Limiting check
  const now = Date.now();
  const attemptInfo = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  if (now - attemptInfo.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    attemptInfo.count = 0;
    attemptInfo.firstAttempt = now;
  }
  attemptInfo.count++;
  loginAttempts.set(ip, attemptInfo);

  if (attemptInfo.count > MAX_ATTEMPTS) {
    store.logAudit('LOGIN_RATE_LIMITED', { id: officerId || 'UNKNOWN' }, { ip, attempts: attemptInfo.count }, ip);
    await telemetryService.recordLoginAttempt({
      officerId,
      ip,
      userAgent,
      status: 'RATE_LIMITED',
      failureReason: 'Rate limit threshold exceeded'
    });
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please wait 60 seconds before trying again.'
    });
  }

  // Security CAPTCHA verification
  if (captchaExpected && String(captchaAnswer).trim() !== String(captchaExpected).trim()) {
    store.logAudit('CAPTCHA_FAILED', { id: officerId }, { reason: 'Incorrect security CAPTCHA answer', ip }, ip);
    await telemetryService.recordLoginAttempt({
      officerId,
      ip,
      userAgent,
      status: 'FAILED_CAPTCHA',
      failureReason: 'Security CAPTCHA verification failed'
    });
    return res.status(400).json({ success: false, message: 'Security CAPTCHA verification failed.' });
  }

  let user = store.users.get(officerId);
  if (!user && name) {
    user = Array.from(store.users.values()).find(u => u.name.toLowerCase() === name.toLowerCase());
  }

  if (!user) {
    store.logAudit('LOGIN_FAILED', { id: officerId }, { reason: 'Unknown Officer ID', ip }, ip);
    await telemetryService.recordLoginAttempt({
      officerId,
      ip,
      userAgent,
      status: 'FAILED_CREDENTIALS',
      failureReason: 'Unknown Officer ID'
    });
    return res.status(401).json({ success: false, message: 'Invalid Officer Credentials or unregistered ID.' });
  }

  // Check account approval status
  if (user.status === 'PENDING_APPROVAL') {
    store.logAudit('LOGIN_REJECTED', user, { reason: 'Account pending administrator approval', ip }, ip);
    await telemetryService.recordLoginAttempt({
      officerId: user.id,
      officerName: user.name,
      departmentId: user.department,
      departmentName: user.departmentName,
      ip,
      userAgent,
      status: 'PENDING_APPROVAL',
      failureReason: 'Account pending administrator approval'
    });
    return res.status(403).json({
      success: false,
      message: 'Account pending approval. An authorized department administrator must approve your enrollment.'
    });
  }

  if (user.status === 'SUSPENDED' || user.status === 'REVOKED') {
    store.logAudit('LOGIN_REJECTED', user, { reason: `Account status is ${user.status}`, ip }, ip);
    await telemetryService.recordLoginAttempt({
      officerId: user.id,
      officerName: user.name,
      departmentId: user.department,
      departmentName: user.departmentName,
      ip,
      userAgent,
      status: 'ACCOUNT_SUSPENDED',
      failureReason: `Account status is ${user.status}`
    });
    return res.status(403).json({
      success: false,
      message: 'Access denied: Officer account has been deactivated or suspended.'
    });
  }

  // Password verification with hash support
  const passwordMatch = verifyPassword(password, user.password);
  if (!passwordMatch) {
    store.logAudit('LOGIN_FAILED', { id: user.id, name: user.name, department: user.department }, { reason: 'Incorrect password' }, ip);
    await telemetryService.recordLoginAttempt({
      officerId: user.id,
      officerName: user.name,
      departmentId: user.department,
      departmentName: user.departmentName,
      ip,
      userAgent,
      status: 'FAILED_CREDENTIALS',
      failureReason: 'Incorrect password'
    });
    return res.status(401).json({ success: false, message: 'Invalid password.' });
  }

  // PIN verification with hash support
  if (pin && user.pin) {
    const pinMatch = verifyPin(pin, user.pin);
    if (!pinMatch) {
      store.logAudit('PIN_FAILED', { id: user.id, name: user.name, department: user.department }, { reason: 'Incorrect 4-digit security PIN' }, ip);
      await telemetryService.recordLoginAttempt({
        officerId: user.id,
        officerName: user.name,
        departmentId: user.department,
        departmentName: user.departmentName,
        ip,
        userAgent,
        status: 'FAILED_PIN',
        failureReason: 'Incorrect 4-digit security PIN'
      });
      return res.status(401).json({ success: false, message: 'Invalid 4-digit NETRISH Security PIN.' });
    }
  }

  // Reset rate limiting on successful login
  loginAttempts.delete(ip);

  // Generate cryptographically secure session token
  const token = generateToken(user.id);
  const currentTime = new Date().toISOString();
  const sessionData = {
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      department: user.department,
      departmentName: user.departmentName,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      permissions: user.permissions || ['CASE_READ', 'ENTITY_SEARCH', 'TIMELINE_VIEW']
    },
    ip,
    loginTime: currentTime,
    lastActivity: currentTime
  };

  activeSessions.set(token, sessionData);
  store.logAudit('LOGIN_SUCCESS', user, { role: user.role, ip }, ip);

  await telemetryService.recordLoginAttempt({
    officerId: user.id,
    officerName: user.name,
    departmentId: user.department,
    departmentName: user.departmentName,
    ip,
    userAgent,
    status: 'SUCCESS',
    sessionId: token
  });

  res.json({
    success: true,
    token,
    user: sessionData.user,
    message: `Welcome, ${user.name}`
  });
});

/**
 * POST /api/auth/signup
 * New officer registration. Marked PENDING_APPROVAL unless valid department enrollment passkey is supplied.
 */
router.post('/signup', (req, res) => {
  const { officerId, name, email, phone, department, password, pin, captchaAnswer, captchaExpected, enrollmentKey } = req.body;
  const trustProxy = process.env.TRUST_PROXY === 'true';
  const ip = getClientIp(req, trustProxy);

  if (captchaExpected && String(captchaAnswer).trim() !== String(captchaExpected).trim()) {
    return res.status(400).json({ success: false, message: 'Security CAPTCHA verification failed.' });
  }

  if (!officerId || !name || !password || !pin) {
    return res.status(400).json({ success: false, message: 'All required registration fields (ID, Name, Password, PIN) must be filled.' });
  }

  if (store.users.has(officerId)) {
    return res.status(400).json({ success: false, message: 'Officer ID is already registered.' });
  }

  const deptId = department || 'D002';
  const deptName = store.getDepartmentName(deptId);

  // Check enrollment key
  const validEnrollmentKey = process.env.ENROLLMENT_PASSKEY || 'NETRISH-ENROLL-2026';
  const isAutoApproved = enrollmentKey && enrollmentKey.trim() === validEnrollmentKey;
  const status = isAutoApproved ? 'ACTIVE' : 'PENDING_APPROVAL';

  const newUser = {
    id: officerId,
    name,
    email: email || `${officerId.toLowerCase()}@police.gov.in`,
    phone: phone || '+91 98100-00000',
    role: 'Investigating Officer',
    department: deptId,
    departmentName: deptName,
    pin: hashPin(pin),
    password: hashPassword(password),
    status,
    createdAt: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    permissions: ['CASE_READ', 'ENTITY_SEARCH', 'TIMELINE_VIEW']
  };

  store.users.set(officerId, newUser);
  store.logAudit('OFFICER_ENROLLED', newUser, { department: newUser.department, status, ip }, ip);

  if (status === 'PENDING_APPROVAL') {
    return res.json({
      success: true,
      pendingApproval: true,
      message: `Enrollment submitted for Officer ${name} (${officerId}). Status: PENDING_APPROVAL. An administrator must approve your account before login.`
    });
  }

  // If approved with valid passkey, issue session token
  const token = generateToken(newUser.id);
  const currentTime = new Date().toISOString();
  const sessionData = {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      department: newUser.department,
      departmentName: newUser.departmentName,
      avatar: newUser.avatar,
      email: newUser.email,
      phone: newUser.phone,
      permissions: newUser.permissions
    },
    ip,
    loginTime: currentTime,
    lastActivity: currentTime
  };
  activeSessions.set(token, sessionData);

  res.json({
    success: true,
    token,
    user: sessionData.user,
    message: `Officer ${name} (${officerId}) enrolled and approved successfully.`
  });
});

/**
 * POST /api/auth/logout
 * Invalidates active session token on server
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  const trustProxy = process.env.TRUST_PROXY === 'true';
  const ip = getClientIp(req, trustProxy);

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    activeSessions.delete(token);
    store.logAudit('LOGOUT_SUCCESS', session.user, { ip }, ip);
  }

  res.json({ success: true, message: 'Logged out successfully. Session invalidated.' });
});

/**
 * GET /api/auth/session
 * Validates current session token
 */
router.get('/session', (req, res) => {
  const officer = authenticateOfficer(req);
  if (!officer) {
    return res.status(401).json({ success: false, message: 'Unauthenticated or session expired.' });
  }
  res.json({ success: true, user: officer });
});

/**
 * GET /api/auth/active-sessions
 * Real session monitor for authorized personnel
 */
router.get('/active-sessions', requireAuth, (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(s => ({
    officerId: s.user.id,
    officerName: s.user.name,
    role: s.user.role,
    department: s.user.department,
    departmentName: s.user.departmentName,
    loginTime: s.loginTime,
    lastActivity: s.lastActivity,
    ip: s.ip
  }));

  // Fetch recent auth events from real audit log
  const recentAuthEvents = store.auditTrail
    .filter(a => a.action.startsWith('LOGIN_') || a.action.startsWith('LOGOUT_') || a.action.startsWith('SESSION_') || a.action === 'CAPTCHA_FAILED')
    .slice(0, 15);

  res.json({
    success: true,
    activeCount: sessions.length,
    sessions,
    recentAuthEvents
  });
});

/**
 * POST /api/auth/approve-officer/:id
 * Admin endpoint to approve pending officer enrollment
 */
router.post('/approve-officer/:id', requireAuth, (req, res) => {
  if (req.officer.role !== 'Department Admin' && req.officer.role !== 'Security Guardian') {
    return res.status(403).json({ success: false, message: 'Only administrators may approve officer enrollments.' });
  }

  const targetUser = store.users.get(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'Officer not found.' });
  }

  targetUser.status = 'ACTIVE';
  targetUser.approvedBy = req.officer.id;
  targetUser.approvedAt = new Date().toISOString();

  store.logAudit('OFFICER_APPROVED', req.officer, { approvedOfficer: targetUser.id, department: targetUser.department });

  res.json({ success: true, message: `Officer ${targetUser.name} (${targetUser.id}) approved.` });
});

export default router;
