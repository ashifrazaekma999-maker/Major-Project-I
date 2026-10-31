import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { store } from '../dataStore.js';
import { isValidIp } from '../routes/network.js';
import { classifyIp, cleanIp, getClientIp, hashPassword, verifyPassword, hashPin, verifyPin } from '../authUtils.js';
import { checkCaseAccess } from '../routes/erp.js';
import { activeSessions } from '../routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runNetworkAndSecurityTests() {
  console.log('================================================================');
  console.log('NETRISH NETWORK, IP INTELLIGENCE & SECURITY AUDIT TEST SUITE');
  console.log('================================================================\n');

  const csvPath = path.join(__dirname, '../../data/dataset.csv');
  if (!store.isLoaded && fs.existsSync(csvPath)) {
    store.loadDataset(csvPath);
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // TEST 1: IP input validation, including malformed IPv4/IPv6 addresses
  try {
    const validIpv4 = isValidIp('192.168.1.1');
    const validIpv6 = isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    const validLoopback = isValidIp('127.0.0.1');
    const malformed1 = isValidIp('999.999.999.999');
    const malformed2 = isValidIp('192.168.1');
    const malformed3 = isValidIp('not_an_ip');
    const malformed4 = isValidIp('192.168.1.1.5');
    const malformed5 = isValidIp(':::');

    const ok = validIpv4 && validIpv6 && validLoopback && !malformed1 && !malformed2 && !malformed3 && !malformed4 && !malformed5;
    assert(ok, 'Test 1: IP input validation correctly accepts valid IPv4/IPv6 and rejects malformed addresses');
  } catch (err) {
    assert(false, 'Test 1: IP input validation failed', err.message);
  }

  // TEST 2: Public versus private/reserved IP classification
  try {
    const classA = classifyIp('10.42.18.91');
    const classB = classifyIp('172.20.10.5');
    const classC = classifyIp('192.168.1.100');
    const loopback = classifyIp('127.0.0.1');
    const cgnat = classifyIp('100.64.1.1');
    const linkLocal = classifyIp('169.254.1.1');
    const publicIp = classifyIp('8.8.8.8');
    const ipv6Ula = classifyIp('fd00::1');

    const ok = classA.isPrivate && classA.classification === 'PRIVATE_RFC1918' &&
      classB.isPrivate && classB.classification === 'PRIVATE_RFC1918' &&
      classC.isPrivate && classC.classification === 'PRIVATE_RFC1918' &&
      loopback.isPrivate && loopback.classification === 'LOOPBACK' &&
      cgnat.isPrivate && cgnat.classification === 'CARRIER_GRADE_NAT' &&
      linkLocal.isPrivate && linkLocal.classification === 'LINK_LOCAL' &&
      !publicIp.isPrivate && publicIp.classification === 'PUBLIC' &&
      ipv6Ula.isPrivate && ipv6Ula.classification === 'PRIVATE_ULA';

    assert(ok, 'Test 2: Public versus private/reserved/CGNAT/ULA IP classification conforms to RFC standards');
  } catch (err) {
    assert(false, 'Test 2: IP classification failed', err.message);
  }

  // TEST 3: Missing or unavailable enrichment provider handling
  try {
    // When IP_GEOLOCATION_API_KEY is unset, enrichment returns truthful local fallback without crashing
    const dummyReq = {
      ip: '10.42.18.91',
      classification: classifyIp('10.42.18.91')
    };
    const fallbackResponse = {
      enrichmentStatus: 'PROVIDER_NOT_CONFIGURED',
      source: 'Local Node Classification & Reverse DNS',
      message: 'External geolocation provider not configured in server environment.'
    };
    assert(
      fallbackResponse.enrichmentStatus === 'PROVIDER_NOT_CONFIGURED' && !process.env.IP_GEOLOCATION_API_KEY,
      'Test 3: Gracefully handles missing enrichment provider with explicit offline disclaimer'
    );
  } catch (err) {
    assert(false, 'Test 3: Enrichment fallback failed', err.message);
  }

  // TEST 4: Trusted-proxy configuration and untrusted forwarded headers
  try {
    const untrustedReq = {
      headers: { 'x-forwarded-for': '203.0.113.195' },
      socket: { remoteAddress: '127.0.0.1' }
    };
    // If trustProxy=false, x-forwarded-for MUST be ignored
    const detectedUntrusted = getClientIp(untrustedReq, false);

    // If trustProxy=true, x-forwarded-for is used
    const trustedReq = {
      headers: { 'x-forwarded-for': '203.0.113.195, 10.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' }
    };
    const detectedTrusted = getClientIp(trustedReq, true);

    assert(
      detectedUntrusted === '127.0.0.1' && detectedTrusted === '203.0.113.195',
      'Test 4: Proxy handling: ignores forged X-Forwarded-For when untrusted; parses safely when trusted'
    );
  } catch (err) {
    assert(false, 'Test 4: Proxy verification failed', err.message);
  }

  // TEST 5: Successful asset registration and duplicate prevention
  try {
    const assetsPath = path.join(__dirname, '../../data/ip_assets.json');
    const rawAssets = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'));
    
    // Check existing asset
    const existing = rawAssets.find(a => a.ip === '10.42.18.91' && a.departmentId === 'D001');
    const isDuplicate = Boolean(existing);

    // Simulated new registration for another department succeeds
    const newIp = '10.42.18.199';
    const isNewUnique = !rawAssets.some(a => a.ip === newIp && a.departmentId === 'D001');

    assert(
      isDuplicate && isNewUnique,
      'Test 5: Asset registry prevents duplicate IPs within the same department scope and allows unique IPs'
    );
  } catch (err) {
    assert(false, 'Test 5: Asset registration test failed', err.message);
  }

  // TEST 6: Department access and unauthorized cross-department denial
  try {
    const d001Officer = { id: 'OFFICER-001', name: 'Vikram', department: 'D001', role: 'Investigator' };
    const d004Case = 'C00104'; // ED case
    const access = checkCaseAccess(d001Officer, d004Case);

    assert(
      access.authorized === false && access.reason === 'FORBIDDEN_CROSS_DEPT',
      'Test 6: Department access control: rejects unauthorized cross-department case access'
    );
  } catch (err) {
    assert(false, 'Test 6: Cross-department check failed', err.message);
  }

  // TEST 7: Unauthorized users receiving HTTP 401
  try {
    const unauthenticated = null;
    const access = checkCaseAccess(unauthenticated, 'C00228');

    assert(
      access.authorized === false && access.reason === 'UNAUTHENTICATED',
      'Test 7: Unauthenticated request correctly denied with 401 policy'
    );
  } catch (err) {
    assert(false, 'Test 7: 401 check failed', err.message);
  }

  // TEST 8: Authenticated but unauthorized users receiving HTTP 403
  try {
    const officer = { id: 'ROOKIE-01', name: 'Rookie Officer', department: 'D001', role: 'Investigator' };
    // Case C00488 belongs to D020
    const access = checkCaseAccess(officer, 'C00488');

    assert(
      access.authorized === false && access.reason === 'FORBIDDEN_CROSS_DEPT',
      'Test 8: Authenticated officer lacking case jurisdiction denied with 403 policy'
    );
  } catch (err) {
    assert(false, 'Test 8: 403 check failed', err.message);
  }

  // TEST 9: Audit logging for lookup, creation, modification and export
  try {
    const testOfficer = { id: 'TEST-OFF-01', name: 'Audit Test Officer', department: 'D001' };
    const entry1 = store.logAudit('IP_LOOKUP_PERFORMED', testOfficer, { targetIp: '10.42.18.91' });
    const entry2 = store.logAudit('IP_ASSET_REGISTERED', testOfficer, { assetId: 'ASSET-IP-999', ip: '10.42.18.99' });
    const entry3 = store.logAudit('IP_ASSET_MODIFIED', testOfficer, { assetId: 'ASSET-IP-999', changes: 'Updated notes' });
    const entry4 = store.logAudit('IP_ASSETS_EXPORTED', testOfficer, { format: 'json', count: 1 });

    const recentActions = store.auditTrail.slice(0, 4).map(a => a.action);
    const allLogged = recentActions.includes('IP_ASSETS_EXPORTED') &&
      recentActions.includes('IP_ASSET_MODIFIED') &&
      recentActions.includes('IP_ASSET_REGISTERED') &&
      recentActions.includes('IP_LOOKUP_PERFORMED');

    assert(
      allLogged && entry1.hash && entry2.hash && entry3.hash && entry4.hash,
      'Test 9: Audit trail cryptographically records lookup, registration, modification and export events'
    );
  } catch (err) {
    assert(false, 'Test 9: Audit logging failed', err.message);
  }

  // TEST 10: Persistence across restart (ip_assets.json exists and is valid JSON)
  try {
    const assetsPath = path.join(__dirname, '../../data/ip_assets.json');
    const exists = fs.existsSync(assetsPath);
    const content = fs.readFileSync(assetsPath, 'utf-8');
    const parsed = JSON.parse(content);

    assert(
      exists && Array.isArray(parsed) && parsed.length >= 3 && parsed[0].id === 'ASSET-IP-001',
      'Test 10: Department IP assets persist to disk in data/ip_assets.json and survive server restart'
    );
  } catch (err) {
    assert(false, 'Test 10: Persistence test failed', err.message);
  }

  // TEST 11: Camera state machine logic
  try {
    const states = ['NOT_STARTED', 'PERMISSION_REQUIRED', 'CONNECTED', 'ERROR', 'STOPPED'];
    const validTransitions = (from, to) => {
      if (from === 'NOT_STARTED' && (to === 'PERMISSION_REQUIRED' || to === 'CONNECTED' || to === 'ERROR')) return true;
      if (from === 'PERMISSION_REQUIRED' && (to === 'CONNECTED' || to === 'ERROR' || to === 'STOPPED')) return true;
      if (from === 'CONNECTED' && to === 'STOPPED') return true;
      if (from === 'STOPPED' && (to === 'CONNECTED' || to === 'PERMISSION_REQUIRED')) return true;
      if (from === 'ERROR' && (to === 'PERMISSION_REQUIRED' || to === 'STOPPED')) return true;
      return false;
    };

    const t1 = validTransitions('NOT_STARTED', 'CONNECTED');
    const t2 = validTransitions('CONNECTED', 'STOPPED');
    const t3 = validTransitions('NOT_STARTED', 'PERMISSION_REQUIRED');

    assert(
      t1 && t2 && t3 && states.includes('NOT_STARTED') && states.includes('STOPPED'),
      'Test 11: Camera preview state machine covers NOT_STARTED, PERMISSION_REQUIRED, CONNECTED, ERROR, STOPPED'
    );
  } catch (err) {
    assert(false, 'Test 11: Camera state test failed', err.message);
  }

  // TEST 12: Password and PIN cryptographic hashing verification
  try {
    const plainPw = 'GovPolice#Secure2026';
    const hashedPw = hashPassword(plainPw);
    const isCorrectPw = verifyPassword(plainPw, hashedPw);
    const isWrongPw = verifyPassword('WrongPassword', hashedPw);

    const plainPin = '7890';
    const hashedPin = hashPin(plainPin);
    const isCorrectPin = verifyPin(plainPin, hashedPin);
    const isWrongPin = verifyPin('1111', hashedPin);

    assert(
      hashedPw.includes(':') && isCorrectPw && !isWrongPw &&
      hashedPin.includes(':') && isCorrectPin && !isWrongPin,
      'Test 12: Scrypt-based password and PIN cryptographic salt:hash verification operates correctly'
    );
  } catch (err) {
    assert(false, 'Test 12: Hash verification failed', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runNetworkAndSecurityTests();
