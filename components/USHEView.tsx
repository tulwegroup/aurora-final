import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, CartesianGrid, LineChart, Line, Legend, ReferenceLine, AreaChart, Area, ComposedChart } from 'recharts';
import { NEURAL_MODULES, DRILL_HOLE_DATABASE } from '../constants';
import { Layers, Network, Cpu, Activity, Play, Settings, Pause, X, Save, Code, ArrowRight, CheckCircle, Terminal, Fingerprint, Zap, Lightbulb, ChevronDown, Target, Scale, Database, AlertCircle, Upload, FileText, Download, Magnet, Thermometer, Radar, ShieldCheck, History, Table2, FileSpreadsheet, Clipboard, FileType, Eye, Sparkles } from 'lucide-react';
import { NeuralModule, ExplorationCampaign, DrillRecord, CalibrationLog, LatentPoint, SpectralData } from '../types';
import { AuroraAPI } from '../api';

interface USHEViewProps {
  campaign: ExplorationCampaign;
}

const DEFAULT_PROJECTS = [
    { id: 'tz', name: 'Reference: Tanzania Rift (Helium)', lat: -8.12, lon: 33.45, type: 'Noble Gas', context: 'Active Rift System', radius: 50 },
    { id: 'nv', name: 'Reference: Nevada Basin (Lithium)', lat: 38.50, lon: -117.50, type: 'Battery Metal', context: 'Sedimentary Basin / Salar', radius: 50 },
    { id: 'sa', name: 'Reference: Saudi Shield (Gold)', lat: 24.50, lon: 42.10, type: 'Precious Metal', context: 'Stable Craton / Shear Zone', radius: 50 },
    { id: 'gh-jubilee', name: 'Reference: Ghana Jubilee (Offshore)', lat: 4.58, lon: -2.95, type: 'Hydrocarbon', context: 'Deepwater Turbidite / Transform Margin', radius: 50 }
];

const COLORS = { 'Mineral': '#10b981', 'Water': '#22d3ee', 'Void': '#f59e0b' };

