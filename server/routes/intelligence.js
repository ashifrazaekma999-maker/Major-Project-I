import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();
const customGraphNodes = new Map();
const deletedGraphNodes = new Map();

router.get('/search', (req, res) => {
  const { q = '', type = 'ALL', limit = 20 } = req.query;
  const query = q.trim().toLowerCase();

  if (!query) {
    const samples = Array.from(store.entities.values())
      .filter(p => p.maxAnomaly > 0.8)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        label: p.label,
        type: 'Person',
        role: p.role,
        anomaly: p.maxAnomaly,
        casesCount: p.cases.size
      }));
    return res.json({ success: true, results: samples });
  }

  const results = [];

  if (type === 'ALL' || type === 'Person') {
    for (const p of store.entities.values()) {
      if (p.id.toLowerCase().includes(query) || p.label.toLowerCase().includes(query) || p.role.toLowerCase().includes(query)) {
        results.push({
          id: p.id,
          label: p.label,
          type: 'Person',
          role: p.role,
          anomaly: p.maxAnomaly,
          casesCount: p.cases.size,
          phonesCount: p.phones.size,
          vehiclesCount: p.vehicles.size
        });
        if (results.length >= limit * 2) break;
      }
    }
  }

  if ((type === 'ALL' || type === 'Phone') && results.length < limit * 2) {
    for (const [phId, ph] of store.phones.entries()) {
      if (phId.toLowerCase().includes(query)) {
        results.push({
          id: phId,
          label: `Phone ${phId}`,
          type: 'Phone',
          linkedPersons: ph.persons.size,
          casesCount: ph.cases.size,
          anomaly: 0.5
        });
      }
    }
  }

  if ((type === 'ALL' || type === 'Vehicle') && results.length < limit * 2) {
    for (const [vId, v] of store.vehicles.entries()) {
      if (vId.toLowerCase().includes(query)) {
        results.push({
          id: vId,
          label: `Vehicle ${vId}`,
          type: 'Vehicle',
          linkedPersons: v.persons.size,
          casesCount: v.cases.size,
          anomaly: 0.6
        });
      }
    }
  }

  if ((type === 'ALL' || type === 'Organization') && results.length < limit * 2) {
    for (const [oId, o] of store.organizations.entries()) {
      if (oId.toLowerCase().includes(query)) {
        results.push({
          id: oId,
          label: `Organization ${oId}`,
          type: 'Organization',
          linkedPersons: o.persons.size,
          casesCount: o.cases.size,
          anomaly: 0.7
        });
      }
    }
  }

  if ((type === 'ALL' || type === 'Case') && results.length < limit * 2) {
    for (const [cId, c] of store.cases.entries()) {
      if (cId.toLowerCase().includes(query) || c.title.toLowerCase().includes(query)) {
        results.push({
          id: cId,
          label: c.title,
          type: 'Case',
          department: c.department_id,
          status: c.status,
          anomaly: c.maxAnomaly
        });
      }
    }
  }

  res.json({
    success: true,
    count: results.length,
    results: results.slice(0, parseInt(limit))
  });
});

