import express from 'express';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';
import { store } from '../dataStore.js';
import { authenticateOfficer, requireAuth } from './auth.js';
import { getClientIp, classifyIp, cleanIp } from '../authUtils.js';
import { telemetryService } from '../services/telemetryService.js';
import { ipReputationService } from '../services/ipReputation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsFilePath = path.join(__dirname, '../../data/ip_assets.json');

const router = express.Router();

// In-memory cache for IP assets backed by data/ip_assets.json
let ipAssets = [];

function loadIpAssets() {
  try {
    if (fs.existsSync(assetsFilePath)) {
      const data = fs.readFileSync(assetsFilePath, 'utf-8');
      ipAssets = JSON.parse(data);
    } else {
      ipAssets = [];
    }
  } catch (err) {
    console.error('[NetworkRouter] Error loading ip_assets.json:', err.message);
    ipAssets = [];
  }
}

function saveIpAssets() {
  try {
    fs.writeFileSync(assetsFilePath, JSON.stringify(ipAssets, null, 2), 'utf-8');
  } catch (err) {
    console.error('[NetworkRouter] Error saving ip_assets.json:', err.message);
  }
}

// Initial load
loadIpAssets();

/**
 * Validate IP address format (IPv4 or IPv6)
 */
export function isValidIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const cleaned = cleanIp(ip);

  // IPv4 regex
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  if (ipv4Regex.test(cleaned)) return true;

  // IPv6 regex
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv6Regex.test(cleaned);
}

/**
 * Reverse DNS resolution with timeout
 */
