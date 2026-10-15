import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();

router.get('/overview', (req, res) => {
  const deptId = req.query.department || 'D001';
  const dept = store.departments.get(deptId);

  const totalCases = store.cases.size;
  const totalEntities = store.entities.size;
  const totalRecords = store.records.length;
  const pendingRequests = store.accessRequests.filter(r => r.status === 'PENDING').length;
  const highSeverityAlerts = store.securityAlerts.filter(a => a.severity === 'HIGH').length;

  const statusCounts = {
    Open: 0,
    Under_Investigation: 0,
    Pending: 0,
    Solved: 0,
    Closed: 0
  };

  store.cases.forEach(c => {
    const s = c.status || 'Open';
    if (statusCounts[s] !== undefined) statusCounts[s]++;
    else statusCounts.Open++;
  });

  const recentCases = Array.from(store.cases.values())
    .slice(0, 12)
    .map(c => ({
      id: c.id,
      title: c.title,
      status: c.status || 'Active',
      department: c.department_id || c.department || 'D002',
      suspectsCount: c.persons?.size ?? (Array.isArray(c.persons) ? c.persons.length : (c.entities?.length || 1)),
      evidenceCount: c.evidenceRefs?.size ?? (Array.isArray(c.evidenceRefs) ? c.evidenceRefs.length : 1),
      maxAnomaly: c.maxAnomaly ?? 0.2,
      latestDatetime: c.latestDatetime || c.openedDate || new Date().toISOString()
    }));

  res.json({
    success: true,
    stats: {
      totalCases,
      totalEntities,
      totalRecords,
      pendingRequests,
      highSeverityAlerts,
      deptCases: dept ? dept.cases.size : 0,
      deptName: dept ? dept.name : store.getDepartmentName(deptId)
    },
    statusCounts,
    recentCases,
    securityAlerts: store.securityAlerts.slice(0, 5)
  });
});

router.get('/department/:deptId', (req, res) => {
  const deptId = req.params.deptId;
  const deptName = store.getDepartmentName(deptId);
  const dept = store.departments.get(deptId);

  const officers = Array.from(store.users.values()).filter(u => u.department === deptId);

  const deptCases = Array.from(store.cases.values())
    .filter(c => c.department_id === deptId)
    .slice(0, 15)
    .map(c => ({
      id: c.id,
      title: c.title,
      status: c.status,
      suspects: c.persons?.size ?? (Array.isArray(c.persons) ? c.persons.length : (c.entities?.length || 1)),
      maxAnomaly: c.maxAnomaly ?? 0.2,
      latestDatetime: c.latestDatetime || c.openedDate || new Date().toISOString()
    }));

  res.json({
    success: true,
    department: {
      id: deptId,
      name: deptName,
      headOfficer: 'Superintendent of Police',
      jurisdiction: 'National Cyber & Special Operations Zone',
      totalCases: dept ? dept.cases.size : deptCases.length,
      activeInvestigators: officers.length || 3,
      clearanceLevel: 'LEVEL 4 - RESTRICTED',
      officers: officers.length > 0 ? officers : [
        { id: 'OFFICER-001', name: 'Inspector Vikram Rathore', role: 'Investigator', status: 'ACTIVE' },
        { id: 'ADMIN-007', name: 'SP Neha Sharma', role: 'Department Admin', status: 'ACTIVE' }
      ],
      cases: deptCases
    }
  });
});

router.get('/cases', (req, res) => {
  const { search, status, department, page = 1, limit = 20 } = req.query;
  let casesList = Array.from(store.cases.values());

  if (search) {
    const q = search.toLowerCase();
    casesList = casesList.filter(c => 
      c.id.toLowerCase().includes(q) || 
      c.title.toLowerCase().includes(q) ||
      (c.department_id && c.department_id.toLowerCase().includes(q))
    );
  }

  if (status && status !== 'ALL') {
    casesList = casesList.filter(c => c.status?.toLowerCase() === status.toLowerCase());
  }

  if (department && department !== 'ALL') {
    casesList = casesList.filter(c => c.department_id === department || c.department === department);
  }

  const total = casesList.length;
  const startIndex = (page - 1) * limit;
  const paginated = casesList.slice(startIndex, startIndex + parseInt(limit)).map(c => {
    const deptId = c.department_id || c.department || 'D001';
    return {
      id: c.id,
      title: c.title,
      status: c.status || 'Active',
      department_id: deptId,
      department_name: store.getDepartmentName(deptId),
      persons_count: c.persons?.size ?? (Array.isArray(c.persons) ? c.persons.length : (c.entities?.length || 1)),
      phones_count: c.phones?.size ?? (Array.isArray(c.phones) ? c.phones.length : 1),
      vehicles_count: c.vehicles?.size ?? (Array.isArray(c.vehicles) ? c.vehicles.length : 0),
      evidence_count: c.evidenceRefs?.size ?? (Array.isArray(c.evidenceRefs) ? c.evidenceRefs.length : 1),
      max_anomaly: c.maxAnomaly ?? (c.anomaly_score ?? 0.1),
      latest_event: c.latestDatetime || c.openedDate || new Date().toISOString()
    };
  });

  res.json({
    success: true,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    cases: paginated
  });
});