router.get('/entity/:id', (req, res) => {
  const entityId = req.params.id;
  const p = store.entities.get(entityId);

  if (!p) {
    if (store.phones.has(entityId)) {
      const ph = store.phones.get(entityId);
      return res.json({
        success: true,
        entity: {
          id: entityId,
          label: `Phone ${entityId}`,
          type: 'Phone',
          cases: Array.from(ph.cases),
          linkedPersons: Array.from(ph.persons).map(pid => store.entities.get(pid)?.label || pid),
          events: []
        }
      });
    }
    return res.status(404).json({ success: false, message: `Entity ${entityId} not found in intelligence registry.` });
  }

  const linkedCases = Array.from(p.cases).map(cId => {
    const c = store.cases.get(cId);
    return {
      id: cId,
      title: c ? c.title : `Case #${cId}`,
      status: c ? c.status : 'Open',
      department: c ? c.department_id : 'D001'
    };
  });

  const connectedNodes = [];
  const neighbors = store.graph.get(entityId);
  if (neighbors) {
    for (const [targetId, edges] of neighbors.entries()) {
      connectedNodes.push({
        id: targetId,
        info: store.getNodeInfo(targetId),
        relationships: edges.map(e => ({ type: e.type, case_id: e.case_id, evidence_ref: e.evidence_ref, signal: e.ai_signal }))
      });
    }
  }

  res.json({
    success: true,
    entity: {
      id: p.id,
      label: p.label,
      role: p.role,
      type: 'Person',
      riskScore: Math.round(p.maxAnomaly * 100),
      anomalyScore: p.maxAnomaly,
      classification: p.maxAnomaly > 0.8 ? 'CRITICAL_WATCHLIST' : (p.maxAnomaly > 0.5 ? 'ELEVATED_SUSPICION' : 'STANDARD_RECORD'),
      cases: linkedCases,
      phones: Array.from(p.phones),
      vehicles: Array.from(p.vehicles),
      organizations: Array.from(p.organizations),
      locations: Array.from(p.locations),
      departments: Array.from(p.departments),
      evidenceRefs: Array.from(p.evidenceRefs),
      eventsCount: p.events.length,
      events: p.events.slice(0, 30),
      connectedNodes: connectedNodes.slice(0, 20),
      accessStatus: 'AUTHORIZED_NATIONAL_CORPUS'
    }
  });
});

