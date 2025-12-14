
import React, { useState, useEffect } from 'react';
import MapVisualization from './MapVisualization';
import { ExplorationCampaign, DiscoveryRecord } from '../types';
import { AuroraAPI } from '../api';
import { Database, Map, Search, Sliders, ChevronRight } from 'lucide-react';

interface PlanetaryMapViewProps {
    campaign: ExplorationCampaign;
}

const PlanetaryMapView: React.FC<PlanetaryMapViewProps> = ({ campaign }) => {
    const [discoveries, setDiscoveries] = useState<DiscoveryRecord[]>([]);
    const [filter, setFilter] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<DiscoveryRecord | null>(null);

    useEffect(() => {
        const loadDiscoveries = async () => {
            const data = await AuroraAPI.getGlobalDiscoveries();
            setDiscoveries(data);
        };
        loadDiscoveries();
        const interval = setInterval(loadDiscoveries, 5000); // Live poll
        return () => clearInterval(interval);
    }, []);

    const filteredDiscoveries = discoveries.filter(d => 
        d.resourceType.toLowerCase().includes(filter.toLowerCase()) || 
        d.regionName.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="flex h-full gap-4">
            {/* Main Map Area */}
            <div className="flex-1 bg-aurora-950 border border-aurora-800 rounded-xl overflow-hidden relative shadow-2xl flex flex-col">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/90 backdrop-blur border border-aurora-500/50 px-4 py-2 rounded-full text-white font-bold shadow-lg flex items-center">
                    <Map size={16} className="mr-2 text-emerald-400" />
                    PLANETARY SURVEILLANCE LAYER
                </div>
                <MapVisualization 
                    anomalies={[]} 
                    onSelectAnomaly={() => {}} 
                    selectedAnomaly={null} 
                    className="w-full h-full"
                    showHistory={true}
                    historyData={filteredDiscoveries} // Explicitly pass filtered data
                    autoFit={true} // Auto-zoom to show all results
                    scanRadius={500} 
                    centerCoordinates={campaign.targetCoordinates} 
                />
            </div>

            {/* Black Box / Data Enclave Side Panel */}
            <div className="w-96 bg-aurora-900/50 border border-aurora-800 rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-aurora-800 bg-aurora-950/50">
                    <h3 className="font-bold text-white flex items-center mb-1">
                        <Database size={18} className="mr-2 text-aurora-400" />
                        Sovereign Data Enclave
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        {filteredDiscoveries.length} RECORDS SECURED
                    </p>
                </div>

                <div className="p-4 border-b border-aurora-800 bg-slate-900/30">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Filter by Resource or Region..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-aurora-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {filteredDiscoveries.length === 0 && (
                        <div className="text-center p-8 text-slate-500 text-xs">
                            No discoveries recorded yet.<br/>
                            Deploy Agent Swarm in Dashboard.
                        </div>
                    )}
                    {filteredDiscoveries.map((record) => (
                        <div 
                            key={record.id} 
                            onClick={() => setSelectedRecord(record)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer group hover:bg-slate-800 ${selectedRecord?.id === record.id ? 'bg-aurora-900/50 border-aurora-500' : 'bg-slate-950 border-slate-800'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold ${record.resourceType.includes('Gold') ? 'text-yellow-400' : record.resourceType.includes('Lithium') ? 'text-purple-400' : 'text-white'}`}>
                                    {record.resourceType}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">{new Date(record.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{record.regionName}</span>
                                <span className="font-mono text-emerald-400">Grade: {record.grade.toFixed(2)}</span>
                            </div>
                            {selectedRecord?.id === record.id && (
                                <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] font-mono text-slate-300 grid grid-cols-2 gap-1 animate-fadeIn">
                                    <div>Depth: {record.depth.toFixed(0)}m</div>
                                    <div>Vol: {record.volume.toFixed(0)} units</div>
                                    <div className="col-span-2 text-slate-500 truncate">{record.id}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlanetaryMapView;
