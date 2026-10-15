import path from 'path';
import { store } from '../dataStore.js';
import { LocalFileStorageProvider } from './storageProvider.js';
import { SyntheticDatasetTestProvider } from './searchProvider.js';
import { BiometricSearchRequest } from './models.js';

class BiometricService {
  constructor() {
    this.storage = new LocalFileStorageProvider();
    this.testProvider = new SyntheticDatasetTestProvider();
    this.activeProvider = this.testProvider;
    this.searchHistory = []; // BiometricSearchRequest[]

    this.initDataStoreIntegration();
  }

  initDataStoreIntegration() {
    // Ensure dataset records are loaded
    if (!this.testProvider.isLoaded) {
      this.testProvider.loadDataset();
    }

    const records = this.testProvider.records || [];
    records.forEach((r, idx) => {
      const subjectId = r.subject_id;
      const caseId = r.case_id;
      const displayName = r.display_name;
      const phoneId = `TEST-PH-${String(idx + 1).padStart(3, '0')}`;

      // 1. Register in store.entities if not already present
      if (!store.entities.has(subjectId)) {
        store.entities.set(subjectId, {
          id: subjectId,
          type: 'Person',
          name: displayName,
          primaryName: displayName,
          status: 'TEST_ONLY',
          riskScore: 78,
          synthetic: true,
          isSyntheticTest: true,
          linkedCases: [caseId],
          aliases: [`Synthetic Subject #${idx + 1}`],
          identifiers: {
            testId: subjectId,
            caseId: caseId,
            fingerprint: `${r.finger_name} (${r.fingerprint_enrolled_image})`,
            faceTemplate: r.face_enrolled_image
          },
          telemetry: {
            phones: [`+91 90000-${String(idx + 1).padStart(5, '0')}`],
            imeis: [`86012904812${String(idx + 1).padStart(4, '0')}`],
            vehicles: [`DL-01-TEST-${String(idx + 1).padStart(4, '0')}`]
          },
          chronology: [
            {
              time: '09:00 AM',
              event: 'Synthetic biometric enrollment logged in NETRISH test benchmark repository.',
              source: 'Biometric Test Suite',
              location: 'National Forensic Science Lab (Virtual Test Bed)'
            },
            {
              time: '11:30 AM',
              event: 'Cross-agency automated test fingerprint & facial vector matched.',
              source: 'NAFIS Synthetic Engine',
              location: 'Virtual Test Grid'
            }
          ]
        });
      }

      // 2. Register in store.cases if not already present
      if (!store.cases.has(caseId)) {
        store.cases.set(caseId, {
          id: caseId,
          title: `SYNTHETIC BENCHMARK CASE: ${displayName} Biometric Validation`,
          department_id: 'D002',
          department: 'D002',
          deptName: 'CBI (Central Bureau of Investigation)',
          leadInvestigator: 'Inspector Vikram Rathore',
          leadSuspect: subjectId,
          leadSuspectName: displayName,
          priority: 'MEDIUM',
          status: 'ACTIVE_BENCHMARK',
          openedDate: '2026-10-01',
          description: `Synthetic benchmark case file for verifying cross-agency biometric search and network graph propagation. Safe artificial test patterns only.`,
          entities: [subjectId],
          persons: new Set([subjectId]),
          phones: new Set([phoneId]),
          vehicles: new Set([]),
          organizations: new Set([]),
          locations: new Set([]),
          evidenceRefs: new Set([r.face_probe_image, r.fingerprint_probe_image]),
          maxAnomaly: 0.15,
          eventsCount: 2,
          isSynthetic: true
        });
      }

      // 3. Register Graph edges
      store.addGraphEdge(caseId, subjectId, 'SUSPECT_IN_CASE', {
        weight: 1.0,
        anomaly_score: 0.15,
        synthetic: true
      });

      store.addGraphEdge(subjectId, phoneId, 'USES_PHONE', {
        weight: 0.9,
        synthetic: true
      });
    });

    console.log(`[BiometricService] Integrated ${records.length} synthetic test subjects into NETRISH Entity & Case Store.`);
  }