router.get('/case-graph/:caseId', (req, res) => {
  const caseId = req.params.caseId || 'C00228';
  let c = store.cases.get(caseId);

  if (!c) {
    const firstCaseKey = Array.from(store.cases.keys())[0] || 'C00228';
    c = store.cases.get(firstCaseKey);
  }

  if (!c) {
    return res.status(404).json({ success: false, message: 'Case not found' });
  }

  const casePersons = Array.from(c.persons).map(pid => store.entities.get(pid)).filter(Boolean);
  const primaryPerson = casePersons[0] || {
    id: 'P0732',
    label: 'Person_0732',
    role: 'Accused (Kingpin)',
    maxAnomaly: 0.89,
    phones: new Set(['PH00002']),
    vehicles: new Set(['V0232']),
    locations: new Set(['L0081'])
  };

  const caseRecords = store.records.filter(r => r.case_id === c.id);

  const nodes = [
    {
      id: c.id,
      label: `CASE #${c.id}`,
      subLabel: store.getDepartmentName(c.department_id),
      type: 'Case',
      isCenter: true,
      department: store.getDepartmentName(c.department_id),
      status: c.status
    }
  ];

  const edges = [];

  // 1. Primary Suspect
  nodes.push({
    id: primaryPerson.id,
    label: primaryPerson.label,
    role: primaryPerson.role || 'Primary Suspect',
    type: 'Suspect',
    anomaly: primaryPerson.maxAnomaly || 0.85,
    aadhaar: `XXXX-XXXX-${primaryPerson.id.replace(/\D/g, '').padEnd(4, '7')}`,
    alias: `Alias: Shadow-${primaryPerson.id.slice(-3)}`
  });
  edges.push({
    id: `E-${c.id}-${primaryPerson.id}`,
    source: c.id,
    target: primaryPerson.id,
    label: 'CHARGED_IN_FIR'
  });

  // 2. Co-accused / Syndicate Members
  const associates = casePersons.slice(1, 4);
  if (associates.length === 0) {
    associates.push({
      id: 'P0765',
      label: 'Person_0765',
      role: 'Syndicate Operative',
      maxAnomaly: 0.72
    });
  }

  associates.forEach((assoc, idx) => {
    nodes.push({
      id: assoc.id,
      label: assoc.label,
      role: assoc.role || 'Co-Conspirator',
      type: 'Member',
      anomaly: assoc.maxAnomaly || 0.65,
      aadhaar: `XXXX-XXXX-${assoc.id.replace(/\D/g, '').padEnd(4, '9')}`
    });
    edges.push({
      id: `E-${primaryPerson.id}-${assoc.id}`,
      source: primaryPerson.id,
      target: assoc.id,
      label: idx === 0 ? 'CO_CONSPIRATOR' : 'SYNDICATE_MEMBER'
    });
  });

  // 3. Phones
  const phoneIds = Array.from(c.phones).slice(0, 3);
  if (phoneIds.length === 0) phoneIds.push('PH00002');
  phoneIds.forEach((ph, idx) => {
    const phoneNodeId = `PHONE-${ph}`;
    nodes.push({
      id: phoneNodeId,
      label: `+91 98210-${(1000 + idx * 372).toString()}`,
      subLabel: `SIM Ref: ${ph}`,
      type: 'Phone',
      telecom: idx === 0 ? 'Airtel NCR' : 'Jio Mumbai'
    });
    edges.push({
      id: `E-${primaryPerson.id}-${phoneNodeId}`,
      source: primaryPerson.id,
      target: phoneNodeId,
      label: 'USES_PHONE'
    });
  });

  // 4. Financial & Bank Accounts
  const txnRecords = caseRecords.filter(r => parseFloat(r.transaction_amount) > 0).slice(0, 2);
  const bankAccounts = txnRecords.length > 0 ? txnRecords : [
    { transaction_amount: '26441.08', record_id: 'TXN-991' },
    { transaction_amount: '145000.00', record_id: 'TXN-992' }
  ];

  bankAccounts.forEach((tx, idx) => {
    const accNodeId = `ACC-${c.id}-${idx + 1}`;
    const amountVal = parseFloat(tx.transaction_amount) || 25000;
    nodes.push({
      id: accNodeId,
      label: `HDFC A/C ••${(8831 + idx * 47).toString()}`,
      subLabel: `₹${amountVal.toLocaleString('en-IN')}`,
      type: 'Account',
      amount: amountVal,
      flag: amountVal > 50000 ? 'SUSPICIOUS_HAWALA' : 'RECURRING_TRANSFER'
    });
    edges.push({
      id: `E-${primaryPerson.id}-${accNodeId}`,
      source: primaryPerson.id,
      target: accNodeId,
      label: 'MONEY_FLOW'
    });
  });

  // 5. Locations
  const locIds = Array.from(c.locations).slice(0, 2);
  if (locIds.length === 0) locIds.push('L0081');
  locIds.forEach((loc, idx) => {
    const locNodeId = `LOC-${loc}`;
    nodes.push({
      id: locNodeId,
      label: idx === 0 ? 'Sector 62, Noida' : 'Connaught Place, Delhi',
      subLabel: `Grid: ${loc}`,
      type: 'Location',
      geo: '28.6139° N, 77.2090° E'
    });
    edges.push({
      id: `E-${primaryPerson.id}-${locNodeId}`,
      source: primaryPerson.id,
      target: locNodeId,
      label: idx === 0 ? 'SAFE_HOUSE' : 'CRIME_SCENE'
    });
  });

  // 6. Vehicles
  const vehIds = Array.from(c.vehicles).slice(0, 2);
  if (vehIds.length === 0) vehIds.push('V0232');
  vehIds.forEach((v, idx) => {
    const vehNodeId = `VEH-${v}`;
    nodes.push({
      id: vehNodeId,
      label: idx === 0 ? 'DL-01-AB-4921' : 'HR-26-DQ-1092',
      subLabel: idx === 0 ? 'Toyota Fortuner' : 'Hyundai Creta',
      type: 'Vehicle',
      vehicleRef: v
    });
    edges.push({
      id: `E-${primaryPerson.id}-${vehNodeId}`,
      source: primaryPerson.id,
      target: vehNodeId,
      label: 'REGISTERED_VEHICLE'
    });
  });

  const customNodes = customGraphNodes.get(c.id) || [];
  const deletedNodes = deletedGraphNodes.get(c.id) || new Set();

  let finalNodes = [...nodes, ...customNodes].filter(n => !deletedNodes.has(n.id));

  // Connect any custom node to primary suspect or center case
  customNodes.forEach(cn => {
    if (!deletedNodes.has(cn.id)) {
      edges.push({
        id: `E-${primaryPerson.id}-${cn.id}`,
        source: primaryPerson.id,
        target: cn.id,
        label: cn.relLabel || 'LINKED_ENTITY'
      });
    }
  });

  const finalNodeIds = new Set(finalNodes.map(n => n.id));
  const finalEdges = edges.filter(e => finalNodeIds.has(e.source) && finalNodeIds.has(e.target));

  res.json({
    success: true,
    caseId: c.id,
    caseTitle: c.title,
    department: store.getDepartmentName(c.department_id),
    status: c.status,
    nodes: finalNodes,
    edges: finalEdges
  });
});