router.get('/cases/:caseId', (req, res) => {
  const caseId = req.params.caseId;
  const c = store.cases.get(caseId);

  if (!c) {
    return res.status(404).json({ success: false, message: `Case ${caseId} not found.` });
  }

  const persons = Array.from(c.persons || c.entities || []).map(pId => {
    const p = store.entities.get(pId);
    return {
      id: pId,
      label: p ? (p.label || p.name || p.primaryName) : `Person ${pId}`,
      role: p ? (p.role || 'Subject') : 'Subject',
      anomaly: p ? (p.maxAnomaly ?? 0.5) : 0.5,
      phones: p ? (Array.isArray(p.phones) ? p.phones : (p.phones ? Array.from(p.phones) : [])) : [],
      vehicles: p ? (Array.isArray(p.vehicles) ? p.vehicles : (p.vehicles ? Array.from(p.vehicles) : [])) : []
    };
  });

  const events = store.records
    .filter(r => r.case_id === caseId)
    .map(r => ({
      record_id: r.record_id,
      datetime: r.event_datetime,
      event_type: r.event_type,
      person_id: r.person_id,
      person_label: r.person_label,
      relationship: r.relationship_type,
      evidence_ref: r.evidence_ref,
      source_type: r.source_type,
      anomaly_score: parseFloat(r.anomaly_score) || 0,
      ai_signal: r.ai_signal
    }))
    .sort((a, b) => (a.datetime > b.datetime ? -1 : 1));

  const ws = store.workspaces.get(caseId) || { notes: [], pinnedEntities: [], leads: [] };

  const deptId = c.department_id || c.department || 'D001';
  res.json({
    success: true,
    caseData: {
      id: c.id,
      title: c.title,
      status: c.status || 'Active',
      department_id: deptId,
      department_name: store.getDepartmentName(deptId),
      max_anomaly: c.maxAnomaly ?? 0.2,
      eventsCount: c.eventsCount || events.length,
      persons,
      phones: Array.from(c.phones || []),
      vehicles: Array.from(c.vehicles || []),
      organizations: Array.from(c.organizations || []),
      locations: Array.from(c.locations || []),
      evidenceRefs: Array.from(c.evidenceRefs || []),
      events: events.slice(0, 30),
      workspace: ws
    }
  });
});

router.post('/cases', (req, res) => {
  const { id, title, department_id = 'D002', status = 'Open', primaryAccused, lawSection, officer } = req.body;

  const newId = id?.trim() || `C${String(store.cases.size + 1).padStart(5, '0')}`;

  if (store.cases.has(newId)) {
    return res.status(400).json({ success: false, message: `Case ID ${newId} already exists.` });
  }

  const newCase = {
    id: newId,
    title: title?.trim() || `Case #${newId} Investigation`,
    status: status || 'Open',
    department_id: department_id || 'D002',
    persons: new Set(),
    phones: new Set(['PH00002']),
    vehicles: new Set(['V0232']),
    organizations: new Set(),
    locations: new Set(['L0081']),
    evidenceRefs: new Set([`FIR-${newId}/2026`]),
    eventsCount: 1,
    maxAnomaly: 0.85,
    latestDatetime: new Date().toISOString(),
    records: []
  };

  if (primaryAccused) {
    const accId = primaryAccused.id || `P${String(store.entities.size + 1).padStart(4, '0')}`;
    newCase.persons.add(accId);
    if (!store.entities.has(accId)) {
      store.entities.set(accId, {
        id: accId,
        label: primaryAccused.name || `Person ${accId}`,
        role: primaryAccused.role || 'Primary Accused',
        phones: new Set(['PH00002']),
        vehicles: new Set(['V0232']),
        locations: new Set(['L0081']),
        organizations: new Set(),
        cases: new Set([newId]),
        departments: new Set([department_id]),
        maxAnomaly: 0.88,
        events: [],
        relationships: [],
        evidenceRefs: new Set([`FIR-${newId}/2026`])
      });
    }
  }

  store.cases.set(newId, newCase);

  store.logAudit('CASE_REGISTERED', officer, {
    caseId: newId,
    title: newCase.title,
    department: department_id,
    lawSection
  });

  res.json({
    success: true,
    message: `Case ${newId} registered successfully in ${store.getDepartmentName(department_id)}.`,
    caseFile: {
      id: newCase.id,
      title: newCase.title,
      status: newCase.status,
      department_id: newCase.department_id,
      department_name: store.getDepartmentName(newCase.department_id)
    }
  });
});

