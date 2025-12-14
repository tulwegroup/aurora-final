
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, Legend } from 'recharts';
import { TEMPORAL_DATA, GRAVITY_SPECTRUM } from '../constants';
import { Orbit, Activity, TrendingUp, Layers, Filter, Loader2, ArrowUpRight, ArrowDownRight, Minus, ChevronDown, Info, Globe, MapPin, Search } from 'lucide-react';
import { AuroraAPI } from '../api';
import { ExplorationCampaign } from '../types';

interface TMALViewProps {
  campaign: ExplorationCampaign;
}

const DEFAULT_PROJECTS = [
    { id: 'tz', name: 'Tanzania Rift (Helium)', lat: -8.12, lon: 33.45, type: 'Noble Gas', context: 'Active Rift System' },
    { id: 'nv', name: 'Nevada Basin (Lithium)', lat: 38.50, lon: -117.50, type: 'Battery Metal', context: 'Sedimentary Basin / Salar' },
    { id: 'sa', name: 'Saudi Shield (Gold)', lat: 24.50, lon: 42.10, type: 'Precious Metal', context: 'Stable Craton / Shear Zone' }
];

const TMALView: React.FC<TMALViewProps> = ({ campaign }) => {
  // Combine defaults with active campaign if it's new
  const projects = React.useMemo(() => {
     const activeName = campaign.regionName || campaign.name || 'Unknown Region';
     const campaignProject = {
         id: 'active-campaign',
         name: `Active Mission: ${activeName}`,
         lat: 0,
         lon: 0,
         type: campaign.resourceType,
         context: `Live Scan (${activeName})`
     };
     
     try {
         const coords = campaign.targetCoordinates.match(/-?\d+(\.\d+)?/g);
         if (coords && coords.length >= 2) {
             let lat = parseFloat(coords[0]);
             if (campaign.targetCoordinates.includes('S')) lat = -lat;
             let lon = parseFloat(coords[1]);
             if (campaign.targetCoordinates.includes('W')) lon = -lon;
             campaignProject.lat = lat;
             campaignProject.lon = lon;
         }
     } catch(e) {}

     const existing = DEFAULT_PROJECTS.find(p => p.name.includes(activeName));
     if (existing) return [campaignProject, ...DEFAULT_PROJECTS.filter(p => p.id !== existing.id)];
     return [campaignProject, ...DEFAULT_PROJECTS];
  }, [campaign]);

  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [temporalData, setTemporalData] = useState<any[]>(TEMPORAL_DATA);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 12]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dynamic Physics State
  const [trend, setTrend] = useState<string>('Stable');
  const [velocity, setVelocity] = useState<number>(0);
  const [depthResolution, setDepthResolution] = useState<number>(75);
  
  // Parallax Simulation State
  const [parallaxAngle, setParallaxAngle] = useState(15);
  const [baseline, setBaseline] = useState(250); 

  const [activeSpectrumFilters, setActiveSpectrumFilters] = useState<string[]>(['Short (Shallow)', 'Medium (Crust)', 'Long (Deep)']);

  useEffect(() => {
      setSelectedProject(projects[0]);
  }, [projects]);

  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          const { lat, lon } = selectedProject;

          const data = await AuroraAPI.getTemporalAnalysis(lat, lon);
          
          if (data && data.data) {
              setTemporalData(data.data);
              setTrend(data.trend || 'Stable');
              setVelocity(data.velocity_mm_yr || 0);
              // Use API depth resolution if available, else calculated
              if (data.depth_resolution) setDepthResolution(data.depth_resolution);
              setTimeRange([0, data.data.length]);
          } else {
              let newTrend = 'Stable';
              let newVel = 0.2;
              
              let baseDeformation = 0;
              const generatedData = Array.from({length: 12}, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - (11 - i));
                  const monthName = date.toLocaleString('default', { month: 'short' });
                  
                  if (selectedProject.type.includes('Hydrocarbon')) {
                      newTrend = 'Subsidence';
                      newVel = -12.4;
                      baseDeformation -= (1 + Math.random());
                      return {
                          date: monthName,
                          deformation: baseDeformation,
                          thermalInertia: 650 + Math.random() * 50,
                          coherence: 0.9 - (i * 0.02)
                      };
                  } else if (selectedProject.type.includes('Noble') || selectedProject.type.includes('Gas')) {
                      newTrend = 'Uplift';
                      newVel = 4.5;
                      baseDeformation += (0.5 + Math.random() * 0.5);
                      return {
                          date: monthName,
                          deformation: baseDeformation,
                          thermalInertia: 720 + Math.random() * 30, 
                          coherence: 0.85 - (i * 0.01)
                      };
                  } else {
                      newTrend = 'Stable';
                      newVel = 0.2;
                      return {
                          date: monthName,
                          deformation: (Math.random() - 0.5) * 2,
                          thermalInertia: 850 + Math.random() * 20, 
                          coherence: 0.95
                      };
                  }
              });

              setTemporalData(generatedData);
              setTrend(newTrend);
              setVelocity(newVel);
          }
          setIsLoading(false);
      };
      fetchData();
  }, [selectedProject]);

  const toggleFilter = (wavelength: string) => {
    if (activeSpectrumFilters.includes(wavelength)) {
      setActiveSpectrumFilters(prev => prev.filter(f => f !== wavelength));
    } else {
      setActiveSpectrumFilters(prev => [...prev, wavelength]);
    }
  };

  const filteredTemporalData = temporalData.slice(timeRange[0], timeRange[1] || temporalData.length);
  const filteredGravityData = GRAVITY_SPECTRUM.filter(d => activeSpectrumFilters.includes(d.wavelength));

  const confidence = Math.min(99, Math.max(50, (baseline / 5) + (parallaxAngle * 1.5)));

  const getDeformationContext = () => {
      if (trend === 'Uplift') return "The ground is rising (swelling). In this geological context, this often indicates positive pressure from a gas cap (Helium/Natural Gas) expanding underground.";
      if (trend === 'Subsidence') return "The ground is sinking. This typically happens when fluids (like Oil/Brine) migrate or are extracted, causing the reservoir rock matrix to compact.";
      return "The ground is stable. No significant movement detected. This suggests a solid, inactive basement rock structure (typical for Hard Rock minerals like Gold).";
  };

  return (
    <div className="space-y-6">
      
      {/* PROJECT SELECTOR & CONTEXT HEADER */}
      <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="p-3 bg-aurora-500/10 rounded-full border border-aurora-500/20">
                  <Globe className="text-aurora-500" size={24} />
              </div>
              <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Analysis Target</label>
                  <div className="relative">
                      <select 
                          value={selectedProject.id}
                          onChange={(e) => {
                              const proj = projects.find(p => p.id === e.target.value);
                              if (proj) setSelectedProject(proj);
                          }}
                          className="w-full md:w-64 bg-slate-950 border border-slate-700 rounded-lg py-2 pl-3 pr-8 text-sm text-white focus:border-aurora-500 appearance-none outline-none font-medium cursor-pointer hover:border-slate-500 transition-colors"
                      >
                          {projects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
              </div>
          </div>

          <div className="flex items-center space-x-6 text-sm w-full md:w-auto bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-slate-400" />
                  <div>
                      <p className="text-[10px] text-slate-500 uppercase">Coordinates</p>
                      <p className="font-mono text-slate-200">{selectedProject.lat.toFixed(2)}, {selectedProject.lon.toFixed(2)}</p>
                  </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>
              <div>
                  <p className="text-[10px] text-slate-500 uppercase">Geological Setting</p>
                  <p className="text-aurora-400 font-medium">{selectedProject.context}</p>
              </div>
          </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center justify-between group hover:border-aurora-500/30 transition-colors">
           <div>
              <p className="text-slate-400 text-xs font-mono mb-1 flex items-center">
                  ANNUAL VELOCITY <Info size={10} className="ml-1 text-slate-600" />
              </p>
              <h3 className={`text-3xl font-bold ${velocity > 0 ? 'text-emerald-400' : velocity < 0 ? 'text-amber-400' : 'text-white'} flex items-center`}>
                  {velocity > 0 ? '+' : ''}{velocity} <span className="text-lg text-slate-500 font-normal ml-1">mm/yr</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Ground movement speed</p>
           </div>
           <div className={`p-3 rounded-full ${velocity !== 0 ? 'bg-aurora-500/10' : 'bg-slate-800'}`}>
              {velocity > 0.5 ? <ArrowUpRight className="text-emerald-400" size={24} /> : 
               velocity < -0.5 ? <ArrowDownRight className="text-amber-400" size={24} /> : 
               <Minus className="text-slate-400" size={24} />}
           </div>
        </div>
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center justify-between">
           <div>
              <p className="text-slate-400 text-xs font-mono mb-1">PARALLAX DEPTH RES</p>
              <h3 className="text-3xl font-bold text-white">±{depthResolution} <span className="text-lg text-slate-500 font-normal">meters</span></h3>
              <p className="text-[10px] text-slate-500 mt-1">Vertical accuracy without drilling</p>
           </div>
           <div className="p-3 bg-aurora-accent/10 rounded-full">
              <Orbit className="text-aurora-accent" size={24} />
           </div>
        </div>
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center justify-between">
           <div>
              <p className="text-slate-400 text-xs font-mono mb-1">MULTI-ORBIT FUSION</p>
              <h3 className="text-3xl font-bold text-white">3 <span className="text-lg text-slate-500 font-normal">Sources</span></h3>
              <p className="text-[10px] text-slate-500 mt-1">SAR + Thermal + Gravity</p>
           </div>
           <div className="p-3 bg-emerald-500/10 rounded-full">
              <Layers className="text-emerald-500" size={24} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Temporal Fingerprinting */}
        <div className="bg-aurora-950 border border-aurora-800 rounded-xl p-6 flex flex-col min-h-[450px]">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                 <TrendingUp className="text-aurora-400" size={20} />
                 <h2 className="font-semibold text-slate-200">Temporal Fingerprinting (InSAR/Thermal)</h2>
              </div>
              <div className="flex items-center space-x-2">
                  {isLoading && <Loader2 size={14} className="animate-spin text-aurora-500" />}
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      trend === 'Uplift' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                      trend === 'Subsidence' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                      'text-slate-400 border-slate-700 bg-slate-800'
                  }`}>TREND: {trend.toUpperCase()}</span>
              </div>
           </div>

           {/* Time Range Filter */}
           <div className="bg-aurora-900/30 p-3 rounded-lg border border-aurora-800 mb-4 flex items-center space-x-4">
              <span className="text-xs text-slate-400 whitespace-nowrap">Time Window</span>
              <input 
                type="range" 
                min="0" max={temporalData.length} 
                value={timeRange[0]} 
                onChange={(e) => setTimeRange([parseInt(e.target.value), temporalData.length])}
                className="w-full accent-aurora-500"
              />
              <span className="text-xs font-mono text-white">{filteredTemporalData.length} mos</span>
           </div>

           <div className="flex-1 w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={filteredTemporalData}>
                    <defs>
                       <linearGradient id="colorDef" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorTherm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#475569" tick={{fontSize: 10}} />
                    <YAxis yAxisId="left" stroke="#f59e0b" tick={{fontSize: 10}} label={{ value: 'Deformation (mm)', angle: -90, position: 'insideLeft', fill: '#f59e0b', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{fontSize: 10}} label={{ value: 'Thermal Inertia', angle: 90, position: 'insideRight', fill: '#06b6d4', fontSize: 10 }} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                       labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend iconType="circle" />
                    <Area yAxisId="left" type="monotone" dataKey="deformation" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDef)" name="Surface Deformation (mm)" animationDuration={500} />
                    <Area yAxisId="right" type="monotone" dataKey="thermalInertia" stroke="#06b6d4" fillOpacity={1} fill="url(#colorTherm)" name="Thermal Inertia (J)" animationDuration={500} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
           
           {/* Layman Interpretation Box */}
           <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg flex items-start space-x-3">
               <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
               <div>
                   <p className="text-xs font-bold text-slate-300 mb-1">Analyst Interpretation</p>
                   <p className="text-xs text-slate-400 leading-relaxed">
                       {getDeformationContext()}
                   </p>
               </div>
           </div>
        </div>

        {/* Gravity Decomposition */}
        <div className="bg-aurora-950 border border-aurora-800 rounded-xl p-6 flex flex-col min-h-[450px]">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                 <Activity className="text-emerald-400" size={20} />
                 <h2 className="font-semibold text-slate-200">Gravity Signal Decomposition</h2>
              </div>
              <Filter size={16} className="text-slate-500" />
           </div>

           {/* Filter Toggles */}
           <div className="flex space-x-2 mb-4">
              {GRAVITY_SPECTRUM.map(item => (
                 <button
                   key={item.wavelength}
                   onClick={() => toggleFilter(item.wavelength)}
                   className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${
                      activeSpectrumFilters.includes(item.wavelength) 
                        ? 'bg-slate-800 border-slate-600 text-white' 
                        : 'bg-transparent border-slate-800 text-slate-600'
                   }`}
                 >
                    {item.wavelength}
                 </button>
              ))}
           </div>

           <div className="flex-1 w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={filteredGravityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#475569" tick={{fontSize: 10}} domain={[0, 500]} />
                    <YAxis dataKey="wavelength" type="category" width={100} stroke="#94a3b8" tick={{fontSize: 10}} />
                    <Tooltip 
                       cursor={{fill: 'transparent'}}
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                    />
                    <Bar dataKey="power" name="Signal Power" barSize={30} radius={[0, 4, 4, 0]}>
                       {filteredGravityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.wavelength.includes('Deep') ? '#8b5cf6' : '#334155'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
           
           {/* Layman Interpretation Box */}
           <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg flex items-start space-x-3">
               <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
               <div>
                   <p className="text-xs font-bold text-slate-300 mb-1">What does Gravity tell us?</p>
                   <p className="text-xs text-slate-400 leading-relaxed">
                       Gravity measures rock density. <strong className="text-slate-300">Deep/Long Wavelengths</strong> show us the "Basement" (the foundation of the continent). <strong className="text-slate-300">Shallow/Short Wavelengths</strong> show us sedimentary traps closer to the surface where oil/gas/water accumulate.
                   </p>
               </div>
           </div>
        </div>
      </div>

      {/* Interactive Parallax Visualization */}
      <div className="bg-aurora-900/30 border border-aurora-800 rounded-xl p-6">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
               <Orbit className="text-slate-400 mr-2" size={20} />
               <h3 className="font-semibold text-slate-200">Multi-Altitude Parallax Inference</h3>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
               <span>CONFIDENCE: {confidence.toFixed(1)}%</span>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Controls */}
            <div className="col-span-1 space-y-6">
               <div>
                  <label className="flex justify-between text-xs text-slate-400 mb-2">
                     <span>Orbital Separation</span>
                     <span className="text-white">{parallaxAngle}°</span>
                  </label>
                  <input 
                     type="range" min="5" max="45" value={parallaxAngle} 
                     onChange={(e) => setParallaxAngle(parseInt(e.target.value))}
                     className="w-full accent-aurora-500"
                  />
               </div>
               <div>
                  <label className="flex justify-between text-xs text-slate-400 mb-2">
                     <span>Baseline Distance</span>
                     <span className="text-white">{baseline} km</span>
                  </label>
                  <input 
                     type="range" min="100" max="1000" step="50" value={baseline} 
                     onChange={(e) => setBaseline(parseInt(e.target.value))}
                     className="w-full accent-aurora-accent"
                  />
               </div>
               
               <div className="bg-slate-950 p-4 rounded-lg border border-aurora-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Estimated Z-Resolution</p>
                  <p className="text-2xl font-bold text-white">±{depthResolution}m</p>
                  <p className="text-[10px] text-slate-500 mt-2 italic border-t border-slate-800 pt-2">
                      "We use 3 different satellites at different angles to triangulate the exact depth of the anomaly, like GPS for the underground."
                  </p>
               </div>
            </div>

            {/* Visualization */}
            <div className="col-span-3 relative h-64 w-full bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-aurora-800/50 shadow-inner">
               
               {/* Satellites */}
               <div 
                  className="absolute top-8 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-300 z-10"
                  style={{ left: `calc(50% - ${baseline/4}px)` }}
               >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-blue-300">LEO</div>
               </div> 

               <div 
                  className="absolute top-4 w-5 h-5 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-all duration-300 z-10"
                  style={{ left: `calc(50% + ${baseline/4}px)` }}
               >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-purple-300">MEO</div>
               </div>
               
               {/* Target */}
               <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-aurora-500"></div>
                  <div className="w-16 h-1 bg-aurora-500/50 rounded-full blur-sm mt-1"></div>
               </div>

               {/* Beams (Dynamic SVG) */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line 
                     x1={`calc(50% - ${baseline/4}px)`} y1="40" 
                     x2="50%" y2="calc(100% - 40px)" 
                     stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" 
                  />
                  <line 
                     x1={`calc(50% + ${baseline/4}px)`} y1="24" 
                     x2="50%" y2="calc(100% - 40px)" 
                     stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" 
                  />
                  
                  {/* Angle Arc */}
                  <path d={`M 50% ${256-60} L calc(50% - 20px) ${256-90}`} stroke="white" strokeWidth="1" opacity="0.2" fill="none" />
               </svg>

               <div className="absolute bottom-2 right-4 bg-black/50 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                  Target Lock: ACTIVE
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TMALView;
