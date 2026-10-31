import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyIp } from '../authUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, '../../data/ip_reputation_cache.json');

class IPReputationService {
  constructor() {
    this.cache = new Map();
    this.loadCache();
  }

  loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [ip, entry] of Object.entries(parsed)) {
          this.cache.set(ip, entry);
        }
      }
    } catch (e) {
      console.warn('[IPReputation] Could not load cache file:', e.message);
    }
  }

  saveCache() {
    try {
      const obj = {};
      for (const [ip, entry] of this.cache.entries()) {
        obj[ip] = entry;
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn('[IPReputation] Could not write cache file:', e.message);
    }
  }

  async checkReputation(ip) {
    const classification = classifyIp(ip);

    // Private, loopback, or reserved IPs are not public threat indicators
    if (classification.isPrivate || classification.classification === 'LOOPBACK') {
      return {
        ip,
        classification: classification.classification,
        isPrivate: true,
        riskLevel: 'LOW RISK',
        score: 0,
        provider: 'LOCAL_NETWORK_CLASSIFIER',
        providerStatus: 'LOCAL_RFC_CLASSIFIED',
        details: 'Internal private/loopback address. Not subject to public abuse reports.',
        reportsCount: 0,
        lastReportedAt: null,
        geolocation: {
          available: false,
          note: `Location unavailable for internal address (${ip}). Physical location is not determinable via IP.`
        }
      };
    }

    // Check cache (TTL 24 hours)
    if (this.cache.has(ip)) {
      const cached = this.cache.get(ip);
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return cached.result;
      }
    }

    const abuseKey = process.env.ABUSEIPDB_API_KEY;
    const ipinfoToken = process.env.IPINFO_TOKEN;

    let reputationResult = {
      ip,
      classification: classification.classification,
      isPrivate: false,
      riskLevel: 'PROVIDER UNAVAILABLE',
      score: null,
      provider: 'AbuseIPDB',
      providerStatus: 'KEY_NOT_CONFIGURED',
      details: 'AbuseIPDB threat intelligence key not configured (set ABUSEIPDB_API_KEY in server environment).',
      reportsCount: 0,
      lastReportedAt: null,
      geolocation: {
        available: false,
        note: 'IP Geolocation provider not configured (set IPINFO_TOKEN in server environment).'
      }
    };

    // 1. AbuseIPDB Lookup
    if (abuseKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const resp = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, {
          headers: {
            'Key': abuseKey,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (resp.ok) {
          const body = await resp.json();
          const d = body.data || {};
          const score = typeof d.abuseConfidenceScore === 'number' ? d.abuseConfidenceScore : 0;
          let risk = 'LOW RISK';
          if (score >= 50) risk = 'HIGH RISK';
          else if (score >= 20) risk = 'REVIEW REQUIRED';

          reputationResult.riskLevel = risk;
          reputationResult.score = score;
          reputationResult.provider = 'AbuseIPDB v2 API';
          reputationResult.providerStatus = 'ONLINE_CONNECTED';
          reputationResult.details = `Abuse Confidence Score: ${score}% across ${d.totalReports || 0} reports. ISP: ${d.isp || 'Unknown'}.`;
          reputationResult.reportsCount = d.totalReports || 0;
          reputationResult.lastReportedAt = d.lastReportedAt || null;
          reputationResult.isp = d.isp || null;
          reputationResult.countryCode = d.countryCode || null;
        } else {
          reputationResult.providerStatus = `API_HTTP_${resp.status}`;
          reputationResult.details = `AbuseIPDB API responded with status ${resp.status}. Local safe fallback applied.`;
        }
      } catch (err) {
        reputationResult.providerStatus = 'LOOKUP_FAILED_TIMEOUT';
        reputationResult.details = `Threat intelligence lookup timed out or failed: ${err.message}`;
      }
    }

    // 2. IPinfo Geolocation Lookup
    if (ipinfoToken) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const geoResp = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}?token=${ipinfoToken}`, {
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (geoResp.ok) {
          const geoData = await geoResp.json();
          let coordinates = null;
          if (geoData.loc) {
            const [lat, lng] = geoData.loc.split(',').map(n => parseFloat(n));
            if (!isNaN(lat) && !isNaN(lng)) coordinates = [lat, lng];
          }

          reputationResult.geolocation = {
            available: true,
            city: geoData.city || 'Unknown',
            region: geoData.region || 'Unknown',
            country: geoData.country || 'Unknown',
            coordinates,
            isp: geoData.org || reputationResult.isp,
            isApproximate: true,
            note: 'Approximate network location only. Public IP does not pinpoint physical street address.'
          };
        }
      } catch (err) {
        // Safe fallback already in place
      }
    }

    // Store in cache
    this.cache.set(ip, { timestamp: Date.now(), result: reputationResult });
    this.saveCache();

    return reputationResult;
  }
}

export const ipReputationService = new IPReputationService();
