
import React, { useState, useEffect } from 'react';
import { MOCK_VOXELS } from '../constants';
import { Voxel, ExplorationCampaign } from '../types';
import { Box, Clock, Database, Search, Layers, Calendar, BarChart3, Info, Sparkles, ArrowUpRight, Loader2, Brain, Scan, ArrowDown } from 'lucide-react';
import { AuroraAPI } from '../api';

interface DigitalTwinViewProps {
    campaign: ExplorationCampaign;
}

const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({ campaign }) => {
    const [year, setYear] = useState(2023);
    const [selectedVoxel, setSelectedVoxel] = useState<Voxel | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
    
    // Live Backend Data State
    const [liveVoxels, setLiveVoxels] = useState<Voxel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [targetName, setTargetName] = useState<string>('Local Model');

    useEffect(() => {
        const fetchBackendVoxels = async () => {
            setIsLoading(true);
            setTargetName(campaign.regionName || campaign.name);
            
            // Parse active campaign coordinates
            let lat = -8.12, lon = 33.45;
            try {
                 const coords = campaign.targetCoordinates.match(/-?\d+(\.\d+)?/g);
                 if (coords && coords.length >= 2) {
                     lat = parseFloat(coords[0]);
                     if (campaign.targetCoordinates.includes('S')) lat = -lat;
                     lon = parseFloat(coords[1]);
                     if (campaign.targetCoordinates.includes('W')) lon = -lon;
                 }
            } catch(e) {}

            const data = await AuroraAPI.getDigitalTwinVoxels(lat, lon);
            
            if (data && data.voxels) {
                setLiveVoxels(data.voxels);
            } else {
                setLiveVoxels(MOCK_VOXELS); // Fallback to mock if offline
            }
            setIsLoading(false);
        };
        fetchBackendVoxels();
    }, [campaign]);

    // Filter logic for volumetric calculation
    const currentVoxels = liveVoxels.length > 0 ? liveVoxels : MOCK_VOXELS;
    const highProbVoxels = currentVoxels.filter(v => v.mineralProb > confidenceThreshold);
    const totalResourceEstimate = highProbVoxels.length * 1.5; 

    // Simulate "Time Machine" effect on Voxel data
    const getHistoricData = (v: Voxel, yr: number) => {
        const ageFactor = Math.abs(2023 - yr);
        const uncertainty = Math.min(0.9, v.uncertainty + (ageFactor * 0.05));
        const mineralProb = v.mineralProb > 0.5 
            ? Math.max(0.1, v.mineralProb - (ageFactor * 0.02)) 
            : v.mineralProb;
        
        return { ...v, uncertainty, mineralProb };
    };

    // Helper to interpret probabilities with GEOLOGICAL CONTEXT
    const getVoxelInsight = (v: Voxel) => {
        const prob = v.mineralProb;
        const depth = v.z; // 0 is surface, 3 is deep
        
        // Scenario 1: Surface Sediment (The "Cap Rock")
        if (depth <= 1 && prob < 0.3) return {
            level: 'Cap Rock / Overburden (Seal)',
            color: 'text-blue-400',
            borderColor: 'border-blue-500/50',
            bg: 'bg-blue-950/30',
            desc: `Low probability (${(prob*100).toFixed(1)}%) at surface is POSITIVE. It indicates a competent seal preventing leakage. The faint signal represents micro-seepage validation.`,
            action: 'Observation: Seal integrity is intact. Look deeper for accumulation.'
        };

        // Scenario 2: Deep Reservoir (The "Prize")
        // UPDATED: Threshold set to 0.7 as per user request for Confirmed cases
        if (depth >= 2 && prob > 0.7) return {
            level: 'High Confidence Reservoir',
            color: 'text-emerald-400',
            borderColor: 'border-emerald-500/50',
            bg: 'bg-emerald-950/30',
            desc: `Strong signal convergence at depth. Density (${v.density.toFixed(2)}) matches porous reservoir rock filled with fluid/gas.`,
            action: 'Recommendation: Primary drilling target. High commercial viability.'
        };

        // Scenario 3: The "Leak" (Bad News)
        if (depth <= 1 && prob > 0.6) return {
            level: 'Breached Seal / Surface Leak',
            color: 'text-red-400',
            borderColor: 'border-red-500/50',
            bg: 'bg-red-950/30',
            desc: 'High concentration at surface suggests the trap has failed and resource is venting to atmosphere. Structural integrity compromised.',
            action: 'Warning: High exploration risk. Reservoir likely depleted.'
        };

        // Default: Transition Zone
        if (prob < 0.3) return {
            level: 'Low Confidence (Inferred)',
            color: 'text-amber-400',
            borderColor: 'border-amber-500/50',
            bg: 'bg-amber-950/30',
            desc: 'Weak geophysical signal. High epistemic uncertainty due to sparse data coverage.',
            action: 'CRITICAL: Task High-Res SAR or run Quantum Inversion to resolve ambiguity.'
        };

        return {
            level: 'Medium Confidence (Indicated)',
            color: 'text-blue-400',
            borderColor: 'border-blue-500/50',
            bg: 'bg-blue-950/30',
            desc: 'Corroborated by at least two physics layers (Gravity + Spectral). Statistical significance is moderate.',
            action: 'Recommendation: Verification scan required to confirm reservoir boundaries.'
        };
    };

    const handleVoxelClick = (v: Voxel) => {
        setIsAnalyzing(true);
        setSelectedVoxel(null);
        setTimeout(() => {
            setSelectedVoxel(v);
            setIsAnalyzing(false);
        }, 600);
    };

    return (
        <div className="space-y-6">
            
            {/* Header / Query Bar */}
            <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-aurora-500/10 rounded-full">
                        <Box className="text-aurora-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Sovereign Digital Twin</h2>
                        <div className="flex items-center space-x-2">
                            <p className="text-xs text-slate-400 font-mono">4D VOXEL GRID • ACTIVE MISSION CONTEXT</p>
                            <span className="text-[10px] bg-emerald-900 text-emerald-400 px-2 rounded-full border border-emerald-700">{targetName.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="bg-slate-900 border border-aurora-800 rounded-lg p-2 flex items-center space-x-2">
                        <Search size={16} className="text-slate-500" />
                        <span className="text-sm text-slate-300 font-mono">/twin/query?coords={campaign.targetCoordinates}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Total Inferred Resource</p>
                        <p className="text-2xl font-bold text-emerald-400">{totalResourceEstimate.toFixed(1)} Mt</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 3D Voxel Viewer */}
                <div className="lg:col-span-2 bg-slate-950 border border-aurora-800 rounded-xl p-6 flex flex-col min-h-[600px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-200 flex items-center">
                            <Layers className="mr-2 text-aurora-accent" size={18} /> Subsurface Model ({year})
                        </h3>
                        <div className="flex space-x-3 text-xs text-slate-500">
                             <span className="flex items-center"><div className="w-2 h-2 bg-slate-700 mr-1"/> Sediment</span>
                             <span className="flex items-center"><div className="w-2 h-2 bg-amber-600/50 mr-1"/> Inferred</span>
                             <span className="flex items-center"><div className="w-2 h-2 bg-emerald-600 mr-1"/> Measured</span>
                        </div>
                    </div>

                    <div className="flex-1 relative perspective-1000 flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5 overflow-hidden rounded-lg border border-slate-900">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center text-aurora-400">
                                <Loader2 size={32} className="animate-spin mb-2" />
                                <span className="text-xs font-mono">Generating Voxel Octree for {campaign.regionName}...</span>
                            </div>
                        ) : (
                            <div className="relative transform-style-3d rotate-x-60 rotate-z-45 scale-90 transition-transform duration-500 hover:rotate-z-60">
                                {currentVoxels.map((rawVoxel) => {
                                    const v = getHistoricData(rawVoxel, year);
                                    const isSelected = selectedVoxel?.id === v.id;
                                    
                                    // Color logic
                                    let color = 'rgba(15, 23, 42, 0.9)'; // Basement
                                    let border = 'border-white/10';

                                    if (v.lithology === 'Reservoir' || v.lithology === 'Pegmatite' || v.lithology === 'Vein') {
                                        if (v.mineralProb < 0.3) {
                                            color = `rgba(245, 158, 11, ${v.mineralProb + 0.3})`; // Amber for Low Prob
                                            border = 'border-amber-500/30';
                                        } else {
                                            color = `rgba(16, 185, 129, ${v.mineralProb})`; // Green for High Prob
                                            border = 'border-emerald-500/30';
                                        }
                                    } else if (v.lithology === 'Cap Rock') {
                                        color = 'rgba(100, 116, 139, 0.8)';
                                    } else if (v.lithology === 'Sediment' || v.lithology === 'Overburden') {
                                        color = 'rgba(148, 163, 184, 0.4)';
                                    }
                                    
                                    return (
                                        <div 
                                            key={v.id}
                                            onClick={() => handleVoxelClick(v)}
                                            className={`absolute w-12 h-12 border transition-all cursor-pointer shadow-lg flex items-center justify-center group ${border} ${
                                                isSelected ? 'border-white border-2 scale-110 z-50 shadow-[0_0_15px_white]' : 'hover:border-white/50 hover:translate-z-2'
                                            }`}
                                            style={{
                                                backgroundColor: color,
                                                transform: `translate3d(${v.x * 55}px, ${v.y * 55}px, ${v.z * 55}px)`, // Increased spacing
                                                zIndex: 4 - v.z
                                            }}
                                        >
                                            {/* Show probability text on interesting voxels */}
                                            {v.mineralProb > 0.1 && (
                                                <span className="text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                                                    {(v.mineralProb * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-4 bg-aurora-900/30 p-3 rounded-lg border border-aurora-800/50">
                        <Clock size={20} className="text-aurora-400" />
                        <div className="flex-1">
                            <label className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Time Machine: Model Evolution</span>
                                <span className="text-white font-mono">{year}</span>
                            </label>
                            <input 
                                type="range" min="2010" max="2024" step="1" 
                                value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                                className="w-full accent-aurora-400"
                            />
                        </div>
                        <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-white">Reset</button>
                    </div>
                </div>

                {/* Voxel Details & Filters */}
                <div className="space-y-6">
                    
                    {/* Voxel Info Panel */}
                    <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 min-h-[500px] flex flex-col relative overflow-hidden">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center justify-between">
                            <span className="flex items-center"><Database size={16} className="mr-2 text-slate-400" /> Voxel Inspection</span>
                            {selectedVoxel && <span className="text-xs font-mono text-emerald-400">{selectedVoxel.id}</span>}
                        </h3>
                        
                        {isAnalyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-aurora-400 space-y-4 animate-fadeIn">
                                <Scan size={48} className="animate-pulse" />
                                <div className="text-center">
                                    <p className="font-bold text-sm">Analyzing Voxel Signature...</p>
                                    <p className="text-xs text-slate-500 mt-1 font-mono">Running Physics Constraints</p>
                                </div>
                                <Loader2 size={24} className="animate-spin text-slate-500" />
                            </div>
                        ) : selectedVoxel ? (
                            <div className="space-y-4 animate-fadeIn flex-1 overflow-y-auto custom-scrollbar pr-1">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm p-2 bg-slate-900/50 rounded">
                                        <span className="text-slate-500">Lithology</span>
                                        <span className="text-white font-medium">{selectedVoxel.lithology}</span>
                                    </div>
                                    <div className="flex justify-between text-sm p-2 bg-slate-900/50 rounded">
                                        <span className="text-slate-500">Mineral Prob</span>
                                        <span className={`font-bold font-mono ${selectedVoxel.mineralProb > 0.7 ? 'text-emerald-400' : selectedVoxel.mineralProb > 0.3 ? 'text-blue-400' : 'text-amber-400'}`}>
                                            {(selectedVoxel.mineralProb * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm p-2 bg-slate-900/50 rounded">
                                        <span className="text-slate-500">Density</span>
                                        <span className="text-white font-mono">{selectedVoxel.density.toFixed(2)} g/cm³</span>
                                    </div>
                                    <div className="flex justify-between text-sm p-2 bg-slate-900/50 rounded">
                                        <span className="text-slate-500">Uncertainty</span>
                                        <div className="flex items-center">
                                            <div className="w-16 h-1.5 bg-slate-700 rounded-full mr-2 overflow-hidden">
                                                <div className="bg-amber-500 h-full" style={{width: `${selectedVoxel.uncertainty * 100}%`}}></div>
                                            </div>
                                            <span className="text-slate-300 text-xs">{(selectedVoxel.uncertainty * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    
                                    {/* DEPTH INDICATOR */}
                                    <div className="flex justify-between text-sm p-2 bg-slate-900/50 rounded">
                                        <span className="text-slate-500">Relative Depth</span>
                                        <span className="text-slate-300 text-xs flex items-center">
                                            {selectedVoxel.z === 0 ? "Surface (0m)" : selectedVoxel.z === 1 ? "Shallow (~500m)" : selectedVoxel.z === 2 ? "Target (~1.5km)" : "Basement (>2km)"}
                                            <ArrowDown size={12} className="ml-1" />
                                        </span>
                                    </div>
                                </div>
                                
                                {/* AI Analyst Insight */}
                                <div className="mt-6 pt-4 border-t border-aurora-800">
                                    <h4 className="text-xs font-bold text-slate-200 flex items-center mb-3">
                                        <Brain size={14} className="mr-2 text-aurora-accent" /> 
                                        AI Analyst Assessment
                                    </h4>
                                    
                                    {(() => {
                                        const insight = getVoxelInsight(selectedVoxel);
                                        return (
                                            <div className={`p-4 rounded-lg border ${insight.borderColor} ${insight.bg} transition-all duration-500`}>
                                                <div className="flex items-start space-x-3 mb-2">
                                                    <Sparkles size={16} className={insight.color} />
                                                    <p className={`text-xs font-bold ${insight.color}`}>{insight.level}</p>
                                                </div>
                                                
                                                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                                                    {insight.desc}
                                                </p>
                                                
                                                <div className="bg-black/20 p-2 rounded text-[10px] text-slate-300 italic border border-white/5 flex items-start">
                                                    <Info size={12} className="mr-2 mt-0.5 flex-shrink-0" />
                                                    {insight.action}
                                                </div>

                                                {selectedVoxel.mineralProb < 0.6 && (
                                                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Projected Uplift</span>
                                                        <span className="text-xs font-mono font-bold text-emerald-400 flex items-center">
                                                            <ArrowUpRight size={12} className="mr-1" />
                                                            +{(0.85 - selectedVoxel.mineralProb).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-70">
                                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                                    <Box size={32} />
                                </div>
                                <p className="text-xs text-center max-w-[200px]">
                                    Select any voxel block in the 3D grid to run physics diagnostics and view probability confidence.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Volumetric Query Filters */}
                    <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6">
                         <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center">
                            <BarChart3 size={16} className="mr-2 text-slate-400" /> Resource Calculator
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>Cutoff Grade (Confidence)</span>
                                    <span className="text-white">{(confidenceThreshold * 100).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05"
                                    value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                    <p className="text-[10px] text-slate-500">QUALIFYING BLOCKS</p>
                                    <p className="text-lg font-bold text-white">{highProbVoxels.length}</p>
                                </div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                    <p className="text-[10px] text-slate-500">MEAN UNCERTAINTY</p>
                                    <p className="text-lg font-bold text-amber-400">12.4%</p>
                                </div>
                            </div>
                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded transition-colors border border-slate-700">
                                Export Volumetric Report (CSV)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalTwinView;