  async searchFace({ filename, buffer, mimeType, userId, userDepartment, caseId = 'TEST-CASE-101', ip = '127.0.0.1' }) {
    // 1. Create and store request
    const searchReq = new BiometricSearchRequest({
      userId: userId || 'OFFICER-001',
      caseId: caseId || 'TEST-CASE-101',
      biometricType: 'FACE',
      inputFile: filename,
      originalFilename: filename,
      mimeType,
      fileSize: buffer ? buffer.length : 0
    });

    // 2. Audit: BIOMETRIC_SEARCH_REQUESTED (no raw image bytes in audit payload)
    store.logAudit(
      'BIOMETRIC_SEARCH_REQUESTED',
      { id: userId, department: userDepartment },
      {
        searchRequestId: searchReq.id,
        biometricType: 'FACE',
        caseId: searchReq.caseId,
        filename: path.basename(filename || 'unknown'),
        mimeType: mimeType || 'image/png',
        fileSizeBytes: buffer ? buffer.length : 0,
        mode: 'TEST MODE'
      },
      ip
    );

    // 3. Save file using storage provider if buffer is provided
    let savedFile = null;
    if (buffer) {
      try {
        savedFile = await this.storage.saveFile(filename, buffer, mimeType);
        searchReq.inputFile = savedFile.relativePath;
      } catch (err) {
        // file save error
      }
    }

    // 4. Run search through test provider
    const searchResult = await this.activeProvider.searchFace({
      filename,
      buffer,
      searchRequestId: searchReq.id,
      caseId: searchReq.caseId,
      userId: searchReq.userId
    });

    // 5. Update request status
    if (searchResult.matchFound && searchResult.candidates.length > 0) {
      searchReq.markCompleted(searchResult.candidates);

      // Audit: BIOMETRIC_CANDIDATES_FOUND
      store.logAudit(
        'BIOMETRIC_CANDIDATES_FOUND',
        { id: userId, department: userDepartment },
        {
          searchRequestId: searchReq.id,
          biometricType: 'FACE',
          caseId: searchReq.caseId,
          resultCount: searchResult.candidates.length,
          topCandidateId: searchResult.candidates[0].subjectId,
          topCandidateCase: searchResult.candidates[0].caseId,
          matchStatus: searchResult.candidates[0].matchLabel,
          mode: 'TEST MODE'
        },
        ip
      );
    } else {
      searchReq.markCompleted([]);

      // Audit: BIOMETRIC_NO_MATCH
      store.logAudit(
        'BIOMETRIC_NO_MATCH',
        { id: userId, department: userDepartment },
        {
          searchRequestId: searchReq.id,
          biometricType: 'FACE',
          caseId: searchReq.caseId,
          resultCount: 0,
          reason: 'No synthetic probe record matches the uploaded image.',
          mode: 'TEST MODE'
        },
        ip
      );
    }

    // Audit: BIOMETRIC_SEARCH_COMPLETED
    store.logAudit(
      'BIOMETRIC_SEARCH_COMPLETED',
      { id: userId, department: userDepartment },
      {
        searchRequestId: searchReq.id,
        biometricType: 'FACE',
        caseId: searchReq.caseId,
        status: searchReq.status,
        resultCount: searchReq.candidateCount,
        mode: 'TEST MODE'
      },
      ip
    );

    this.searchHistory.unshift(searchReq);
    if (this.searchHistory.length > 100) this.searchHistory.pop();

    return {
      searchRequest: searchReq.toJSON(),
      ...searchResult
    };
  }

