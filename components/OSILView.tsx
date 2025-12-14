
import React, { useState, useEffect } from 'react';
import { INGESTION_STREAMS } from '../constants';
import { SystemStatus, ExplorationCampaign, TaskingRequest } from '../types';
import { AuroraAPI } from '../api';
import { Server, Activity, Database, Wifi, AlertTriangle, CheckCircle, DownloadCloud, Globe, Satellite, Waves, Mountain, Clock, Calendar, Cloud, ArrowRight, Eye, Radar, Loader2, Lock } from 'lucide-react';

interface OSILViewProps {
  campaign: ExplorationCampaign;
}

const OSILView: React.FC<OSILViewProps> = ({ campaign }) => {
  const [domain, setDomain] = useState<'Land' | 'Marine'>(campaign.environment || 'Land');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskingStatus, setTaskingStatus] = useState<string | null>(null);
  const [geeActive, setGeeActive] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'Connecting' | 'Connected' | 'Unreachable'>('Connecting');

  // STRICT FILTERING: Match streams to Campaign Environment AND Sensor Needs
  const sortedStreams = INGESTION_STREAMS.map(s => {
      // 1. Filter by Domain (Land vs Marine)
      const matchesDomain = !s.domain || s.domain === campaign.environment;
      
      // 2. Identify if this sensor is critical for the active Resource Type
      const isCritical = (campaign.resourceType.includes('Hydrocarbon') && s.type.includes('SAR')) || 
                         (campaign.resourceType.includes('Mineral') && s.type.includes('Gravimetry'));

      const isTasked = matchesDomain && (isCritical || s.status === SystemStatus.ONLINE);

      return { 
          ...s, 
          is_tasked: isTasked,
          active_region: isTasked ? (campaign.regionName || campaign.name) : null,
          throughput: isTasked ? s.throughput + (Math.random() * 0.5) : 0 // Zero throughput for non-tasked streams
      };
  }).sort((a, b) => (a.is_tasked === b.is_tasked) ? 0 : a.is_tasked ? -1 : 1);

  useEffect(() => {
      const checkLiveStatus = async () => {
          const connectivity = await AuroraAPI.checkConnectivity();
          if (connectivity.status === SystemStatus.ONLINE && connectivity.mode === 'Cloud') {
              setBackendStatus('Connected');
              setGeeActive(true);
          } else {
              setBackendStatus('Unreachable');
              setGeeActive(false);
          }
      };
      
      checkLiveStatus();
      setDomain(campaign.environment || 'Land');
      
      const fetchSchedule = async () => {
          setIsLoading(true);
          let lat = 0, lon = 0;
          try {
            const nums = campaign.targetCoordinates.match(/-?\d+(\.\d+)?/g);
            if (nums && nums.length >= 2) {
                 lat = parseFloat(nums[0]);
                 if (campaign.targetCoordinates.includes('S')) lat = -lat;
                 lon = parseFloat(nums[1]);
                 if (campaign.targetCoordinates.includes('W')) lon = -lon;
             }
          } catch (e) {}

          const data = await AuroraAPI.getSatelliteSchedule(lat, lon);
          if (data && data.schedule) {
              setSchedule(data.schedule);
          }
          setIsLoading(false);
      };
      fetchSchedule();
  }, [campaign]);

  const handleRequestTasking = async (satName: string) => {
      setTaskingStatus(`Requesting ${satName}...`);
      const request: TaskingRequest = {
         id: `TSK-${Math.floor(Math.random() * 9000) + 1000}`,
         targetCoordinates: campaign.targetCoordinates,
         sensorType: satName.includes('Sentinel-1') ? 'SAR (C-Band)' : 'Multispectral',
         priority: 'Urgent',
         status: 'Pending',
         requestor: 'Mission Control',
         submittedAt: 'Just now'
      };
      await AuroraAPI.submitTask(request);
      setTimeout(() => {
          setTaskingStatus(null);
          setSchedule(prev => prev.map(s => s.satellite === satName ? { ...s, tasking_status: 'Scheduled' } : s));
      }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center justify-between">
          <div><p className="text-slate-400 text-xs font-mono mb-1">AGGREGATE THROUGHPUT</p><h3 className="text-3xl font-bold text-white">2.4 <span className="text-lg text-slate-500 font-normal">GB/s</span></h3></div>
          <div className="p-3 bg-aurora-500/10 rounded-full border border-aurora-500/20"><Activity className="text-aurora-500" size={24} /></div>
        </div>
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center justify-between">
          <div><p className="text-slate-400 text-xs font-mono mb-1">TASKED SENSORS</p><h3 className="text-3xl font-bold text-white">{sortedStreams.filter(s => s.is_tasked).length} <span className="text-lg text-slate-500 font-normal">/ {INGESTION_STREAMS.length}</span></h3></div>
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20"><Wifi className="text-emerald-500" size={24} /></div>
        </div>
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center justify-between">
          <div><p className="text-slate-400 text-xs font-mono mb-1">DATA LAKE STORAGE</p><h3 className="text-3xl font-bold text-white">14.2 <span className="text-lg text-slate-500 font-normal">PB</span></h3></div>
          <div className="p-3 bg-aurora-accent/10 rounded-full border border-aurora-accent/20"><Database className="text-aurora-accent" size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipelines */}
        <div className="bg-aurora-950 border border-aurora-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-aurora-800 flex justify-between items-center bg-aurora-900/30">
            <div className="flex items-center space-x-2"><Server className="text-slate-400" size={18} /><h2 className="font-semibold text-slate-200">Ingestion Pipelines</h2></div>
            <div className={`px-3 py-1 rounded-lg flex border border-aurora-800 items-center space-x-2 ${geeActive ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-slate-900'}`}>
                {geeActive ? <Wifi size={12} className="text-emerald-400 animate-pulse" /> : <Lock size={12} className="text-slate-500" />}
                <span className={`text-xs font-mono uppercase ${geeActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {geeActive ? 'LIVE TELEMETRY (GEE)' : `${domain} DOMAIN LOCK (SIM)`}
                </span>
            </div>
          </div>

          <div className="divide-y divide-aurora-800/50">
            {sortedStreams.map((stream) => (
              <div key={stream.id} className={`p-6 transition-colors ${stream.is_tasked ? 'bg-aurora-900/10 hover:bg-white/5' : 'bg-slate-950 opacity-40 grayscale'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 mb-2 md:mb-0">
                    <div className={`w-2 h-2 rounded-full ${stream.status === SystemStatus.ONLINE ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                    <div><h3 className="text-white font-medium">{stream.source}</h3><p className="text-xs text-slate-500 font-mono">{stream.type} | ID: {stream.id}</p></div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <div className="flex items-center space-x-6 text-sm font-mono">
                        <span className="flex items-center text-slate-400"><DownloadCloud size={14} className="mr-2" />{stream.throughput.toFixed(1)} MB/s</span>
                        <span className={`px-2 py-1 rounded text-xs border ${stream.is_tasked ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-slate-700 text-slate-500 bg-slate-900'}`}>
                        {stream.is_tasked ? 'ACTIVE TASKING' : 'STANDBY'}
                        </span>
                    </div>
                    {stream.is_tasked && (
                        <div className="mt-1 text-[10px] text-aurora-400 font-mono flex items-center">
                            <Activity size={10} className="mr-1 animate-pulse" /> TARGET: {campaign.regionName?.toUpperCase()}
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-aurora-950 border border-aurora-800 rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h2 className="font-semibold text-slate-200 flex items-center"><Globe className="mr-2 text-slate-400" size={18} /> Mission Schedule</h2>
               <div className="flex items-center space-x-2">
                   {backendStatus === 'Connected' ? (
                       <span className="text-[10px] bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700">BACKEND CONNECTED</span>
                   ) : (
                       <span className="text-[10px] bg-amber-900 text-amber-400 px-2 py-0.5 rounded border border-amber-700">USING LOCAL PHYSICS</span>
                   )}
                   <Clock size={14} className="text-slate-500 ml-2" /><span className="text-xs font-mono text-slate-400">{new Date().toISOString().split('T')[0]}</span>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? <div className="flex flex-col items-center justify-center h-48 text-slate-500"><Loader2 size={32} className="animate-spin mb-2" /><span className="text-xs">Orbital calculation...</span></div> : (
                    <div className="space-y-4">
                        {schedule.map((pass, idx) => (
                            <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 relative overflow-hidden group">
                                {pass.tasking_status === 'Scheduled' && <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-bl font-bold">TASKED</div>}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${pass.sensor_type.includes('SAR') ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{pass.sensor_type.includes('SAR') ? <Radar size={18} /> : <Eye size={18} />}</div>
                                        <div><h4 className="text-sm font-bold text-white">{pass.satellite}</h4><p className="text-[10px] text-slate-500 font-mono">{pass.sensor_type}</p></div>
                                    </div>
                                    <div className="text-right"><p className="text-lg font-bold text-white">{pass.time_to_acquisition}</p><p className="text-[10px] text-slate-500">ETA</p></div>
                                </div>
                                <button onClick={() => handleRequestTasking(pass.satellite)} disabled={!!taskingStatus || pass.tasking_status === 'Scheduled'} className={`w-full py-2 rounded text-xs font-bold transition-colors flex items-center justify-center ${pass.tasking_status === 'Scheduled' ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-500/30 cursor-default' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'}`}>
                                    {taskingStatus?.includes(pass.satellite) ? <Loader2 size={12} className="animate-spin mr-2" /> : null}
                                    {pass.tasking_status === 'Scheduled' ? 'ACQUISITION LOCKED' : 'REQUEST URGENT TASKING'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OSILView;
