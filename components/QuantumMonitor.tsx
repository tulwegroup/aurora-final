

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { QuantumJob } from '../types';

interface QuantumMonitorProps {
  jobs: QuantumJob[];
}

const data = Array.from({ length: 30 }, (_, i) => ({
  time: i,
  coherence: 85 + Math.random() * 15,
  entanglement: 40 + Math.random() * 40
}));

const QuantumMonitor: React.FC<QuantumMonitorProps> = ({ jobs }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metric Chart */}
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-aurora-accent mr-2"></span>
            Qubit Coherence Stability
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCoherence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Area type="monotone" dataKey="coherence" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCoherence)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Jobs List */}
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-aurora-500 mr-2"></span>
            Active Inversion Jobs
          </h3>
          <div className="flex-1 space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-slate-950/50 rounded-lg p-3 border border-aurora-800/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{job.targetRegion}</div>
                    <div className="text-xs text-slate-500 font-mono">ID: {job.id} | Qubits: {job.qubitsUsed}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    job.status === 'Running' ? 'border-aurora-500 text-aurora-400 bg-aurora-500/10' :
                    job.status === 'Completed' ? 'border-aurora-success text-aurora-success bg-aurora-success/10' :
                    'border-slate-600 text-slate-400'
                  }`}>
                    {job.status}
                  </span>
                </div>
                {job.status === 'Running' && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-aurora-500 h-full rounded-full transition-all duration-1000" style={{ width: `${job.progress}%` }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumMonitor;