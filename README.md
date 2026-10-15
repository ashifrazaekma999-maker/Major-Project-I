# NETRISH | National Entity Tracking, Relationship, Investigation & Secure Hub
### Smart India Hackathon 2026 • Problem Statement ID: 26189 • Team: NETRISH (ID: 034)
**AI-Powered Criminal Network Analysis System & Law Enforcement Operational ERP**

---

## 📌 Project Overview
**NETRISH** is a state-of-the-art law enforcement intelligence and ERP platform designed according to the **A-Z Master Project Blueprint**. It connects departmental ERP operations with an integrated Intelligence Investigation workspace, enabling multi-hop relationship discovery, explainable forensic reasoning (FACT vs INFERENCE vs LEAD), cross-jurisdiction convergence, and tamper-evident cryptographic audit logs.

---

## 🚀 How to Run the Application

### Option 1: 1-Click Launch (Windows)
Double-click `start.bat` in the root folder. It will:
1. Link local dependencies.
2. Launch the **NETRISH Backend Core** on `http://localhost:5000`.
3. Launch the **NETRISH Tactical Web Interface** on `http://localhost:3000`.

### Option 2: Manual Terminal Commands
1. **Prepare dependencies** (reuses already downloaded modules):
   ```bash
   node setup_modules.mjs
   ```
2. **Start Backend Server**:
   ```bash
   node server/index.js
   ```
   *Ingests all 10,000 synthetic records, builds in-memory graph adjacency indices, and opens API endpoints on port 5000.*

3. **Start Frontend Web Client** (in a second terminal):
   ```bash
   cd client
   npx vite --port 3000
   ```
   *Open browser at `http://localhost:3000`*

---

## 👮 Default Officer Evaluation Accounts (Pre-configured)

| Officer Name | Role / Clearance | Officer ID | Password | 4-Digit Security PIN | Department Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Inspector Vikram Rathore** | Senior Investigator | `OFFICER-001` | `Password@123` | `2618` | D001 - Special Cyber Crime Cell |
| **SP Neha Sharma** | Department Administrator | `ADMIN-007` | `Password@123` | `1234` | D001 - Special Cyber Crime Cell |
| **ACP Rajesh Kumar** | Security Guardian | `SEC-012` | `Password@123` | `9999` | D005 - State Intelligence Directorate |
| **DG A. Verma** | Management Overview | `LEAD-034` | `Password@123` | `2026` | D010 - Special Task Force (STF) |

*Note: The login screen also features a **1-Click Quick Evaluation Switcher** for instant testing without manual typing.*

---

## 🏛️ Implemented Blueprint Modules

### 1. 🏢 Operational ERP System
- **Command Dashboard**: Real-time KPI counters, priority case dossier feed, DEFCON threat monitor.
- **My Department**: Police unit clearance, active squad roster, and assigned cases.
- **Cases & Records**: Full lifecycle stage management (`REGISTERED` ➔ `OPEN` ➔ `UNDER_INVESTIGATION` ➔ `PENDING_REVIEW` ➔ `SOLVED` ➔ `CLOSED` ➔ `ARCHIVED`), search, filters, and comprehensive modal dossiers.
- **Investigation Workspace**: Pinned suspects, actionable tactical leads, investigator logbook notes.
- **Access Control & Temporary Access**: Time-bound cross-department data grants with owner approval, live countdown timers, and 1-click immediate revocation.
- **Security Guardian**: Perimeter threat tracking, brute-force alarms, failed PIN logins, and suspicious export monitoring.
- **Audit Trail (Hash Chain)**: Tamper-evident append-only ledger sealed with SHA-256 cryptographic hashes (`hash = SHA256(prev_hash + timestamp + action + user + details)`).
- **Reports & Export**: Executive printable forensic case dossiers with digital hash fingerprinting.
- **Management Overview**: National command oversight metrics across all 20 specialized police divisions.

### 2. 🔍 Intelligence Investigation Workspace
- **Global Entity Search**: Fast multi-vector search across Suspect Persons, Phones, Vehicles, Organizations, and Cases.
- **Entity 360° Dossier**: Unified profile with threat gauge, demographics, verified hardware identifiers, linked cases, and chronological timeline.
- **Network Relationship Graph**: Interactive HTML5 Force-Directed canvas with draggable nodes, zoom/pan controls, N-Hop radius filter (1, 2, 3 hops), relationship filter (`COMMUNICATED_WITH`, `TRANSACTED_WITH`, `SEEN_ON_CCTV`, etc.), and inspector panel.
- **"Why Connected?" Pathfinder**: BFS multi-hop graph pathfinder strictly separating empirical **FACT**, analytical **INFERENCE**, and actionable **POSSIBLE LEAD** with cited evidence references.
- **Cross-Case Analysis**: Dual-case matrix identifying cross-jurisdiction overlaps across suspects, burner phones, getaway vehicles, and front organizations.
- **Event Timeline**: Chronological temporal stream with evidence citations and source classifications.
- **Tactical Geospatial Map**: SVG radar map with crime hotspots, coordinate density, and sector reconnaissance.
- **Biometric Search**: Facial & NAFIS fingerprint probe matcher with NIST NFIQ quality checking and honest candidate results.
- **AI Investigation Copilot**: Evidence-grounded forensic assistant adhering strictly to NIST AI Risk Management principles (Zero Hallucination contract).

### 3. 📊 Analytics
- **Anomaly Detection**: Sensitivity threshold slider, 2,000-vector frequency spectrum histogram, and anomalous incident triage ledger.

### 4. ⚙️ Configuration & Security
- **Authentication**: 2-Step verification (Officer ID + Password + Tactical Visual Math CAPTCHA + 4-digit NETRISH PIN).
- **Department Enrollment**: Registration portal protected by Department Enrollment Pass Key (`NETRISH2026`).
- **Tactical Theme**: Dark Tactical Slate and Daylight Blue modes.

---

## 🗄️ Dataset Provenance
- Ingests **10,000 authentic records** across **22 standardized schema fields** from `data/dataset.csv`.
- Covers **989 Cases**, **797 Suspects**, **1,199 Phones**, **500 Vehicles**, **300 Organizations**, and **200 Locations**.