router.post('/cases/:caseId/status', (req, res) => {
  const caseId = req.params.caseId;
  const { status, officer } = req.body;
  const c = store.cases.get(caseId);

  if (!c) {
    return res.status(404).json({ success: false, message: 'Case not found.' });
  }

  const validStatuses = ['REGISTERED', 'OPEN', 'UNDER_INVESTIGATION', 'PENDING_REVIEW', 'SOLVED', 'CLOSED', 'ARCHIVED'];
  if (!validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({ success: false, message: 'Invalid case status lifecycle stage.' });
  }

  const prevStatus = c.status;
  c.status = status;

  store.logAudit('CASE_STATUS_UPDATED', officer, {
    case_id: caseId,
    previous_status: prevStatus,
    new_status: status
  });

  res.json({ success: true, message: `Case ${caseId} status changed to ${status}.` });
});

router.post('/cases/:caseId/workspace', (req, res) => {
  const caseId = req.params.caseId;
  const { type, payload, officer } = req.body;

  if (!store.workspaces.has(caseId)) {
    store.workspaces.set(caseId, { notes: [], pinnedEntities: [], leads: [] });
  }

  const ws = store.workspaces.get(caseId);

  if (type === 'NOTE') {
    ws.notes.unshift({
      id: `NOTE-${Date.now()}`,
      content: payload.content,
      officer: officer?.name || 'Officer',
      timestamp: new Date().toISOString()
    });
  } else if (type === 'PIN_ENTITY') {
    if (!ws.pinnedEntities.includes(payload.entityId)) {
      ws.pinnedEntities.push(payload.entityId);
    }
  } else if (type === 'LEAD') {
    ws.leads.unshift({
      id: `LEAD-${Date.now()}`,
      title: payload.title,
      details: payload.details,
      signal: payload.signal || 'Possible Lead',
      evidence_ref: payload.evidence_ref || 'INTERNAL_NOTE',
      timestamp: new Date().toISOString()
    });
  }

  store.logAudit('WORKSPACE_UPDATED', officer, { caseId, type, payloadSummary: payload?.title || payload?.content?.slice(0, 30) });

  res.json({ success: true, workspace: ws });
});

router.get('/access-requests', (req, res) => {
  res.json({ success: true, requests: store.accessRequests });
});

router.post('/access-requests', (req, res) => {
  const {
    targetDepartment,
    caseId,
    purpose,
    durationMins = 60,
    suspectIdentifier,
    officer,
    badge
  } = req.body;

  const reqId = `REQ-${Date.now().toString().slice(-6)}`;
  const expiresAt = new Date(Date.now() + (parseInt(durationMins) || 60) * 60 * 1000).toISOString();

  const newRequest = {
    id: reqId,
    requestingOfficer: officer?.name || 'Inspector Vikram Rathore',
    officerId: officer?.id || 'OFFICER-001',
    badge: badge || 'CBI-SP-041',
    fromDepartment: officer?.department || 'D002',
    fromDeptName: store.getDepartmentName(officer?.department || 'D002'),
    targetDepartment: targetDepartment || 'D006',
    targetDeptName: store.getDepartmentName(targetDepartment || 'D006'),
    caseId: caseId || 'C00228',
    suspectIdentifier: suspectIdentifier || 'Aadhaar: 4921-8842-1092 / Phone: +91 98210-1000',
    purpose: purpose || 'Multi-agency cross-jurisdiction forensic audit',
    status: 'PENDING',
    requestedAt: new Date().toISOString(),
    expiresAt,
    durationMins: parseInt(durationMins) || 60,
    currentScreenActivity: 'Awaiting Authorization',
    officerIp: '10.42.18.91',
    deviceSignature: 'DELL-OPTIPLEX-NCR-GOV-09',
    isRecording: false
  };

  store.accessRequests.unshift(newRequest);
  store.logAudit('ACCESS_REQUESTED', officer, { requestId: reqId, targetDepartment, caseId, suspectIdentifier });

  res.json({ success: true, request: newRequest });
});

