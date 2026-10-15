import React, { useState, useEffect } from 'react';

export default function MapView({ onSelectCase }) {
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/intelligence/map')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHotspots(data.hotspots);
          setSelectedHotspot(data.hotspots[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
          <span>INTELLIGENCE INVESTIGATION</span>
          <span>•</span>
          <span>GEOSPATIAL INTELLIGENCE MATRIX</span>
        </div>
        <h1 className="text-xl font-black text-white font-mono tracking-wide">
          TACTICAL CRIME HOTSPOT & SECTOR RADAR
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Aggregates spatial incidents, ANPR vehicle transit checkpoints, and crime scene clusters across national sector coordinates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tactical Map Display (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl h-[560px] flex flex-col justify-between">
          <div className="flex justify-between items-center z-10">
            <div className="text-xs font-mono text-cyan-400 font-bold flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>GEOSPATIAL RADAR: NEW DELHI & NCR OPERATIONAL GRID</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              COORDINATES: 28.6139° N, 77.2090° E
            </span>
          </div>

          {/* Interactive Tactical SVG Grid */}
          <div className="relative w-full h-[440px] flex items-center justify-center my-auto">
            {/* Radar circles */}
            <svg className="w-full h-full" viewBox="0 0 600 400">
              <defs>
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="600" height="400" fill="url(#radarGlow)" />
              {/* Radar Grid Lines */}
              <circle cx="300" cy="200" r="70" fill="none" stroke="#1e293b" strokeDasharray="3 3" />
              <circle cx="300" cy="200" r="130" fill="none" stroke="#1e293b" strokeDasharray="4 4" />
              <circle cx="300" cy="200" r="180" fill="none" stroke="#1e293b" />
              <line x1="300" y1="20" x2="300" y2="380" stroke="#1e293b" strokeDasharray="2 2" />
              <line x1="20" y1="200" x2="580" y2="200" stroke="#1e293b" strokeDasharray="2 2" />

              {/* Render Hotspot Pins */}
              {hotspots.slice(0, 30).map((h, i) => {
                const cx = 300 + ((h.lng - 77.2) * 50);
                const cy = 200 - ((h.lat - 28.6) * 50);
                const isSelected = selectedHotspot?.id === h.id;

                return (
                  <g
                    key={h.id}
                    onClick={() => setSelectedHotspot(h)}
                    className="cursor-pointer transition-all duration-300"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 10 : (h.eventCount > 20 ? 7 : 5)}
                      fill={h.maxAnomaly > 0.8 ? '#ef4444' : '#06b6d4'}
                      fillOpacity={isSelected ? 0.9 : 0.6}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={18}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        className="animate-spin"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 z-10 border-t border-slate-900 pt-2">
            <span>GRID SYSTEM: WGS-84 LAW ENFORCEMENT PROJECTION</span>
            <span>CLICK ANY PIN TO INSPECT SECTOR DOSSIER</span>
          </div>
        </div>

        {/* Right Sector Inspector (1 Col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              SECTOR RECONNAISSANCE
            </h3>
            <p className="text-[11px] text-slate-400">Jurisdictional location analysis</p>
          </div>

          {selectedHotspot ? (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] font-mono text-cyan-400">SECTOR LOCATION ID</div>
                <h4 className="text-lg font-bold text-white font-mono mt-0.5">{selectedHotspot.id}</h4>
                <div className="text-slate-400 text-xs mt-1">{selectedHotspot.name}</div>
                <div className="text-[11px] font-mono text-slate-500 mt-2">
                  Coordinates: {selectedHotspot.lat}° N, {selectedHotspot.lng}° E
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">INCIDENT DENSITY</div>
                  <div className="text-base font-bold text-cyan-400">{selectedHotspot.eventCount} Events</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">MAX ANOMALY</div>
                  <div className={`text-base font-bold ${selectedHotspot.maxAnomaly > 0.8 ? 'text-red-400' : 'text-amber-400'}`}>
                    {(selectedHotspot.maxAnomaly * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  LINKED INVESTIGATIONS ({selectedHotspot.linkedCases?.length || 0}):
                </span>
                <div className="space-y-1">
                  {selectedHotspot.linkedCases?.map(cId => (
                    <div key={cId} className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-cyan-300 flex justify-between">
                      <span>Case #{cId}</span>
                      <span className="text-[10px] text-slate-500">Active Jurisdiction</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs text-center p-8">Select a coordinate pin on radar.</div>
          )}
        </div>
      </div>
    </div>
  );
}
