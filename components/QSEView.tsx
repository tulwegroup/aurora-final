
import React, { useState, useEffect } from 'react';
import { Cpu, Zap, GitCommit, CheckCircle, Clock, Grid, Play, X, Activity, Server, ArrowRight, TrendingDown, HelpCircle, Info, Lightbulb, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { QUANTUM_JOBS, MOCK_QUBITS } from '../constants';
import { Qubit, QuantumJob, ExplorationCampaign } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { AuroraAPI } from '../api';

interface QSEViewProps {
  campaign: ExplorationCampaign;
}

const QSEView: React.FC<QSEViewProps> = ({ campaign }) => {
  const [qubits, setQubits] = useState<Qubit[]>(MOCK_QUBITS);
  const [jobs, setJobs] = useState<QuantumJob[]>([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [hoveredQubit, setHoveredQubit] = useState<Qubit | null>(null);
  const [showExplainers, setShowExplainers] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [energyHistory, setEnergyHistory] = useState<{step: number, energy: number}[]>([]);
  const [jobResult, setJobResult] = useState<any>(null);

  const [newJob, setNewJob] = useState({
    region: campaign.regionName || campaign.name,
    algorithm: 'VQE (Variational Quantum Eigensolver)',
    qubits: 64
  });

  useEffect(() => {
     setNewJob(prev => ({ ...prev, region: campaign.regionName || campaign.name }));
     
     const campaignJobId = `QJ-${campaign.id.split('-').pop()}`;
     const campaignRegion = campaign.regionName || campaign.name;
     
     const existingCampaignJob = QUANTUM_JOBS.find(j => j.targetRegion === campaignRegion);
     
     let relevantJobs: QuantumJob[] = [];
     if (existingCampaignJob) {
         relevantJobs = [existingCampaignJob];
     } else {
         const autoJob: QuantumJob = {
             id: campaignJobId,
             targetRegion: campaignRegion,
             qubitsUsed: 48,
             status: 'Queued',
             progress: 0
         };
         relevantJobs = [autoJob];
     }
     
     const historicalJobs = QUANTUM_JOBS.filter(j => j.targetRegion !== campaignRegion);
     setJobs([...relevantJobs, ...historicalJobs]); 

  }, [campaign]);

  const activeRegionName = campaign.regionName || campaign.name;
  const currentMissionJobs = jobs.filter(j => j.targetRegion === activeRegionName);
  const historicalJobs = jobs.filter(j => j.targetRegion !== activeRegionName);

  const animateTrace = (fullTrace: any[]) => {
      setIsOptimizing(true);
      setEnergyHistory([]);
      let step = 0;
      const interval = setInterval(() => {
          if (step >= fullTrace.length) {
              clearInterval(interval);
              setIsOptimizing(false);
              return;
          }
          setEnergyHistory(prev => {
              const newData = [...prev, fullTrace[step]];
              if (newData.length > 50) newData.shift();
              return newData;
          });
          setQubits(prev => prev.map(q => {
             if (q.status === 'Error') return q;
             return { ...q, status: Math.random() > 0.85 ? 'Active' : 'Idle' };
          }));
          step++;
      }, 100);
  };

  const handleSubmitJob = async () => {
    const job: QuantumJob = {
      id: `QJ-${Math.floor(Math.random() * 9000) + 1000}`,
      targetRegion: newJob.region,
      qubitsUsed: newJob.qubits,
      status: 'Running',
      progress: 0
    };
    setJobs([job, ...jobs]);
    setShowJobModal(false);
    
    const response = await AuroraAPI.runQuantumOptimization(newJob.region, newJob.qubits, newJob.algorithm);
    
    if (response && response.trace) {
        setJobResult(response);
        animateTrace(response.trace);
        setTimeout(() => {
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Completed', progress: 100 } : j));
        }, response.trace.length * 100);
    } else {
        const mockTrace = Array.from({length: 40}, (_, i) => ({
             step: i,
             energy: -1.0 - (1 - Math.exp(-0.1 * i))
        }));
        animateTrace(mockTrace);
        setTimeout(() => setIsOptimizing(false), 4000);
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* QPU Stats - Keep existing layout */}
         <div className="bg-aurora-950 border border-aurora-800 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Cpu size={120} /></div>
            <div>
               <div className="flex justify-between items-start">
                   <h2 className="text-lg font-semibold text-white mb-1 flex items-center"><Cpu className="mr-2 text-aurora-accent" size={20} /> Quantum Processing Unit</h2>
                   <button onClick={() => setShowExplainers(!showExplainers)} className="text-xs text-aurora-400 hover:text-white flex items-center"><HelpCircle size={14} className="mr-1" /> {showExplainers ? 'Hide' : 'Show'} Context</button>
               </div>
               <p className="text-sm text-slate-400 mb-4 font-mono">QPU-Alpha-7 (Superconducting Transmon)</p>
               <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Coherence</p><p className="text-xl font-bold text-aurora-accent">142<span className="text-xs text-slate-600 font-normal">µs</span></p></div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Gate Fidelity</p><p className="text-xl font-bold text-emerald-400">99.9<span className="text-xs text-slate-600 font-normal">%</span></p></div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800"><p className="text-[10px] text-slate-500 uppercase tracking-wider">Active Qubits</p><p className="text-xl font-bold text-aurora-500">64<span className="text-xs text-slate-600 font-normal">/64</span></p></div>
               </div>
            </div>
            <button onClick={() => setShowJobModal(true)} disabled={isOptimizing} className="w-full bg-aurora-600 hover:bg-aurora-500 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center disabled:opacity-50"><Play size={14} className="mr-2" /> Run Inversion Validation</button>
         </div>

         {/* Optimization Visualizer */}
         <div className="bg-aurora-900/30 border border-aurora-800 rounded-xl p-6 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-2 z-10">
                <h3 className="text-slate-300 font-medium text-sm flex items-center"><TrendingDown className="mr-2 text-emerald-400" size={16} /> Energy Minimization</h3>
                {isOptimizing ? <span className="text-xs text-emerald-400 animate-pulse font-mono">● OPTIMIZING</span> : null}
            </div>
            <div className="flex-1 min-h-[150px] relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={energyHistory}>
                     <defs><linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                     <XAxis dataKey="step" hide /><YAxis domain={[-3.5, 0]} hide />
                     <Area type="monotone" dataKey="energy" stroke="#fff" strokeWidth={2} fill="url(#energyGrad)" isAnimationActive={false} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
         {/* Lattice */}
         <div className="lg:col-span-2 bg-aurora-950 border border-aurora-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 py-3 border-b border-aurora-800 bg-aurora-900/30 flex justify-between items-center">
               <h2 className="font-semibold text-slate-200 text-sm flex items-center"><Grid size={16} className="mr-2 text-slate-400" /> Qubit Lattice Topology (8x8)</h2>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-950 relative">
               <div className="grid grid-cols-8 gap-3">
                  {qubits.map((q) => (
                     <div 
                        key={q.id} 
                        onMouseEnter={() => setHoveredQubit(q)}
                        onMouseLeave={() => setHoveredQubit(null)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-crosshair relative ${q.status === 'Active' ? 'bg-aurora-500/20 border-aurora-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] scale-110' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                     >
                        <div className={`w-1.5 h-1.5 rounded-full ${q.status === 'Active' ? 'bg-aurora-400' : 'bg-slate-600'}`} />
                        
                        {/* Interactive Tooltip */}
                        {hoveredQubit?.id === q.id && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-2 rounded text-[10px] whitespace-nowrap z-20 shadow-xl pointer-events-none w-32 text-center">
                                <p className="font-bold text-white mb-1">Qubit {q.id}</p>
                                <div className="space-y-0.5">
                                    <p className="text-slate-400 flex justify-between"><span>Coh:</span> <span className="text-aurora-400">{q.coherenceTime.toFixed(0)}µs</span></p>
                                    <p className="text-slate-400 flex justify-between"><span>Fid:</span> <span className="text-emerald-400">{(q.gateFidelity * 100).toFixed(1)}%</span></p>
                                </div>
                            </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Job Queue */}
         <div className="bg-aurora-950 border border-aurora-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 py-3 border-b border-aurora-800 bg-aurora-900/30">
               <h2 className="font-semibold text-slate-200 text-sm flex items-center"><GitCommit size={16} className="mr-2 text-slate-400" /> Mission Queue</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
               {currentMissionJobs.length === 0 && <div className="p-4 text-center text-xs text-slate-500 italic">No active jobs for {activeRegionName}</div>}
               {currentMissionJobs.map(job => (
                  <div key={job.id} className="bg-slate-900/50 p-3 rounded border border-aurora-500/30 hover:border-aurora-500 transition-colors shadow-lg">
                     <div className="flex justify-between items-start mb-2">
                        <div><div className="text-sm font-medium text-emerald-400">{job.targetRegion}</div><div className="text-[10px] text-slate-500 font-mono">ID: {job.id} (Active)</div></div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-600 text-slate-400">{job.status}</span>
                     </div>
                     <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-1"><div className={`h-full rounded-full transition-all duration-500 ${job.status === 'Completed' ? 'bg-emerald-500' : 'bg-aurora-500'}`} style={{ width: `${job.progress}%` }} /></div>
                  </div>
               ))}
               <div className="mt-4 pt-2 border-t border-slate-800">
                   <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 py-2">
                       <span className="flex items-center"><Archive size={12} className="mr-2" /> Global Job History</span>
                       {showHistory ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                   </button>
                   {showHistory && (
                       <div className="space-y-2 mt-2 pl-2 border-l border-slate-800">
                           {historicalJobs.map(job => (
                               <div key={job.id} className="bg-slate-950 p-2 rounded border border-slate-800 opacity-70"><div className="flex justify-between"><span className="text-xs text-slate-400">{job.targetRegion}</span><span className="text-[10px] text-slate-600">{job.status}</span></div></div>
                           ))}
                       </div>
                   )}
               </div>
            </div>
         </div>
      </div>

      {showJobModal && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl">
            <div className="bg-aurora-950 border border-aurora-700 p-6 rounded-xl w-96 shadow-2xl animate-fadeIn">
               <div className="flex justify-between items-center mb-6"><h3 className="text-white font-bold text-lg">New Inversion Job</h3><button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button></div>
               <div className="space-y-4">
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Target Region</label><input type="text" value={newJob.region} disabled className="w-full bg-slate-900 border border-aurora-800 rounded p-2 text-sm text-slate-500" /></div>
                  <button onClick={handleSubmitJob} disabled={isOptimizing} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded flex items-center justify-center transition-colors disabled:opacity-50">Launch Process</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default QSEView;
