
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExplorationCampaign, AppView, CAMPAIGN_PHASES, Anomaly, Satellite, TargetResult, ScanSector, MineralAgentType, HiveMindState } from '../types';
import { RESOURCE_CATALOG, ANOMALIES, SATELLITES } from '../constants';
import MapVisualization from './MapVisualization';
import { Play, Upload, Plus, Target, Activity, Zap, Search, ChevronRight, AlertTriangle, CheckCircle, MapPin, Database, Radar, Globe, Crosshair, Loader2, FileText, Terminal, Bot, LayoutGrid, Users, Maximize, StopCircle, Cpu, Pause, Wifi, Lock, ShieldCheck } from 'lucide-react';
import { AuroraAPI } from '../api';

interface DashboardProps {
    campaign: ExplorationCampaign;
    onLaunchCampaign: (campaign: ExplorationCampaign) => void;
    onAdvancePhase: () => void;
    onUpdateCampaign: (campaign: ExplorationCampaign) => void;
    onNavigate: (view: AppView) => void;
    // New Props for Persistence
    hiveMindState: HiveMindState;
    setHiveMindState: React.Dispatch<React.SetStateAction<HiveMindState>>;
}

const PRESET_REGIONS = [
    { name: 'Nevada, USA', coords: '38.50, -117.50' },
    { name: 'Ghana (Ashanti)', coords: '6.50, -1.50' },
    { name: 'Tanzania (Rukwa)', coords: '-8.12, 33.45' },
    { name: 'Saudi Arabia (Shield)', coords: '24.50, 42.10' },
    { name: 'Western Australia', coords: '-26.0, 121.0' },
    { name: 'Chile (Atacama)', coords: '-23.5, -68.0' }
];