  async searchFingerprint({ filename, buffer, mimeType, fingerName = 'RIGHT_THUMB', userId, userDepartment, caseId = 'TEST-CASE-101', ip = '127.0.0.1' }) {
    const searchReq = new BiometricSearchRequest({
      userId: userId || 'OFFICER-001',
      caseId: caseId || 'TEST-CASE-101',
      biometricType: 'FINGERPRINT',
      fingerName,
      inputFile: filename,
      originalFilename: filename,
      mimeType,
      fileSize: buffer ? buffer.length : 0
    });

    // Audit: BIOMETRIC_SEARCH_REQUESTED
    store.logAudit(
      'BIOMETRIC_SEARCH_REQUESTED',
      { id: userId, department: userDepartment },
      {
        searchRequestId: searchReq.id,
        biometricType: 'FINGERPRINT',
        fingerName,
        caseId: searchReq.caseId,
        filename: path.basename(filename || 'unknown'),
        mimeType: mimeType || 'image/png',
        fileSizeBytes: buffer ? buffer.length : 0,
        mode: 'TEST MODE'
      },
      ip
    );

    let savedFile = null;
    if (buffer) {
      try {
        savedFile = await this.storage.saveFile(filename, buffer, mimeType);
        searchReq.inputFile = savedFile.relativePath;
      } catch (err) {
        // file save error
      }
    }

    const searchResult = await this.activeProvider.searchFingerprint({
      filename,
      buffer,
      fingerName,
      searchRequestId: searchReq.id,
      caseId: searchReq.caseId,
      userId: searchReq.userId
    });

    if (searchResult.matchFound && searchResult.candidates.length > 0) {
      searchReq.markCompleted(searchResult.candidates);

      store.logAudit(
        'BIOMETRIC_CANDIDATES_FOUND',
        { id: userId, department: userDepartment },
        {
          searchRequestId: searchReq.id,
          biometricType: 'FINGERPRINT',
          fingerName,
          caseId: searchReq.caseId,
          resultCount: searchResult.candidates.length,
          topCandidateId: searchResult.candidates[0].subjectId,
          topCandidateCase: searchResult.candidates[0].caseId,
          matchStatus: searchResult.candidates[0].matchLabel,
          mode: 'TEST MODE'
        },
        ip
      );
    } else {
      searchReq.markCompleted([]);

      store.logAudit(
        'BIOMETRIC_NO_MATCH',
        { id: userId, department: userDepartment },
        {
          searchRequestId: searchReq.id,
          biometricType: 'FINGERPRINT',
          fingerName,
          caseId: searchReq.caseId,
          resultCount: 0,
          reason: 'No synthetic fingerprint probe record matches the uploaded print.',
          mode: 'TEST MODE'
        },
        ip
      );
    }

    store.logAudit(
      'BIOMETRIC_SEARCH_COMPLETED',
      { id: userId, department: userDepartment },
      {
        searchRequestId: searchReq.id,
        biometricType: 'FINGERPRINT',
        fingerName,
        caseId: searchReq.caseId,
        status: searchReq.status,
        resultCount: searchReq.candidateCount,
        mode: 'TEST MODE'
      },
      ip
    );

    this.searchHistory.unshift(searchReq);
    if (this.searchHistory.length > 100) this.searchHistory.pop();

    return {
      searchRequest: searchReq.toJSON(),
      ...searchResult
    };
  }

  logResultViewed({ candidateId, subjectId, caseId, userId, userDepartment, ip = '127.0.0.1' }) {
    store.logAudit(
      'BIOMETRIC_RESULT_VIEWED',
      { id: userId, department: userDepartment },
      {
        candidateId,
        subjectId,
        caseId,
        mode: 'TEST MODE',
        reviewedAt: new Date().toISOString()
      },
      ip
    );
  }

  getSearchHistory() {
    return this.searchHistory.map(r => r.toJSON());
  }

  getSearchRequestById(id) {
    const req = this.searchHistory.find(r => r.id === id);
    return req ? req.toJSON() : null;
  }

  getTestRecords() {
    if (!this.testProvider.isLoaded) {
      this.testProvider.loadDataset();
    }
    return this.testProvider.records || [];
  }
}

export const biometricService = new BiometricService();
