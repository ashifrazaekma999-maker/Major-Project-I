import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NetrishDataStore {
  constructor() {
    this.records = [];
    this.entities = new Map();
    this.cases = new Map();
    this.departments = new Map();
    this.phones = new Map();
    this.vehicles = new Map();
    this.organizations = new Map();
    this.locations = new Map();
    this.graph = new Map();
    this.auditTrail = [];
    this.accessRequests = [];
    this.securityAlerts = [];
    this.workspaces = new Map();
    this.users = new Map();
    this.isLoaded = false;

    this.initMockUsers();
    this.initGenesisAudit();
    this.initAccessRequests();
  }

  initAccessRequests() {
    this.accessRequests = [
      {
        id: 'REQ-2026-091',
        requestingOfficer: 'Inspector Vikram Rathore',
        officerId: 'OFFICER-001',
        badge: 'CBI-SP-041',
        fromDepartment: 'D002',
        fromDeptName: 'CBI (Central Bureau of Investigation)',
        targetDepartment: 'D006',
        targetDeptName: 'GST Intelligence (DGGI)',
        caseId: 'C00228',
        suspectIdentifier: 'Aadhaar: 4921-8842-1092 / Phone: +91 98210-1000',
        purpose: 'Cross-checking shell firm GSTIN ITC credits against Hawala money laundering trail in FIR 44/2026.',
        status: 'ACTIVE_STREAMING',
        requestedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 46).toISOString(),
        durationMins: 60,
        approvedBy: 'DGGI Commissioner R. S. Meena',
        approvedAt: new Date(Date.now() - 1000 * 60 * 13).toISOString(),
        currentScreenActivity: 'Inspecting DGGI Circular & E-Way Bill Movement Ledger',
        officerIp: '10.42.18.91',
        deviceSignature: 'DELL-OPTIPLEX-NCR-GOV-09',
        isRecording: true
      },
      {
        id: 'REQ-2026-092',
        requestingOfficer: 'ACP Rajesh Kumar',
        officerId: 'SEC-012',
        badge: 'ED-AML-882',
        fromDepartment: 'D004',
        fromDeptName: 'ED (Enforcement Directorate)',
        targetDepartment: 'D005',
        targetDeptName: 'Income Tax (DGIT Investigation)',
        caseId: 'C00104',
        suspectIdentifier: 'PAN: BKZPA9912K / Vehicle: DL-01-AB-4921',
        purpose: 'PMLA predicate offense scrutiny: Verification of undisclosed offshore asset declaration forms.',
        status: 'PENDING',
        requestedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
        durationMins: 120,
        currentScreenActivity: 'Awaiting Authorization',
        officerIp: '10.42.19.45',
        deviceSignature: 'HP-ELITEBOOK-ED-HQ',
        isRecording: false
      }
    ];
  }

  initMockUsers() {
    const defaultUsers = [
      {
        id: 'OFFICER-001',
        name: 'Inspector Vikram Rathore',
        email: 'v.rathore@police.gov.in',
        role: 'Investigator',
        department: 'D001',
        departmentName: 'Cyber Crime Investigation Division',
        pin: '2618',
        password: 'Password@123',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      },
      {
        id: 'ADMIN-007',
        name: 'SP Neha Sharma',
        email: 'neha.sharma@police.gov.in',
        role: 'Department Admin',
        department: 'D001',
        departmentName: 'Cyber Crime Investigation Division',
        pin: '1234',
        password: 'Password@123',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
      },
      {
        id: 'SEC-012',
        name: 'ACP Rajesh Kumar',
        email: 'rajesh.sec@police.gov.in',
        role: 'Security Guardian',
        department: 'D005',
        departmentName: 'Intelligence & Surveillance Directorate',
        pin: '9999',
        password: 'Password@123',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      {
        id: 'LEAD-034',
        name: 'Director General A. Verma',
        email: 'dg.verma@mha.gov.in',
        role: 'Management Overview',
        department: 'D010',
        departmentName: 'Special Operations Command',
        pin: '2026',
        password: 'Password@123',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      }
    ];

    defaultUsers.forEach(u => this.users.set(u.id, u));
  }

  initGenesisAudit() {
    const genesisTime = new Date('2026-10-01T00:00:00Z').toISOString();
    const genesisPayload = `GENESIS:0000000000000000:${genesisTime}:SYSTEM_INIT:NETRISH_SECURE_MAINFRAME`;
    const genesisHash = crypto.createHash('sha256').update(genesisPayload).digest('hex');

    this.auditTrail.push({
      id: 'AUD-000001',
      timestamp: genesisTime,
      action: 'SYSTEM_GENESIS_INITIALIZATION',
      officer_id: 'SYSTEM',
      officer_name: 'NETRISH Root Core',
      department_id: 'GOV_CENTRAL',
      details: 'Secure append-only cryptographic audit chain initialized.',
      ip: '127.0.0.1',
      prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: genesisHash
    });
  }

  logAudit(action, officer, details, ip = '127.0.0.1') {
    const prevEntry = this.auditTrail[this.auditTrail.length - 1];
    const prevHash = prevEntry ? prevEntry.hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const id = `AUD-${String(this.auditTrail.length + 1).padStart(6, '0')}`;
    
    const officerId = officer?.id || 'SYSTEM';
    const officerName = officer?.name || 'Automated Service';
    const deptId = officer?.department || 'SYSTEM';

    const payload = `${prevHash}:${timestamp}:${id}:${action}:${officerId}:${JSON.stringify(details)}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    const entry = {
      id,
      timestamp,
      action,
      officer_id: officerId,
      officer_name: officerName,
      department_id: deptId,
      details,
      ip,
      prev_hash: prevHash,
      hash
    };

    this.auditTrail.unshift(entry);
    return entry;
  }

  loadDataset(csvPath) {
    if (this.isLoaded) return;
    try {
      const resolvedPath = path.resolve(csvPath);
      if (!fs.existsSync(resolvedPath)) {
        console.error(`Dataset not found at ${resolvedPath}`);
        return false;
      }

      const content = fs.readFileSync(resolvedPath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return false;

      const headers = lines[0].split(',').map(h => h.trim());

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = this.parseCSVLine(line);
        if (values.length < headers.length) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        this.records.push(row);
        this.indexRow(row);
      }

      this.isLoaded = true;
      return true;
    } catch (err) {
      console.error('Error loading dataset:', err);
      return false;
    }
  }

  parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  indexRow(row) {
    const {
      record_id, case_id, person_id, person_label, person_role,
      phone_id, vehicle_id, location_id, organization_id, department_id,
      event_type, relationship_type, event_datetime, source_type,
      evidence_ref, transaction_amount, anomaly_score, ai_signal
    } = row;

    const numAnomaly = parseFloat(anomaly_score) || 0;
    const numAmount = parseFloat(transaction_amount) || 0;

    if (person_id) {
      if (!this.entities.has(person_id)) {
        this.entities.set(person_id, {
          id: person_id,
          label: person_label || `Person ${person_id}`,
          role: person_role || 'Subject',
          phones: new Set(),
          vehicles: new Set(),
          locations: new Set(),
          organizations: new Set(),
          cases: new Set(),
          departments: new Set(),
          maxAnomaly: 0,
          events: [],
          relationships: [],
          evidenceRefs: new Set()
        });
      }
      const p = this.entities.get(person_id);
      if (phone_id) p.phones.add(phone_id);
      if (vehicle_id) p.vehicles.add(vehicle_id);
      if (location_id) p.locations.add(location_id);
      if (organization_id) p.organizations.add(organization_id);
      if (case_id) p.cases.add(case_id);
      if (department_id) p.departments.add(department_id);
      if (evidence_ref) p.evidenceRefs.add(evidence_ref);
      if (numAnomaly > p.maxAnomaly) p.maxAnomaly = numAnomaly;

      p.events.push({
        record_id,
        case_id,
        event_type,
        event_datetime,
        source_type,
        evidence_ref,
        amount: numAmount,
        anomaly_score: numAnomaly,
        ai_signal
      });
    }

    if (case_id) {
      if (!this.cases.has(case_id)) {
        this.cases.set(case_id, {
          id: case_id,
          title: `Case #${case_id} Investigation`,
          status: row.case_status || 'Open',
          department_id: department_id || 'D001',
          persons: new Set(),
          phones: new Set(),
          vehicles: new Set(),
          organizations: new Set(),
          locations: new Set(),
          evidenceRefs: new Set(),
          eventsCount: 0,
          maxAnomaly: 0,
          latestDatetime: event_datetime,
          records: []
        });
      }
      const c = this.cases.get(case_id);
      if (person_id) c.persons.add(person_id);
      if (phone_id) c.phones.add(phone_id);
      if (vehicle_id) c.vehicles.add(vehicle_id);
      if (organization_id) c.organizations.add(organization_id);
      if (location_id) c.locations.add(location_id);
      if (evidence_ref) c.evidenceRefs.add(evidence_ref);
      c.eventsCount++;
      if (numAnomaly > c.maxAnomaly) c.maxAnomaly = numAnomaly;
      if (event_datetime && (!c.latestDatetime || event_datetime > c.latestDatetime)) {
        c.latestDatetime = event_datetime;
      }
      c.records.push(record_id);
    }

    const deptId = department_id || 'D001';
    if (!this.departments.has(deptId)) {
      this.departments.set(deptId, {
        id: deptId,
        name: this.getDepartmentName(deptId),
        cases: new Set(),
        persons: new Set(),
        eventsCount: 0,
        activeAlerts: 0
      });
    }
    const d = this.departments.get(deptId);
    if (case_id) d.cases.add(case_id);
    if (person_id) d.persons.add(person_id);
    d.eventsCount++;
    if (numAnomaly > 0.8) d.activeAlerts++;

    if (phone_id) {
      if (!this.phones.has(phone_id)) this.phones.set(phone_id, { id: phone_id, persons: new Set(), cases: new Set() });
      if (person_id) this.phones.get(phone_id).persons.add(person_id);
      if (case_id) this.phones.get(phone_id).cases.add(case_id);
    }
    if (vehicle_id) {
      if (!this.vehicles.has(vehicle_id)) this.vehicles.set(vehicle_id, { id: vehicle_id, persons: new Set(), cases: new Set() });
      if (person_id) this.vehicles.get(vehicle_id).persons.add(person_id);
      if (case_id) this.vehicles.get(vehicle_id).cases.add(case_id);
    }
    if (organization_id) {
      if (!this.organizations.has(organization_id)) this.organizations.set(organization_id, { id: organization_id, persons: new Set(), cases: new Set() });
      if (person_id) this.organizations.get(organization_id).persons.add(person_id);
      if (case_id) this.organizations.get(organization_id).cases.add(case_id);
    }
    if (location_id) {
      if (!this.locations.has(location_id)) this.locations.set(location_id, { id: location_id, persons: new Set(), cases: new Set(), events: 0 });
      if (person_id) this.locations.get(location_id).persons.add(person_id);
      if (case_id) this.locations.get(location_id).cases.add(case_id);
      this.locations.get(location_id).events++;
    }

    if (person_id) {
      const targets = [
        phone_id ? { id: phone_id, type: 'Phone' } : null,
        vehicle_id ? { id: vehicle_id, type: 'Vehicle' } : null,
        organization_id ? { id: organization_id, type: 'Organization' } : null,
        location_id ? { id: location_id, type: 'Location' } : null,
        case_id ? { id: case_id, type: 'Case' } : null
      ].filter(Boolean);

      targets.forEach(t => {
        this.addGraphEdge(person_id, t.id, relationship_type || 'ASSOCIATED_WITH', {
          record_id,
          case_id,
          evidence_ref,
          event_datetime,
          source_type,
          ai_signal,
          anomaly_score: numAnomaly,
          fromType: 'Person',
          toType: t.type
        });
      });
    }
  }

  addGraphEdge(u, v, relType, meta) {
    if (!this.graph.has(u)) this.graph.set(u, new Map());
    if (!this.graph.has(v)) this.graph.set(v, new Map());

    const uEdges = this.graph.get(u);
    if (!uEdges.has(v)) uEdges.set(v, []);
    uEdges.get(v).push({ type: relType, ...meta });

    const vEdges = this.graph.get(v);
    if (!vEdges.has(u)) vEdges.set(u, []);
    vEdges.get(u).push({ type: relType, ...meta, reverse: true });
  }

  getDepartmentName(deptId) {
    const names = {
      D001: 'Cyber Crime Cell (I4C)',
      D002: 'CBI (Central Bureau of Investigation)',
      D003: 'CID (Crime Investigation Department)',
      D004: 'ED (Enforcement Directorate)',
      D005: 'Income Tax (DGIT Investigation)',
      D006: 'GST Intelligence (DGGI)',
      D007: 'NCB (Narcotics Control Bureau)',
      D008: 'NIA (National Investigation Agency)',
      D009: 'DRI (Directorate of Revenue Intelligence)',
      D010: 'SFIO (Serious Fraud Investigation Office)',
      D011: 'State Anti-Corruption Bureau (ACB)',
      D012: 'Special Task Force (STF)',
      D013: 'Metropolitan Crime Branch',
      D014: 'Financial Intelligence Unit (FIU-IND)',
      D015: 'Technical Surveillance Wing',
      D016: 'Economic Offences Wing (EOW)',
      D017: 'Anti-Terror Squad (ATS)',
      D018: 'Airport & Customs Border Security',
      D019: 'Internal Security Operations',
      D020: 'Rapid Action Forensic Unit'
    };
    return names[deptId] || `Law Enforcement Division ${deptId}`;
  }

  getNetworkSubgraph(centerEntityId, hops = 2, maxNodes = 60, relFilter = 'ALL') {
    if (!centerEntityId || !this.graph.has(centerEntityId)) {
      return this.getDefaultOverviewGraph();
    }

    const visitedNodes = new Set([centerEntityId]);
    const queue = [{ id: centerEntityId, hop: 0 }];
    const edgesList = [];
    const nodeDetails = new Map();

    nodeDetails.set(centerEntityId, this.getNodeInfo(centerEntityId));

    while (queue.length > 0 && visitedNodes.size < maxNodes) {
      const { id, hop } = queue.shift();
      if (hop >= hops) continue;

      const neighbors = this.graph.get(id);
      if (!neighbors) continue;

      for (const [targetId, edgeArray] of neighbors.entries()) {
        for (const edge of edgeArray) {
          if (relFilter !== 'ALL' && edge.type !== relFilter) continue;

          edgesList.push({
            id: `${id}->${targetId}-${edge.type}-${edge.record_id || Math.random()}`,
            source: id,
            target: targetId,
            label: edge.type,
            ai_signal: edge.ai_signal,
            evidence_ref: edge.evidence_ref,
            case_id: edge.case_id,
            anomaly_score: edge.anomaly_score
          });

          if (!visitedNodes.has(targetId) && visitedNodes.size < maxNodes) {
            visitedNodes.add(targetId);
            nodeDetails.set(targetId, this.getNodeInfo(targetId));
            queue.push({ id: targetId, hop: hop + 1 });
          }
        }
      }
    }

    const nodes = Array.from(nodeDetails.values());
    return { nodes, edges: edgesList, centerId: centerEntityId, count: nodes.length };
  }

  getDefaultOverviewGraph() {
    const nodes = [];
    const edges = [];
    const highAnomalyRecords = this.records
      .filter(r => parseFloat(r.anomaly_score) > 0.75)
      .slice(0, 35);

    const nodeIds = new Set();
    highAnomalyRecords.forEach(r => {
      if (r.person_id) nodeIds.add(r.person_id);
      if (r.phone_id) nodeIds.add(r.phone_id);
      if (r.vehicle_id) nodeIds.add(r.vehicle_id);
      if (r.organization_id) nodeIds.add(r.organization_id);

      if (r.person_id && r.phone_id) {
        edges.push({
          id: `e-${r.record_id}-ph`,
          source: r.person_id,
          target: r.phone_id,
          label: r.relationship_type || 'USES_PHONE',
          ai_signal: r.ai_signal,
          evidence_ref: r.evidence_ref,
          case_id: r.case_id
        });
      }
      if (r.person_id && r.vehicle_id) {
        edges.push({
          id: `e-${r.record_id}-vh`,
          source: r.person_id,
          target: r.vehicle_id,
          label: r.relationship_type || 'TRAVELED_IN',
          ai_signal: r.ai_signal,
          evidence_ref: r.evidence_ref,
          case_id: r.case_id
        });
      }
      if (r.person_id && r.organization_id) {
        edges.push({
          id: `e-${r.record_id}-og`,
          source: r.person_id,
          target: r.organization_id,
          label: r.relationship_type || 'WORKS_WITH',
          ai_signal: r.ai_signal,
          evidence_ref: r.evidence_ref,
          case_id: r.case_id
        });
      }
    });

    nodeIds.forEach(id => {
      nodes.push(this.getNodeInfo(id));
    });

    return { nodes, edges, centerId: nodes[0]?.id || 'P0732', count: nodes.length };
  }

  getNodeInfo(id) {
    if (this.entities.has(id)) {
      const p = this.entities.get(id);
      return {
        id,
        label: p.label,
        type: 'Person',
        role: p.role,
        anomaly: p.maxAnomaly,
        casesCount: p.cases.size,
        phonesCount: p.phones.size,
        vehiclesCount: p.vehicles.size
      };
    }
    if (id.startsWith('PH')) {
      return { id, label: `Phone ${id}`, type: 'Phone', anomaly: 0.5 };
    }
    if (id.startsWith('V')) {
      return { id, label: `Vehicle ${id}`, type: 'Vehicle', anomaly: 0.4 };
    }
    if (id.startsWith('O')) {
      return { id, label: `Org ${id}`, type: 'Organization', anomaly: 0.6 };
    }
    if (id.startsWith('L')) {
      return { id, label: `Location ${id}`, type: 'Location', anomaly: 0.3 };
    }
    if (id.startsWith('C')) {
      return { id, label: `Case #${id}`, type: 'Case', anomaly: 0.7 };
    }
    return { id, label: id, type: 'Entity', anomaly: 0.2 };
  }

  findPathBetweenEntities(sourceId, targetId) {
    if (!this.graph.has(sourceId) || !this.graph.has(targetId)) {
      return {
        connected: false,
        reason: 'One or both entities not found in active graph database.'
      };
    }

    if (sourceId === targetId) {
      return { connected: true, path: [sourceId], steps: [] };
    }

    const queue = [[sourceId]];
    const visited = new Set([sourceId]);

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const node = currentPath[currentPath.length - 1];

      if (node === targetId) {
        const steps = [];
        for (let i = 0; i < currentPath.length - 1; i++) {
          const u = currentPath[i];
          const v = currentPath[i + 1];
          const edges = this.graph.get(u)?.get(v) || [];
          const bestEdge = edges[0] || {};
          steps.push({
            from: u,
            to: v,
            relationship: bestEdge.type || 'LINKED_TO',
            evidence_ref: bestEdge.evidence_ref || 'SYSTEM_RECORD',
            case_id: bestEdge.case_id || 'N/A',
            signal: bestEdge.ai_signal || 'Fact',
            source_type: bestEdge.source_type || 'Case_Record'
          });
        }

        return {
          connected: true,
          hops: currentPath.length - 1,
          path: currentPath,
          steps,
          explanation: `Direct evidence path established across ${currentPath.length - 1} hops linking ${sourceId} to ${targetId}.`
        };
      }

      const neighbors = this.graph.get(node);
      if (neighbors) {
        for (const nextNode of neighbors.keys()) {
          if (!visited.has(nextNode)) {
            visited.add(nextNode);
            queue.push([...currentPath, nextNode]);
          }
        }
      }
    }

    return {
      connected: false,
      reason: `No connected multi-hop pathway discovered between ${sourceId} and ${targetId}.`
    };
  }

  analyzeCrossCase(caseId1, caseId2) {
    const c1 = this.cases.get(caseId1);
    const c2 = this.cases.get(caseId2);

    if (!c1 || !c2) {
      return { error: 'One or both cases not found.' };
    }

    const sharedPersons = [...c1.persons].filter(x => c2.persons.has(x));
    const sharedPhones = [...c1.phones].filter(x => c2.phones.has(x));
    const sharedVehicles = [...c1.vehicles].filter(x => c2.vehicles.has(x));
    const sharedOrgs = [...c1.organizations].filter(x => c2.organizations.has(x));
    const sharedLocations = [...c1.locations].filter(x => c2.locations.has(x));

    const totalOverlap = sharedPersons.length + sharedPhones.length + sharedVehicles.length + sharedOrgs.length + sharedLocations.length;
    const correlationScore = Math.min(100, Math.round((totalOverlap / (c1.eventsCount + c2.eventsCount + 5)) * 100 * 3));

    return {
      case1: { id: c1.id, dept: c1.department_id, status: c1.status },
      case2: { id: c2.id, dept: c2.department_id, status: c2.status },
      correlationScore,
      overlap: {
        persons: sharedPersons.map(p => ({ id: p, label: this.entities.get(p)?.label })),
        phones: sharedPhones,
        vehicles: sharedVehicles,
        organizations: sharedOrgs,
        locations: sharedLocations
      },
      summary: totalOverlap > 0 
        ? `Identified ${totalOverlap} shared operational vectors across jurisdictions (${c1.department_id} & ${c2.department_id}).`
        : 'No direct entity overlap detected between these two cases.'
    };
  }
}

export const store = new NetrishDataStore();
