import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExplorationCampaign, AppView, Anomaly, Satellite, TargetResult, ScanSector, MineralAgentType, HiveMindState } from '../types';
import { RESOURCE_CATALOG, ANOMALIES, SATELLITES, CAMPAIGN_PHASES } from '../constants';
import MapVisualization from './MapVisualization';
import { Play, Upload, Plus, Target, Activity, Zap, Search, ChevronRight, AlertTriangle, CheckCircle, MapPin, Database, Globe, BarChart3, Filter, Download, X, Eye } from 'lucide-react';

interface DashboardProps {
  campaign: ExplorationCampaign;
  onLaunchCampaign: (campaign: ExplorationCampaign) => Promise<void>;
  onAdvancePhase: () => Promise<void>;
  onUpdateCampaign: (campaign: ExplorationCampaign) => Promise<void>;
  onNavigate: (view: AppView) => void;
  hiveMindState: HiveMindState;
  setHiveMindState: React.Dispatch<React.SetStateAction<HiveMindState>>;
}

const Dashboard: React.FC<DashboardProps> = ({
  campaign,
  onLaunchCampaign,
  onAdvancePhase,
  onUpdateCampaign,
  onNavigate,
  hiveMindState,
  setHiveMindState
}) => {
  const [activeResource, setActiveResource] = useState(RESOURCE_CATALOG[0]);
  const [scanProgress, setScanProgress] = useState(0);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignRegion, setNewCampaignRegion] = useState('');
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  
  // Mock targets for visualization
  const mockTargets: TargetResult[] = [
    { id: 't1', confidence: 0.92, location: { lat: 4.58, lon: -2.95 }, type: 'Hydrocarbon', depth: 1200 },
    { id: 't2', confidence: 0.87, location: { lat: 4.62, lon: -2.98 }, type: 'Gold', depth: 800 },
    { id: 't3', confidence: 0.78, location: { lat: 4.55, lon: -2.92 }, type: 'Copper', depth: 1500 },
  ];

  // Initialize hive mind scan grid
  useEffect(() => {
    if (!hiveMindState.scanGrid || hiveMindState.scanGrid.length === 0) {
      const grid: ScanSector[] = [];
      for (let y = 0; y < 11; y++) {
        for (let x = 0; x < 11; x++) {
          grid.push({
            id: `${x}-${y}`,
            x,
            y,
            status: 'pending',
            opacity: 0.1
          });
        }
      }
      setHiveMindState(prev => ({ ...prev, scanGrid: grid }));
    }
  }, [hiveMindState.scanGrid, setHiveMindState]);

  const startHiveScan = () => {
    setHiveMindState(prev => ({
      ...prev,
      isScanning: true,
      activeAgents: ['prospector', 'analyst'],
      logs: [...(prev.logs || []), `[${new Date().toLocaleTimeString()}] HiveMind Scan Initiated.`],
      hits: 0,
      misses: 0
    }));
  };

  const stopHiveScan = () => {
    setHiveMindState(prev => ({
      ...prev,
      isScanning: false,
      logs: [...(prev.logs || []), `[${new Date().toLocaleTimeString()}] HiveMind Scan Terminated.`]
    }));
  };

  const handleLaunchNewCampaign = async () => {
    if (!newCampaignName.trim() || !newCampaignRegion.trim()) return;

    const newCampaign: ExplorationCampaign = {
      id: `camp-${Date.now()}`,
      name: newCampaignName,
      description: `Exploration campaign for ${newCampaignRegion}`,
      region: newCampaignRegion,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 1000000,
      status: 'active',
      phaseProgress: 0,
      phaseIndex: 0,
      currentPhase: CAMPAIGN_PHASES[0]
    };

    await onLaunchCampaign(newCampaign);
    setShowLaunchModal(false);
    setNewCampaignName('');
    setNewCampaignRegion('');
  };

  const calculateCampaignStats = () => {
    const phaseIndex = campaign.phaseIndex || 0;
    const phaseProgress = campaign.phaseProgress || 0;
    const totalDays = 90;
    const daysRemaining = Math.ceil((totalDays * (100 - phaseProgress)) / 100);
    
    return {
      phaseIndex,
      phaseProgress,
      daysRemaining,
      budgetSpent: Math.round((campaign.budget * phaseProgress) / 100),
      anomaliesDetected: ANOMALIES.filter(a => a.severity === 'HIGH').length
    };
  };

  const stats = calculateCampaignStats();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Campaign Header */}
      <div className="bg-aurora-900/30 border border-aurora-700 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{campaign.name}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center">
                <MapPin size={14} className="mr-2" />
                {campaign.region}
              </span>
              <span className="flex items-center">
                <Database size={14} className="mr-2" />
                {campaign.status.toUpperCase()}
              </span>
              <span className="flex items-center">
                <BarChart3 size={14} className="mr-2" />
                Phase: {campaign.currentPhase || CAMPAIGN_PHASES[0]}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLaunchModal(true)}
              className="px-4 py-2 bg-aurora-600 hover:bg-aurora-500 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} /> New Campaign
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="px-4 py-2 border border-aurora-600 text-aurora-400 hover:bg-aurora-600/20 rounded-lg flex items-center gap-2"
            >
              <Globe size={16} /> View Map
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Campaign Progress</span>
            <span>{stats.phaseProgress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-aurora-500 to-aurora-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.phaseProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            {CAMPAIGN_PHASES.map((phase, idx) => (
              <span
                key={phase}
                className={`${idx <= stats.phaseIndex ? 'text-aurora-400' : ''}`}
              >
                {phase}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Map & Targets */}
        <div className="col-span-2 space-y-6">
          {/* Map Visualization */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Globe size={18} />
                Regional Analysis Map
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-slate-600 rounded-lg hover:bg-slate-800">
                  <Filter size={14} />
                </button>
                <button className="px-3 py-1 text-sm border border-slate-600 rounded-lg hover:bg-slate-800">
                  <Download size={14} />
                </button>
              </div>
            </div>
            <div className="h-96 rounded-lg overflow-hidden border border-slate-800">
              <MapVisualization
                targets={mockTargets}
                satellites={SATELLITES}
                onCoordinateSelect={setSelectedCoordinates}
              />
            </div>
            {selectedCoordinates && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-sm">
                <p>Selected: {selectedCoordinates.lat.toFixed(4)}, {selectedCoordinates.lon.toFixed(4)}</p>
              </div>
            )}
          </div>

          {/* HiveMind Scanner */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap size={18} />
                HiveMind Autonomous Scanner
              </h2>
              <div className="flex gap-2">
                {!hiveMindState.isScanning ? (
                  <button
                    onClick={startHiveScan}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-2"
                  >
                    <Play size={16} /> Start Scan
                  </button>
                ) : (
                  <button
                    onClick={stopHiveScan}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-2"
                  >
                    <X size={16} /> Stop Scan
                  </button>
                )}
              </div>
            </div>
            
            {/* Scan Grid */}
            <div className="mb-4">
              <div className="grid grid-cols-11 gap-1 mb-4">
                {hiveMindState.scanGrid?.slice(0, 121).map((sector) => (
                  <div
                    key={sector.id}
                    className={`aspect-square rounded ${
                      sector.status === 'anomaly'
                        ? 'bg-emerald-500/80'
                        : sector.status === 'analyzed'
                        ? 'bg-slate-700'
                        : 'bg-slate-800'
                    }`}
                    style={{ opacity: sector.opacity }}
                    title={`Sector ${sector.id}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Progress: {Math.round(((hiveMindState.scanGrid?.filter(s => s.status !== 'pending').length || 0) / 121) * 100)}%</span>
                <span>Hits: {hiveMindState.hits || 0} | Misses: {hiveMindState.misses || 0}</span>
              </div>
            </div>

            {/* Scan Logs */}
            <div className="h-32 overflow-y-auto bg-slate-950 rounded-lg p-3 font-mono text-xs">
              {hiveMindState.logs?.slice(-5).map((log, idx) => (
                <div key={idx} className="text-slate-400 mb-1">{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Resources */}
        <div className="space-y-6">
          {/* Campaign Stats */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity size={18} />
              Campaign Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Budget</span>
                <span className="font-mono">${stats.budgetSpent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Days Remaining</span>
                <span className="font-mono">{stats.daysRemaining}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">High Confidence Anomalies</span>
                <span className="font-mono text-emerald-400">{stats.anomaliesDetected}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Satellites Online</span>
                <span className="font-mono">{SATELLITES.filter(s => s.status === 'ACTIVE').length}/{SATELLITES.length}</span>
              </div>
            </div>
          </div>

          {/* Resource Catalog */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database size={18} />
              Resource Catalog
            </h2>
            <div className="space-y-3">
              {RESOURCE_CATALOG.map((resource) => (
                <button
                  key={resource.id}
                  onClick={() => setActiveResource(resource)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeResource.id === resource.id
                      ? 'border-aurora-500 bg-aurora-900/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{resource.name}</span>
                    {activeResource.id === resource.id && (
                      <CheckCircle size={14} className="text-aurora-400" />
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Value: ${resource.valuePerTon.toLocaleString()}/ton • {resource.rarity}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Anomaly Alerts */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} />
              Recent Anomalies
            </h2>
            <div className="space-y-3">
              {ANOMALIES.slice(0, 3).map((anomaly) => (
                <div
                  key={anomaly.index}
                  className="p-3 border border-slate-700 rounded-lg hover:bg-slate-800/30"
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${
                      anomaly.severity === 'HIGH' ? 'text-rose-400' :
                      anomaly.severity === 'MEDIUM' ? 'text-amber-400' :
                      'text-slate-400'
                    }`}>
                      {anomaly.severITY} Confidence
                    </span>
                    <Eye size={14} className="text-slate-500" />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    λ: {anomaly.wavelength}nm • z-score: {anomaly.z_score.toFixed(1)}
                  </div>
                </div>
              ))}
              <button
                onClick={() => onNavigate('ushe')}
                className="w-full py-2 text-center text-aurora-400 hover:text-aurora-300 text-sm border border-aurora-800 rounded-lg hover:bg-aurora-900/20"
              >
                View All Anomalies <ChevronRight size={12} className="inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Launch Campaign Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Launch New Campaign</h3>
              <button
                onClick={() => setShowLaunchModal(false)}
                className="p-1 hover:bg-slate-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-aurora-500"
                  placeholder="e.g., West Africa Gold Survey"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Region</label>
                <input
                  type="text"
                  value={newCampaignRegion}
                  onChange={(e) => setNewCampaignRegion(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-aurora-500"
                  placeholder="e.g., Ghana Offshore Basin"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowLaunchModal(false)}
                  className="flex-1 py-3 border border-slate-600 rounded-lg hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunchNewCampaign}
                  disabled={!newCampaignName.trim() || !newCampaignRegion.trim()}
                  className="flex-1 py-3 bg-aurora-600 hover:bg-aurora-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Launch Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
