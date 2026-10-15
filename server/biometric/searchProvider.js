import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BiometricSubject, BiometricTemplate, BiometricCandidate } from './models.js';

export class BiometricSearchProvider {
  async searchFace(options) {
    throw new Error('Not implemented');
  }

  async searchFingerprint(options) {
    throw new Error('Not implemented');
  }

  async getSearchStatus(searchRequestId) {
    throw new Error('Not implemented');
  }

  async getCandidate(candidateId) {
    throw new Error('Not implemented');
  }
}

export class SyntheticDatasetTestProvider extends BiometricSearchProvider {
  constructor(datasetDir = path.resolve(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset')) {
    super();
    this.datasetDir = datasetDir;
    this.csvPath = path.join(datasetDir, 'biometric_test_records.csv');

    this.subjects = new Map(); // subject_id -> BiometricSubject
    this.templates = []; // BiometricTemplate[]
    this.faceProbeIndex = new Map(); // normalized key / hash -> record
    this.fingerprintProbeIndex = new Map(); // normalized key / hash -> record
    this.candidatesStore = new Map(); // candidateId -> BiometricCandidate
    this.records = [];
    this.isLoaded = false;

    this.loadDataset();
  }

  loadDataset() {
    if (!fs.existsSync(this.csvPath)) {
      console.warn(`[BiometricTestProvider] CSV not found at: ${this.csvPath}`);
      return;
    }

    try {
      const content = fs.readFileSync(this.csvPath, 'utf8');
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return;

      const header = lines[0].split(',').map(h => h.trim());
      const records = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < header.length) continue;

        const row = {};
        header.forEach((h, idx) => {
          row[h] = cols[idx];
        });
        records.push(row);
      }

      this.records = records;

      records.forEach(r => {
        const subject = new BiometricSubject({
          id: r.subject_id,
          subjectId: r.subject_id,
          caseId: r.case_id,
          displayName: r.display_name,
          status: r.status || 'TEST_ONLY',
          metadata: {
            fingerName: r.finger_name,
            matchLabel: r.match_label,
            isSynthetic: true
          }
        });
        this.subjects.set(r.subject_id, subject);

        // Face Enrolled Template
        const faceEnrolledTpl = new BiometricTemplate({
          id: `TPL-FACE-ENR-${r.subject_id}`,
          subjectId: r.subject_id,
          biometricType: 'FACE',
          imagePath: r.face_enrolled_image,
          source: 'SYNTHETIC_ENROLLED'
        });
        this.templates.push(faceEnrolledTpl);

        // Fingerprint Enrolled Template
        const fpEnrolledTpl = new BiometricTemplate({
          id: `TPL-FP-ENR-${r.subject_id}`,
          subjectId: r.subject_id,
          biometricType: 'FINGERPRINT',
          fingerName: r.finger_name || 'RIGHT_THUMB',
          imagePath: r.fingerprint_enrolled_image,
          source: 'SYNTHETIC_ENROLLED'
        });
        this.templates.push(fpEnrolledTpl);

        // Build Index for Face Probes
        const faceProbeBase = path.basename(r.face_probe_image).toLowerCase();
        const faceEnrolledBase = path.basename(r.face_enrolled_image).toLowerCase();
        const subjectKey = r.subject_id.toLowerCase();

        this.faceProbeIndex.set(faceProbeBase, r);
        this.faceProbeIndex.set(faceEnrolledBase, r);
        this.faceProbeIndex.set(subjectKey, r);

        // Build Index for Fingerprint Probes
        const fpProbeBase = path.basename(r.fingerprint_probe_image).toLowerCase();
        const fpEnrolledBase = path.basename(r.fingerprint_enrolled_image).toLowerCase();

        this.fingerprintProbeIndex.set(fpProbeBase, r);
        this.fingerprintProbeIndex.set(fpEnrolledBase, r);
        this.fingerprintProbeIndex.set(subjectKey, r);

        // Compute sha256 hashes of probe files if present on disk for exact content match
        try {
          const fullFaceProbePath = path.join(this.datasetDir, r.face_probe_image);
          if (fs.existsSync(fullFaceProbePath)) {
            const buf = fs.readFileSync(fullFaceProbePath);
            const hash = crypto.createHash('sha256').update(buf).digest('hex');
            this.faceProbeIndex.set(`hash:${hash}`, r);
          }

          const fullFpProbePath = path.join(this.datasetDir, r.fingerprint_probe_image);
          if (fs.existsSync(fullFpProbePath)) {
            const buf = fs.readFileSync(fullFpProbePath);
            const hash = crypto.createHash('sha256').update(buf).digest('hex');
            this.fingerprintProbeIndex.set(`hash:${hash}`, r);
          }
        } catch (err) {
          // ignore hash computation error
        }
      });

      this.isLoaded = true;
      console.log(`[BiometricTestProvider] Loaded ${records.length} synthetic test subjects from CSV.`);
    } catch (err) {
      console.error('[BiometricTestProvider] Error loading dataset:', err);
    }
  }

  async searchFace({ filename, buffer, searchRequestId, caseId, userId }) {
    if (!this.isLoaded) this.loadDataset();

    const normalizedName = (filename || '').toLowerCase().trim();
    let matchedRecord = null;

    // Check by filename
    if (normalizedName) {
      const baseName = path.basename(normalizedName);
      if (this.faceProbeIndex.has(baseName)) {
        matchedRecord = this.faceProbeIndex.get(baseName);
      } else {
        // Partial check for test IDs (e.g. TEST-PER-001)
        for (const [key, record] of this.faceProbeIndex.entries()) {
          if (!key.startsWith('hash:') && baseName.includes(key.replace('.png', ''))) {
            matchedRecord = record;
            break;
          }
        }
      }
    }

    // Check by content hash if buffer is provided
    if (!matchedRecord && buffer) {
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      if (this.faceProbeIndex.has(`hash:${hash}`)) {
        matchedRecord = this.faceProbeIndex.get(`hash:${hash}`);
      }
    }

    if (!matchedRecord) {
      return {
        matchFound: false,
        candidates: [],
        mode: 'TEST MODE',
        dataset: 'NETRISH Synthetic Biometric Test Dataset',
        message: 'NO MATCH FOUND in Synthetic Test Dataset'
      };
    }

    const candidate = new BiometricCandidate({
      searchRequestId,
      subjectId: matchedRecord.subject_id,
      caseId: matchedRecord.case_id,
      displayName: matchedRecord.display_name,
      matchType: 'TEST_MODE_DETERMINISTIC_MAP',
      similarityScore: 0.988,
      reviewStatus: 'PENDING_HUMAN_REVIEW',
      enrolledImagePath: `/api/biometric/image?path=${encodeURIComponent(matchedRecord.face_enrolled_image)}`,
      probeImagePath: `/api/biometric/image?path=${encodeURIComponent(matchedRecord.face_probe_image)}`,
      fingerName: null,
      matchLabel: matchedRecord.match_label || 'MATCH',
      dataset: 'NETRISH Synthetic Biometric Test Dataset',
      isSynthetic: true
    });

    this.candidatesStore.set(candidate.id, candidate);

    return {
      matchFound: true,
      mode: 'TEST MODE',
      dataset: 'NETRISH Synthetic Biometric Test Dataset',
      biometricType: 'Face',
      candidates: [candidate],
      message: 'Synthetic test candidate identified.'
    };
  }

  async searchFingerprint({ filename, buffer, fingerName = 'RIGHT_THUMB', searchRequestId, caseId, userId }) {
    if (!this.isLoaded) this.loadDataset();

    const normalizedName = (filename || '').toLowerCase().trim();
    let matchedRecord = null;

    if (normalizedName) {
      const baseName = path.basename(normalizedName);
      if (this.fingerprintProbeIndex.has(baseName)) {
        matchedRecord = this.fingerprintProbeIndex.get(baseName);
      } else {
        for (const [key, record] of this.fingerprintProbeIndex.entries()) {
          if (!key.startsWith('hash:') && baseName.includes(key.replace('.png', ''))) {
            matchedRecord = record;
            break;
          }
        }
      }
    }

    if (!matchedRecord && buffer) {
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      if (this.fingerprintProbeIndex.has(`hash:${hash}`)) {
        matchedRecord = this.fingerprintProbeIndex.get(`hash:${hash}`);
      }
    }

    if (!matchedRecord) {
      return {
        matchFound: false,
        candidates: [],
        mode: 'TEST MODE',
        dataset: 'NETRISH Synthetic Biometric Test Dataset',
        message: 'NO MATCH FOUND in Synthetic Test Dataset'
      };
    }

    const candidate = new BiometricCandidate({
      searchRequestId,
      subjectId: matchedRecord.subject_id,
      caseId: matchedRecord.case_id,
      displayName: matchedRecord.display_name,
      matchType: 'TEST_MODE_DETERMINISTIC_MAP',
      similarityScore: 0.992,
      reviewStatus: 'PENDING_HUMAN_REVIEW',
      enrolledImagePath: `/api/biometric/image?path=${encodeURIComponent(matchedRecord.fingerprint_enrolled_image)}`,
      probeImagePath: `/api/biometric/image?path=${encodeURIComponent(matchedRecord.fingerprint_probe_image)}`,
      fingerName: matchedRecord.finger_name || fingerName || 'RIGHT_THUMB',
      matchLabel: matchedRecord.match_label || 'MATCH',
      dataset: 'NETRISH Synthetic Biometric Test Dataset',
      isSynthetic: true
    });

    this.candidatesStore.set(candidate.id, candidate);

    return {
      matchFound: true,
      mode: 'TEST MODE',
      dataset: 'NETRISH Synthetic Biometric Test Dataset',
      biometricType: 'Fingerprint',
      candidates: [candidate],
      message: 'Synthetic test candidate identified.'
    };
  }

  async getCandidate(candidateId) {
    return this.candidatesStore.get(candidateId) || null;
  }
}

export class AuthorizedBiometricProvider extends BiometricSearchProvider {
  constructor() {
    super();
    this.isAuthorized = false;
  }

  async searchFace() {
    throw new Error('AuthorizedBiometricProvider not active. Forensic-grade real-world AFIS recognition requires authorized legal clearance and live external provider configuration.');
  }

  async searchFingerprint() {
    throw new Error('AuthorizedBiometricProvider not active. Forensic-grade real-world AFIS recognition requires authorized legal clearance and live external provider configuration.');
  }
}
