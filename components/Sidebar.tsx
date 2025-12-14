
import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Satellite, 
  Cpu, 
  Activity, 
  Database, 
  Layers, 
  Settings,
  Hexagon,
  TrendingUp,
  Box,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Plus,
  Upload,
  AlertTriangle,
  Waves,
  Map // Import Map icon
} from 'lucide-react';
import { AppView, ExplorationCampaign } from '../types';
import { AuroraAPI } from '../api';

interface SidebarProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  customLogo?: string | null;
  onSwitchCampaign?: (campaign: ExplorationCampaign) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, customLogo, onSwitchCampaign }) => {
  const [showMissionSelect, setShowMissionSelect] = useState(false);
  const [campaigns, setCampaigns] = useState<ExplorationCampaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const loadCampaigns = async () => {
          const list = await AuroraAPI.getAllCampaigns();
          setCampaigns(list);
          const active = await AuroraAPI.getActiveCampaign();
          setActiveCampaignId(active.id);
      };
      loadCampaigns();
      // Refresh list periodically to catch backend updates
      const interval = setInterval(loadCampaigns, 10000);
      return () => clearInterval(interval);
  }, []);

  const handleCampaignClick = (c: ExplorationCampaign) => {
      if (onSwitchCampaign) {
          onSwitchCampaign(c);
          setActiveCampaignId(c.id);
          setShowMissionSelect(false);
      }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const success = await AuroraAPI.importCampaign(file);
          if (success) {
              const list = await AuroraAPI.getAllCampaigns();
              setCampaigns(list);
              setShowMissionSelect(true); // Keep open to show new entry
          }
      }
  };

  const menuItems: { id: AppView; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Mission Control', icon: Activity },
    { id: 'map', label: 'Planetary Map', icon: Map }, // New Map Tab
    { id: 'portfolio', label: 'Portfolio Command', icon: Briefcase },
    { id: 'osil', label: 'Sensor Integration (OSIL)', icon: Satellite },
    { id: 'seismic', label: 'Aurora Seismic (ASS)', icon: Waves },
    { id: 'ushe', label: 'Harmonization (USHE)', icon: Layers },
    { id: 'pcfc', label: 'Physics-Causal Core', icon: Hexagon },
    { id: 'tmal', label: 'Temporal Analytics (TMAL)', icon: TrendingUp },
    { id: 'qse', label: 'Quantum Engine (QSE)', icon: Cpu },
    { id: 'twin', label: 'Digital Twin (4D)', icon: Box },
    { id: 'ietl', label: 'Tasking & Intel (IETL)', icon: Globe },
    { id: 'data', label: 'Data Lake', icon: Database },
  ];

  const activeCampName = campaigns.find(c => c.id === activeCampaignId)?.regionName || "Loading...";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-aurora-950 border-r border-aurora-800 flex flex-col z-50">
      <div className="p-4 border-b border-aurora-800">
        <div className="flex items-center space-x-3 mb-4 px-2">
            {customLogo ? (
                <img src={customLogo} alt="Logo" className="h-8 w-auto object-contain max-w-[150px]" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-aurora-500 to-aurora-accent flex items-center justify-center shadow-lg shadow-aurora-500/20">
                    <span className="text-white font-bold text-lg">A</span>
                </div>
            )}
            
            {!customLogo && (
                <div>
                    <h1 className="text-lg font-bold text-white tracking-wider">AURORA</h1>
                    <p className="text-xs text-aurora-400 font-mono tracking-widest">OSI v3.0</p>
                </div>
            )}
        </div>

        {/* Mission Selector */}
        <div className="relative">
            <button 
                onClick={() => setShowMissionSelect(!showMissionSelect)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-aurora-500 rounded-lg p-2 flex items-center justify-between text-left transition-all group"
            >
                <div className="overflow-hidden">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Mission</p>
                    <p className="text-xs font-bold text-white truncate group-hover:text-aurora-400">{activeCampName}</p>
                </div>
                {showMissionSelect ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </button>

            {showMissionSelect && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-950 border border-aurora-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {campaigns.length === 0 && (
                            <button 
                                onClick={() => setActiveTab('config')}
                                className="w-full text-left p-3 text-xs border-b border-slate-800 bg-amber-900/20 hover:bg-amber-900/30 text-amber-400 flex items-center"
                            >
                                <AlertTriangle size={14} className="mr-2" />
                                <span>DB Empty - Click to Seed</span>
                            </button>
                        )}
                        {campaigns.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleCampaignClick(c)}
                                className={`w-full text-left p-3 text-xs border-b border-slate-800 last:border-0 hover:bg-slate-900 ${c.id === activeCampaignId ? 'bg-aurora-900/30' : ''}`}
                            >
                                <div className="flex justify-between">
                                    <span className={`font-bold ${c.id === activeCampaignId ? 'text-aurora-400' : 'text-slate-300'}`}>{c.regionName}</span>
                                    {c.id === activeCampaignId && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_lime]" />}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate">{c.id}</p>
                            </button>
                        ))}
                    </div>
                    <div className="p-2 bg-slate-900 border-t border-slate-800 grid grid-cols-2 gap-2">
                        <button onClick={() => setActiveTab('dashboard')} className="flex items-center justify-center space-x-1 text-[9px] font-bold text-slate-400 hover:text-white py-1.5 rounded hover:bg-slate-800 transition-colors">
                            <Plus size={10} /> <span>NEW</span>
                        </button>
                        <button onClick={handleImportClick} className="flex items-center justify-center space-x-1 text-[9px] font-bold text-slate-400 hover:text-white py-1.5 rounded hover:bg-slate-800 transition-colors">
                            <Upload size={10} /> <span>IMPORT</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".json,application/json" 
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-3 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-aurora-800/50 text-aurora-400 shadow-md border border-aurora-700/50' 
                  : 'text-slate-400 hover:bg-aurora-900 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-aurora-400' : 'text-slate-500 group-hover:text-white'} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-aurora-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-aurora-800">
        <button 
          onClick={() => setActiveTab('config')}
          className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors w-full ${
            activeTab === 'config' ? 'text-white bg-aurora-900' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings size={18} />
          <span className="text-sm">System Config</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
