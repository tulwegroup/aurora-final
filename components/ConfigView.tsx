
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Shield, Server, DollarSign, Calculator, CheckCircle, Upload, Loader2, Image as ImageIcon, FileText, BookOpen, AlertCircle, ExternalLink, Wifi, RefreshCw, AlertTriangle, ArrowRight, Lock, CloudOff, Key, FileJson, Check, X, RotateCcw, ShieldCheck, Activity, Users, FileCode, Search, Database, Globe, Wand2, Info, XCircle, CheckCircle2 } from 'lucide-react';
import { LICENSING_PACKAGES, COMMERCIAL_ADDONS, RESOURCE_CATALOG } from '../constants';
import { PricingPackage, SystemMetrics, UserRole } from '../types';
import { AuroraAPI } from '../api';
import { APP_CONFIG } from '../config';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ConfigViewProps {
    setCustomLogo?: (logo: string | null) => void;
}

const ConfigView: React.FC<ConfigViewProps> = ({ setCustomLogo }) => {
  const [activeEndpoint, setActiveEndpoint] = useState(() => AuroraAPI.getActiveEndpoint());
  const [activeSection, setActiveSection] = useState<'system' | 'commercial' | 'catalog' | 'security'>('system');
  const [isChecking, setIsChecking] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [geeActive, setGeeActive] = useState(() => AuroraAPI.isGeePersistent());
  const [isUploadingKey, setIsUploadingKey] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [jsonPaste, setJsonPaste] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [needsHydration, setNeedsHydration] = useState(false);
  const keyUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const loadInitialData = async () => {
          await handleRefreshStatus();
          const campaigns = await AuroraAPI.getAllCampaigns();
          if (campaigns.length === 0) setNeedsHydration(true);
      };
      loadInitialData();
  }, []);

  const handleRefreshStatus = async () => {
      setIsChecking(true);
      setConnectionStatus(null);
      setConnectionError(null);
      
      const endpoint = AuroraAPI.getActiveEndpoint();
      setActiveEndpoint(endpoint);

      if (endpoint) {
          const check = await AuroraAPI.checkConnectivity();
          if (check.status === 'ONLINE') setConnectionStatus('ONLINE');
          else if (check.status === 'WARNING') {
              setConnectionStatus('RESTRICTED');
              setConnectionError(check.message || 'Server reachable but access may be restricted (CORS/Auth).');
          } else {
              setConnectionStatus('OFFLINE');
              setConnectionError(check.message || 'Unable to reach server.');
          }
      } else {
          setConnectionStatus('OFFLINE');
          setConnectionError('Running in Sovereign (Offline) Mode. No backend URL configured.');
      }
      
      const status = await AuroraAPI.getSystemStatus();
      setGeeActive(status?.gee_initialized || AuroraAPI.isGeePersistent());
      
      setIsChecking(false);
  };
  
  const handleUploadResponse = (res: any) => {
      if (res.status === 'success') {
          setUploadStatus({ msg: res.message || 'Service Account Verified.', type: 'success' });
          setGeeActive(true);
      } else {
          setUploadStatus({ msg: res.message || 'Invalid key or server error.', type: 'error' });
          setGeeActive(false);
      }
      setIsUploadingKey(false);
  };
  
  const processKeyUpload = async (file: File) => {
      setIsUploadingKey(true);
      setUploadStatus(null);
      const res = await AuroraAPI.uploadServiceAccount(file);
      handleUploadResponse(res);
  };
  
  const handleKeyUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          processKeyUpload(event.target.files[0]);
      }
  };

  const handleJsonPasteSubmit = async () => {
      if (!jsonPaste.trim()) {
          setUploadStatus({ msg: 'JSON content cannot be empty.', type: 'error' });
          return;
      }
      setIsUploadingKey(true);
      setUploadStatus(null);
      const res = await AuroraAPI.uploadServiceAccountText(jsonPaste);
      handleUploadResponse(res);
      setJsonPaste('');
  };

  const handleResetGee = () => {
      AuroraAPI.setGeePersistence(false);
      setGeeActive(false);
      setUploadStatus({ msg: 'GEE authentication has been reset.', type: 'success'});
  };

  const handleSeedData = async () => {
      setIsSeeding(true);
      await AuroraAPI.seedDemoData();
      setIsSeeding(false);
      setNeedsHydration(false);
  };
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const handleRemoveLogo = () => { /* ... */ };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      <div className="flex space-x-1 bg-aurora-900/30 p-1 rounded-lg w-fit border border-aurora-800">
         {/* ... (tabs) ... */}
      </div>

      {activeSection === 'system' && (
          <div className="flex flex-col gap-6">
              
              {/* --- 1. Cloud Connection Status --- */}
              <div className="bg-aurora-900/30 border border-aurora-800 rounded-xl p-6">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                            <Server size={20} className="mr-3 text-aurora-500" /> Cloud Connection Status
                         </h3>
                         <p className="text-xs text-slate-500 max-w-lg">
                            The frontend automatically detects the backend server when running in a cloud environment. 
                            If connected, provide GEE credentials below to enable live data.
                         </p>
                      </div>
                      <button onClick={handleRefreshStatus} disabled={isChecking} className="bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-lg border border-slate-700 hover:bg-slate-700 flex items-center transition-colors">
                          {isChecking ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
                          Refresh Status
                      </button>
                   </div>
                   
                   <div className="mt-6 bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between gap-4">
                       <div>
                           <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Auto-Detected Backend URL</label>
                           <code className="text-sm font-mono text-aurora-400 break-all">{activeEndpoint || 'N/A (Sovereign Mode)'}</code>
                       </div>
                       <div className="text-right">
                           {isChecking ? (
                               <div className="flex items-center space-x-2 text-slate-500 font-bold text-sm"><Loader2 size={16} className="animate-spin" /><span>CHECKING...</span></div>
                           ) : connectionStatus === 'ONLINE' ? (
                               <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm"><CheckCircle size={16}/><span>CONNECTED</span></div>
                           ) : connectionStatus === 'RESTRICTED' ? (
                               <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm"><AlertTriangle size={16}/><span>RESTRICTED</span></div>
                           ) : (
                               <div className="flex items-center space-x-2 text-red-400 font-bold text-sm"><XCircle size={16}/><span>OFFLINE</span></div>
                           )}
                       </div>
                   </div>
                   {connectionError && <p className="text-xs text-red-400 mt-2 font-mono">{connectionError}</p>}
              </div>

              {/* --- 2. GEE Integration --- */}
              <div className="bg-aurora-900/30 border border-aurora-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Key size={20} className="mr-3 text-aurora-accent" /> Google Earth Engine (GEE) Integration
                  </h3>
                  
                  {geeActive ? (
                      <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-xl flex flex-col items-center text-center">
                          <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
                          <h4 className="text-lg font-bold text-white">GEE Authentication Active</h4>
                          <p className="text-xs text-emerald-200/70 mb-6">Live satellite data streams are enabled for all relevant modules.</p>
                          <button onClick={handleResetGee} className="bg-red-900/50 hover:bg-red-800 text-white text-xs font-bold py-2 px-4 rounded border border-red-500/50 flex items-center transition-colors">
                              <RotateCcw size={14} className="mr-2"/> Reset Authentication
                          </button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Paste JSON */}
                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col">
                              <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center"><FileJson size={14} className="mr-2"/> Paste Service Account JSON</label>
                              <textarea 
                                  value={jsonPaste} 
                                  onChange={(e) => setJsonPaste(e.target.value)}
                                  placeholder='{ "type": "service_account", ... }'
                                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none font-mono resize-none focus:border-aurora-500" 
                              />
                              <button onClick={handleJsonPasteSubmit} disabled={isUploadingKey} className="w-full mt-3 bg-aurora-600 hover:bg-aurora-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center disabled:opacity-50">
                                  {isUploadingKey ? <Loader2 size={14} className="animate-spin mr-2"/> : <ShieldCheck size={14} className="mr-2"/>}
                                  Authenticate
                              </button>
                          </div>
                          {/* OR Upload File */}
                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                              <p className="text-xs text-slate-400 mb-4">Or upload the key file directly:</p>
                              <input type="file" ref={keyUploadRef} onChange={handleKeyUpload} accept=".json" className="hidden" />
                              <button onClick={() => keyUploadRef.current?.click()} disabled={isUploadingKey} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg text-sm font-bold border border-slate-700 flex items-center justify-center transition-colors">
                                  <Upload size={16} className="mr-2" /> Upload JSON File
                              </button>
                          </div>
                      </div>
                  )}
                  {uploadStatus && (
                      <div className={`mt-4 p-3 rounded text-xs font-mono flex items-center ${uploadStatus.type === 'success' ? 'bg-emerald-900/20 text-emerald-300' : 'bg-red-900/20 text-red-300'}`}>
                          {uploadStatus.type === 'success' ? <Check size={14} className="mr-2"/> : <X size={14} className="mr-2"/>}
                          {uploadStatus.msg}
                      </div>
                  )}
              </div>
          </div>
      )}
      {/* ... (other sections are unchanged) ... */}
    </div>
  );
};

export default ConfigView;
