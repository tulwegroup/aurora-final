
import React, { useState, useEffect, useRef } from 'react';
import { ExplorationCampaign, SeismicJob, SeismicSlice, SeismicAxis, SeismicTrap } from '../types';
import { AuroraAPI } from '../api';
import { Waves, Play, Activity, Layers, Box, Download, AlertCircle, CheckCircle2, Scan, Target, AlertTriangle, Cuboid, Eye, EyeOff, Brain, Sparkles, X } from 'lucide-react';

interface SeismicViewProps {
    campaign: ExplorationCampaign;
}

interface Interpretation {
    title: string;
    description: string;
    significance: string;
    type: 'structure' | 'anomaly' | 'horizon' | 'background';
}

const SeismicCanvas: React.FC<{ 
    slice: SeismicSlice | null; 
    showHorizons: boolean; 
    showFaults: boolean; 
    showUncertainty: boolean;
    crosshairX?: number; // 0-100
    crosshairY?: number; // 0-100
    onCrosshairClick?: (x: number, y: number) => void;
    onHover?: (x: number, y: number, interp: Interpretation | null) => void;
    label: string;
}> = ({ slice, showHorizons, showFaults, showUncertainty, crosshairX, crosshairY, onCrosshairClick, onHover, label }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !slice) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const { width, height, data, uncertainty } = slice;
        const cellW = canvasRef.current.width / width;
        const cellH = canvasRef.current.height / height;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // 1. Draw Seismic Amplitude
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const val = data[y][x]; // -1 to 1
                const intensity = Math.floor(((val + 1) / 2) * 255);
                ctx.fillStyle = `rgb(${intensity},${intensity},${intensity})`;
                ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);

                // Uncertainty Overlay (Red Heatmap)
                if (showUncertainty) {
                    const u = uncertainty[y][x];
                    if (u > 0.3) {
                        ctx.fillStyle = `rgba(239, 68, 68, ${u * 0.6})`; // Red with alpha
                        ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
                    }
                }
            }
        }

        // 2. Overlay Horizons (Only for vertical slices)
        if (showHorizons && slice.axis !== 'timeslice') {
            slice.horizons.forEach(h => {
                ctx.beginPath();
                ctx.strokeStyle = '#10b981'; // Emerald
                ctx.lineWidth = 2;
                h.depth.forEach((d, x) => {
                    const y = (d / 100) * height; 
                    if (x === 0) ctx.moveTo(x * cellW, y * cellH);
                    else ctx.lineTo(x * cellW, y * cellH);
                });
                ctx.stroke();
            });
        }

        // 3. Overlay Faults (Only for vertical slices)
        if (showFaults && slice.axis !== 'timeslice') {
            slice.faults.forEach(f => {
                ctx.beginPath();
                ctx.strokeStyle = '#ef4444'; // Red
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.moveTo(f.x * cellW, (f.y1/100)*canvasRef.current!.height);
                ctx.lineTo(f.x * cellW, (f.y2/100)*canvasRef.current!.height);
                ctx.stroke();
                ctx.setLineDash([]);
            });
        }

        // 4. Draw Crosshairs (Interactive Navigation)
        if (crosshairX !== undefined && crosshairY !== undefined) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'; // Cyan
            ctx.lineWidth = 1;
            // Vertical Line
            const cx = (crosshairX / 100) * canvasRef.current.width;
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, canvasRef.current.height);
            // Horizontal Line
            const cy = (crosshairY / 100) * canvasRef.current.height;
            ctx.moveTo(0, cy);
            ctx.lineTo(canvasRef.current.width, cy);
            ctx.stroke();
        }

    }, [slice, showHorizons, showFaults, showUncertainty, crosshairX, crosshairY]);

    const handleClick = (e: React.MouseEvent) => {
        if (!onCrosshairClick || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onCrosshairClick(x, y);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!onHover || !slice || !canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to data coordinates (0-100 grid)
        const dataX = Math.floor((mouseX / rect.width) * 100);
        const dataY = Math.floor((mouseY / rect.height) * 100);

        let interp: Interpretation = {
            title: 'Sedimentary Host Rock',
            description: 'Standard lithified strata. Low porosity inferred.',
            significance: 'Non-productive overburden.',
            type: 'background'
        };

        // 1. Check Fault Proximity (within 2 units)
        if (showFaults && slice.axis !== 'timeslice') {
            const nearFault = slice.faults.find(f => Math.abs(f.x - dataX) < 3 && dataY > f.y1 && dataY < f.y2);
            if (nearFault) {
                interp = {
                    title: 'Normal Fault Plane',
                    description: `Vertical displacement detected (Throw: ~${nearFault.throw}m).`,
                    significance: 'CRITICAL: Potential hydrocarbon migration pathway or mineralizing fluid conduit.',
                    type: 'structure'
                };
            }
        }

        // 2. Check Horizon Proximity (within 2 units)
        if (showHorizons && slice.axis !== 'timeslice' && interp.type === 'background') {
            const nearHorizon = slice.horizons.find(h => {
                const depthAtX = h.depth[Math.min(dataX, 99)]; // dataX is 0-100
                return Math.abs(depthAtX - dataY) < 3;
            });
            if (nearHorizon) {
                interp = {
                    title: nearHorizon.label,
                    description: `Strong acoustic impedance contrast (Conf: ${(nearHorizon.confidence * 100).toFixed(0)}%).`,
                    significance: nearHorizon.label.includes('Reservoir') ? 'Primary Target Zone: Porous formation capable of holding fluid.' : 'Regional Seal: Impermeable layer trapping resources below.',
                    type: 'horizon'
                };
            }
        }

        // 3. Check Bright Spots / Anomalies (High Amplitude)
        if (interp.type === 'background') {
            const val = slice.data[Math.min(dataY, 99)]?.[Math.min(dataX, 99)];
            if (val > 0.75) {
                interp = {
                    title: 'High Amplitude Anomaly (Bright Spot)',
                    description: 'Direct Hydrocarbon Indicator (DHI) or massive sulphide body.',
                    significance: 'HIGH PRIORITY: Strong evidence of fluid contact or metallogenic density contrast.',
                    type: 'anomaly'
                };
            } else if (val < -0.7) {
                interp = {
                    title: 'Low Impedance Zone',
                    description: 'Potential salt diapir or highly porous gas sand.',
                    significance: 'Investigate for trap formation mechanics.',
                    type: 'structure'
                };
            }
        }

        onHover(e.clientX, e.clientY, interp);
    };

    const handleMouseLeave = () => {
        if (onHover) onHover(0, 0, null);
    };

    return (
        <div className="relative w-full h-full border border-slate-800 bg-black rounded overflow-hidden group">
            <div className="absolute top-2 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded border border-white/10 z-10 pointer-events-none">{label}</div>
            {slice ? (
                <canvas 
                    ref={canvasRef} 
                    width={300} 
                    height={300} 
                    className="w-full h-full object-cover cursor-crosshair"
                    onClick={handleClick}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No Data</div>
            )}
        </div>
    );
};

const SeismicView: React.FC<SeismicViewProps> = ({ campaign }) => {
    const [activeJob, setActiveJob] = useState<SeismicJob | null>(null);
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
    
    // 3D Navigator State (0-100 coordinates)
    const [posX, setPosX] = useState(50); // Inline Index
    const [posY, setPosY] = useState(50); // Crossline Index
    const [posZ, setPosZ] = useState(30); // Time Slice Index

    // Slices Data
    const [sliceInline, setSliceInline] = useState<SeismicSlice | null>(null);
    const [sliceCrossline, setSliceCrossline] = useState<SeismicSlice | null>(null);
    const [sliceTimeslice, setSliceTimeslice] = useState<SeismicSlice | null>(null);

    // View Options
    const [showHorizons, setShowHorizons] = useState(true);
    const [showFaults, setShowFaults] = useState(true);
    const [showUncertainty, setShowUncertainty] = useState(false);
    
    // Structural Traps
    const [traps, setTraps] = useState<SeismicTrap[]>([]);

    // Tooltip State
    const [tooltip, setTooltip] = useState<{x: number, y: number, content: Interpretation} | null>(null);

    // 1. Job Simulation
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeJob && activeJob.status !== 'Completed' && activeJob.status !== 'Failed') {
            interval = setInterval(() => {
                setActiveJob(prev => {
                    if (!prev) return null;
                    const nextProgress = Math.min(100, prev.progress + 5);
                    let nextStatus = prev.status;
                    let nextTask = prev.currentTask;
                    
                    if (nextProgress < 20) { nextStatus = 'Ingesting'; nextTask = 'OSIL-ASS: Ingesting Gravimetric & InSAR Stacks...'; }
                    else if (nextProgress < 40) { nextStatus = 'Harmonizing'; nextTask = 'USHE-ASS: Aligning Multi-Physics Tensor...'; }
                    else if (nextProgress < 70) { nextStatus = 'Inverting'; nextTask = 'PIIE: M-PINN Physics Inversion...'; }
                    else if (nextProgress < 90) { nextStatus = 'Synthesizing'; nextTask = 'SEI: Extracting Horizons & Faults...'; }
                    else { nextStatus = 'Completed'; nextTask = 'Validation Complete.'; }

                    return { ...prev, progress: nextProgress, status: nextStatus, currentTask: nextTask };
                });
            }, 500); // Faster simulation
        }
        return () => clearInterval(interval);
    }, [activeJob]);

    // 2. Fetch Data when Position Changes or Job Completes
    useEffect(() => {
        const loadSlices = async () => {
            if (!activeJob || activeJob.status !== 'Completed') return;
            
            let lat = 0, lon = 0;
            try {
                const nums = campaign.targetCoordinates.match(/-?\d+(\.\d+)?/g);
                if (nums && nums.length >= 2) {
                    lat = parseFloat(nums[0]);
                    lon = parseFloat(nums[1]);
                }
            } catch(e) {}

            // In 3D mode, fetch all 3 orthogonal slices
            const p1 = AuroraAPI.getSeismicSlice(lat, lon, Math.floor(posY), 'inline');
            const p2 = AuroraAPI.getSeismicSlice(lat, lon, Math.floor(posX), 'crossline');
            const p3 = AuroraAPI.getSeismicSlice(lat, lon, Math.floor(posZ), 'timeslice');
            
            const [s1, s2, s3] = await Promise.all([p1, p2, p3]);
            setSliceInline(s1);
            setSliceCrossline(s2);
            setSliceTimeslice(s3);

            // Fetch Traps if empty
            if (traps.length === 0) {
                const t = await AuroraAPI.getStructuralTraps(lat, lon);
                setTraps(t);
            }
        };
        loadSlices();
    }, [activeJob?.status, posX, posY, posZ, campaign]);

    const handleStartJob = async () => {
        const job = await AuroraAPI.startSeismicJob(campaign.id);
        setActiveJob(job);
    };

    const handleExport = () => {
        // Mock export
        const blob = new Blob(["SEGY HEADER\nTRACE 1\nTRACE 2\n..."], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AURORA_SEISMIC_VOL_${campaign.id}.sgy`;
        a.click();
    };

    const jumpToTrap = (trap: SeismicTrap) => {
        setPosX(trap.coordinates.x);
        setPosY(trap.coordinates.y);
        setPosZ(trap.coordinates.z);
        setViewMode('3D');
    };

    const handleHover = (x: number, y: number, interp: Interpretation | null) => {
        if (!interp) {
            setTooltip(null);
        } else {
            setTooltip({ x, y, content: interp });
        }
    };

    return (
        <div className="space-y-6 relative">
            
            {/* AI Geologist Tooltip */}
            {tooltip && (
                <div 
                    className="fixed z-50 pointer-events-none animate-fadeIn"
                    style={{ left: tooltip.x + 20, top: tooltip.y + 20 }}
                >
                    <div className="bg-slate-900/95 backdrop-blur-md border border-aurora-500/50 rounded-lg p-3 w-64 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center space-x-2 mb-2 border-b border-slate-700 pb-2">
                            <Brain size={14} className="text-aurora-400" />
                            <span className="text-xs font-bold text-white">AI Geologist Analysis</span>
                        </div>
                        <h4 className={`text-sm font-bold mb-1 ${
                            tooltip.content.type === 'anomaly' ? 'text-emerald-400' : 
                            tooltip.content.type === 'structure' ? 'text-amber-400' :
                            tooltip.content.type === 'horizon' ? 'text-blue-400' : 'text-slate-300'
                        }`}>
                            {tooltip.content.title}
                        </h4>
                        <p className="text-xs text-slate-300 mb-2 leading-relaxed">{tooltip.content.description}</p>
                        <div className="bg-white/5 p-2 rounded border border-white/10">
                            <p className="text-[10px] text-aurora-300 italic flex items-start">
                                <Sparkles size={10} className="mr-1 mt-0.5 flex-shrink-0" />
                                {tooltip.content.significance}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Mission Control */}
            <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-aurora-500/10 rounded-full border border-aurora-500/20">
                        <Waves className="text-aurora-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Aurora Seismic Synthesizer (ASS v1.0)</h2>
                        <p className="text-xs text-slate-400 font-mono">PHYSICS-INFORMED PSEUDO-SEISMIC GENERATION</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {activeJob?.status === 'Completed' ? (
                        <div className="flex space-x-2">
                            <button onClick={handleExport} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold border border-slate-600 flex items-center transition-all">
                                <Download size={14} className="mr-2" /> Export SEGY
                            </button>
                            <div className="bg-emerald-900/20 border border-emerald-500/30 px-4 py-2 rounded-lg text-emerald-400 text-xs font-bold flex items-center">
                                <CheckCircle2 size={14} className="mr-2" /> Synthesis Complete
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleStartJob}
                            disabled={!!activeJob}
                            className={`bg-aurora-600 hover:bg-aurora-500 text-white px-6 py-3 rounded-lg font-bold flex items-center shadow-lg transition-all ${!!activeJob ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {activeJob ? <Activity size={18} className="mr-2 animate-spin" /> : <Play size={18} className="mr-2" />}
                            {activeJob ? 'Processing...' : 'Synthesize Volume'}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visualizer Panel */}
                <div className="lg:col-span-2 bg-slate-950 border border-aurora-800 rounded-xl flex flex-col overflow-hidden min-h-[600px]">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-aurora-800 bg-aurora-900/20 flex justify-between items-center">
                        <div className="flex space-x-2">
                            <button onClick={() => setViewMode('2D')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center ${viewMode === '2D' ? 'bg-aurora-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Scan size={14} className="mr-1"/> 2D Line</button>
                            <button onClick={() => setViewMode('3D')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center ${viewMode === '3D' ? 'bg-aurora-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Cuboid size={14} className="mr-1"/> 3D Ortho</button>
                        </div>
                        {activeJob?.status === 'Completed' && (
                            <div className="flex items-center space-x-4">
                                <button onClick={() => setShowUncertainty(!showUncertainty)} className={`text-xs flex items-center space-x-1 ${showUncertainty ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                                    {showUncertainty ? <Eye size={14}/> : <EyeOff size={14}/>} <span>Uncertainty</span>
                                </button>
                                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={showHorizons} onChange={e => setShowHorizons(e.target.checked)} className="accent-emerald-500" />
                                    <span>Horizons</span>
                                </label>
                                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={showFaults} onChange={e => setShowFaults(e.target.checked)} className="accent-red-500" />
                                    <span>Faults</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 bg-black p-1 relative">
                        {!activeJob ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                                <Scan size={64} className="mb-4" />
                                <p className="text-sm">Initiate synthesis to generate seismic volume.</p>
                            </div>
                        ) : activeJob.status !== 'Completed' ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-6">
                                <div className="relative w-32 h-32">
                                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                    <div className="absolute inset-0 border-t-4 border-aurora-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-white">{activeJob.progress}%</div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white mb-1">{activeJob.status}</h3>
                                    <p className="text-xs text-aurora-400 font-mono">{activeJob.currentTask}</p>
                                </div>
                            </div>
                        ) : viewMode === '2D' ? (
                            // 2D Single View
                            <div className="w-full h-full relative">
                                <SeismicCanvas 
                                    slice={sliceInline} 
                                    showHorizons={showHorizons} 
                                    showFaults={showFaults} 
                                    showUncertainty={showUncertainty}
                                    label={`INLINE ${Math.floor(posY)}`}
                                    onHover={handleHover}
                                />
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 flex items-center space-x-3">
                                    <Layers size={14} className="text-slate-400" />
                                    <span className="text-xs text-slate-300 font-mono w-24">Slice Y: {posY}</span>
                                    <input 
                                        type="range" min="0" max="99" 
                                        value={posY} 
                                        onChange={(e) => setPosY(parseInt(e.target.value))}
                                        className="w-32 accent-aurora-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        ) : (
                            // 3D Orthogonal View
                            <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full w-full">
                                {/* Top Left: Time Slice (Z) - Map View */}
                                <SeismicCanvas 
                                    slice={sliceTimeslice} 
                                    showHorizons={false} 
                                    showFaults={showFaults} 
                                    showUncertainty={showUncertainty}
                                    crosshairX={posX} crosshairY={posY}
                                    onCrosshairClick={(x,y) => { setPosX(x); setPosY(y); }}
                                    onHover={handleHover}
                                    label={`TIME SLICE (Z=${Math.floor(posZ)})`}
                                />
                                
                                {/* Top Right: Crossline (YZ) - Side View */}
                                <SeismicCanvas 
                                    slice={sliceCrossline} 
                                    showHorizons={showHorizons} 
                                    showFaults={showFaults} 
                                    showUncertainty={showUncertainty}
                                    crosshairX={posY} crosshairY={posZ}
                                    onCrosshairClick={(y,z) => { setPosY(y); setPosZ(z); }}
                                    onHover={handleHover}
                                    label={`CROSSLINE (X=${Math.floor(posX)})`}
                                />

                                {/* Bottom Left: Inline (XZ) - Front View */}
                                <SeismicCanvas 
                                    slice={sliceInline} 
                                    showHorizons={showHorizons} 
                                    showFaults={showFaults} 
                                    showUncertainty={showUncertainty}
                                    crosshairX={posX} crosshairY={posZ}
                                    onCrosshairClick={(x,z) => { setPosX(x); setPosZ(z); }}
                                    onHover={handleHover}
                                    label={`INLINE (Y=${Math.floor(posY)})`}
                                />

                                {/* Bottom Right: 3D Controls / Info */}
                                <div className="bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase">Navigator</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Inline (Y)</span><span className="text-white">{Math.floor(posY)}</span></div>
                                                <input type="range" min="0" max="99" value={posY} onChange={e=>setPosY(parseInt(e.target.value))} className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg appearance-none"/>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Crossline (X)</span><span className="text-white">{Math.floor(posX)}</span></div>
                                                <input type="range" min="0" max="99" value={posX} onChange={e=>setPosX(parseInt(e.target.value))} className="w-full accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none"/>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Depth (Z)</span><span className="text-white">{Math.floor(posZ)}</span></div>
                                                <input type="range" min="0" max="99" value={posZ} onChange={e=>setPosZ(parseInt(e.target.value))} className="w-full accent-amber-500 h-1 bg-slate-700 rounded-lg appearance-none"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-2 text-center">
                                        Click on any slice to jump position.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Analysis */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6">
                        <h3 className="font-semibold text-slate-200 mb-4 flex items-center"><Activity size={18} className="mr-2 text-emerald-400"/> Validation Metrics</h3>
                        <div className="space-y-4">
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                                <span className="text-xs text-slate-400">Analog Match</span>
                                <span className="text-sm font-bold text-white">92.4%</span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                                <span className="text-xs text-slate-400">Horizon Continuity</span>
                                <span className="text-sm font-bold text-emerald-400">High</span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                                <span className="text-xs text-slate-400">Fault Probability</span>
                                <span className="text-sm font-bold text-amber-400">0.76</span>
                            </div>
                        </div>
                    </div>

                    {/* Structural Interpretation */}
                    <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6">
                        <h3 className="font-semibold text-slate-200 mb-4 flex items-center"><Box size={18} className="mr-2 text-aurora-400"/> Structural Interpretation</h3>
                        
                        {traps.length > 0 ? (
                            <div className="space-y-2">
                                {traps.map(trap => (
                                    <div 
                                        key={trap.id}
                                        onClick={() => jumpToTrap(trap)}
                                        className="p-3 bg-slate-900/50 border border-slate-700 hover:border-aurora-500 rounded cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-white group-hover:text-aurora-400">{trap.name}</span>
                                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{trap.type}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>Conf: {(trap.confidence * 100).toFixed(0)}%</span>
                                            <span>Vol: {trap.volumetrics} MMbbl</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-xs italic">
                                {activeJob?.status === 'Completed' ? 'No major structural traps identified.' : 'Waiting for synthesis...'}
                            </div>
                        )}
                    </div>

                    {/* Disclaimers */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-[10px] text-slate-500">
                        <div className="flex items-center mb-2 text-slate-400 font-bold">
                            <AlertCircle size={12} className="mr-1" /> SYNTHETIC DATA NOTICE
                        </div>
                        <p>
                            ASS products are physics-informed approximations derived from gravity, magnetic, and InSAR data. 
                            They are not direct seismic measurements. Calibration with well logs recommended.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeismicView;
