import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyIp } from '../authUtils.js';
import { ipReputationService } from './ipReputation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TELEMETRY_FILE = path.resolve(__dirname, '../../data/login_telemetry.json');
const IP_ASSETS_FILE = path.resolve(__dirname, '../../data/ip_assets.json');

export function parseUserAgent(ua = '') {
  let apparentBrowser = 'Unknown Browser';
  let apparentOS = 'Unknown OS';

  if (!ua || typeof ua !== 'string') {
    return { apparentBrowser, apparentOS };
  }

  // OS Detection
  if (/windows nt 10/i.test(ua)) apparentOS = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) apparentOS = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(ua)) apparentOS = 'Windows 7';
  else if (/windows/i.test(ua)) apparentOS = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) apparentOS = 'macOS';
  else if (/android/i.test(ua)) apparentOS = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) apparentOS = 'iOS';
  else if (/linux/i.test(ua)) apparentOS = 'Linux';

  // Browser Detection (Order matters: Edge before Chrome, Chrome before Safari)
  if (/edg\//i.test(ua)) apparentBrowser = 'Microsoft Edge';
  else if (/opr\/|opera/i.test(ua)) apparentBrowser = 'Opera';
  else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) apparentBrowser = 'Google Chrome';
  else if (/firefox\//i.test(ua)) apparentBrowser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) apparentBrowser = 'Apple Safari';
  else if (/curl/i.test(ua)) apparentBrowser = 'cURL CLI';
  else if (/postman/i.test(ua)) apparentBrowser = 'Postman';

  return { apparentBrowser, apparentOS };
}

class TelemetryService {
  constructor() {
    this.events = [];
    this.assets = [];
    this.loadAssets();
    this.loadTelemetry();
  }

  loadAssets() {
    try {
      if (fs.existsSync(IP_ASSETS_FILE)) {
        this.assets = JSON.parse(fs.readFileSync(IP_ASSETS_FILE, 'utf8'));
      }
    } catch (e) {
      this.assets = [];
    }
  }

  loadTelemetry() {
    try {
      if (fs.existsSync(TELEMETRY_FILE)) {
        const raw = fs.readFileSync(TELEMETRY_FILE, 'utf8');
        this.events = JSON.parse(raw);
        if (!Array.isArray(this.events)) this.events = [];
      }
    } catch (e) {
      console.warn('[TelemetryService] Could not read telemetry file:', e.message);
      this.events = [];
    }
  }

  saveTelemetry() {
    try {
      fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(this.events, null, 2), 'utf8');
    } catch (e) {
      console.warn('[TelemetryService] Could not persist telemetry file:', e.message);
    }
  }

  getEnrolledDevice(ip, departmentId) {
    this.loadAssets();
    const match = this.assets.find(a => a.ip === ip && (a.status === 'ACTIVE' || a.active !== false));
    if (match) {
      return {
        isEnrolled: true,
        name: match.name || match.assetName || 'Enrolled Asset',
        type: match.type || match.assetType || 'Workstation',
        department: match.department || match.departmentId
      };
    }
    return {
      isEnrolled: false,
      name: 'Unenrolled Device',
      type: 'Unknown Endpoint',
      department: null
    };
  }

  async recordLoginAttempt({
    officerId = null,
    officerName = null,
    departmentId = null,
    departmentName = null,
    ip = '127.0.0.1',
    userAgent = '',
    status = 'SUCCESS', // SUCCESS, FAILED_CREDENTIALS, FAILED_PIN, FAILED_CAPTCHA, PENDING_APPROVAL, RATE_LIMITED
    failureReason = null,
    sessionId = null
  }) {
    const classification = classifyIp(ip);
    const { apparentBrowser, apparentOS } = parseUserAgent(userAgent);
    const enrolled = this.getEnrolledDevice(ip, departmentId);
    const reputation = await ipReputationService.checkReputation(ip);

    let approximateGeo = reputation.geolocation || {
      available: false,
      note: 'Location unavailable. Physical location is not determinable via IP.'
    };

    // If local test IP has registered location from department assets
    if (!approximateGeo.available && enrolled.isEnrolled) {
      approximateGeo = {
        available: true,
        city: 'New Delhi HQ',
        region: 'Delhi',
        country: 'India',
        coordinates: [28.6139, 77.2090],
        isApproximate: true,
        note: 'Approximate location derived from verified enrolled department asset.'
      };
    }

    const event = {
      id: `LOG-EVT-${String(this.events.length + 1).padStart(4, '0')}`,
      timestamp: new Date().toISOString(),
      status,
      officerId: officerId || 'UNKNOWN',
      officerName: officerName || 'Unknown Officer',
      departmentId: departmentId || 'D001',
      departmentName: departmentName || 'Law Enforcement',
      ip,
      classification: classification.classification,
      classificationDesc: classification.description,
      userAgent: userAgent || 'Unknown',
      apparentBrowser,
      apparentOS,
      deviceEnrolledName: enrolled.name,
      isEnrolledDevice: enrolled.isEnrolled,
      approximateGeo,
      reputation: {
        score: reputation.score,
        risk: reputation.riskLevel,
        provider: reputation.provider,
        status: reputation.providerStatus,
        note: reputation.details
      },
      failureReason,
      reviewStatus: (reputation.riskLevel === 'HIGH RISK' || status === 'RATE_LIMITED') ? 'FLAGGED_SUSPICIOUS' : 'VERIFIED'
    };

    // Prepend to array
    this.events.unshift(event);
    // Keep max 500 events
    if (this.events.length > 500) this.events.pop();

    this.saveTelemetry();
    return event;
  }

  getTelemetry({
    officerId,
    departmentId,
    isDirector = false,
    statusFilter = 'ALL',
    searchQuery = '',
    limit = 100
  }) {
    let list = this.events;

    // Department isolation: If not director/superadmin, restrict strictly to officer's own department
    if (!isDirector && departmentId) {
      list = list.filter(e => e.departmentId === departmentId);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'SUCCESS') list = list.filter(e => e.status === 'SUCCESS');
      else if (statusFilter === 'FAILED') list = list.filter(e => e.status !== 'SUCCESS');
      else if (statusFilter === 'FLAGGED') list = list.filter(e => e.reviewStatus === 'FLAGGED_SUSPICIOUS' || e.reputation?.risk === 'HIGH RISK');
    }

    if (officerId) {
      list = list.filter(e => e.officerId.toLowerCase() === officerId.toLowerCase());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => 
        e.ip.toLowerCase().includes(q) ||
        e.officerId.toLowerCase().includes(q) ||
        (e.officerName && e.officerName.toLowerCase().includes(q)) ||
        (e.apparentBrowser && e.apparentBrowser.toLowerCase().includes(q)) ||
        (e.apparentOS && e.apparentOS.toLowerCase().includes(q))
      );
    }

    return list.slice(0, limit);
  }

  reviewEvent(eventId, { reviewedBy, resolution, notes }) {
    const item = this.events.find(e => e.id === eventId);
    if (!item) return null;

    item.reviewStatus = resolution === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED';
    item.reviewedBy = reviewedBy;
    item.reviewNotes = notes || 'Administrative review completed.';
    item.reviewedAt = new Date().toISOString();

    this.saveTelemetry();
    return item;
  }
}

export const telemetryService = new TelemetryService();
