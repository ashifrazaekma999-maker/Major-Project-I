import React, { useState, useEffect } from 'react';

export default function DepartmentView({ defaultDeptId = 'D001', onSelectCase, setTab }) {
  const [deptId, setDeptId] = useState(defaultDeptId);
  const [deptData, setDeptData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartment(deptId);
  }, [deptId]);

  const fetchDepartment = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/erp/department/${id}`);
      const data = await res.json();
      if (data.success) setDeptData(data.department);
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
            <span>ERP CONTROL PLANE</span>
            <span>•</span>
            <span>DEPARTMENT PROFILE & SQUAD ROSTER</span>
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">
            LAW ENFORCEMENT UNIT PROFILE
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">UNIT:</span>
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-3 py-2 rounded-lg outline-none"
          >
            <option value="D001">D001 - Special Cyber Crime Cell</option>
            <option value="D002">D002 - Financial Intelligence Unit</option>
            <option value="D003">D003 - Narcotics Control Wing</option>
            <option value="D004">D004 - Counter Terrorism Squad</option>
            <option value="D005">D005 - State Intelligence Directorate</option>
            <option value="D010">D010 - Special Task Force (STF)</option>
            <option value="D012">D012 - Anti-Corruption Bureau</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-xs font-mono text-cyan-400 p-8 text-center">Loading department records...</div>
      ) : deptData ? (
        <div className="space-y-6">
          {/* Unit Overview Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-3xl">
                  🏢
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-white font-mono">{deptData.name}</h2>
                    <span className="text-xs font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded">
                      {deptData.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{deptData.jurisdiction}</p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-1 font-semibold">
                    CLEARANCE: {deptData.clearanceLevel}
                  </p>
                </div>
              </div>

              <div className="flex space-x-6 text-center font-mono">
                <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">ASSIGNED CASES</div>
                  <div className="text-xl font-bold text-white mt-0.5">{deptData.totalCases}</div>
                </div>
                <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">ACTIVE OFFICERS</div>
                  <div className="text-xl font-bold text-cyan-400 mt-0.5">{deptData.activeInvestigators}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Squad Roster & Department Cases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Squad Officers Roster */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-mono text-cyan-400 uppercase font-bold border-b border-slate-800 pb-2">
                ACTIVE SQUAD ROSTER & CLEARANCES
              </h3>
              <div className="space-y-3">
                {deptData.officers?.map((off, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
                        👮
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{off.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{off.role} • {off.id}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                      {off.status || 'ACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Cases */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-mono text-cyan-400 uppercase font-bold border-b border-slate-800 pb-2">
                JURISDICTIONAL ACTIVE CASES
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {deptData.cases?.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (onSelectCase) onSelectCase(c.id);
                      setTab('erp-cases');
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-cyan-400">{c.id}</div>
                      <div className="text-[11px] text-slate-300">{c.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Suspects: {c.suspects} • Risk: {(c.maxAnomaly * 100).toFixed(0)}%
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