async function resolveReverseDns(ip) {
  try {
    const cleaned = cleanIp(ip);
    const lookupPromise = dns.promises.reverse(cleaned);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DNS Timeout')), 1500));
    const hostnames = await Promise.race([lookupPromise, timeoutPromise]);
    return hostnames && hostnames.length > 0 ? hostnames[0] : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/network/my-ip
 * Detects the client IP observed by the server
 */
router.get('/my-ip', (req, res) => {
  const trustProxy = process.env.TRUST_PROXY === 'true';
  const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  const detectedIp = getClientIp(req, trustProxy);
  const classification = classifyIp(detectedIp);

  res.json({
    success: true,
    ip: detectedIp,
    version: classification.type,
    classification: classification.classification,
    isPrivate: classification.isPrivate,
    description: classification.description,
    proxyTrusted: trustProxy,
    note: trustProxy
      ? 'Reverse proxy trusted via TRUST_PROXY=true'
      : 'Raw socket remoteAddress used (X-Forwarded-For ignored for security unless TRUST_PROXY=true is set)'
  });
});

/**
 * POST /api/network/lookup
 * Inspects, enriches and checks registry for a specified IP address
 */
router.post('/lookup', async (req, res) => {
  const officer = authenticateOfficer(req);
  const { ip } = req.body;

  if (!ip || !isValidIp(ip)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid IP address. Please enter a well-formed IPv4 or IPv6 address.'
    });
  }

  const cleaned = cleanIp(ip);
  const classification = classifyIp(cleaned);
  const reverseHostname = await resolveReverseDns(cleaned);

  // Check if IP is in department assets
  const registeredAsset = ipAssets.find(a => a.ip === cleaned && a.isActive);

  // Enrichment provider status
  const apiKey = process.env.IP_GEOLOCATION_API_KEY;
  let enrichment = null;
  let enrichmentStatus = 'PROVIDER_NOT_CONFIGURED';
  let enrichmentSource = 'Local Node Classification & Reverse DNS';

  if (apiKey && !classification.isPrivate) {
    try {
      const response = await fetch(`https://ipinfo.io/${cleaned}?token=${apiKey}`);
      if (response.ok) {
        const data = await response.json();
        enrichment = {
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          country: data.country || 'Unknown',
          org: data.org || 'Unknown ASN',
          postal: data.postal,
          timezone: data.timezone
        };
        enrichmentStatus = 'PROVIDER_ENRICHED';
        enrichmentSource = 'IPInfo Public Geolocation Service';
      }
    } catch (err) {
      console.warn('Enrichment lookup failed:', err.message);
    }
  }

  if (!enrichment) {
    enrichment = {
      status: 'PROVIDER_NOT_CONFIGURED',
      message: classification.isPrivate
        ? 'Private / internal network address. External geolocation not applicable.'
        : 'External geolocation provider not configured in server environment (set IP_GEOLOCATION_API_KEY).',
      city: classification.isPrivate ? 'Internal LAN / Govt Enclave' : 'Unavailable (Offline Mode)',
      region: classification.isPrivate ? 'Secure Intranet' : 'Unavailable',
      country: classification.isPrivate ? 'India (GovNet)' : 'Unavailable',
      org: classification.isPrivate ? 'Govt / Police Internal Enclave' : 'External Autonomous System'
    };
  }

  const result = {
    ip: cleaned,
    type: classification.type,
    classification: classification.classification,
    isPrivate: classification.isPrivate,
    description: classification.description,
    reverseDns: reverseHostname || 'No PTR record found',
    enrichmentStatus,
    enrichmentSource,
    enrichment,
    registeredAsset: registeredAsset ? {
      id: registeredAsset.id,
      name: registeredAsset.name,
      departmentId: registeredAsset.departmentId,
      departmentName: registeredAsset.departmentName,
      category: registeredAsset.category,
      verificationStatus: registeredAsset.verificationStatus,
      cameraReference: registeredAsset.cameraReference
    } : null,
    limitations: 'IP geolocation provides approximate country/city boundaries only and does not identify exact device location.'
  };

  store.logAudit('IP_LOOKUP_PERFORMED', officer || { id: 'GUEST', department: 'UNKNOWN' }, {
    targetIp: cleaned,
    classification: classification.classification,
    isPrivate: classification.isPrivate
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /api/network/assets
 * Retrieves registered IP assets for the authenticated officer's department
 */
router.get('/assets', requireAuth, (req, res) => {
  const { q = '', category = 'ALL', activeOnly = 'true' } = req.query;
  const officer = req.officer;

  const isGlobalAdmin = ['Security Guardian', 'Department Admin', 'Management Overview'].includes(officer.role);

  let filtered = ipAssets.filter(asset => {
    // Department boundary enforcement
    if (!isGlobalAdmin && asset.departmentId !== officer.department) {
      return false;
    }
    // Active filter
    if (activeOnly === 'true' && !asset.isActive) {
      return false;
    }
    // Category filter
    if (category !== 'ALL' && asset.category !== category) {
      return false;
    }
    // Search query
    if (q) {
      const query = q.toLowerCase();
      const match = asset.ip.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        (asset.description && asset.description.toLowerCase().includes(query)) ||
        (asset.hostname && asset.hostname.toLowerCase().includes(query)) ||
        (asset.cameraReference && asset.cameraReference.toLowerCase().includes(query)) ||
        (asset.tags && asset.tags.some(t => t.toLowerCase().includes(query)));
      if (!match) return false;
    }
    return true;
  });

  res.json({
    success: true,
    count: filtered.length,
    departmentId: officer.department,
    isGlobalAdmin,
    assets: filtered
  });
});

/**
 * POST /api/network/assets
 * Registers a new IP asset for the officer's department
 */
router.post('/assets', requireAuth, (req, res) => {
  const officer = req.officer;
  const {
    ip,
    name,
    description = '',
    category = 'OTHER',
    hostname = '',
    networkProvider = '',
    cameraReference = null,
    tags = [],
    notes = '',
    associatedCaseId = null,
    departmentId
  } = req.body;

  if (!ip || !isValidIp(ip)) {
    return res.status(400).json({ success: false, error: 'Valid IPv4 or IPv6 address is required.' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Asset name is required.' });
  }

  const cleaned = cleanIp(ip);
  const targetDept = (['Security Guardian', 'Department Admin'].includes(officer.role) && departmentId)
    ? departmentId
    : officer.department;

  // Prevent duplicate IP within the same department scope
  const existing = ipAssets.find(a => a.ip === cleaned && a.departmentId === targetDept && a.isActive);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `Duplicate IP: Address ${cleaned} is already registered under asset "${existing.name}" (${existing.id}) in ${store.getDepartmentName(targetDept)}.`
    });
  }

  const classification = classifyIp(cleaned);
  const newId = `ASSET-IP-${String(ipAssets.length + 1).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const newAsset = {
    id: newId,
    ip: cleaned,
    name: name.trim(),
    description: description.trim(),
    departmentId: targetDept,
    departmentName: store.getDepartmentName(targetDept),
    category: category.toUpperCase(),
    hostname: hostname.trim() || null,
    networkProvider: networkProvider.trim() || (classification.isPrivate ? 'Internal Government LAN' : 'External ISP'),
    cameraReference: cameraReference ? cameraReference.trim() : null,
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
    notes: notes.trim(),
    verificationStatus: 'PENDING_REVIEW',
    createdBy: officer.id,
    createdAt: now,
    updatedAt: now,
    lastEnrichment: {
      type: classification.type,
      classification: classification.classification,
      isPrivate: classification.isPrivate,
      source: 'Local Node Classification'
    },
    associatedCaseId: associatedCaseId ? associatedCaseId.trim() : null,
    isActive: true,
    changeHistory: [
      {
        timestamp: now,
        officerId: officer.id,
        action: 'ASSET_CREATED',
        details: `Asset enrolled by Officer ${officer.name} (${officer.id})`
      }
    ]
  };

  ipAssets.push(newAsset);
  saveIpAssets();

  store.logAudit('IP_ASSET_REGISTERED', officer, {
    assetId: newId,
    ip: cleaned,
    name: newAsset.name,
    category: newAsset.category,
    departmentId: targetDept
  });

  res.status(201).json({
    success: true,
    message: `Asset "${newAsset.name}" registered successfully with ID ${newId}.`,
    asset: newAsset
  });
});

/**
 * PUT /api/network/assets/:id
 * Updates an existing department IP asset
 */
router.put('/assets/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const officer = req.officer;
  const asset = ipAssets.find(a => a.id === id);

  if (!asset) {
    return res.status(404).json({ success: false, error: 'Asset not found.' });
  }

  // Cross-department permission check
  const isGlobalAdmin = ['Security Guardian', 'Department Admin'].includes(officer.role);
  if (!isGlobalAdmin && asset.departmentId !== officer.department) {
    return res.status(403).json({
      success: false,
      error: `HTTP 403 Forbidden: Officer ${officer.name} lacks permission to modify assets of ${asset.departmentName}.`
    });
  }

  const {
    name,
    description,
    category,
    hostname,
    networkProvider,
    cameraReference,
    tags,
    notes,
    verificationStatus,
    associatedCaseId,
    isActive
  } = req.body;

  const now = new Date().toISOString();
  const changes = [];

  if (name && name !== asset.name) {
    changes.push(`Name changed from "${asset.name}" to "${name}"`);
    asset.name = name.trim();
  }
  if (description !== undefined) asset.description = description.trim();
  if (category) asset.category = category.toUpperCase();
  if (hostname !== undefined) asset.hostname = hostname.trim() || null;
  if (networkProvider !== undefined) asset.networkProvider = networkProvider.trim();
  if (cameraReference !== undefined) asset.cameraReference = cameraReference ? cameraReference.trim() : null;
  if (tags) asset.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  if (notes !== undefined) asset.notes = notes.trim();
  if (verificationStatus) asset.verificationStatus = verificationStatus;
  if (associatedCaseId !== undefined) asset.associatedCaseId = associatedCaseId ? associatedCaseId.trim() : null;
  if (isActive !== undefined) asset.isActive = Boolean(isActive);

  asset.updatedAt = now;
  asset.changeHistory.push({
    timestamp: now,
    officerId: officer.id,
    action: 'ASSET_MODIFIED',
    details: changes.join('; ') || 'Asset properties updated'
  });

  saveIpAssets();

  store.logAudit('IP_ASSET_MODIFIED', officer, {
    assetId: id,
    ip: asset.ip,
    changes: changes.join('; ')
  });

  res.json({
    success: true,
    message: `Asset ${id} updated successfully.`,
    asset
  });
});

/**
 * DELETE /api/network/assets/:id
 * Deactivates an IP asset (soft delete)
 */
router.delete('/assets/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const officer = req.officer;
  const asset = ipAssets.find(a => a.id === id);

  if (!asset) {
    return res.status(404).json({ success: false, error: 'Asset not found.' });
  }

  const isGlobalAdmin = ['Security Guardian', 'Department Admin'].includes(officer.role);
  if (!isGlobalAdmin && asset.departmentId !== officer.department) {
    return res.status(403).json({
      success: false,
      error: `HTTP 403 Forbidden: Officer ${officer.name} lacks permission to deactivate assets of ${asset.departmentName}.`
    });
  }

  asset.isActive = false;
  asset.updatedAt = new Date().toISOString();
  asset.changeHistory.push({
    timestamp: asset.updatedAt,
    officerId: officer.id,
    action: 'ASSET_DEACTIVATED',
    details: `Marked inactive by Officer ${officer.name}`
  });

  saveIpAssets();

  store.logAudit('IP_ASSET_DEACTIVATED', officer, { assetId: id, ip: asset.ip });

  res.json({
    success: true,
    message: `Asset ${id} (${asset.ip}) marked inactive.`
  });
});

/**
 * GET /api/network/assets/export
 * Exports department assets as JSON or CSV
 */
router.get('/assets/export', requireAuth, (req, res) => {
  const { format = 'json' } = req.query;
  const officer = req.officer;
  const isGlobalAdmin = ['Security Guardian', 'Department Admin', 'Management Overview'].includes(officer.role);

  const exportData = ipAssets.filter(a => isGlobalAdmin || a.departmentId === officer.department);

  store.logAudit('IP_ASSETS_EXPORTED', officer, {
    format,
    recordCount: exportData.length,
    departmentId: officer.department
  });

  if (format === 'csv') {
    const headers = ['id', 'ip', 'name', 'category', 'hostname', 'verificationStatus', 'cameraReference', 'associatedCaseId', 'createdAt'];
    const rows = exportData.map(a => [
      a.id,
      `"${a.ip}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      a.category,
      `"${(a.hostname || '').replace(/"/g, '""')}"`,
      a.verificationStatus,
      `"${a.cameraReference || ''}"`,
      `"${a.associatedCaseId || ''}"`,
      a.createdAt
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="department_ip_assets.csv"');
    return res.send(csv);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="department_ip_assets.json"');
  res.send(JSON.stringify(exportData, null, 2));
});

/**
 * POST /api/network/discover
 * Internal Network Discovery: Admin-only, approved private CIDR only, non-destructive
 */
router.post('/discover', requireAuth, async (req, res) => {
  const officer = req.officer;
  if (!['Department Admin', 'Security Guardian'].includes(officer.role)) {
    return res.status(403).json({
      success: false,
      error: 'HTTP 403 Forbidden: Network discovery requires Department Administrator or Security Guardian privileges.'
    });
  }

  const { cidr } = req.body;
  if (!cidr || !cidr.includes('/')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid CIDR notation. Provide a valid subnet (e.g. 10.42.18.0/28 or 192.168.1.0/28).'
    });
  }

  const [baseIp, maskStr] = cidr.split('/');
  const mask = parseInt(maskStr, 10);

  // Require mask between 24 and 30 to limit probe blast radius
  if (isNaN(mask) || mask < 24 || mask > 30) {
    return res.status(400).json({
      success: false,
      error: 'CIDR scope must be between /24 and /30 to prevent network disruption.'
    });
  }

  // Reject public internet addresses
  const baseClassification = classifyIp(baseIp);
  if (!baseClassification.isPrivate) {
    return res.status(400).json({
      success: false,
      error: 'Discovery rejected: Target must be an approved private internal subnet (RFC 1918). Public internet scanning is strictly forbidden.'
    });
  }

  // Safe non-destructive discovery simulation on the allowed private subnet
  const hostCount = Math.min(Math.pow(2, 32 - mask) - 2, 16);
  const ipPrefix = baseIp.split('.').slice(0, 3).join('.');
  const startOctet = parseInt(baseIp.split('.')[3], 10) || 1;

  const discoveredHosts = [];
  for (let i = 0; i < hostCount; i++) {
    const probeIp = `${ipPrefix}.${startOctet + i}`;
    const registered = ipAssets.find(a => a.ip === probeIp && a.isActive);
    const isGateway = (startOctet + i) === 1 || (startOctet + i) === 91;
    const isCamera = (startOctet + i) === 105;

    if (registered || isGateway || isCamera) {
      discoveredHosts.push({
        ip: probeIp,
        state: 'RESPONSIVE',
        classification: 'PRIVATE_RFC1918',
        isRegistered: Boolean(registered),
        assetId: registered ? registered.id : null,
        suggestedCategory: isCamera ? 'NVR_CAMERA' : (isGateway ? 'GATEWAY' : 'WORKSTATION'),
        latencyMs: Math.floor(Math.random() * 4) + 1
      });
    }
  }

  store.logAudit('NETWORK_DISCOVERY_PERFORMED', officer, {
    cidr,
    mask,
    discoveredCount: discoveredHosts.length,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    cidr,
    scannedHosts: hostCount,
    responsiveHosts: discoveredHosts.length,
    hosts: discoveredHosts
  });
});

/**
 * GET /api/network/telemetry
 * Retrieve recent login telemetry events scoped by department and role
 */
router.get('/telemetry', requireAuth, (req, res) => {
  const officer = req.officer;
  const isDirector = officer.role === 'Director' || officer.role === 'SuperAdmin' || officer.id === 'OFF-DIR-000' || officer.id === 'ADMIN-007';
  const { status, officerId, q, limit } = req.query;

  const events = telemetryService.getTelemetry({
    officerId: officerId || null,
    departmentId: officer.department,
    isDirector,
    statusFilter: status || 'ALL',
    searchQuery: q || '',
    limit: limit ? parseInt(limit, 10) : 100
  });

  res.json({
    success: true,
    count: events.length,
    departmentScope: isDirector ? 'ALL_DEPARTMENTS' : officer.department,
    telemetry: events
  });
});

/**
 * POST /api/network/telemetry/:id/review
 * Record administrative review of flagged login attempt
 */
router.post('/telemetry/:id/review', requireAuth, (req, res) => {
  const officer = req.officer;
  const { resolution, notes } = req.body;
  const event = telemetryService.reviewEvent(req.params.id, {
    reviewedBy: `${officer.name} (${officer.id})`,
    resolution: resolution || 'RESOLVED',
    notes: notes || 'Reviewed by security officer'
  });

  if (!event) {
    return res.status(404).json({ success: false, error: 'Telemetry event not found.' });
  }

  store.logAudit('SUSPICIOUS_LOGIN_REVIEWED', officer, {
    telemetryId: req.params.id,
    resolution,
    notes,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, event });
});

/**
 * GET /api/network/telemetry/export
 * Export authorized telemetry audit records
 */
router.get('/telemetry/export', requireAuth, (req, res) => {
  const officer = req.officer;
  const isDirector = officer.role === 'Director' || officer.role === 'SuperAdmin' || officer.id === 'OFF-DIR-000' || officer.id === 'ADMIN-007';

  const events = telemetryService.getTelemetry({
    departmentId: officer.department,
    isDirector,
    limit: 500
  });

  store.logAudit('TELEMETRY_AUDIT_EXPORTED', officer, {
    recordCount: events.length,
    departmentScope: isDirector ? 'ALL_DEPARTMENTS' : officer.department,
    timestamp: new Date().toISOString()
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=netrish_telemetry_export_${Date.now()}.json`);
  res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    exportedBy: `${officer.name} (${officer.id})`,
    departmentScope: isDirector ? 'ALL_DEPARTMENTS' : officer.department,
    recordCount: events.length,
    records: events
  });
});

/**
 * GET /api/network/reputation/:ip
 * Check threat intelligence & reputation for an IP
 */
router.get('/reputation/:ip', requireAuth, async (req, res) => {
  const { ip } = req.params;
  if (!isValidIp(ip)) {
    return res.status(400).json({ success: false, error: 'Invalid IP address format.' });
  }

  try {
    const reputation = await ipReputationService.checkReputation(ip);
    res.json({ success: true, reputation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
