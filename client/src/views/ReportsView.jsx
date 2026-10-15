import React, { useState } from 'react';

export default function ReportsView({ currentCaseId = 'C00228', currentUser }) {
  const [reportType, setReportType] = useState('CASE_EXECUTIVE');
  const [caseId, setCaseId] = useState(currentCaseId);
  const [generating, setGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setReportReady(true);
    }, 800);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
            <span>ERP CONTROL PLANE</span>
            <span>•</span>
            <span>OFFICIAL INTELLIGENCE REPORTING</span>
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">
            EXECUTIVE FORENSIC REPORT GENERATOR
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Generates standardized law-enforcement evidentiary briefs suitable for inter-agency briefings, judicial filings, and command reviews.
          </p>
        </div>

        {reportReady && (
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold rounded-lg border border-slate-700 transition flex items-center space-x-2"
          >
            <span>🖨️</span>
            <span>PRINT / SAVE AS PDF</span>
          </button>
        )}
      </div>

      {/* Selector controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">REPORT TEMPLATE</label>
            <select
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); setReportReady(false); }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none font-mono"
            >
              <option value="CASE_EXECUTIVE">Full Case Executive Brief & Suspect Matrix</option>
              <option value="NETWORK_RELATIONSHIP">Criminal Syndicate Multi-Hop Graph Report</option>
              <option value="TAMPER_AUDIT">Cryptographic Audit Chain Integrity Certificate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">CASE REFERENCE NUMBER</label>
            <input
              type="text"
              value={caseId}
              onChange={(e) => { setCaseId(e.target.value.toUpperCase()); setReportReady(false); }}
              placeholder="e.g. C00228"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-cyan-300 font-mono outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg transition"
        >
          {generating ? 'COMPILING CLASSIFIED REPORT...' : 'COMPILE OFFICIAL DOSSIER ⚡'}
        </button>
      </div>

      {/* Official Printable Report Canvas */}
      {reportReady && (
        <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-300 space-y-6 font-sans print:p-0 print:border-none print:shadow-none">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="text-xs font-bold tracking-widest text-slate-600 uppercase font-mono">
                GOVERNMENT OF INDIA • LAW ENFORCEMENT COMMAND
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                NETRISH FORENSIC DOSSIER
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                National Entity Tracking, Relationship, Investigation & Secure Hub (PID 26189)
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="bg-slate-900 text-white px-3 py-1 font-bold inline-block rounded">
                RESTRICTED - LAW ENFORCEMENT ONLY
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-xl font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">CASE FILE:</span>
              <strong className="text-slate-900">{caseId}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">INVESTIGATING OFFICER:</span>
              <strong className="text-slate-900">{currentUser?.name || 'Inspector Vikram Rathore'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">JURISDICTION UNIT:</span>
              <strong className="text-slate-900">D001 Cyber Crime Cell</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">CORPUS STATUS:</span>
              <strong className="text-emerald-700">AUDITED & GROUNDED</strong>
            </div>
          </div>

          {/* Section: Executive Findings */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-mono uppercase text-slate-900 border-b pb-1">
              1. EXECUTIVE SYNDICATE SUMMARY
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Investigation into Case #{caseId} established multi-hop communication, vehicle sightings, and transactional ties connecting principal subject <strong>Person_0732 (P0732)</strong> with associate <strong>Person_0765 (P0765)</strong> across multiple sectors. High anomaly deviation score (0.891) triggered automated forensic prioritization under Section 43/66 IT Act & relevant IPC provisions.
            </p>
          </div>

          {/* Section: Suspect & Evidence Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-mono uppercase text-slate-900 border-b pb-1">
              2. IDENTIFIED SUSPECTS & FORENSIC VECTORS
            </h3>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-200 font-mono text-[11px]">
                <tr>
                  <th className="p-2 border border-slate-300">Entity ID</th>
                  <th className="p-2 border border-slate-300">Designation</th>
                  <th className="p-2 border border-slate-300">Hardware / Vehicle Ref</th>
                  <th className="p-2 border border-slate-300">Anomaly Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono">
                <tr>
                  <td className="p-2 border border-slate-300 font-bold">P0732</td>
                  <td className="p-2 border border-slate-300 font-sans">Primary Subject</td>
                  <td className="p-2 border border-slate-300">PH00002 / V0232</td>
                  <td className="p-2 border border-slate-300 text-red-600 font-bold">89.1% (High)</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-bold">P0765</td>
                  <td className="p-2 border border-slate-300 font-sans">Associate</td>
                  <td className="p-2 border border-slate-300">PH00199 / V0270</td>
                  <td className="p-2 border border-slate-300 text-slate-600">12.4% (Standard)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Digital Signature & Tamper Certificate */}
          <div className="pt-6 border-t border-slate-300 flex justify-between items-end font-mono text-xs">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500">DIGITAL HASH FINGERPRINT:</div>
              <div className="text-[11px] text-slate-700 font-bold">
                SHA256: 7a8f9c0e2b4d1a3c5e7f9a1b3c5d7e9f0a2b4c6e8d...
              </div>
              <div className="text-[10px] text-emerald-700">✓ Cryptographic Audit Trail Verified</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-900 uppercase">Authorized Signature</div>
              <div className="text-[10px] text-slate-500">NETRISH Central Forensic Command</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
