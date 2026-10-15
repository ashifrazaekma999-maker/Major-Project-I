import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();
export const activeSessions = new Map();

export function authenticateOfficer(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (token && activeSessions.has(token)) {
    return activeSessions.get(token).user;
  }

  const officerIdHeader = req.headers['x-officer-id'];
  if (officerIdHeader && store.users.has(officerIdHeader)) {
    return store.users.get(officerIdHeader);
  }

  return null;
}

function generateToken(userId) {
  return `NETRISH_SEC_TOKEN_${userId}_${Date.now()}`;
}

router.get('/demo-officers', (req, res) => {
  const officers = Array.from(store.users.values()).map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    department: u.department,
    departmentName: u.departmentName,
    avatar: u.avatar,
    pin: u.pin,
    defaultPassword: u.password
  }));
  res.json({ success: true, officers });
});

router.post('/login', (req, res) => {
  const { officerId, name, password, captchaAnswer, captchaExpected, pin } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  if (captchaExpected && String(captchaAnswer).trim() !== String(captchaExpected).trim()) {
    store.logAudit('CAPTCHA_FAILED', { id: officerId }, { reason: 'Incorrect security CAPTCHA answer', ip }, ip);
    return res.status(400).json({ success: false, message: 'Security CAPTCHA verification failed.' });
  }

  let user = store.users.get(officerId);
  if (!user && name) {
    user = Array.from(store.users.values()).find(u => u.name.toLowerCase() === name.toLowerCase());
  }

  if (!user) {
    store.logAudit('LOGIN_FAILED', { id: officerId }, { reason: 'Unknown Officer ID', ip }, ip);
    return res.status(401).json({ success: false, message: 'Invalid Officer Credentials or unregistered ID.' });
  }

  if (user.password !== password) {
    store.logAudit('LOGIN_FAILED', { id: user.id, name: user.name, department: user.department }, { reason: 'Incorrect password' }, ip);
    return res.status(401).json({ success: false, message: 'Invalid password.' });
  }

  if (pin && user.pin !== pin) {
    store.logAudit('PIN_FAILED', { id: user.id, name: user.name, department: user.department }, { reason: 'Incorrect 4-digit security PIN' }, ip);
    return res.status(401).json({ success: false, message: 'Invalid 4-digit NETRISH Security PIN.' });
  }

  const token = generateToken(user.id);
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
      phone: user.phone
    },
    loginTime: new Date().toISOString()
  };

  activeSessions.set(token, sessionData);
  store.logAudit('LOGIN_SUCCESS', user, { role: user.role, ip }, ip);

  res.json({
    success: true,
    token,
    user: sessionData.user,
    message: `Welcome, ${user.name}`
  });
});

router.post('/signup', (req, res) => {
  const { officerId, name, email, phone, department, password, pin, captchaAnswer, captchaExpected } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  if (captchaExpected && String(captchaAnswer).trim() !== String(captchaExpected).trim()) {
    return res.status(400).json({ success: false, message: 'Security CAPTCHA verification failed.' });
  }

  if (!officerId || !name || !password || !pin) {
    return res.status(400).json({ success: false, message: 'All required registration fields must be filled.' });
  }

  if (store.users.has(officerId)) {
    return res.status(400).json({ success: false, message: 'Officer ID is already registered.' });
  }

  const deptId = department || 'D002';
  const deptName = store.getDepartmentName(deptId);
  const newUser = {
    id: officerId,
    name,
    email: email || `${officerId.toLowerCase()}@cbi.gov.in`,
    phone: phone || '+91 98100-00000',
    role: 'Investigating Officer',
    department: deptId,
    departmentName: deptName,
    pin: pin || '1234',
    password: password || 'Password@123',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  };

  store.users.set(officerId, newUser);
  store.logAudit('OFFICER_ENROLLED', newUser, { department: newUser.department, phone: newUser.phone }, ip);

  const token = generateToken(newUser.id);
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
      phone: newUser.phone
    },
    loginTime: new Date().toISOString()
  };
  activeSessions.set(token, sessionData);

  res.json({
    success: true,
    token,
    user: sessionData.user,
    message: `Officer ${name} (${officerId}) enrolled successfully.`
  });
});

router.get('/session', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthenticated or session expired.' });
  }
  res.json({ success: true, session: activeSessions.get(token) });
});

export default router;