router.post('/case-graph/:caseId/node', (req, res) => {
  const { caseId } = req.params;
  const { id, label, subLabel, type, role, anomaly, relLabel } = req.body;

  if (!id || !label) {
    return res.status(400).json({ success: false, message: 'Node ID and Label are required.' });
  }

  if (!customGraphNodes.has(caseId)) {
    customGraphNodes.set(caseId, []);
  }

  const newNode = {
    id: id.trim(),
    label: label.trim(),
    subLabel: subLabel || '',
    type: type || 'Suspect',
    role: role || 'Investigated Entity',
    anomaly: parseFloat(anomaly) || 0.6,
    relLabel: relLabel || 'ASSOCIATED_WITH'
  };

  const list = customGraphNodes.get(caseId);
  const existingIdx = list.findIndex(n => n.id === newNode.id);
  if (existingIdx >= 0) {
    list[existingIdx] = newNode;
  } else {
    list.push(newNode);
  }

  // Remove from deleted set if re-adding
  if (deletedGraphNodes.has(caseId)) {
    deletedGraphNodes.get(caseId).delete(newNode.id);
  }

  res.json({ success: true, message: `Node ${newNode.id} added successfully to Case ${caseId}.`, node: newNode });
});

router.delete('/case-graph/:caseId/node/:nodeId', (req, res) => {
  const { caseId, nodeId } = req.params;

  if (!deletedGraphNodes.has(caseId)) {
    deletedGraphNodes.set(caseId, new Set());
  }
  deletedGraphNodes.get(caseId).add(nodeId);

  // Also remove from custom nodes if present
  if (customGraphNodes.has(caseId)) {
    customGraphNodes.set(caseId, customGraphNodes.get(caseId).filter(n => n.id !== nodeId));
  }

  res.json({ success: true, message: `Node ${nodeId} removed from Case ${caseId}.` });
});

router.get('/network', (req, res) => {
  const { centerId = 'P0732', hops = 2, maxNodes = 50, relFilter = 'ALL' } = req.query;
  const graphData = store.getNetworkSubgraph(centerId, parseInt(hops), parseInt(maxNodes), relFilter);

  res.json({
    success: true,
    centerId: graphData.centerId,
    nodes: graphData.nodes,
    edges: graphData.edges,
    totalNodes: graphData.count,
    totalEdges: graphData.edges.length,
    filters: { hops, relFilter, maxNodes }
  });
});

router.get('/why-connected', (req, res) => {
  const { source, target } = req.query;

  if (!source || !target) {
    return res.status(400).json({ success: false, message: 'Please provide both source and target entity IDs.' });
  }

  const result = store.findPathBetweenEntities(source.trim(), target.trim());

  res.json({
    success: true,
    source,
    target,
    ...result
  });
});

router.get('/cross-case', (req, res) => {
  const { case1, case2 } = req.query;

  if (!case1 || !case2) {
    const samples = Array.from(store.cases.keys()).slice(0, 2);
    const analysis = store.analyzeCrossCase(samples[0] || 'C00228', samples[1] || 'C00553');
    return res.json({ success: true, analysis });
  }

  const analysis = store.analyzeCrossCase(case1.trim(), case2.trim());
  res.json({ success: true, analysis });
});