class SeededRNG {
    private seed: number;
    constructor(seedStr: string) {
        let h = 0x811c9dc5;
        for (let i = 0; i < seedStr.length; i++) {
            h ^= seedStr.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    range(min: number, max: number) {
        return min + (this.next() * (max - min));
    }
}

export const USHEView: React.FC<USHEViewProps> = ({ campaign }) => {
    const [neuralModules, setNeuralModules] = useState<NeuralModule[]>(NEURAL_MODULES);
    const [drillRecords, setDrillRecords] = useState<DrillRecord[]>(DRILL_HOLE_DATABASE);
    const [latentPoints, setLatentPoints] = useState<LatentPoint[]>([]);
    const [activeProject, setActiveProject] = useState(DEFAULT_PROJECTS[0]);
    const [calibrationLogs, setCalibrationLogs] = useState<CalibrationLog[]>([]);
    const [spectralData, setSpectralData] = useState<SpectralData[]>([]);
    const [isTraining, setIsTraining] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [systemStatus, setSystemStatus] = useState('ACTIVE');
    const [selectedSpectrum, setSelectedSpectrum] = useState('Fused');
    const [anomalyScore, setAnomalyScore] = useState<number>(0);
    
    // Fetch real USHE data when project changes
    useEffect(() => {
        const fetchUSHEdata = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${AuroraAPI.BASE_URL}/api/v1/ushe/sample?lat=${activeProject.lat}&lon=${activeProject.lon}&radius_km=${activeProject.radius}`
                );
                const data = await response.json();
                
                // Set spectral data
                setSpectralData(data.spectral || []);
                
                // Set calibration logs
                if (data.calibration_logs) {
                    setCalibrationLogs(data.calibration_logs.map((log: any, index: number) => ({
                        id: index + 1,
                        region_id: log.region_id,
                        reference_count: log.reference_count,
                        timestamp: log.timestamp
                    })));
                }
                
                // Calculate anomaly score
                calculateAnomalyScore(data.spectral || []);
                
            } catch (error) {
                console.error('Failed to fetch USHE data:', error);
                // Fallback to mock data
                generateMockSpectralData();
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchUSHEdata();
    }, [activeProject]);

    const calculateAnomalyScore = (spectral: SpectralData[]) => {
        // Simple anomaly detection based on Fused value deviations
        if (spectral.length === 0) {
            setAnomalyScore(0);
            return;
        }
        
        const fusedValues = spectral.map(s => s.Fused || 0);
        const mean = fusedValues.reduce((a, b) => a + b, 0) / fusedValues.length;
        const variance = fusedValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / fusedValues.length;
        const stdDev = Math.sqrt(variance);
        
        // Normalize to 0-100 score
        const score = Math.min(Math.max((stdDev * 100), 0), 100);
        setAnomalyScore(Math.round(score));
    };

    const generateMockSpectralData = () => {
        const rng = new SeededRNG(activeProject.id);
        const mockData: SpectralData[] = [];
        for (let i = 400; i <= 2500; i += 50) {
            mockData.push({
                wavelength: i,
                Optical: 0.3 + rng.next() * 0.2,
                SAR: 0.2 + rng.next() * 0.15,
                Thermal: 0.4 + rng.next() * 0.1,
                Gravity: 0.3 + rng.next() * 0.1,
                Fused: 0.5 + rng.next() * 0.2
            });
        }
        setSpectralData(mockData);
    };

    const scanLogs = [
        { id: 1, message: 'AURORA OSI v3.1.0 initialized', timestamp: '23:49:12', type: 'system' },
        { id: 2, message: 'Neural modules: 8/8 loaded', timestamp: '23:49:15', type: 'success' },
        { id: 3, message: 'Latent space: calibrated to reference projects', timestamp: '23:49:18', type: 'info' },
        { id: 4, message: 'Deep scan: active (physics + AI fusion)', timestamp: '23:49:22', type: 'active' },
    ];

    const toggleModule = (id: string) => {
        setNeuralModules(prev => prev.map(module => 
            module.id === id ? { ...module, active: !module.active } : module
        ));
    };

    const startTraining = () => {
        setIsTraining(true);
        setTimeout(() => setIsTraining(false), 3000);
    };

    // Generate latent space points
    useEffect(() => {
        const rng = new SeededRNG(campaign.id);
        const points: LatentPoint[] = [];
        for (let i = 0; i < 50; i++) {
            points.push({
                x: rng.range(-2, 2),
                y: rng.range(-2, 2),
                z: rng.range(0.5, 2),
                type: ['Mineral', 'Water', 'Void'][Math.floor(rng.next() * 3)] as 'Mineral' | 'Water' | 'Void',
                confidence: rng.range(0.7, 0.95)
            });
        }
        setLatentPoints(points);
    }, [campaign.id]);

    return (
        <div className="h-screen bg-slate-950 text-slate-200 overflow-hidden">
            {/* Top Header */}
            <div className="border-b border-slate-800 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Layers className="text-aurora-400" size={24} />
                    <div>
                        <h1 className="text-xl font-bold">Unified Subsurface Hypothesis Engine (USHE)</h1>
                        <p className="text-slate-400 text-sm">v3.1.0 — Campaign: {campaign.name} | Project: {activeProject.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${systemStatus === 'ACTIVE' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${systemStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                        {systemStatus}
                    </div>
                    {anomalyScore > 0 && (
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${anomalyScore > 70 ? 'bg-rose-900/30 text-rose-400' : 'bg-amber-900/30 text-amber-400'}`}>
                            <Radar size={14} />
                            Anomaly: {anomalyScore}%
                        </div>
                    )}
                    <button 
                        className="px-4 py-2 bg-aurora-600 hover:bg-aurora-700 rounded-lg flex items-center gap-2"
                        onClick={() => {
                            // Trigger rescan
                            const fetchData = async () => {
                                setIsLoading(true);
                                try {
                                    const response = await fetch(
                                        `${AuroraAPI.BASE_URL}/api/v1/ushe/sample?lat=${activeProject.lat}&lon=${activeProject.lon}&radius_km=${activeProject.radius}`
                                    );
                                    const data = await response.json();
                                    setSpectralData(data.spectral || []);
                                    calculateAnomalyScore(data.spectral || []);
                                } catch (error) {
                                    console.error('Rescan failed:', error);
                                } finally {
                                    setIsLoading(false);
                                }
                            };
                            fetchData();
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Activity className="animate-spin" size={16} />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                Rescan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-12 h-[calc(100vh-73px)]">
                {/* Left Panel - Neural Modules */}
                <div className="col-span-3 border-r border-slate-800 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Network size={18} />
                            Neural Modules
                        </h2>
                        <button className="text-xs text-slate-400 hover:text-slate-300">Configure</button>
                    </div>
                    
                    <div className="space-y-3">
                        {neuralModules.map(module => (
                            <div 
                                key={module.id}
                                className={`p-3 rounded-lg border ${module.active ? 'border-aurora-500/50 bg-aurora-900/20' : 'border-slate-700 bg-slate-900/50'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded ${module.active ? 'bg-aurora-500/20' : 'bg-slate-700'}`}>
                                            {module.icon === 'cpu' && <Cpu size={14} />}
                                            {module.icon === 'activity' && <Activity size={14} />}
                                            {module.icon === 'layers' && <Layers size={14} />}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{module.name}</h3>
                                            <p className="text-xs text-slate-400">{module.type}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => toggleModule(module.id)}
                                        className={`w-8 h-4 rounded-full transition-colors ${module.active ? 'bg-aurora-500' : 'bg-slate-600'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full bg-white transform transition-transform ${module.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">{module.description}</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Confidence: {module.confidence}%</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800">{module.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Project Selector */}
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Database size={14} />
                            Reference Projects
                        </h3>
                        <div className="space-y-2">
                            {DEFAULT_PROJECTS.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => setActiveProject(project)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${activeProject.id === project.id ? 'border-aurora-500 bg-aurora-900/20' : 'border-slate-700 hover:border-slate-600'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{project.name}</span>
                                        {activeProject.id === project.id && <CheckCircle size={14} className="text-aurora-400" />}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-400">
                                        {project.type} • {project.context}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Panel - Spectral Visualization */}
                <div className="col-span-6 p-4 overflow-y-auto">
                    {/* Spectrum Selector */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Radar size={18} />
                                Spectral Signature Analysis
                            </h2>
                            <p className="text-sm text-slate-400">
                                Lat: {activeProject.lat}, Lon: {activeProject.lon} • Radius: {activeProject.radius}km
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {['Fused', 'Optical', 'SAR', 'Thermal', 'Gravity'].map(spectrum => (
                                <button
                                    key={spectrum}
                                    onClick={() => setSelectedSpectrum(spectrum)}
                                    className={`px-3 py-1.5 text-sm rounded-lg ${selectedSpectrum === spectrum ? 'bg-aurora-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                                >
                                    {spectrum}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Spectral Chart */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
                        <div className="h-80">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <Activity className="animate-spin mx-auto mb-4" size={32} />
                                        <p>Loading spectral data from Sentinel satellites...</p>
                                    </div>
                                </div>
                            ) : spectralData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={spectralData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis 
                                            dataKey="wavelength" 
                                            label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5 }}
                                            stroke="#94a3b8"
                                        />
                                        <YAxis 
                                            label={{ value: 'Reflectance/Intensity', angle: -90, position: 'insideLeft' }}
                                            stroke="#94a3b8"
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }}
                                            labelStyle={{ color: '#cbd5e1' }}
                                        />
                                        <Legend />
                                        <Area 
                                            type="monotone" 
                                            dataKey={selectedSpectrum} 
                                            fill="#22c55e" 
                                            stroke="#22c55e" 
                                            fillOpacity={0.2}
                                            strokeWidth={2}
                                        />
                                        <ReferenceLine 
                                            y={0.5} 
                                            stroke="#94a3b8" 
                                            strokeDasharray="3 3" 
                                            label={{ value: 'Baseline', position: 'insideTopRight', fill: '#94a3b8' }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-slate-400">No spectral data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calibration Logs */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Terminal size={16} />
                                Calibration Logs
                            </h3>
                            <span className="text-xs text-slate-400">
                                {calibrationLogs.length} regions calibrated
                            </span>
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {isTraining && (
                                <div className="text-aurora-400 animate-pulse flex items-center gap-2">
                                    {">"} <span className="animate-pulse">Backpropagation active... updating weights</span>
                                </div>
                            )}
                            {calibrationLogs.map(log => (
                                <div key={log.id} className="text-sm p-2 hover:bg-slate-800/50 rounded">
                                    <span className="text-slate-400">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>{' '}
                                    <span className="text-emerald-500">SUCCESS</span>{' '}
                                    Re-calibrated {log.region_id} (n={log.reference_count})
                                </div>
                            ))}
                            <div className="text-slate-500 text-sm p-2">
                                {">"} System Ready. Anomaly detection active.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Latent Space & Controls */}
                <div className="col-span-3 border-l border-slate-800 p-4 overflow-y-auto">
                    {/* Latent Space Visualization */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Eye size={16} />
                            Latent Space Explorer
                        </h3>
                        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" dataKey="x" name="X" stroke="#94a3b8" />
                                    <YAxis type="number" dataKey="y" name="Y" stroke="#94a3b8" />
                                    <ZAxis type="number" dataKey="z" range={[50, 400]} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Latent Points" data={latentPoints} shape="circle">
                                        {latentPoints.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.type]} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-3 text-xs">
                            {Object.entries(COLORS).map(([type, color]) => (
                                <div key={type} className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                    {type}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Controls */}
                    <div className="space-y-4">
                        <div className="p-4 border border-slate-700 rounded-xl">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Settings size={16} />
                                System Controls
                            </h4>
                            <div className="space-y-3">
                                <button 
                                    onClick={startTraining}
                                    className="w-full py-2 bg-aurora-600 hover:bg-aurora-700 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Zap size={14} />
                                    Run Backpropagation
                                </button>
                                <button className="w-full py-2 border border-slate-600 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2">
                                    <Save size={14} />
                                    Save Session
                                </button>
                                <button className="w-full py-2 border border-slate-600 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2">
                                    <Code size={14} />
                                    Export Analysis
                                </button>
                            </div>
                        </div>

                        {/* Real-time Stats */}
                        <div className="p-4 border border-slate-700 rounded-xl">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Activity size={16} />
                                Real-time Metrics
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Spectral Points</span>
                                    <span className="font-mono">{spectralData.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Anomaly Score</span>
                                    <span className={`font-mono ${anomalyScore > 70 ? 'text-rose-400' : 'text-amber-400'}`}>
                                        {anomalyScore}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Active Modules</span>
                                    <span className="font-mono">
                                        {neuralModules.filter(m => m.active).length}/{neuralModules.length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Data Freshness</span>
                                    <span className="font-mono">~5 min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
