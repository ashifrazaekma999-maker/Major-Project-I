import React, { useState, useEffect } from 'react';

export default function AuditTrailView() {
  const [logs, setLogs] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [integrityStatus, setIntegrityStatus] = useState('VERIFYING...');
  const [isChainValid, setIsChainValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditTrail();
  }, [search]);

  const fetchAuditTrail = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, limit: 50 });
      const res = await fetch(`/api/erp/audit-trail?${q}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalRecords(data.totalRecords);
        setIntegrityStatus(data.chainIntegrityStatus);
        setIsChainValid(data.isChainTamperEvident);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
            <span>CRYPTOGRAPHIC LEDGER</span>
            <span>•</span>
            <span>FORENSIC TAMPER-EVIDENT LOGS</span>
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">
            AUDIT TRAIL & SHA-256 HASH CHAIN
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Append-only blockchain-grade verification ledger. Every action (logins, AI queries, case updates, permission grants) is cryptographically sealed with the preceding block's hash.
          </p>
        </div>

        {/* Chain Integrity Badge */}
        <div className={`p-4 rounded-xl border flex items-center space-x-3 font-mono text-xs shadow-lg ${
          isChainValid ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-red-950/80 border-red-500/50 text-red-300'
        }`}>
          <span className="text-xl">{isChainValid ? '🔒' : '⚠️'}</span>
          <div>
            <div className="text-[10px] uppercase text-slate-400">LEDGER INTEGRITY STATUS:</div>
            <div className="font-bold">{integrityStatus}</div>
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, officer name, or SHA-256 hash prefix..."
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-lg outline-none font-mono"
          />
        </div>
        <div className="text-xs font-mono text-slate-400">
          Total Blocks: <strong className="text-cyan-400">{totalRecords}</strong>
        </div>
      </div>

      {/* Audit Blocks Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b1329] text-slate-400 text-[11px] border-b border-slate-800 uppercase">
              <tr>
                <th className="px-5 py-3.5">Block ID & Time</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Officer & Department</th>
                <th className="px-5 py-3.5">Forensic Context Details</th>
                <th className="px-5 py-3.5">Cryptographic Hash Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-mono">
                    Validating cryptographic SHA-256 chain...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-mono">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-cyan-400">{log.id}</div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-950 text-cyan-300 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-sans">
                      <div className="text-slate-200 font-semibold">{log.officer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.officer_id} • {log.department_id}</div>
                    </td>
                    <td className="px-5 py-3.5 font-sans text-slate-300 max-w-xs truncate">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[10px] text-cyan-400">
                        Curr: {log.hash.slice(0, 16)}...
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Prev: {log.prev_hash.slice(0, 16)}...
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