router.post('/access-requests/:id/approve', (req, res) => {
  const reqId = req.params.id;
  const { officer } = req.body;
  const r = store.accessRequests.find(x => x.id === reqId);

  if (!r) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  r.status = 'ACTIVE_STREAMING';
  r.approvedBy = officer?.name || 'Department Administrator';
  r.approvedAt = new Date().toISOString();
  r.isRecording = true;
  r.currentScreenActivity = 'Case File Opened • Live Screen & Video Surveillance Active';

  store.logAudit('TEMP_ACCESS_GRANTED', officer, { requestId: reqId, targetDepartment: r.targetDepartment, expiresAt: r.expiresAt });

  res.json({ success: true, message: `Access granted until ${new Date(r.expiresAt).toLocaleTimeString()}`, request: r });
});

router.post('/access-requests/:id/revoke', (req, res) => {
  const reqId = req.params.id;
  const { officer } = req.body;
  const r = store.accessRequests.find(x => x.id === reqId);

  if (!r) {
    return res.status(404).json({ success: false, message: 'Request not found.' });
  }

  r.status = 'REVOKED';
  r.revokedAt = new Date().toISOString();
  r.isRecording = false;
  r.currentScreenActivity = 'ACCESS TERMINATED BY CUSTODIAN';

  store.logAudit('TEMP_ACCESS_REVOKED', officer, { requestId: reqId, targetDepartment: r.targetDepartment });

  res.json({ success: true, message: `Access revoked instantly for request ${reqId}.`, request: r });
});

router.get('/security-guardian', (req, res) => {
  if (store.securityAlerts.length < 3) {
    store.securityAlerts.push(
      {
        id: 'SEC-101',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        type: 'SUSPICIOUS_CROSS_QUERY_SPIKE',
        severity: 'MEDIUM',
        details: 'High frequency query executed on classified narcotics case cluster from remote workstation.'
      },
      {
        id: 'SEC-102',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        type: 'FAILED_PIN_RETRY_LIMIT',
        severity: 'HIGH',
        details: 'Officer ID OFFICER-001 reached 3 consecutive PIN attempts before validation.'
      }
    );
  }

  res.json({
    success: true,
    threatLevel: 'DEFCON-3 ELEVATED',
    alerts: store.securityAlerts,
    stats: {
      totalAlerts: store.securityAlerts.length,
      highAlerts: store.securityAlerts.filter(a => a.severity === 'HIGH').length,
      mediumAlerts: store.securityAlerts.filter(a => a.severity === 'MEDIUM').length,
      monitoredNodes: 1204
    }
  });
});

router.get('/audit-trail', (req, res) => {
  const { search, limit = 50 } = req.query;
  let logs = store.auditTrail;

  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(l => 
      l.action.toLowerCase().includes(q) ||
      l.officer_name.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q) ||
      l.hash.toLowerCase().includes(q)
    );
  }

  let isChainIntact = true;
  for (let i = logs.length - 1; i > 0; i--) {
    if (logs[i - 1].prev_hash !== logs[i].hash && logs[i].id !== 'AUD-000001') {
      isChainIntact = false;
      break;
    }
  }

  res.json({
    success: true,
    totalRecords: store.auditTrail.length,
    isChainTamperEvident: isChainIntact,
    chainIntegrityStatus: isChainIntact ? 'VERIFIED_VALID' : 'CORRUPTED',
    logs: logs.slice(0, parseInt(limit))
  });
});

router.get('/management', (req, res) => {
  const depts = Array.from(store.departments.values()).map(d => ({
    id: d.id,
    name: d.name,
    totalCases: d.cases.size,
    totalPersons: d.persons.size,
    eventsCount: d.eventsCount,
    activeAlerts: d.activeAlerts
  }));

  res.json({
    success: true,
    departments: depts,
    systemSummary: {
      totalRecordsIngested: store.records.length,
      totalTrackedPersons: store.entities.size,
      totalRegisteredCases: store.cases.size,
      totalPhoneNumbers: store.phones.size,
      totalVehicles: store.vehicles.size,
      totalOrganizations: store.organizations.size,
      nationalCrimeClearanceRate: '68.4%'
    }
  });
});

export default router;
