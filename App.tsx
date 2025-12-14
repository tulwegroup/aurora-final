
import React, { Component, useState, useEffect, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import { Bell, Search, User, ShieldCheck, Server, AlertTriangle, RefreshCw, Loader2, ChevronRight } from 'lucide-react';
import { ExplorationCampaign, CAMPAIGN_PHASES, AppView, HiveMindState, MineralAgentType } from './types';
import { ACTIVE_CAMPAIGN } from './constants';
import { AuroraAPI } from './api';
import { APP_CONFIG } from './config';

// --- LAZY LOAD SUB-SYSTEMS FOR PRODUCTION PERFORMANCE ---
const Dashboard = lazy(() => import('./components/Dashboard'));
const OSILView = lazy(() => import('./components/OSILView'));
const PCFCView = lazy(() => import('./components/PCFCView'));
const USHEView = lazy(() => import('./components/USHEView'));
const QSEView = lazy(() => import('./components/QSEView'));
const IETLView = lazy(() => import('./components/IETLView'));
const TMALView = lazy(() => import('./components/TMALView'));
const ConfigView = lazy(() => import('./components/ConfigView'));
const DataLakeView = lazy(() => import('./components/DataLakeView'));
const DigitalTwinView = lazy(() => import('./components/DigitalTwinView'));
const PortfolioView = lazy(() => import('./components/PortfolioView'));
const SeismicView = lazy(() => import('./components/SeismicView'));
const PlanetaryMapView = lazy(() => import('./components/PlanetaryMapView')); 

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Critical Subsystem Failure:", error, errorInfo); }
  
  handleReload = () => { 
    this.setState({ hasError: false, error: null }); 
    window.location.reload(); 
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-aurora-950/50 rounded-xl border border-aurora-800 animate-fadeIn">
          <div className="bg-red-900/20 p-6 rounded-full mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Subsystem Malfunction</h2>
          <p className="mb-8 max-w-md text-slate-400">
            The active module encountered a critical runtime exception. 
            Diagnostic data has been logged to the black box.
          </p>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-red-400 mb-8 w-full max-w-lg overflow-auto text-left shadow-inner">
            <p className="opacity-50 mb-2">// STACK TRACE</p>
            {this.state.error?.toString() || 'Unknown Error'}
          </div>
          <button onClick={this.handleReload} className="bg-aurora-600 hover:bg-aurora-500 text-white px-8 py-3 rounded-lg font-bold flex items-center transition-all shadow-lg hover:shadow-aurora-500/20">
            <RefreshCw size={18} className="mr-2" /> Reboot Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ViewLoader = () => (
  <div className="flex flex-col items-center justify-center h-[600px] text-slate-500">
    <Loader2 size={48} className="text-aurora-500 animate-spin mb-4" />
    <p className="font-mono text-sm tracking-widest text-aurora-400 animate-pulse">INITIALIZING MODULE...</p>
  </div>
);

const ConnectionWarningBanner = ({ onNavigate }: { onNavigate: (view: AppView) => void }) => (
    <div className="sticky top-16 z-30 bg-amber-500/10 border-b-2 border-amber-500 text-amber-300 p-3 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
        <div className="flex items-center">
            <AlertTriangle size={24} className="mr-4 text-amber-400 flex-shrink-0" />
            <div>
                <p className="font-bold text-sm">LIMITED CONNECTIVITY: Operating in Sovereign (Offline) Mode.</p>
                <p className="text-amber-300/80 text-[11px]">The backend URL is not configured or the server is unreachable. All processing is disabled.</p>
            </div>
        </div>
        <button onClick={() => onNavigate('config')} className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2 px-4 rounded flex items-center transition-colors whitespace-nowrap ml-4">
            Verify Connection <ChevronRight size={14} className="ml-1" />
        </button>
    </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [campaign, setCampaign] = useState<ExplorationCampaign>(ACTIVE_CAMPAIGN);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [bootStep, setBootStep] = useState('Initializing Secure Enclave...');
  const [showConnectionWarning, setShowConnectionWarning] = useState(false);

  const [hiveMind, setHiveMind] = useState<HiveMindState>({
      isScanning: false, scanGrid: [], activeAgents: ['Au'], logs: [], progress: 0, hits: 0, misses: 0
  });

  useEffect(() => {
    const bootSystem = async () => {
       setBootStep('Validating API Gateway...');
       const isConnected = await AuroraAPI.init();
       setShowConnectionWarning(!isConnected);
       
       setBootStep('Connecting to Mission Database...');
       const active = await AuroraAPI.getActiveCampaign();
       setCampaign(active);

       const savedLogo = localStorage.getItem('aurora_custom_logo');
       if (savedLogo) setCustomLogo(savedLogo);
       
       setBootStep(isConnected ? 'Backend Handshake Confirmed...' : 'Verifying Subsystem Integrity...');
       await new Promise(r => setTimeout(r, 800)); 
       
       setIsBooting(false);
    };
    bootSystem();
  }, []);

  // --- GLOBAL JOB POLLING ---
  useEffect(() => {
    const pollJobStatus = async () => {
      if (campaign.status === 'Active' && campaign.jobId) {
        try {
          const status = await AuroraAPI.getJobStatus(campaign.jobId);
          
          let updatedCampaign = { ...campaign };

          // Update progress based on backend status
          updatedCampaign.phaseProgress = status.progress;
          const phaseIndex = Math.floor(status.progress / 20);
          if (phaseIndex < CAMPAIGN_PHASES.length) {
            updatedCampaign.phaseIndex = phaseIndex;
            updatedCampaign.currentPhase = CAMPAIGN_PHASES[phaseIndex];
          }

          if (status.status === 'COMPLETED') {
            const results = await AuroraAPI.getJobResults(campaign.jobId);
            updatedCampaign = {
              ...updatedCampaign,
              status: 'Completed',
              jobId: undefined, // Clear job ID
              phaseProgress: 100,
              accuracyScore: 0.95, // Assume high accuracy on completion
              results: results.results || [],
              drillTargets: results.drillTargets || []
            };
            // Generate report in background after completion
            AuroraAPI.generateAndSaveReport(updatedCampaign);
          } else if (status.status === 'FAILED') {
            updatedCampaign = {
              ...updatedCampaign,
              status: 'Paused', // Or a new 'Failed' status
              jobId: undefined,
            };
          }
          
          setCampaign(updatedCampaign);

        } catch (error) {
          console.error("Failed to poll job status:", error);
          // If polling fails, pause the campaign to prevent infinite loops
          setCampaign(c => ({ ...c, status: 'Paused' }));
        }
      }
    };

    const intervalId = setInterval(pollJobStatus, APP_CONFIG.API.POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [campaign]);

  // --- HIVEMIND SIMULATION LOGIC ---
  useEffect(() => {
      let isEffectActive = true;
      let timer: any = null;
      if (!hiveMind.isScanning) return;
      
      const processNextSector = async () => {
          if (!isEffectActive) return;
          const sectorIdx = hiveMind.scanGrid.findIndex(s => s.status === 'pending');
          if (sectorIdx === -1) {
              setHiveMind(prev => ({ ...prev, isScanning: false, logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] HiveMind Scan Complete.`] }));
              return;
          }
          let lat = 0, lon = 0;
          try {
              const nums = campaign.targetCoordinates.match(/-?\d+(\.\d+)?/g);
              if (nums && nums.length >= 2) { lat = parseFloat(nums[0]); if (campaign.targetCoordinates.includes('S')) lat = -lat; lon = parseFloat(nums[1]); if (campaign.targetCoordinates.includes('W')) lon = -lon; }
          } catch(e) {}
          
          const currentSector = hiveMind.scanGrid[sectorIdx];
          const sectorLat = lat + ((currentSector.y - 5) * 0.05); 
          const sectorLon = lon + ((currentSector.x - 5) * 0.05);
          let hitFound = false;
          let discoveryType = '';
          await new Promise(r => setTimeout(r, 50)); 
          if (!isEffectActive) return;
          try {
              for (const agentType of hiveMind.activeAgents) {
                  const discovery = await AuroraAPI.runAgentScan(agentType as MineralAgentType, sectorLat, sectorLon, campaign.regionName);
                  if (discovery) { hitFound = true; discoveryType = discovery.resourceType; break; }
              }
          } catch (e) { console.error("Agent Scan Error:", e); }
          if (!isEffectActive) return;
          setHiveMind(prev => {
              if(!prev.isScanning) return prev;
              const newGrid = [...prev.scanGrid];
              if (sectorIdx >= 0 && sectorIdx < newGrid.length) { newGrid[sectorIdx] = { ...newGrid[sectorIdx], status: hitFound ? 'anomaly' : 'analyzed', opacity: hitFound ? 0.8 : 0.2 }; }
              const time = new Date().toLocaleTimeString();
              const newLog = hitFound ? `[${time}] >>> DISCOVERY: ${discoveryType} in Sector ${currentSector.id}!` : null;
              const updatedLogs = newLog ? [...prev.logs, newLog] : prev.logs;
              if (updatedLogs.length > 100) updatedLogs.splice(0, updatedLogs.length - 100);
              return { ...prev, scanGrid: newGrid, logs: updatedLogs, hits: prev.hits + (hitFound ? 1 : 0), misses: prev.misses + (hitFound ? 0 : 1) };
          });
      };
      timer = setTimeout(processNextSector, 50);
      return () => { isEffectActive = false; if (timer) clearTimeout(timer); };
  }, [hiveMind.isScanning, hiveMind.scanGrid, hiveMind.activeAgents, campaign.targetCoordinates, campaign.regionName]);


  const handleLaunchCampaign = async (newCampaign: ExplorationCampaign) => {
    setCampaign(newCampaign);
    await AuroraAPI.updateCampaign(newCampaign);
  };

  const handleUpdateCampaign = async (updatedCampaign: ExplorationCampaign) => {
      setCampaign(updatedCampaign);
      await AuroraAPI.updateCampaign(updatedCampaign);
  };

  const handleSwitchCampaign = async (switchedCampaign: ExplorationCampaign) => {
      setCampaign(switchedCampaign);
      await AuroraAPI.updateCampaign(switchedCampaign);
      setActiveTab('dashboard'); 
  };

  // This function is now deprecated as phase advancement is controlled by the backend job progress.
  const handleAdvancePhase = async () => {
      console.warn("handleAdvancePhase is deprecated. Phase is controlled by backend job status.");
  };

  const renderContent = () => {
    let ViewComponent: React.LazyExoticComponent<React.ComponentType<any>>;
    switch (activeTab) {
      case 'dashboard': ViewComponent = Dashboard; break;
      case 'map': ViewComponent = PlanetaryMapView; break;
      case 'portfolio': ViewComponent = PortfolioView; break;
      case 'osil': ViewComponent = OSILView; break;
      case 'seismic': ViewComponent = SeismicView; break;
      case 'ushe': ViewComponent = USHEView; break;
      case 'pcfc': ViewComponent = PCFCView; break;
      case 'tmal': ViewComponent = TMALView; break;
      case 'qse': ViewComponent = QSEView; break;
      case 'twin': ViewComponent = DigitalTwinView; break;
      case 'ietl': ViewComponent = IETLView; break;
      case 'data': ViewComponent = DataLakeView; break;
      case 'config': ViewComponent = ConfigView; break;
      default: ViewComponent = Dashboard; break;
    }
    const props: any = { campaign };

    if (ViewComponent === Dashboard) {
        Object.assign(props, { 
            onLaunchCampaign: handleLaunchCampaign, 
            onAdvancePhase: handleAdvancePhase, 
            onUpdateCampaign: handleUpdateCampaign, 
            onNavigate: setActiveTab,
            hiveMindState: hiveMind,
            setHiveMindState: setHiveMind
        });
    }
    
    if (ViewComponent === IETLView) props.customLogo = customLogo;
    if (ViewComponent === ConfigView) props.setCustomLogo = setCustomLogo;

    return (
      <ErrorBoundary>
        <Suspense fallback={<ViewLoader />}>
          <ViewComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  if (isBooting) {
     return (
        <div className="min-h-screen bg-aurora-950 flex flex-col items-center justify-center text-slate-200">
           <div className="relative mb-8"><div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-aurora-500 animate-spin"></div><div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-white">A</div></div>
           <h1 className="text-2xl font-bold tracking-widest mb-2">AURORA OSI v3</h1><p className="text-aurora-400 font-mono text-sm animate-pulse">{bootStep}</p>
           <div className="mt-12 flex space-x-8 text-xs text-slate-600 font-mono"><span className="flex items-center"><ShieldCheck size={14} className="mr-2"/> ENCRYPTION ACTIVE</span><span className="flex items-center"><Server size={14} className="mr-2"/> SOVEREIGN NODE</span></div>
        </div>
     );
  }

  return (
    <div className="flex min-h-screen bg-aurora-950 font-sans text-slate-200 selection:bg-aurora-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} customLogo={customLogo} onSwitchCampaign={handleSwitchCampaign} />
      <main className="ml-64 flex-1 flex flex-col">
        <header className="h-16 border-b border-aurora-800 bg-aurora-950/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search anomalies, coordinates, or logs..." 
              className="w-full bg-slate-900 border border-aurora-800 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-aurora-500 focus:ring-1 focus:ring-aurora-500 transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative cursor-pointer group">
              <Bell size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="flex items-center space-x-3 pl-6 border-l border-aurora-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{campaign.regionName || campaign.name}</p>
                <p className="text-xs text-aurora-500 flex items-center justify-end">
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${campaign.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                    {campaign.status}
                </p>
              </div>
              <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center border border-aurora-700">
                <User size={16} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>
        {showConnectionWarning && <ConnectionWarningBanner onNavigate={setActiveTab} />}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
