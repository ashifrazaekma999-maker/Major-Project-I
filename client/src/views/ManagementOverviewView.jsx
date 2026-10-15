import React, { useState, useEffect } from 'react';

export default function ManagementOverviewView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/erp/management')
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
          <span>ERP CONTROL PLANE</span>
          <span>•</span>
          <span>HIGH COMMAND OVERSIGHT</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          NATIONAL LAW ENFORCEMENT MANAGEMENT OVERVIEW
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Aggregated executive metrics across all 20 specialized police divisions, intelligence wings, and task forces.
        </p>
      </div>

      {loading ? (
        <div className="text-xs font-mono text-cyan-400 p-8 text-center">Compiling national command metrics...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase">NATIONAL CLEARANCE RATE</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{data.systemSummary.nationalCrimeClearanceRate}</div>
              <div className="text-[10px] text-slate-400 mt-1">Cross-state benchmark</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase">TOTAL INGESTED RECORDS</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">{data.systemSummary.totalRecordsIngested.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">100% Normalized schema</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase">TRACKED PHONE NUMBERS</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{data.systemSummary.totalPhoneNumbers.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">Call record & IMSI index</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase">SUSPECT VEHICLES</span>
              <div className="text-2xl font-black text-purple-400 mt-1">{data.systemSummary.totalVehicles.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">ANPR FastTag sightings</div>
            </div>
          </div>

          {/* 20 Departments Workload Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              SPECIALIZED POLICE DIVISIONS WORKLOAD MATRIX (20 UNITS)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.departments?.map((d) => (
                <div key={d.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{d.id}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      d.activeAlerts > 0 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {d.activeAlerts} Alerts
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 line-clamp-1">{d.name}</div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 border-t border-slate-900 pt-2">
                    <span>{d.totalCases} Cases</span>
                    <span>{d.totalPersons} Suspects</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
