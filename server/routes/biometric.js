import express from 'express';
import path from 'path';
import fs from 'fs';
import { biometricService } from '../biometric/biometricService.js';
import { authenticateOfficer } from './auth.js';
import { store } from '../dataStore.js';

const router = express.Router();

// Middleware: Require Officer Authentication
function requireOfficerAuth(req, res, next) {
  const officer = authenticateOfficer(req);
  if (!officer) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Officer bearer token or session credentials.'
    });
  }
  req.officer = officer;
  next();
}

// Helper: Check case authorization
function isOfficerAuthorizedForCase(officer, caseId) {
  if (!caseId) return true;

  // Synthetic test cases are open to all authenticated officers for benchmark testing
  if (caseId.startsWith('TEST-CASE-')) {
    return true;
  }

  // Check role-based global clearance
  if (officer.role === 'Security Guardian' || officer.role === 'Department Admin' || officer.role === 'Management Overview') {
    return true;
  }

  // Check department ownership
  const caseRecord = store.cases.get(caseId);
  if (caseRecord && caseRecord.department === officer.department) {
    return true;
  }

  // Check cross-agency access request
  const hasApprovedRequest = store.accessRequests.some(
    r => r.caseId === caseId && r.officerId === officer.id && r.status === 'ACTIVE_STREAMING'
  );

  return hasApprovedRequest;
}

// POST /api/biometric/search/face
router.post('/search/face', requireOfficerAuth, async (req, res) => {
  try {
    const { filename, fileBase64, mimeType, caseId = 'TEST-CASE-101' } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!filename && !fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'No file selected. Please select or upload a face image probe.'
      });
    }

    // Check authorization for case
    if (!isOfficerAuthorizedForCase(req.officer, caseId)) {
      store.logAudit(
        'SECURITY_POLICY_VIOLATION',
        req.officer,
        {
          action: 'BIOMETRIC_SEARCH_REJECTED',
          reason: 'Unauthorized case access attempt',
          caseId,
          officerId: req.officer.id,
          officerDepartment: req.officer.department
        },
        ip
      );
      return res.status(403).json({
        success: false,
        error: `Unauthorized access: Officer ${req.officer.name} (${req.officer.department}) lacks clearance for Case #${caseId}. Cross-agency access request required.`
      });
    }

    let buffer = null;
    let effectiveMime = mimeType || 'image/png';

    if (fileBase64) {
      const match = fileBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        effectiveMime = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(fileBase64, 'base64');
      }
    } else if (filename) {
      const probeCheckPaths = [
        path.join(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset/faces/probe', path.basename(filename)),
        path.join(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset/faces/enrolled', path.basename(filename)),
        path.join(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset', filename)
      ];
      for (const p of probeCheckPaths) {
        if (fs.existsSync(p)) {
          try { buffer = fs.readFileSync(p); } catch(e) {}
          break;
        }
      }
    }

    // Validate using storage provider
    const validation = biometricService.storage.validateFile(filename || 'face_probe.png', buffer, effectiveMime);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const result = await biometricService.searchFace({
      filename: filename || 'face_probe.png',
      buffer,
      mimeType: effectiveMime,
      userId: req.officer.id,
      userDepartment: req.officer.department,
      caseId,
      ip
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[BiometricRoute] Face search error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Face biometric search failed'
    });
  }
});

// POST /api/biometric/search/fingerprint
router.post('/search/fingerprint', requireOfficerAuth, async (req, res) => {
  try {
    const { filename, fileBase64, mimeType, fingerName = 'RIGHT_THUMB', caseId = 'TEST-CASE-101' } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (!filename && !fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'No file selected. Please select or upload a fingerprint probe image.'
      });
    }

    // Check authorization for case
    if (!isOfficerAuthorizedForCase(req.officer, caseId)) {
      store.logAudit(
        'SECURITY_POLICY_VIOLATION',
        req.officer,
        {
          action: 'BIOMETRIC_SEARCH_REJECTED',
          reason: 'Unauthorized case access attempt',
          caseId,
          officerId: req.officer.id,
          officerDepartment: req.officer.department
        },
        ip
      );
      return res.status(403).json({
        success: false,
        error: `Unauthorized access: Officer ${req.officer.name} (${req.officer.department}) lacks clearance for Case #${caseId}. Cross-agency access request required.`
      });
    }

    let buffer = null;
    let effectiveMime = mimeType || 'image/png';

    if (fileBase64) {
      const match = fileBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        effectiveMime = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(fileBase64, 'base64');
      }
    } else if (filename) {
      const probeCheckPaths = [
        path.join(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset/fingerprints/probe', path.basename(filename)),
        path.join(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset/fingerprints/enrolled', path.basename(filename)),
        path.join(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset', filename)
      ];
      for (const p of probeCheckPaths) {
        if (fs.existsSync(p)) {
          try { buffer = fs.readFileSync(p); } catch(e) {}
          break;
        }
      }
    }

    const validation = biometricService.storage.validateFile(filename || 'fp_probe.png', buffer, effectiveMime);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const result = await biometricService.searchFingerprint({
      filename: filename || 'fp_probe.png',
      buffer,
      mimeType: effectiveMime,
      fingerName,
      userId: req.officer.id,
      userDepartment: req.officer.department,
      caseId,
      ip
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[BiometricRoute] Fingerprint search error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Fingerprint biometric search failed'
    });
  }
});

// GET /api/biometric/history
router.get('/history', requireOfficerAuth, (req, res) => {
  try {
    const history = biometricService.getSearchHistory();
    res.json({
      success: true,
      total: history.length,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/biometric/history/:id
router.get('/history/:id', requireOfficerAuth, (req, res) => {
  try {
    const details = biometricService.getSearchRequestById(req.params.id);
    if (!details) {
      return res.status(404).json({ success: false, error: 'Search record not found' });
    }
    res.json({
      success: true,
      searchRequest: details
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/biometric/test-records
router.get('/test-records', requireOfficerAuth, (req, res) => {
  try {
    const records = biometricService.getTestRecords();
    res.json({
      success: true,
      mode: 'TEST MODE',
      dataset: 'NETRISH Synthetic Biometric Test Dataset',
      records
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/biometric/image
router.get('/image', (req, res) => {
  try {
    const reqPath = req.query.path;
    if (!reqPath) {
      return res.status(400).send('Missing path parameter');
    }

    const datasetDir = path.resolve(process.cwd(), 'data/NETRISH_Biometric_Test_Dataset');
    const uploadsDir = path.resolve(process.cwd(), 'data/uploads/biometric');

    let fullPath = '';
    if (reqPath.startsWith('uploads/')) {
      fullPath = path.resolve(process.cwd(), 'data', reqPath);
    } else {
      fullPath = path.resolve(datasetDir, reqPath.replace(/^[/\\]+/, ''));
    }

    // Path traversal check
    if (!fullPath.startsWith(datasetDir) && !fullPath.startsWith(uploadsDir)) {
      return res.status(403).send('Forbidden: Access outside biometric directory is prohibited');
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('Image file not found');
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };

    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    res.status(500).send('Error reading biometric image');
  }
});

// POST /api/biometric/audit/view-result
router.post('/audit/view-result', requireOfficerAuth, (req, res) => {
  try {
    const { candidateId, subjectId, caseId } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    biometricService.logResultViewed({
      candidateId,
      subjectId,
      caseId,
      userId: req.officer.id,
      userDepartment: req.officer.department,
      ip
    });

    res.json({ success: true, message: 'View event audited' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
