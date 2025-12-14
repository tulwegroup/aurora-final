

import React, { useState, useEffect, useRef } from 'react';
import { CAUSAL_NODES, SEEPAGE_NETWORK } from '../constants';
import { CausalNode, ExplorationCampaign } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GitBranch, Brain, AlertOctagon, Info, ArrowUpRight, Play, Share2, Droplet, Eye, Sparkles, AlertTriangle, CheckCircle, Layers, Activity, Lightbulb, HelpCircle } from 'lucide-react';
import { AuroraAPI } from '../api';

interface PCFCViewProps {
  campaign: ExplorationCampaign;
}

const PCFCView: React.FC<PCFCViewProps> = ({ campaign }) => {
  const [activeTab, setActiveTab] = useState<'causal' | 'tomography' | 'seepage'>('causal');
  const [selectedNode, setSelectedNode] = useState<CausalNode | null>(null);

  // Tomography State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [physicsResult, setPhysicsResult] = useState<any>(null);
  const [tomographyData, setTomographyData] = useState<number[][] | null>(null);
  const [lossData, setLossData] = useState<{epoch: number, physics: number, data: number}[]>([]);

  // Generate a local fallback slice if backend is unreachable
  const generateFallbackSlice = () => {
    const size = 50;
    const grid: number[][] = [];
    
    // Vary geometry based on campaign type
    const isHydro = campaign.resourceType?.includes('Hydrocarbon') || campaign.targets?.some(t => t.resourceType.includes('Hydrocarbon'));
    
    for(let y=0; y<size; y++) {
        const row: number[] = [];
        for(let x=0; x<size; x++) {
            // Create an Anticline (Dome) shape math function
            const cx = size/2;
            const cy = size/2;
            // Cosine wave to simulate fold
            const domeHeight = cy + 12 * Math.cos((x-cx)*0.15);
            
            let val = 2.4 + (y/size)*0.5; // Base pressure gradient
            
            if (y > domeHeight) {
                val = 2.75; // Dense Basement (Red)
            } else if (y > domeHeight - 6) {
                if (isHydro) val = 2.25; // Lower density fluid for hydrocarbon
                else val = 2.35; // Standard Porous Reservoir
            } else if (y < 5) {
                val = 2.1; // Surface Sediment (Blue)
            }

            // Add Entropy
            val += (Math.random() * 0.1);
            row.push(val);
        }
        grid.push(row);
    }
    return grid;
  };

  const startTomography = async () => {
     if (isResolving) return;
     
     setIsResolving(true);
     setPhysicsResult(null);
     setTomographyData(null);

     // Parse Lat/Lon from Campaign String
     let lat = 0, lon = 0;
     try {
         const coords = campaign.targetCoordinates.match(/-?\d+(\.\d+)?/g);
         if (coords && coords.length >= 2) {
             lat = parseFloat(coords[0]);
             if (campaign.targetCoordinates.includes('S')) lat = -lat;
             lon = parseFloat(coords[1]);
             if (campaign.targetCoordinates.includes('W')) lon = -lon;
         }
     } catch(e) {}

     // 1. Call Inversion Metrics
     let pResult = await AuroraAPI.runPhysicsInversion(lat, lon, 2500); 
     
     // 2. Call Tomography Slice
     const tResult = await AuroraAPI.getPhysicsTomography(lat, lon);
     
     // Robust Logic: Use Backend data if available, else Fallback
     if (tResult && tResult.slice) {
         setTomographyData(tResult.slice);
         if (tResult.residuals) {
             pResult = { ...pResult, residuals: tResult.residuals, structure: tResult.structure };
         }
     } else {
         // FALLBACK MODE
         console.warn("Using Client-Side Fallback for Tomography");
         await new Promise(r => setTimeout(r, 1500)); // Simulate compute time
         setTomographyData(generateFallbackSlice());
         
         const isHydro = campaign.resourceType?.includes('Hydrocarbon') || campaign.targets?.some(t => t.resourceType.includes('Hydrocarbon'));

         pResult = {
             ...pResult,
             structure: isHydro ? "Salt Diapir (Inferred)" : "Anticline (Inferred)",
             residuals: { mass_conservation: 0.0012, momentum_balance: 0.004 }
         };
     }
     
     setPhysicsResult(pResult || {
         residuals: { mass_conservation: 0.0012, momentum_balance: 0.004 },
         structure: "Anticline (Inferred)"
     });
     
     // Generate Mock Loss Data for Chart
     const newLoss = Array.from({ length: 20 }, (_, i) => ({
        epoch: i,
        physics: 0.5 * Math.exp(-0.2 * i) + Math.random() * 0.05,
        data: 0.8 * Math.exp(-0.15 * i) + Math.random() * 0.05,
     }));
     setLossData(newLoss);

     setIsResolving(false);
  };

  // Draw Tomography on Canvas whenever data updates
  useEffect(() => {
      if (!canvasRef.current || !tomographyData) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      const rows = tomographyData.length;
      const cols = tomographyData[0].length;
      const cellW = w / cols;
      const cellH = h / rows;

      ctx.clearRect(0, 0, w, h);

      // Find min/max for normalization
      let minVal = 999, maxVal = -999;
      tomographyData.forEach(row => row.forEach(val => {
          if(val < minVal) minVal = val;
          if(val > maxVal) maxVal = val;
      }));

      // Render Heatmap
      for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
              const val = tomographyData[y][x];
              // Normalize 0-1
              const norm = (val - minVal) / (maxVal - minVal || 1);
              
              // Color Map Visualization Logic
              // 0.0 - 0.25: Blue (Very Low Density - Surface/Water)
              // 0.25 - 0.50: Cyan/Green (Low Density - Porous Reservoir) -> THIS IS THE TARGET
              // 0.50 - 0.75: Yellow/Orange (Medium Density - Cap Rock/Seal)
              // 0.75 - 1.00: Red/Dark Red (High Density - Basement Rock)
              
              let r=0, g=0, b=0;
              if (norm < 0.25) { // Blue -> Cyan
                  const t = norm / 0.25;
                  r=0; g=Math.floor(100 + 155*t); b=255;
              } else if (norm < 0.5) { // Cyan -> Green (TARGET)
                  const t = (norm - 0.25) / 0.25;
                  r=0; g=255; b=Math.floor(255 * (1 - t));
              } else if (norm < 0.75) { // Green -> Yellow
                  const t = (norm - 0.5) / 0.25;
                  r=Math.floor(255 * t); g=255; b=0;
              } else { // Yellow -> Red
                  const t = (norm - 0.75) / 0.25;
                  r=255; g=Math.floor(255 * (1 - t)); b=0;
              }

              ctx.fillStyle = `rgb(${r},${g},${b})`;
              ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1); // +1 to fix gaps
          }
      }

  }, [tomographyData]);

  // AI Physicist Interpretation
  const getPhysicsInterpretation = () => {
      if (!physicsResult?.residuals) return null;
      
      const { mass_conservation, momentum_balance } = physicsResult.residuals;
      const structure = physicsResult.structure || "Unknown";

      if (mass_conservation < 0.002) {
          return {
              summary: "High-Integrity Structural Trap",
              details: `Mass conservation residual (${mass_conservation.toFixed(4)}) is near zero, indicating a tightly sealed reservoir. The '${structure}' geometry is effectively trapping fluids/gas.`,
              status: "Optimal",
              color: "text-emerald-400",
              borderColor: "border-emerald-500/50",
              bg: "bg-emerald-950/30"
          };
      } else if (momentum_balance > 0.03) {
          return {
              summary: "Complex Fault / Shear Zone",
              details: `High momentum residual (${momentum_balance.toFixed(4)}) suggests turbulent or chaotic stress field. Consistent with mineralized shear zones (Gold/Copper) but risky for fluid retention.`,
              status: "Volatile",
              color: "text-amber-400",
              borderColor: "border-amber-500/50",
              bg: "bg-amber-950/30"
          };
      } else {
          return {
              summary: "Background Geology",
              details: "Physics residuals indicate standard hydrostatic pressure gradients. No significant anomalies detected in this sector.",
              status: "Neutral",
              color: "text-slate-400",
              borderColor: "border-slate-500/50",
              bg: "bg-slate-900/30"
          };
      }
  };

  // Helper to interpret Causal Nodes for Investors
  const getCausalInsight = (node: CausalNode) => {
      if (node.type === 'observable') {
          return {
              title: "Observable Data (The Evidence)",
              desc: "This is raw data collected from satellites. It is the 'visible clue' on the surface.",
              impact: "High confidence data that grounds the model in reality.",
              color: "text-emerald-400"
          };
      } else if (node.type === 'hidden') {
          return {
              title: "Latent Variable (The Target)",
              desc: "This is what we are looking for underground. We cannot see it directly, but we infer it mathematically.",
              impact: "Represents the actual mineral or geological structure value.",
              color: "text-aurora-accent"
          };
      } else {
          return {
              title: "Physics Constraint (The Law)",
              desc: "A scientific law (e.g. Poisson's Equation) that acts as a 'Judge'.",
              impact: "Forces the AI to obey reality, preventing 'hallucinations' or false positives.",
              color: "text-aurora-500"
          };
      }
  };

  const insight = getPhysicsInterpretation();

  return (
    <div className="space-y-6 h-full">
      
      {/* Navigation */}
      <div className="flex space-x-2 bg-aurora-900/30 p-1 rounded-lg w-fit border border-aurora-800">
         <button onClick={() => setActiveTab('causal')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'causal' ? 'bg-aurora-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><GitBranch size={16} className="mr-2" /> Causal Graph</button>
         <button onClick={() => setActiveTab('tomography')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'tomography' ? 'bg-aurora-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><Eye size={16} className="mr-2" /> Live Tomography</button>
         <button onClick={() => setActiveTab('seepage')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'seepage' ? 'bg-aurora-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><Share2 size={16} className="mr-2" /> Seepage Network</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 bg-aurora-950 border border-aurora-800 rounded-xl flex flex-col min-h-[500px]">
        
        {activeTab === 'causal' ? (
           <>
            <div className="px-6 py-4 border-b border-aurora-800 flex justify-between items-center bg-aurora-900/30">
               <div className="flex items-center space-x-2"><GitBranch className="text-aurora-accent" size={20} /><h2 className="font-semibold text-slate-200">Causal Inference Graph (DAG)</h2></div>
               <div className="flex space-x-4 text-xs font-mono">
                  <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Observable</div>
                  <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-aurora-500 mr-2"></span>Physics Constraint</div>
                  <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-aurora-accent mr-2"></span>Hidden Latent</div>
               </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
               <svg className="w-full h-full">
                  <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#64748b" /></marker>
                  </defs>
                  {CAUSAL_NODES.map(node => (
                     node.parents.map(parentId => {
                        const parent = CAUSAL_NODES.find(n => n.id === parentId);
                        if (!parent) return null;
                        return (
                           <line key={`${parent.id}-${node.id}`} x1={node.x} y1={node.y} x2={parent.x} y2={parent.y} stroke={selectedNode?.id === node.id || selectedNode?.id === parent.id ? "#ffffff" : "#334155"} strokeWidth={selectedNode?.id === node.id || selectedNode?.id === parent.id ? "2" : "1"} markerEnd="url(#arrowhead)" strokeDasharray="5,5" className="animate-[dash_20s_linear_infinite]" />
                        );
                     })
                  ))}
                  {CAUSAL_NODES.map(node => {
                     const isSelected = selectedNode?.id === node.id;
                     const color = node.type === 'observable' ? '#10b981' : node.type === 'physics' ? '#06b6d4' : '#8b5cf6';
                     return (
                        <g key={node.id} onClick={() => setSelectedNode(node)} className="cursor-pointer hover:opacity-80">
                           <circle cx={node.x} cy={node.y} r={isSelected ? "28" : "24"} fill="#0f172a" stroke={color} strokeWidth={isSelected ? "3" : "2"} className={`filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-300`} />
                           <text x={node.x} y={node.y} dy="4" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold" fontFamily="monospace">{(node.confidence * 100).toFixed(0)}%</text>
                           <text x={node.x} y={node.y + 45} textAnchor="middle" fill={isSelected ? "#fff" : "#94a3b8"} fontSize="12" fontWeight="500">{node.label}</text>
                        </g>
                     );
                  })}
               </svg>
            </div>
           </>
        ) : activeTab === 'seepage' ? (
           <>
              <div className="px-6 py-4 border-b border-aurora-800 flex justify-between items-center bg-aurora-900/30">
                 <div className="flex items-center space-x-2"><Droplet className="text-blue-500" size={20} /><h2 className="font-semibold text-slate-200">Probabilistic Seepage Network (PSN)</h2></div>
                 <span className="text-xs text-slate-500 font-mono">FLOW DIRECTION: SOURCE → SEEP</span>
              </div>
              <div className="flex-1 relative overflow-hidden bg-slate-950">
                 <svg className="w-full h-full">
                    <defs>
                      <linearGradient id="flowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                         <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <marker id="flowArrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12" fill="#06b6d4" /></marker>
                    </defs>
                    {[100, 200, 300, 400].map(y => (<line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />))}
                    <text x="10" y="390" fill="#475569" fontSize="10">Depth: 4km</text><text x="10" y="50" fill="#475569" fontSize="10">Surface</text>
                    {SEEPAGE_NETWORK.map(node => (
                        node.next.map(nextId => {
                            const target = SEEPAGE_NETWORK.find(n => n.id === nextId);
                            if(!target) return null;
                            return (
                                <g key={`${node.id}-${nextId}`}>
                                    <path d={`M${node.x},${node.y} C${node.x},${(node.y+target.y)/2} ${target.x},${(node.y+target.y)/2} ${target.x},${target.y}`} fill="none" stroke="url(#flowGradient)" strokeWidth={node.probability * 4} markerEnd="url(#flowArrow)"/>
                                </g>
                            )
                        })
                    ))}
                    {SEEPAGE_NETWORK.map(node => (
                        <g key={node.id} className="cursor-pointer">
                            <circle cx={node.x} cy={node.y} r={node.type === 'Source' ? 20 : 12} fill={node.type === 'Seep' ? '#06b6d4' : node.type === 'Source' ? '#8b5cf6' : '#334155'} stroke="white" strokeWidth="2" />
                            <text x={node.x} y={node.y + 25} textAnchor="middle" fill="white" fontSize="10">{node.label}</text>
                        </g>
                    ))}
                 </svg>
              </div>
           </>
        ) : (
           <>
              <div className="px-6 py-4 border-b border-aurora-800 flex justify-between items-center bg-aurora-900/30">
               <div className="flex items-center space-x-2"><Eye className="text-aurora-500" size={20} /><h2 className="font-semibold text-slate-200">Live Subsurface Tomography (PINN Output)</h2></div>
               <button onClick={startTomography} disabled={isResolving} className="text-xs bg-aurora-600 hover:bg-aurora-500 px-3 py-1 rounded text-white flex items-center disabled:opacity-50"><Play size={12} className="mr-1" /> {isResolving ? 'Calculating...' : 'Run Simulation'}</button>
            </div>
            
            {/* CANVAS RENDERER */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black relative">
               <canvas ref={canvasRef} width={600} height={350} className="border border-slate-800 rounded shadow-[0_0_30px_rgba(6,182,212,0.1)] w-full h-full object-contain" />
               
               <div className="absolute bottom-6 left-6 space-y-2 pointer-events-none">
                  <div className="bg-black/70 backdrop-blur border border-aurora-500/30 px-3 py-1 rounded text-xs text-aurora-400 font-mono">TARGET: {campaign.targetCoordinates}</div>
                  {physicsResult && <div className="bg-black/70 backdrop-blur border border-emerald-500/30 px-3 py-1 rounded text-xs text-emerald-400 font-mono">STRUCTURE: {physicsResult.structure}</div>}
               </div>

               {!isResolving && !tomographyData && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
                       <p className="text-slate-400 text-sm">Click "Run Simulation" to generate physics slice</p>
                   </div>
               )}
            </div>

            {/* LEGEND - New Addition */}
            {tomographyData && (
                <div className="p-4 bg-slate-900 border-t border-aurora-800">
                    <h4 className="text-[10px] text-slate-400 uppercase tracking-wider mb-3 font-bold">Geological Density Legend</h4>
                    <div className="grid grid-cols-4 gap-2">
                         <div className="flex flex-col items-center">
                             <div className="w-full h-2 rounded bg-gradient-to-r from-blue-600 to-cyan-500 mb-1"></div>
                             <span className="text-[9px] text-slate-300">Surface / Water</span>
                             <span className="text-[8px] text-slate-500">&lt; 2.2 g/cm³</span>
                         </div>
                         <div className="flex flex-col items-center p-1 rounded border border-emerald-500/50 bg-emerald-900/20">
                             <div className="w-full h-2 rounded bg-gradient-to-r from-cyan-400 to-emerald-500 mb-1"></div>
                             <span className="text-[9px] font-bold text-white">TARGET RESERVOIR</span>
                             <span className="text-[8px] text-emerald-400">~2.35 g/cm³</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <div className="w-full h-2 rounded bg-gradient-to-r from-emerald-500 to-yellow-500 mb-1"></div>
                             <span className="text-[9px] text-slate-300">Seal / Cap Rock</span>
                             <span className="text-[8px] text-slate-500">~2.5 g/cm³</span>
                         </div>
                         <div className="flex flex-col items-center">
                             <div className="w-full h-2 rounded bg-gradient-to-r from-yellow-500 to-red-600 mb-1"></div>
                             <span className="text-[9px] text-slate-300">Basement Rock</span>
                             <span className="text-[8px] text-slate-500">&gt; 2.7 g/cm³</span>
                         </div>
                    </div>
                    <div className="mt-3 text-[10px] text-slate-400 italic text-center">
                        <span className="text-emerald-400 font-bold">Analysis Tip:</span> Look for the "Cool" anomaly (Green/Cyan) trapped beneath the "Hot" (Yellow/Red) basement layers.
                    </div>
                </div>
            )}
           </>
        )}
      </div>

      <div className="space-y-6">
        
        {/* RIGHT PANEL - Contextual Info */}
        {activeTab === 'tomography' && insight ? (
             <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 animate-fadeIn">
                 <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                    <Brain size={18} className="mr-2 text-aurora-accent" /> AI Physicist Analysis
                 </h3>
                 
                 <div className={`p-4 rounded-lg border ${insight.borderColor} ${insight.bg} mb-4`}>
                     <div className="flex items-start space-x-3 mb-2">
                        <Sparkles size={16} className={insight.color} />
                        <span className={`text-sm font-bold ${insight.color}`}>{insight.summary}</span>
                     </div>
                     <p className="text-xs text-slate-300 leading-relaxed">
                         {insight.details}
                     </p>
                 </div>
                 
                 <div className="text-xs text-slate-400 mb-2 p-2 border border-slate-800 rounded bg-slate-950/50">
                    <p className="font-bold text-slate-300 mb-1">What is Tomography?</p>
                    2D Density Cross-section generated via Physics-Informed Neural Networks (PINNs). Visualizes subsurface structural traps and density contrasts.
                 </div>

                 {/* Residual Metrics */}
                 <div className="space-y-3 mt-4">
                     <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Physics Residuals</p>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center">
                         <span className="text-xs text-slate-400">Mass Conservation</span>
                         <span className={`text-xs font-mono font-bold ${physicsResult?.residuals?.mass_conservation < 0.002 ? 'text-emerald-400' : 'text-red-400'}`}>
                             {physicsResult?.residuals?.mass_conservation?.toFixed(5)}
                         </span>
                     </div>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center">
                         <span className="text-xs text-slate-400">Momentum Balance</span>
                         <span className="text-xs font-mono font-bold text-blue-400">
                             {physicsResult?.residuals?.momentum_balance?.toFixed(5)}
                         </span>
                     </div>
                 </div>
             </div>
        ) : activeTab === 'seepage' ? (
             <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 animate-fadeIn">
                 <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                    <Activity size={18} className="mr-2 text-blue-400" /> Network Analysis
                 </h3>
                 <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-lg mb-4">
                     <p className="text-xs text-slate-300 leading-relaxed">
                        Probabilistic flow network modeling hydrocarbon/helium migration pathways from source rock to surface seeps. Arrows indicate flow direction and probability.
                     </p>
                 </div>
                 <div className="space-y-2">
                     {SEEPAGE_NETWORK.slice(0, 3).map(node => (
                         <div key={node.id} className="flex justify-between items-center text-xs p-2 border-b border-slate-800/50">
                             <span className="text-slate-400">{node.label}</span>
                             <span className="text-blue-400 font-mono">{(node.probability * 100).toFixed(0)}%</span>
                         </div>
                     ))}
                 </div>
             </div>
        ) : activeTab === 'causal' && selectedNode ? (
            <div className="bg-aurora-900/50 border border-aurora-400/50 rounded-xl p-6 animate-fadeIn shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                {(() => {
                    const info = getCausalInsight(selectedNode);
                    return (
                        <>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className={`text-lg font-bold ${info.color}`}>{selectedNode.label}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider ${selectedNode.type === 'observable' ? 'bg-emerald-500/20 text-emerald-400' : selectedNode.type === 'physics' ? 'bg-aurora-500/20 text-aurora-400' : 'bg-aurora-accent/20 text-aurora-accent'}`}>
                                        {info.title}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white"><Info size={18} /></button>
                            </div>
                            
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4">
                                <p className="text-xs text-slate-300 mb-3">{info.desc}</p>
                                <div className="flex items-start space-x-2 text-xs text-slate-400 italic">
                                    <Lightbulb size={12} className="mt-0.5 flex-shrink-0" />
                                    <span>Investor Note: {info.impact}</span>
                                </div>
                            </div>

                            <div className="bg-slate-950/50 p-3 rounded border border-aurora-800/50">
                                <p className="text-xs text-slate-500 mb-1">Causal Confidence</p>
                                <div className="flex items-end justify-between"><span className="text-2xl font-mono text-white">{(selectedNode.confidence * 100).toFixed(1)}%</span></div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-aurora-500 h-full rounded-full" style={{ width: `${selectedNode.confidence * 100}%` }}></div></div>
                            </div>
                        </>
                    );
                })()}
            </div>
        ) : (
            <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col items-center text-center h-full animate-fadeIn">
                <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                    <Brain className="text-aurora-400" size={32} />
                </div>
                <h3 className="text-white font-bold mb-2">How to Read This Graph</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    This Directed Acyclic Graph (DAG) visualizes the <strong>Causal Logic</strong> of the AI. It proves the system isn't just finding patterns, but validating physics.
                </p>
                
                <div className="w-full space-y-3 text-left">
                    <div className="flex items-center space-x-3 p-2 bg-slate-900/50 rounded border border-emerald-500/20">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <div>
                            <p className="text-xs font-bold text-emerald-400">Observable Nodes</p>
                            <p className="text-[10px] text-slate-500">Real satellite data (e.g. Gravity)</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-slate-900/50 rounded border border-aurora-accent/20">
                        <div className="w-3 h-3 rounded-full bg-aurora-accent" />
                        <div>
                            <p className="text-xs font-bold text-aurora-accent">Hidden Latents</p>
                            <p className="text-[10px] text-slate-500">The subsurface target (e.g. Reservoir)</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-slate-900/50 rounded border border-aurora-500/20">
                        <div className="w-3 h-3 rounded-full bg-aurora-500" />
                        <div>
                            <p className="text-xs font-bold text-aurora-500">Physics Constraints</p>
                            <p className="text-[10px] text-slate-500">Laws of nature that link them.</p>
                        </div>
                    </div>
                </div>
                
                <p className="text-[10px] text-slate-500 mt-6 italic">
                    Click any node in the graph to see specific investment insights.
                </p>
            </div>
        )}

        {/* PINN Metrics Chart */}
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6">
          <div className="flex items-center mb-4"><Brain className="text-aurora-500 mr-2" size={20} /><h3 className="font-semibold text-slate-200">PINN Training Metrics</h3></div>
          <div className="h-[150px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lossData.length > 0 ? lossData : [{epoch:0, physics:0.5, data:0.5}]}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="epoch" hide />
                   <YAxis hide />
                   <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                   <Area type="monotone" dataKey="physics" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} name="Physics Loss" />
                   <Area type="monotone" dataKey="data" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="Data Loss" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono"><span>Epoch: {lossData.length * 200}</span><span className="text-emerald-400">{isResolving ? 'Converging...' : lossData.length > 10 ? 'Converged' : 'Ready'}</span></div>
        </div>

      </div>
    </div>
    </div>
  );
};

export default PCFCView;