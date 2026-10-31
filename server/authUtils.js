import crypto from 'crypto';

/**
 * Hash a password using crypto.scryptSync with a unique salt
 */
export function hashPassword(password, salt = null) {
  if (!password) return '';
  const effectiveSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(String(password), effectiveSalt, 64);
  return `${effectiveSalt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored salt:hash string
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  // If storedHash is already salt:hash
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':');
    const derivedKey = crypto.scryptSync(String(password), salt, 64);
    return crypto.timingSafeEqual(Buffer.from(derivedKey.toString('hex')), Buffer.from(key));
  }
  // Backward compatibility with initial seeded plain text
  return password === storedHash;
}

/**
 * Hash a 4-digit security PIN separately
 */
export function hashPin(pin, salt = null) {
  if (!pin) return '';
  const effectiveSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(`PIN_${pin}`, effectiveSalt, 32);
  return `${effectiveSalt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify 4-digit PIN against stored salt:hash
 */
export function verifyPin(pin, storedPinHash) {
  if (!pin || !storedPinHash) return false;
  if (storedPinHash.includes(':')) {
    const [salt, key] = storedPinHash.split(':');
    const derivedKey = crypto.scryptSync(`PIN_${pin}`, salt, 32);
    return crypto.timingSafeEqual(Buffer.from(derivedKey.toString('hex')), Buffer.from(key));
  }
  return String(pin) === String(storedPinHash);
}

/**
 * Generate cryptographically secure random session token
 */
export function generateToken(userId) {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `NETRISH_SESSION_${userId}_${randomBytes}`;
}

/**
 * Safely extract observed client IP
 * Only trusts X-Forwarded-For if trustProxy is explicitly true
 */
export function getClientIp(req, trustProxy = false) {
  if (trustProxy && req.headers['x-forwarded-for']) {
    const forwarded = req.headers['x-forwarded-for'];
    const firstIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]).trim();
    if (firstIp) return cleanIp(firstIp);
  }
  const socketIp = req.socket?.remoteAddress || '127.0.0.1';
  return cleanIp(socketIp);
}

/**
 * Normalize IPv6-mapped IPv4 e.g. ::ffff:127.0.0.1 -> 127.0.0.1
 */
export function cleanIp(ip) {
  if (!ip) return '127.0.0.1';
  let cleaned = String(ip).trim();
  if (cleaned.startsWith('::ffff:')) {
    cleaned = cleaned.substring(7);
  }
  return cleaned;
}

/**
 * Classify IP as public vs private/loopback/link-local/carrier-grade
 */
export function classifyIp(ip) {
  const cleaned = cleanIp(ip);

  // IPv4 Loopback
  if (cleaned === '127.0.0.1' || cleaned === '::1' || cleaned.startsWith('127.')) {
    return { type: cleaned.includes(':') ? 'IPv6' : 'IPv4', classification: 'LOOPBACK', isPrivate: true, description: 'Loopback Host Interface' };
  }

  // IPv6 check
  if (cleaned.includes(':')) {
    // Unique local address fc00::/7 (fc00:: - fdff::)
    if (/^[fF][cCdD]/i.test(cleaned)) {
      return { type: 'IPv6', classification: 'PRIVATE_ULA', isPrivate: true, description: 'IPv6 Unique Local Address (RFC 4193)' };
    }
    // Link-local fe80::/10
    if (/^[fF][eE][89aAbB]/i.test(cleaned)) {
      return { type: 'IPv6', classification: 'LINK_LOCAL', isPrivate: true, description: 'IPv6 Link-Local Unicast (RFC 4291)' };
    }
    return { type: 'IPv6', classification: 'PUBLIC', isPrivate: false, description: 'Public IPv6 Global Unicast' };
  }

  // IPv4 standard checks
  const parts = cleaned.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return { type: 'UNKNOWN', classification: 'INVALID', isPrivate: false, description: 'Malformed IP Address' };
  }

  const [b0, b1] = parts;

  // RFC 1918 Private Ranges:
  // 10.0.0.0/8
  if (b0 === 10) {
    return { type: 'IPv4', classification: 'PRIVATE_RFC1918', isPrivate: true, description: 'Private Class A (10.0.0.0/8)' };
  }
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) {
    return { type: 'IPv4', classification: 'PRIVATE_RFC1918', isPrivate: true, description: 'Private Class B (172.16.0.0/12)' };
  }
  // 192.168.0.0/16
  if (b0 === 192 && b1 === 168) {
    return { type: 'IPv4', classification: 'PRIVATE_RFC1918', isPrivate: true, description: 'Private Class C (192.168.0.0/16)' };
  }
  // Link-local: 169.254.0.0/16
  if (b0 === 169 && b1 === 254) {
    return { type: 'IPv4', classification: 'LINK_LOCAL', isPrivate: true, description: 'Link-Local Address (RFC 3927)' };
  }
  // Carrier-Grade NAT: 100.64.0.0/10 (100.64.0.0 - 100.127.255.255)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) {
    return { type: 'IPv4', classification: 'CARRIER_GRADE_NAT', isPrivate: true, description: 'Shared Address Space / CGNAT (RFC 6598)' };
  }

  return { type: 'IPv4', classification: 'PUBLIC', isPrivate: false, description: 'Public Internet IPv4 Address' };
}