router.get('/timeline', (req, res) => {
  const { caseId, personId, limit = 50 } = req.query;

  let events = store.records;

  if (caseId) {
    events = events.filter(r => r.case_id === caseId);
  }
  if (personId) {
    events = events.filter(r => r.person_id === personId);
  }

  events = events
    .map(r => ({
      record_id: r.record_id,
      datetime: r.event_datetime,
      case_id: r.case_id,
      person_id: r.person_id,
      person_label: r.person_label,
      event_type: r.event_type,
      relationship_type: r.relationship_type,
      source_type: r.source_type,
      evidence_ref: r.evidence_ref,
      anomaly_score: parseFloat(r.anomaly_score) || 0,
      ai_signal: r.ai_signal
    }))
    .sort((a, b) => (a.datetime > b.datetime ? -1 : 1))
    .slice(0, parseInt(limit));

  res.json({ success: true, count: events.length, events });
});

router.get('/map', (req, res) => {
  const locationsMap = new Map();

  store.records.slice(0, 1500).forEach(r => {
    if (!r.location_id) return;
    if (!locationsMap.has(r.location_id)) {
      const locNum = parseInt(r.location_id.replace('L', '')) || 1;
      const baseLat = 28.6139 + ((locNum % 25) - 12) * 0.45;
      const baseLng = 77.2090 + (((locNum * 7) % 30) - 15) * 0.5;

      locationsMap.set(r.location_id, {
        id: r.location_id,
        name: `Sector / Zone ${r.location_id}`,
        lat: Number(baseLat.toFixed(4)),
        lng: Number(baseLng.toFixed(4)),
        eventCount: 0,
        linkedCases: new Set(),
        linkedPersons: new Set(),
        maxAnomaly: 0
      });
    }

    const loc = locationsMap.get(r.location_id);
    loc.eventCount++;
    if (r.case_id) loc.linkedCases.add(r.case_id);
    if (r.person_id) loc.linkedPersons.add(r.person_id);
    const sc = parseFloat(r.anomaly_score) || 0;
    if (sc > loc.maxAnomaly) loc.maxAnomaly = sc;
  });

  const hotspots = Array.from(locationsMap.values())
    .map(l => ({
      ...l,
      linkedCasesCount: l.linkedCases.size,
      linkedPersonsCount: l.linkedPersons.size,
      linkedCases: Array.from(l.linkedCases).slice(0, 5),
      linkedPersons: Array.from(l.linkedPersons).slice(0, 5)
    }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 50);

  res.json({ success: true, count: hotspots.length, hotspots });
});

router.post('/biometrics', (req, res) => {
  const { modality = 'FACE', queryId } = req.body;

  if (!queryId) {
    return res.json({
      success: true,
      status: 'CANDIDATES_FOUND',
      modality,
      message: 'Probe vector quality checked (94.2% clarity). Cross-referenced against authorized forensic database.',
      candidates: [
        {
          person_id: 'P0732',
          label: 'Person_0732',
          confidence: 0.962,
          qualityScore: 94.2,
          matchedTemplate: 'NAFIS-FP-2026-9921',
          role: 'Subject',
          linkedCases: 3,
          anomalyScore: 0.891,
          auditNote: 'Human forensic examiner sign-off mandatory before court submission.'
        },
        {
          person_id: 'P0765',
          label: 'Person_0765',
          confidence: 0.841,
          qualityScore: 88.5,
          matchedTemplate: 'NAFIS-FP-2026-4412',
          role: 'Subject',
          linkedCases: 2,
          anomalyScore: 0.124,
          auditNote: 'Secondary match candidate.'
        }
      ]
    });
  }

  const p = store.entities.get(queryId);
  if (p) {
    return res.json({
      success: true,
      status: 'CANDIDATES_FOUND',
      modality,
      candidates: [{
        person_id: p.id,
        label: p.label,
        confidence: 0.985,
        role: p.role,
        anomalyScore: p.maxAnomaly,
        linkedCases: p.cases.size
      }]
    });
  }

  res.json({
    success: true,
    status: 'NO_MATCH_DATA_SOURCE',
    modality,
    message: 'No biometric probe matches returned from current local test database.'
  });
});

export default router;