const Dashboard: React.FC<DashboardProps> = ({ campaign, onLaunchCampaign, onAdvancePhase, onUpdateCampaign, onNavigate, hiveMindState, setHiveMindState }) => {
    const [showMissionPlanner, setShowMissionPlanner] = useState(false);
    const [scanMode, setScanMode] = useState<'Regional' | 'Pinpoint' | 'HiveMind'>('Regional');
    const [missionConfig, setMissionConfig] = useState({
        coordinates: campaign.targetCoordinates || '',
        selectedResources: [] as string[],
        radius: campaign.radius || 50,
        name: ''
    });
    const [isLaunching, setIsLaunching] = useState(false);
    const [isLiveConnection, setIsLiveConnection] = useState(false);
    const [geeKeyPresent, setGeeKeyPresent] = useState(false);

    const [anomalies, setAnomalies] = useState<Anomaly[]>(ANOMALIES);
    const [selectedAnomly, setSelectedAnomaly] = useState<Anomaly | null>(null);
    const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Sync local logs with persistent logs when in HiveMind mode
    useEffect(() => {
        if (hiveMindState.isScanning) {
            setTelemetryLogs(hiveMindState.logs);
        }
    }, [hiveMindState.logs, hiveMindState.isScanning]);

    // Initial Setup & Live Check
    useEffect(() => {
        const checkLive = async () => {
            // Check connection to Backend (Streaming status)
            // FIX: Replaced non-existent 'isUsingFallback' with '!isCloudConnected'
            const isFallback = !AuroraAPI.isCloudConnected();
            setIsLiveConnection(!isFallback);
            
            // Check if Key exists (Auth status)
            const hasKey = AuroraAPI.isGeePersistent();
            setGeeKeyPresent(hasKey);
        };
        checkLive();

        if (campaign) {
            setMissionConfig(prev => ({
                ...prev,
                coordinates: campaign.targetCoordinates,
                radius: campaign.radius,
                name: '' 
            }));
            // Only auto-switch mode if we aren't currently running a hive mind scan
            if (!hiveMindState.isScanning) {
                setScanMode(campaign.radius < 1 ? 'Pinpoint' : 'Regional');
            }
        }
    }, [campaign, hiveMindState.isScanning]);

    const addLog = useCallback((msg: string) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' });
        setTelemetryLogs(prev => [...prev, `[${time}] ${msg}`]);
    }, []);

    // Standard Scan Progress Driver (Optimized: 100ms ticks, 2% increments)
    useEffect(() => {
        // Only run for active, standard campaigns (not HiveMind, not completed, AND autoPlay is true)
        if (campaign.status === 'Active' && !hiveMindState.isScanning && campaign.autoPlay) {
            const timer = setTimeout(() => {
                if (campaign.phaseProgress >= 100) {
                    // Phase complete, advance
                    onAdvancePhase();
                } else {
                    // Increment progress
                    onUpdateCampaign({
                        ...campaign,
                        phaseProgress: Math.min(100, campaign.phaseProgress + 2) // +2% for speed
                    });
                }
            }, 100); // Slower tick rate to prevent UI lockup
            return () => clearTimeout(timer);
        }
    }, [campaign, hiveMindState.isScanning, onUpdateCampaign, onAdvancePhase]);

    // Standard Telemetry Logging - Separate effect to avoid blocking the driver
    useEffect(() => {
        if (campaign.status !== 'Active' || hiveMindState.isScanning) return;

        // Trigger logs based on progress thresholds
        const prog = campaign.phaseProgress;
        const currentPhaseName = campaign.currentPhase ? campaign.currentPhase.toUpperCase() : 'INIT';
        
        if (prog === 2) {
            setTelemetryLogs([]);
            addLog(`[${currentPhaseName}] Initiating Sequence...`);
            if (isLiveConnection) addLog(`[NETWORK] GEE Handshake Established. Streaming Sentinel-2.`);
            else if (geeKeyPresent) addLog(`[NETWORK] Authenticated Key Found. Attempting Backend Handshake...`);
            else addLog(`[NETWORK] Backend Unreachable. Engaging Physics Engine.`);
        }
        if (prog === 20) addLog(`[${currentPhaseName}] Sensor Array Locked. Acquiring Signal...`);
        if (prog === 50) addLog(`[${currentPhaseName}] Ingesting Spectro-Radiometric Data...`);
        if (prog === 80) addLog(`[${currentPhaseName}] Processing Physics Inversion Layers...`);
        
        // --- NEW: INJECT DISCOVERY RESULT LOGS AT END OF PHASE ---
        if (prog === 98) {
            addLog(`[${currentPhaseName}] Phase Complete. Finalizing Results.`);
            if (campaign.results && campaign.results.length > 0) {
                campaign.results.forEach(res => {
                    const prob = (res.probability * 100).toFixed(1);
                    const status = res.probability >= 0.70 ? "CONFIRMED" : "POSSIBLE";
                    addLog(`[ANALYSIS] Target Locked: ${res.element} (${status} - ${prob}% Conf.)`);
                });
            }
        }

    }, [campaign.phaseProgress, campaign.status, campaign.currentPhase, campaign.results, hiveMindState.isScanning, addLog, isLiveConnection, geeKeyPresent]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [telemetryLogs]);

    const parseCoords = (str: string): [number, number] | null => {
        try {
            const nums = str.match(/-?\d+(\.\d+)?/g);
            if (nums && nums.length >= 2) {
                let lat = parseFloat(nums[0]);
                if (str.includes('S')) lat = -lat;
                let lon = parseFloat(nums[1]);
                if (str.includes('W')) lon = -lon;
                return [lat, lon];
            }
        } catch(e) {}
        return null;
    };

    const handleCoordinateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const text = await file.text();
            try {
                if (text.includes('{')) {
                    const json = JSON.parse(text);
                    if (json.coordinates) setMissionConfig({ ...missionConfig, coordinates: json.coordinates });
                } else {
                    const coords = text.trim();
                    if (coords.match(/-?\d+(\.\d+)?/)) setMissionConfig({ ...missionConfig, coordinates: coords });
                }
            } catch (err) {
                console.error("Failed to parse coordinates file");
            }
        }
    };

    const toggleResource = (category: string) => {
        setMissionConfig(prev => {
            const exists = prev.selectedResources.includes(category);
            return {
                ...prev,
                selectedResources: exists 
                    ? prev.selectedResources.filter(r => r !== category)
                    : [...prev.selectedResources, category]
            };
        });
    };

    const toggleAgent = (type: MineralAgentType) => {
        setHiveMindState(prev => ({
            ...prev,
            activeAgents: prev.activeAgents.includes(type) 
                ? prev.activeAgents.filter(t => t !== type) 
                : [...prev.activeAgents, type]
        }));
    };

    const handleAbortHive = () => {
        setHiveMindState(prev => ({
            ...prev,
            isScanning: false,
            logs: [...prev.logs, "!!! EMERGENCY STOP TRIGGERED !!!", "Swarm Protocol Terminated."]
        }));
    };

    const handleStopMission = () => {
        onUpdateCampaign({
            ...campaign,
            status: 'Paused',
            autoPlay: false
        });
        addLog("Mission Paused by User.");
    };

    const handleResumeMission = () => {
        onUpdateCampaign({
            ...campaign,
            status: 'Active',
            autoPlay: true
        });
        addLog("Mission Resumed.");
    };

    const handleLaunch = async () => {
        setIsLaunching(true);
        try {
            let finalCoordinates = missionConfig.coordinates;
            let finalRegionName = "Unknown Region";

            // 1. Check if input is text name or coords
            const parsed = parseCoords(missionConfig.coordinates);
            if (!parsed) {
                // It's a name, try geocoding locally first
                const geo = await AuroraAPI.geocode(missionConfig.coordinates);
                if (geo) {
                    finalCoordinates = `${geo.lat}, ${geo.lon}`;
                    finalRegionName = geo.name;
                    addLog(`Geocoded '${missionConfig.coordinates}' -> ${finalCoordinates}`);
                } else {
                    alert("Could not resolve location name. Please enter coordinates.");
                    setIsLaunching(false);
                    return;
                }
            } else {
                const context = AuroraAPI.getGeologicContext(parsed[0], parsed[1]);
                finalRegionName = context.name;
            }

            const finalRadius = scanMode === 'Pinpoint' ? 0 : missionConfig.radius;

            if (scanMode === 'HiveMind') {
                // Setup Grid for Visualization in Persistence State
                const grid: ScanSector[] = [];
                let id = 0;
                for(let y=0; y<10; y++) {
                    for(let x=0; x<10; x++) {
                        grid.push({ id: id++, x, y, status: 'pending', opacity: 0 });
                    }
                }
                // Update Global State
                setHiveMindState(prev => ({
                    ...prev,
                    isScanning: true,
                    scanGrid: grid,
                    logs: ["HIVE MIND ACTIVATED.", `Deploying ${prev.activeAgents.length} Agents to ${finalRegionName}...`]
                }));
                
                // Update Campaign Metadata without triggering legacy logic
                const newCampaign: ExplorationCampaign = {
                    ...campaign,
                    id: `CMP-${Date.now()}`,
                    name: missionConfig.name || `HiveMind Swarm: ${finalRegionName}`,
                    regionName: finalRegionName,
                    targetCoordinates: finalCoordinates,
                    radius: finalRadius,
                    status: 'Active'
                };
                onLaunchCampaign(newCampaign); // Just to save record
                setShowMissionPlanner(false);
                return; 
            }

            // Standard Campaign Launch
            const initialResults: TargetResult[] = missionConfig.selectedResources.map(r => {
                const catalogItem = RESOURCE_CATALOG.find(c => c.category === r);
                return {
                    element: catalogItem ? catalogItem.default : 'Unknown',
                    resourceType: r,
                    status: 'Pending',
                    probability: 0,
                    specifications: {}
                };
            });

            const newCampaign: ExplorationCampaign = {
                ...campaign,
                id: `CMP-${Date.now()}`,
                name: missionConfig.name || `${scanMode} Scan: ${finalRegionName}`,
                regionName: finalRegionName,
                targetCoordinates: finalCoordinates,
                radius: finalRadius,
                resourceType: missionConfig.selectedResources.join(', ') || 'Multi-Objective',
                targetElement: initialResults.map(r => r.element).join(', '),
                targets: missionConfig.selectedResources.map(r => ({ resourceType: r, targetElement: 'Unknown' })),
                results: initialResults,
                drillTargets: [],
                startDate: new Date().toISOString(),
                status: 'Active',
                phaseIndex: 0,
                currentPhase: CAMPAIGN_PHASES[0],
                phaseProgress: 0,
                accuracyScore: 0.1,
                autoPlay: true 
            };
            onLaunchCampaign(newCampaign);
            setShowMissionPlanner(false);
            setTelemetryLogs([]); 
        } catch (error) {
            console.error("Launch Error:", error);
            alert("An error occurred during launch. Please check console.");
        } finally {
            setIsLaunching(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={80} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-mono uppercase mb-1">Campaign Status</p>
                        <h3 className="text-xl font-bold text-white flex items-center">
                            {hiveMindState.isScanning ? 'HIVE SCANNING' : campaign.status.toUpperCase()}
                            {(campaign.status === 'Active' || hiveMindState.isScanning) && <span className="ml-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                        </h3>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Progress</span>
                            <span className="text-white">{hiveMindState.isScanning ? Math.floor((hiveMindState.scanGrid.filter(s=>s.status!=='pending').length / Math.max(1, hiveMindState.scanGrid.length))*100) : campaign.phaseProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${hiveMindState.isScanning ? (hiveMindState.scanGrid.filter(s=>s.status!=='pending').length / Math.max(1, hiveMindState.scanGrid.length))*100 : campaign.phaseProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-mono uppercase mb-1">Target Accuracy</p>
                        <h3 className="text-3xl font-bold text-aurora-400">{(campaign.accuracyScore * 100).toFixed(1)}<span className="text-sm text-slate-500">%</span></h3>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Probability of Commercial Discovery</p>
                </div>

                <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-mono uppercase mb-1">Data Source</p>
                        <div className="flex items-center space-x-2 mt-1">
                            {isLiveConnection ? <Wifi size={18} className="text-emerald-400"/> : <Lock size={18} className="text-amber-400"/>}
                            <h3 className={`text-lg font-bold ${isLiveConnection ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isLiveConnection ? 'SATELLITE (LIVE)' : geeKeyPresent ? 'SIMULATION (AUTH OK)' : 'PHYSICS ENGINE'}
                            </h3>
                        </div>
                    </div>
                    
                    {/* ENHANCED STATUS INDICATOR */}
                    <div className="flex flex-col space-y-1 mt-2">
                        {isLiveConnection ? (
                            <div className="flex items-center space-x-2 text-xs text-emerald-400">
                                <Database size={12} /> <span>GEE Stream Active (Sentinel-2)</span>
                            </div>
                        ) : geeKeyPresent ? (
                            <div className="flex items-center space-x-2 text-xs text-amber-400">
                                <ShieldCheck size={12} /> <span>Key Loaded • Backend Unreachable</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                                <AlertTriangle size={12} /> <span>Simulated Latent Space (Offline)</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col justify-center items-center text-center hover:bg-aurora-900/80 transition-colors cursor-pointer border-dashed" onClick={() => setShowMissionPlanner(true)}>
                    <div className="w-12 h-12 rounded-full bg-aurora-600 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                        <Plus size={24} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white">New Mission</h3>
                    <p className="text-xs text-slate-400">Configure Parameters</p>
                </div>
            </div>

            {/* Main Viz Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-aurora-950 border border-aurora-800 rounded-xl p-1 relative h-[500px] group">
                        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-emerald-400 border border-emerald-500/30 flex items-center">
                            <Radar size={14} className="mr-2 animate-spin-slow" />
                            {hiveMindState.isScanning ? 'HIVE GRID ACTIVE' : `LIVE FEED: ${campaign.targetCoordinates}`}
                        </div>
                        {/* Maximize Button */}
                        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onNavigate('map')} className="bg-black/60 backdrop-blur text-white p-2 rounded hover:bg-black/80 border border-white/20">
                                <Maximize size={16} />
                            </button>
                        </div>
                        {/* Memoized Map to prevent re-renders stalling the UI */}
                        <MapVisualization 
                            anomalies={anomalies}
                            selectedAnomaly={selectedAnomly}
                            onSelectAnomaly={setSelectedAnomaly}
                            scanRadius={campaign.radius}
                            centerCoordinates={campaign.targetCoordinates}
                            isGEEActive={isLiveConnection}
                            reportTargets={campaign.drillTargets ? campaign.drillTargets.map(t => ({id: t.id, lat: t.lat, lon: t.lon, label: t.description, type: 'Target', depth: t.depth, priority: t.priority})) : []}
                            scanGrid={hiveMindState.isScanning ? hiveMindState.scanGrid : []}
                            showHistory={true}
                            className="w-full h-full"
                        />
                    </div>

                    {/* Mission Control Panel / Config Form */}
                    {showMissionPlanner && (
                        <div className="bg-aurora-900/80 border border-aurora-500 rounded-xl p-6 animate-fadeIn shadow-2xl">
                            <div className="flex justify-between items-center mb-6 border-b border-aurora-500/30 pb-4">
                                <h3 className="text-lg font-bold text-white flex items-center"><Target className="mr-2 text-aurora-500" /> Mission Configuration</h3>
                                <button onClick={() => setShowMissionPlanner(false)} className="text-slate-400 hover:text-white">Cancel</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* SCAN TOPOLOGY SELECTION */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Operational Mode</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button 
                                            onClick={() => { setScanMode('Pinpoint'); setMissionConfig(prev => ({ ...prev, radius: 0 })); }}
                                            className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${scanMode === 'Pinpoint' ? 'bg-aurora-500/20 border-aurora-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                        >
                                            <Crosshair size={24} className={`mb-2 ${scanMode === 'Pinpoint' ? 'text-aurora-400' : 'text-slate-500'}`} />
                                            <span className="text-sm font-bold">Pinpoint Target</span>
                                            <span className="text-[10px] opacity-60 mt-1">Single Site (0km)</span>
                                        </button>
                                        <button 
                                            onClick={() => { setScanMode('Regional'); setMissionConfig(prev => ({ ...prev, radius: 50 })); }}
                                            className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${scanMode === 'Regional' ? 'bg-aurora-500/20 border-aurora-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                        >
                                            <Radar size={24} className={`mb-2 ${scanMode === 'Regional' ? 'text-aurora-400' : 'text-slate-500'}`} />
                                            <span className="text-sm font-bold">Regional Survey</span>
                                            <span className="text-[10px] opacity-60 mt-1">Area Recon (10-50km)</span>
                                        </button>
                                        <button 
                                            onClick={() => { setScanMode('HiveMind'); setMissionConfig(prev => ({ ...prev, radius: 100 })); }}
                                            className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${scanMode === 'HiveMind' ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                        >
                                            <LayoutGrid size={24} className={`mb-2 ${scanMode === 'HiveMind' ? 'text-emerald-400' : 'text-slate-500'}`} />
                                            <span className="text-sm font-bold">Autonomous Grid</span>
                                            <span className="text-[10px] opacity-60 mt-1">Multi-Agent Swarm (100km+)</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Coordinates or Region Name</label>
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            type="text" 
                                            value={missionConfig.coordinates}
                                            onChange={(e) => setMissionConfig({...missionConfig, coordinates: e.target.value})}
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-aurora-500 outline-none font-mono"
                                            placeholder="Lat, Lon OR Name (e.g. 'Permian Basin', '-8.12, 33.45')"
                                        />
                                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-lg flex items-center justify-center border border-slate-600 transition-colors" title="Upload CSV/TXT">
                                            <Upload size={16} className="mr-2" />
                                            <span className="text-xs font-bold">Import</span>
                                            <input type="file" className="hidden" accept=".csv,.txt,.json" onChange={handleCoordinateUpload} />
                                        </label>
                                    </div>
                                    {/* Presets */}
                                    <div className="flex space-x-2 overflow-x-auto pb-1">
                                        {PRESET_REGIONS.map(r => (
                                            <button 
                                                key={r.name}
                                                onClick={() => setMissionConfig({ ...missionConfig, coordinates: r.coords })}
                                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-400 hover:text-white hover:border-aurora-500 whitespace-nowrap"
                                            >
                                                {r.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {scanMode === 'HiveMind' ? (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deploy Specialist Agents</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'Au', label: 'Aurum Hunter', desc: 'Gold & Precious', icon: '🟡' },
                                                { id: 'Li', label: 'Brine Seeker', desc: 'Lithium & Salts', icon: '🟣' },
                                                { id: 'Cx', label: 'Carbon Scout', desc: 'Oil & Gas', icon: '⚫' }
                                            ].map(agent => (
                                                <button
                                                    key={agent.id}
                                                    onClick={() => toggleAgent(agent.id as MineralAgentType)}
                                                    className={`p-3 rounded-lg border text-left transition-all ${hiveMindState.activeAgents.includes(agent.id as MineralAgentType) ? 'bg-emerald-900/40 border-emerald-500' : 'bg-slate-900 border-slate-700 opacity-60'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm font-bold text-white">{agent.label}</span>
                                                        <span>{agent.icon}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">{agent.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Resources</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-lg p-2">
                                            {RESOURCE_CATALOG.map((resource) => (
                                                <button
                                                    key={resource.category}
                                                    onClick={() => toggleResource(resource.category)}
                                                    className={`p-2 rounded text-left border flex flex-col justify-center transition-all ${
                                                        missionConfig.selectedResources.includes(resource.category)
                                                            ? 'bg-aurora-900/80 border-aurora-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold">{resource.category}</span>
                                                        {missionConfig.selectedResources.includes(resource.category) && <div className="w-1.5 h-1.5 rounded-full bg-aurora-400 shadow-[0_0_5px_cyan]"></div>}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={handleLaunch} 
                                    disabled={isLaunching}
                                    className={`bg-aurora-600 hover:bg-aurora-500 text-white px-6 py-3 rounded-lg font-bold flex items-center shadow-lg transition-transform hover:scale-105 ${isLaunching ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isLaunching ? <Loader2 size={18} className="mr-2 animate-spin" /> : scanMode === 'HiveMind' ? <Bot size={18} className="mr-2" /> : <Zap size={18} className="mr-2" />} 
                                    {isLaunching ? 'Initializing...' : scanMode === 'HiveMind' ? 'Deploy Swarm' : 'Launch Mission'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Phase Tracker / Hive Status */}
                    <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6">
                        <h3 className="font-bold text-white mb-4 flex items-center"><Activity size={18} className="mr-2 text-aurora-500"/> {hiveMindState.isScanning ? 'Swarm Ops Center' : 'Workflow Phase'}</h3>
                        
                        {hiveMindState.isScanning ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-emerald-400 font-bold animate-pulse text-xs">
                                        <Cpu size={14} className="mr-2" /> SWARM ACTIVE
                                    </div>
                                    <button 
                                        onClick={handleAbortHive}
                                        className="bg-red-900/80 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded border border-red-500/50 flex items-center transition-colors shadow-[0_0_10px_rgba(220,38,38,0.3)]"
                                    >
                                        <StopCircle size={12} className="mr-1" /> ABORT MISSION
                                    </button>
                                </div>

                                {/* Active Agents List */}
                                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-800 pb-1 mb-1">Real-Time Actions</p>
                                    {hiveMindState.activeAgents.map(agent => (
                                        <div key={agent} className="flex justify-between items-center text-xs">
                                            <span className="text-slate-300 font-mono flex items-center"><Bot size={12} className="mr-2 text-aurora-400"/> Agent-{agent}</span>
                                            <span className="text-emerald-400 font-mono animate-pulse">ANALYZING...</span>
                                        </div>
                                    ))}
                                    {hiveMindState.activeAgents.length === 0 && <span className="text-xs text-red-400">No agents active.</span>}
                                </div>

                                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                                        <span>Sector Scan Progress</span>
                                        <span className="text-white">{hiveMindState.scanGrid.filter(s => s.status !== 'pending').length} / {hiveMindState.scanGrid.length}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(hiveMindState.scanGrid.filter(s => s.status !== 'pending').length / Math.max(1, hiveMindState.scanGrid.length)) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                        <div className="text-slate-500">Hits</div>
                                        <div className="text-emerald-400 font-bold text-lg">{hiveMindState.hits}</div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                        <div className="text-slate-500">Misses</div>
                                        <div className="text-slate-400 font-bold text-lg">{hiveMindState.misses}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {CAMPAIGN_PHASES.map((phase, idx) => {
                                    const isActive = idx === campaign.phaseIndex;
                                    const isCompleted = idx < campaign.phaseIndex;
                                    return (
                                        <div key={idx} className={`flex items-center space-x-3 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-60' : 'opacity-30'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                                                isActive ? 'bg-aurora-500 text-black border-aurora-400 shadow-[0_0_10px_cyan]' :
                                                isCompleted ? 'bg-emerald-500 text-black border-emerald-400' :
                                                'bg-slate-800 text-slate-500 border-slate-700'
                                            }`}>
                                                {isCompleted ? <CheckCircle size={12} /> : idx + 1}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{phase}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Controls */}
                                {campaign.status === 'Active' ? (
                                    <div className="space-y-3 mt-4">
                                        {campaign.autoPlay && (
                                            <div className="w-full bg-aurora-900/50 text-aurora-400 text-xs font-bold py-3 rounded border border-aurora-500/30 flex items-center justify-center animate-pulse">
                                                <Loader2 size={14} className="mr-2 animate-spin" />
                                                AUTONOMOUS SEQUENCE ACTIVE
                                            </div>
                                        )}
                                        <button 
                                            onClick={handleStopMission}
                                            className="w-full bg-red-900/80 hover:bg-red-700 text-white text-xs font-bold py-3 rounded border border-red-500/50 flex items-center justify-center transition-colors shadow-lg"
                                        >
                                            <StopCircle size={14} className="mr-2" /> STOP MISSION
                                        </button>
                                    </div>
                                ) : campaign.status === 'Paused' ? (
                                    <button 
                                        onClick={handleResumeMission}
                                        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded border border-emerald-500/50 flex items-center justify-center transition-colors shadow-lg"
                                    >
                                        <Play size={14} className="mr-2" /> RESUME MISSION
                                    </button>
                                ) : campaign.status === 'Completed' ? (
                                    <button 
                                        onClick={() => onNavigate('ietl')}
                                        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded border border-emerald-500 shadow-lg flex items-center justify-center transition-colors animate-fadeIn"
                                    >
                                        <FileText size={16} className="mr-2" /> Mission Complete - View Report
                                    </button>
                                ) : (
                                    <button 
                                        onClick={onAdvancePhase}
                                        className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded border border-slate-600 flex items-center justify-center transition-colors"
                                    >
                                        Complete Phase <ChevronRight size={14} className="ml-1" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Live Telemetry Console */}
                    <div className="bg-aurora-950 border border-aurora-800 rounded-xl p-4 flex-1 flex flex-col h-[300px] font-mono text-xs shadow-inner overflow-hidden">
                        <h3 className="font-bold text-slate-400 mb-2 flex items-center justify-between border-b border-aurora-800 pb-2">
                            <span className="flex items-center"><Terminal size={14} className="mr-2 text-emerald-500" /> {hiveMindState.isScanning ? 'AGENT SWARM LOGS' : 'AURORA KERNEL TELEMETRY'}</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 p-1">
                            {telemetryLogs.map((log, i) => (
                                <div key={i} className="text-emerald-400/90 break-words leading-tight">
                                    <span className="text-slate-600 mr-2">{log.substring(0, 11)}</span>
                                    {log.substring(11)}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;