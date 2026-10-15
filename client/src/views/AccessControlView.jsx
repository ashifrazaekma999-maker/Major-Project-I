import React, { useState, useEffect } from 'react';

export default function AccessControlView({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Request Form
  const [targetDept, setTargetDept] = useState('D002');
  const [caseId, setCaseId] = useState('C00228');
  const [purpose, setPurpose] = useState('Tracing cross-state illegal hawala ledger transactions');
  const [duration, setDuration] = useState('24');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/erp/access-requests');
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDepartment: targetDept,
          caseId,
          purpose,
          durationHours: duration,
          officer: currentUser || { id: 'OFFICER-001', name: 'Inspector Vikram Rathore', department: 'D001' }
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/erp/access-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer: currentUser })
      });
      const data = await res.json();
      if (data.success) fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevoke = async (id) => {
    try {
      const res = await fetch(`/api/erp/access-requests/${id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer: currentUser })
      });
      const data = await res.json();
      if (data.success) fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
            <span>ERP SECURITY ARCHITECTURE</span>
            <span>•</span>
            <span>CROSS-DEPARTMENT ACCESS GOVERNANCE</span>
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">
            TIME-BOUND ACCESS CONTROL & PERMISSION GATES
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Controlled inter-agency collaboration. Grants time-limited clearance with owner department sign-off, automatic expiration timers, and 1-click immediate revocation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/20 transition flex items-center space-x-2"
        >
          <span>➕</span>
          <span>REQUEST CROSS-DEPT ACCESS</span>
        </button>
      </div>

      {/* Requests Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1329] text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase">
              <tr>
                <th className="px-5 py-3.5">Request ID</th>
                <th className="px-5 py-3.5">Requesting Officer</th>
                <th className="px-5 py-3.5">Jurisdiction Link</th>
                <th className="px-5 py-3.5">Investigative Purpose</th>
                <th className="px-5 py-3.5">Status & Expiration</th>
                <th className="px-5 py-3.5 text-right">Owner Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Loading access authorization ledger...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No active inter-department access requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-bold text-cyan-400">{r.id}</td>
                    <td className="px-5 py-3.5 font-sans">
                      <div className="font-semibold text-slate-200">{r.requestingOfficer}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.officerId} ({r.fromDepartment})</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-white font-bold">{r.fromDepartment}</span>
                      <span className="text-cyan-400 mx-1.5">➔</span>
                      <span className="text-amber-400 font-bold">{r.targetDepartment}</span>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">Case #{r.caseId}</div>
                    </td>
                    <td className="px-5 py-3.5 font-sans text-slate-300 max-w-xs truncate">
                      {r.purpose}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                        r.status === 'APPROVED' ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' :
                        r.status === 'REVOKED' ? 'bg-red-950/70 border-red-500/40 text-red-300' :
                        'bg-amber-950/70 border-amber-500/40 text-amber-300'
                      }`}>
                        {r.status}
                      </span>
                      {r.status === 'APPROVED' && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Expires: {new Date(r.expiresAt).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {r.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded text-[11px] transition"
                        >
                          ✓ Grant Access
                        </button>
                      ) : r.status === 'APPROVED' ? (
                        <button
                          onClick={() => handleRevoke(r.id)}
                          className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-300 rounded text-[11px] transition"
                        >
                          ⛔ Instant Revoke
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Access Request */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1329] border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-mono text-sm font-bold text-white">SUBMIT CROSS-DEPARTMENT REQUEST</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-slate-300 mb-1">TARGET DEPARTMENT</label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                >
                  <option value="D002">D002 - Financial Intelligence Unit</option>
                  <option value="D003">D003 - Narcotics Control Wing</option>
                  <option value="D004">D004 - Counter Terrorism Squad</option>
                  <option value="D005">D005 - State Intelligence Directorate</option>
                  <option value="D010">D010 - Special Task Force (STF)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-slate-300 mb-1">CASE REFERENCE ID</label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-300 mb-1">GRANT DURATION (HOURS)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                >
                  <option value="6">6 Hours (Express Triage)</option>
                  <option value="12">12 Hours (Standard Investigation)</option>
                  <option value="24">24 Hours (Full Operational Day)</option>
                  <option value="72">72 Hours (Joint Inter-agency Task)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-slate-300 mb-1">OFFICIAL JUSTIFICATION & PURPOSE</label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg transition"
              >
                SUBMIT FOR OWNER APPROVAL
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
