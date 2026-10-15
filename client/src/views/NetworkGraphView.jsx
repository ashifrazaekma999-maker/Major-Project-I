import React, { useState, useEffect, useRef } from 'react';

export default function NetworkGraphView({ onSelectEntity, onSelectCase, initialCenterId = 'P0732' }) {
  const canvasRef = useRef(null);
  const [centerId, setCenterId] = useState(initialCenterId);
  const [hops, setHops] = useState(2);
  const [relFilter, setRelFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedItem, setSelectedItem] = useState(null); // Node or Edge clicked

  // Physics simulation state
  const simNodes = useRef([]);
  const simEdges = useRef([]);
  const animFrameId = useRef(null);
  const transform = useRef({ x: 0, y: 0, scale: 1 });
  const draggingNode = useRef(null);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetchGraph();
  }, [centerId, hops, relFilter]);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ centerId, hops, relFilter, maxNodes: 45 });
      const res = await fetch(`/api/intelligence/network?${q}`);
      const data = await res.json();
      if (data.success) {
        setGraphData({ nodes: data.nodes, edges: data.edges });
        initSimulation(data.nodes, data.edges);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initSimulation = (nodes, edges) => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;
    const height = canvas ? canvas.height : 600;

    // Distribute nodes around center
    simNodes.current = nodes.map((n, idx) => {
      const angle = (idx / nodes.length) * 2 * Math.PI;
      const radius = n.id === centerId ? 0 : 120 + Math.random() * 150;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: n.id === centerId ? 18 : (n.type === 'Person' ? 14 : 10)
      };
    });

    simEdges.current = edges.map(e => ({ ...e }));
    transform.current = { x: 0, y: 0, scale: 1 };

    startLoop();
  };

  const startLoop = () => {
    if (animFrameId.current) cancelAnimationFrame(animFrameId.current);

    const step = () => {
      updatePhysics();
      draw();
      animFrameId.current = requestAnimationFrame(step);
    };
    animFrameId.current = requestAnimationFrame(step);
  };

  const updatePhysics = () => {
    const nodes = simNodes.current;
    const edges = simEdges.current;
    if (!nodes.length) return;

    // Repulsion between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 250) {
          const force = (250 - dist) / dist * 0.05;
          nodes[i].vx -= dx * force;
          nodes[i].vy -= dy * force;
          nodes[j].vx += dx * force;
          nodes[j].vy += dy * force;
        }
      }
    }

    // Spring attraction along edges
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    for (const e of edges) {
      const source = nodeMap.get(e.source);
      const target = nodeMap.get(e.target);
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredDist = 120;
        const force = (dist - desiredDist) * 0.005;
        source.vx += dx * force;
        source.vy += dy * force;
        target.vx -= dx * force;
        target.vy -= dy * force;
      }
    }

    // Centering force & update positions
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 400;
    const cy = canvas ? canvas.height / 2 : 300;

    for (const n of nodes) {
      if (n === draggingNode.current) continue;
      // Gravity towards center
      n.vx += (cx - n.x) * 0.001;
      n.vy += (cy - n.y) * 0.001;

      // Friction
      n.vx *= 0.85;
      n.vy *= 0.85;

      n.x += n.vx;
      n.y += n.vy;
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(transform.current.x, transform.current.y);
    ctx.scale(transform.current.scale, transform.current.scale);

    const nodeMap = new Map(simNodes.current.map(n => [n.id, n]));

    // Draw Edges
    for (const e of simEdges.current) {
      const u = nodeMap.get(e.source);
      const v = nodeMap.get(e.target);
      if (!u || !v) continue;

      ctx.beginPath();
      ctx.moveTo(u.x, u.y);
      ctx.lineTo(v.x, v.y);
      ctx.strokeStyle = e.ai_signal === 'Fact' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw small edge relationship text in center
      const mx = (u.x + v.x) / 2;
      const my = (u.y + v.y) / 2;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(e.label, mx, my);
    }

    // Draw Nodes
    for (const n of simNodes.current) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);

      // Node color by type
      if (n.id === centerId) {
        ctx.fillStyle = '#06b6d4'; // Cyan center
      } else if (n.type === 'Person') {
        ctx.fillStyle = n.anomaly > 0.8 ? '#ef4444' : '#3b82f6';
      } else if (n.type === 'Phone') {
        ctx.fillStyle = '#10b981';
      } else if (n.type === 'Vehicle') {
        ctx.fillStyle = '#f59e0b';
      } else if (n.type === 'Organization') {
        ctx.fillStyle = '#8b5cf6';
      } else {
        ctx.fillStyle = '#64748b';
      }

      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = n.id === centerId ? '#ffffff' : '#0f172a';
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.label || n.id, n.x, n.y + n.radius + 12);
    }

    ctx.restore();
  };

  // Mouse interaction handlers for Drag, Pan, and Zoom
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left - transform.current.x) / transform.current.scale;
    const my = (e.clientY - rect.top - transform.current.y) / transform.current.scale;

    // Check if clicked a node
    for (const n of simNodes.current) {
      const dx = n.x - mx;
      const dy = n.y - my;
      if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 5) {
        draggingNode.current = n;
        setSelectedItem({ type: 'NODE', data: n });
        return;
      }
    }

    // Otherwise pan canvas
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (draggingNode.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      draggingNode.current.x = (e.clientX - rect.left - transform.current.x) / transform.current.scale;
      draggingNode.current.y = (e.clientY - rect.top - transform.current.y) / transform.current.scale;
    } else if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      transform.current.x += dx;
      transform.current.y += dy;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    draggingNode.current = null;
    isPanning.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    transform.current.scale = Math.max(0.3, Math.min(3, transform.current.scale * zoomFactor));
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
            <span>INTELLIGENCE INVESTIGATION</span>
            <span>•</span>
            <span>GRAPH TRAVERSAL ENGINE</span>
          </div>
          <h1 className="text-xl font-black text-white font-mono tracking-wide">
            CRIMINAL NETWORK RELATIONSHIP GRAPH
          </h1>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <span className="text-[11px] font-mono text-slate-400">FOCUS:</span>
            <input
              type="text"
              value={centerId}
              onChange={(e) => setCenterId(e.target.value.toUpperCase())}
              placeholder="e.g. P0732"
              className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs px-2 py-1 rounded w-24 outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
            <span className="text-[11px] font-mono text-slate-400">HOPS:</span>
            {[1, 2, 3].map(h => (
              <button
                key={h}
                onClick={() => setHops(h)}
                className={`px-2 py-0.5 text-xs font-mono rounded ${
                  hops === h ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <select
            value={relFilter}
            onChange={(e) => setRelFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="ALL">All Relationships</option>
            <option value="COMMUNICATED_WITH">COMMUNICATED_WITH</option>
            <option value="TRANSACTED_WITH">TRANSACTED_WITH</option>
            <option value="TRAVELED_IN">TRAVELED_IN</option>
            <option value="LOCATED_AT">LOCATED_AT</option>
            <option value="WORKS_WITH">WORKS_WITH</option>
            <option value="APPEARED_IN_CASE">APPEARED_IN_CASE</option>
          </select>

          <button
            onClick={() => { transform.current = { x: 0, y: 0, scale: 1 }; }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700"
          >
            Reset View 🎯
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph Canvas (3 Cols) */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl h-[620px] flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-10 text-cyan-400 font-mono text-xs">
              TRAVERSING MULTI-HOP GRAPH...
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={900}
            height={620}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Canvas Floating Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-[10px] font-mono space-y-1 backdrop-blur-sm">
            <div className="text-slate-400 font-bold mb-1">NODE LEGEND:</div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-slate-300">Active Focus</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-300">Person / Subject</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Phone Identifier</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">Vehicle</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-slate-300">Organization</span>
            </div>
          </div>
        </div>

        {/* Right Node Inspector (1 Col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col h-[620px] overflow-y-auto">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              INSPECTOR PANEL
            </h2>
            <span className="text-[10px] font-mono text-cyan-400">
              {graphData.nodes.length} Nodes • {graphData.edges.length} Edges
            </span>
          </div>

          {selectedItem?.type === 'NODE' ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase">SELECTED ENTITY</span>
                <h3 className="text-base font-bold text-cyan-400 font-mono mt-0.5">{selectedItem.data.id}</h3>
                <p className="text-xs text-slate-300 mt-1">{selectedItem.data.label}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                    {selectedItem.data.type}
                  </span>
                  {selectedItem.data.role && (
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {selectedItem.data.role}
                    </span>
                  )}
                </div>
              </div>

              {selectedItem.data.type === 'Person' && (
                <div className="space-y-2">
                  <button
                    onClick={() => onSelectEntity(selectedItem.data.id)}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg transition"
                  >
                    Open Entity 360° Dossier →
                  </button>
                  <button
                    onClick={() => { setCenterId(selectedItem.data.id); }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold rounded-lg border border-slate-700 transition"
                  >
                    Re-Center Graph Here 🎯
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <span className="text-3xl">🖱️</span>
              <p className="text-xs">Click or drag any node on the graph to inspect forensic metadata and links.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
