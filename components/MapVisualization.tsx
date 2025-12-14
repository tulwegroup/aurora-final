
import React, { useEffect, useRef, useState } from 'react';
import { Anomaly, ScanSector, DiscoveryRecord } from '../types';
import { Target, Zap, Radius, Layers, Maximize, History, Database, Box } from 'lucide-react';
import { AuroraAPI } from '../api';

interface ReportTarget {
    id: string;
    lat: number;
    lon: number;
    label: string;
    type: string;
    depth?: number;
    priority?: string;
}

interface MapVisualizationProps {
  anomalies: Anomaly[];
  onSelectAnomaly: (anomaly: Anomaly) => void;
  selectedAnomaly: Anomaly | null;
  scanRadius?: number; // km
  isGEEActive?: boolean;
  centerCoordinates?: string; // "lat, lon" string
  reportTargets?: ReportTarget[];
  scanGrid?: ScanSector[];
  showHistory?: boolean;
  historyData?: DiscoveryRecord[]; // OPTIONAL: Pass data directly to avoid double fetch
  className?: string; // Allow override of height/width
  autoFit?: boolean; // If true, map will zoom to fit all markers instead of centering on coordinates
}

// Helper to determine specific units
const getResourceUnit = (resourceType: string): string => {
    const r = resourceType.toLowerCase();
    if (r.includes('gold') || r.includes('au')) return 'Moz'; // Million Ounces
    if (r.includes('lithium') || r.includes('li')) return 'Mt LCE'; // Lithium Carbonate Equivalent
    if (r.includes('oil') || r.includes('hydrocarbon')) return 'MMbbl'; // Million Barrels
    if (r.includes('gas') || r.includes('helium')) return 'Bcf'; // Billion Cubic Feet
    if (r.includes('water')) return 'GL'; // Gigaliters
    return 'Mt'; // Default Million Tonnes
};

const MapVisualization: React.FC<MapVisualizationProps> = React.memo(({ 
    anomalies, 
    onSelectAnomaly, 
    selectedAnomaly, 
    scanRadius = 50, 
    isGEEActive,
    centerCoordinates,
    reportTargets = [],
    scanGrid = [],
    showHistory = true,
    historyData,
    className = "h-[500px]",
    autoFit = false
}) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const gridRef = useRef<any[]>([]);
  const historyRef = useRef<any[]>([]);
  
  const [internalHistory, setInternalHistory] = useState<DiscoveryRecord[]>([]);
  
  // Use passed history data if available, otherwise use internal state
  const effectiveHistory = historyData || internalHistory;

  // Inventory Stats for HUD
  const inventory = effectiveHistory.reduce((acc, curr) => {
      const type = curr.resourceType.split(' ')[0]; // e.g. "Gold" from "Gold (Au)"
      if (!acc[type]) acc[type] = { count: 0, vol: 0, unit: getResourceUnit(curr.resourceType) };
      acc[type].count += 1;
      acc[type].vol += curr.volume;
      return acc;
  }, {} as Record<string, {count: number, vol: number, unit: string}>);

  // Parse Center Coordinates
  const getCenter = () => {
      if (!centerCoordinates) return [0, 0];
      const nums = centerCoordinates.match(/-?\d+(\.\d+)?/g);
      if (nums && nums.length >= 2) {
          let lat = parseFloat(nums[0]);
          let lon = parseFloat(nums[1]);
          if (centerCoordinates.includes('S') && lat > 0) lat = -lat;
          if (centerCoordinates.includes('W') && lon > 0) lon = -lon;
          return [lat, lon];
      }
      return [0, 0];
  };

  const [centerLat, centerLon] = getCenter();

  // Initialize Map
  useEffect(() => {
      if (!mapContainerRef.current) return;
      if (mapRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLon],
          zoom: 10,
          zoomControl: true, // Enabled Zoom Controls
          attributionControl: false
      });

      // Use Esri World Imagery for Realism
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri'
      }).addTo(map);

      // Add Range Rings
      if (!autoFit) {
          L.circle([centerLat, centerLon], {
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.05,
              radius: (scanRadius || 50) * 1000,
              weight: 1,
              dashArray: '5, 10'
          }).addTo(map);
      }

      mapRef.current = map;

      return () => {
          map.remove();
          mapRef.current = null;
      };
  }, []);

  // Load Global History (Only if not provided via props)
  useEffect(() => {
      if (historyData) return; // Skip if props provided

      const loadHistory = async () => {
          const history = await AuroraAPI.getGlobalDiscoveries();
          setInternalHistory(history);
      };
      if (showHistory) {
          loadHistory();
          const interval = setInterval(loadHistory, 5000);
          return () => clearInterval(interval);
      }
  }, [showHistory, historyData]);

  // Update View on Center Change (Only if NOT auto-fitting)
  useEffect(() => {
      if(mapRef.current && !autoFit) {
          mapRef.current.setView([centerLat, centerLon], 10, { animate: true });
      }
  }, [centerLat, centerLon, autoFit]);

  // Render Global History (Persistent Layer)
  useEffect(() => {
      if (!mapRef.current || !showHistory) return;
      const L = (window as any).L;

      // Clear existing history markers
      historyRef.current.forEach(m => mapRef.current.removeLayer(m));
      historyRef.current = [];

      const bounds = L.latLngBounds([]);

      effectiveHistory.forEach(record => {
          let color = '#ffffff';
          let typeLabel = 'Unknown';

          if (record.resourceType.includes('Gold') || record.resourceType.includes('Au')) {
              color = '#fbbf24'; // Yellow
              typeLabel = 'Precious Metal';
          } else if (record.resourceType.includes('Lithium') || record.resourceType.includes('Li')) {
              color = '#c084fc'; // Purple
              typeLabel = 'Battery Metal';
          } else if (record.resourceType.includes('Hydrocarbon') || record.resourceType.includes('Oil')) {
              color = '#ef4444'; // Red
              typeLabel = 'Energy';
          } else if (record.resourceType.includes('Water')) {
              color = '#38bdf8'; // Blue
              typeLabel = 'Aquifer';
          }

          const radius = 6 + (Math.log(Math.max(1, record.volume)) * 1.5);
          const unit = getResourceUnit(record.resourceType);

          const marker = L.circleMarker([record.lat, record.lon], {
              radius: radius,
              color: '#ffffff',
              weight: 1,
              fillColor: color,
              fillOpacity: 0.9,
              className: 'discovery-pulse' 
          }).addTo(mapRef.current);

          if (record.grade > 5.0 || record.volume > 100) {
               const glow = L.circleMarker([record.lat, record.lon], {
                  radius: radius + 4,
                  color: 'transparent',
                  fillColor: color,
                  fillOpacity: 0.2,
              }).addTo(mapRef.current);
              historyRef.current.push(glow);
          }

          // Rich Popup with Specific Units and Region Name
          marker.bindPopup(`
              <div class="font-sans text-slate-200 min-w-[220px]">
                  <div class="text-xs font-bold text-slate-400 uppercase mb-1 flex justify-between">
                      <span>${typeLabel}</span>
                      <span class="text-white">${new Date(record.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div class="text-sm font-bold text-white mb-2 pb-2 border-b border-slate-700">
                      ${record.resourceType}
                  </div>
                  <div class="text-xs text-emerald-400 mb-2 font-bold">${record.regionName}</div>
                  <div class="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                          <span class="text-slate-500 block">Est. Volume</span>
                          <span class="text-emerald-400 font-mono font-bold">${record.volume.toFixed(1)} ${unit}</span>
                      </div>
                      <div>
                          <span class="text-slate-500 block">Est. Grade</span>
                          <span class="text-amber-400 font-mono font-bold">${record.grade.toFixed(2)}</span>
                      </div>
                      <div>
                          <span class="text-slate-500 block">Depth</span>
                          <span class="text-white font-mono">${record.depth.toFixed(0)}m</span>
                      </div>
                      <div>
                          <span class="text-slate-500 block">Confidence</span>
                          <span class="text-white font-mono">${(record.confidence * 100).toFixed(0)}%</span>
                      </div>
                  </div>
                  <div class="text-[10px] text-slate-500 font-mono truncate">ID: ${record.id}</div>
              </div>
          `, { className: 'custom-popup-dark' });

          historyRef.current.push(marker);
          bounds.extend([record.lat, record.lon]);
      });

      // Auto Fit Logic
      if (autoFit && effectiveHistory.length > 0) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }

  }, [effectiveHistory, showHistory, autoFit]);

  // Render Scanning Grid (HiveMind)
  useEffect(() => {
      if(!mapRef.current) return;
      const L = (window as any).L;

      gridRef.current.forEach(l => mapRef.current.removeLayer(l));
      gridRef.current = [];

      if (scanGrid.length > 0) {
          const radiusDeg = (scanRadius || 50) / 111;
          const latStep = (radiusDeg * 2) / 10;
          const lonStep = (radiusDeg * 2) / 10;

          scanGrid.forEach(sector => {
              if (sector.status === 'pending') return;

              const sLat = (centerLat + radiusDeg) - (sector.y * latStep);
              const sLon = (centerLon - radiusDeg) + (sector.x * lonStep);
              
              const color = sector.status === 'scanning' ? '#22d3ee' : sector.status === 'anomaly' ? '#f59e0b' : '#10b981';
              const opacity = sector.status === 'scanning' ? 0.4 : 0.1;

              const rect = L.rectangle([
                  [sLat, sLon],
                  [sLat - latStep, sLon + lonStep]
              ], {
                  color: color,
                  weight: 1,
                  fillColor: color,
                  fillOpacity: opacity
              }).addTo(mapRef.current);
              
              gridRef.current.push(rect);
          });
      }

  }, [scanGrid, centerLat, centerLon, scanRadius]);

  return (
    <div className={`relative w-full bg-slate-950 rounded-xl overflow-hidden border border-aurora-800 shadow-2xl group ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      <style>{`
        .leaflet-popup-content-wrapper {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            color: #e2e8f0;
            padding: 0;
            overflow: hidden;
        }
        .leaflet-popup-tip {
            background: #334155;
        }
        .leaflet-popup-content {
            margin: 12px;
        }
        .leaflet-container a.leaflet-popup-close-button {
            color: #94a3b8;
        }
        /* Style for zoom controls if needed to match dark theme */
        .leaflet-bar a {
            background-color: #1e293b;
            color: #e2e8f0;
            border-bottom: 1px solid #334155;
        }
        .leaflet-bar a:hover {
            background-color: #334155;
        }
      `}</style>

      {/* Top Left: Controls - MOVED to BOTTOM LEFT to avoid collision with Dashboard Overlay */}
      <div className="absolute bottom-6 left-4 z-[400] flex flex-col space-y-2 pointer-events-none">
         <div className={`backdrop-blur-sm border rounded-lg px-3 py-1 text-xs font-mono flex items-center shadow-lg ${
             isGEEActive 
             ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10' 
             : 'bg-black/80 border-aurora-800 text-aurora-400'
         }`}>
           <Target size={12} className="mr-2 animate-pulse" /> {isGEEActive ? 'LIVE SATELLITE FEED' : 'TACTICAL MAP'}
         </div>
         
         {!autoFit && (
             <div className="bg-aurora-900/80 backdrop-blur-sm border border-aurora-700 rounded-lg px-3 py-1 text-xs font-mono text-emerald-400 flex items-center">
                 <Radius size={12} className="mr-2" />
                 RADIUS: {scanRadius} KM
             </div>
         )}
         
         {showHistory && effectiveHistory.length > 0 && (
             <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1 text-xs font-mono text-amber-400 flex items-center">
                 <History size={12} className="mr-2" />
                 HIVE MEMORY: {effectiveHistory.length} SITES
             </div>
         )}
      </div>

      {/* Top Right: Planetary Inventory HUD (New) */}
      {autoFit && effectiveHistory.length > 0 && (
          <div className="absolute top-4 right-4 z-[400] bg-slate-950/90 backdrop-blur border border-aurora-700 rounded-lg p-3 shadow-2xl min-w-[180px]">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-1 mb-2 flex items-center">
                  <Box size={10} className="mr-1" /> Resource Inventory
              </h4>
              <div className="space-y-1.5">
                  {Object.entries(inventory).map(([type, stats]) => {
                      const data = stats as { count: number; vol: number; unit: string };
                      return (
                      <div key={type} className="flex justify-between items-center text-xs">
                          <span className={`font-bold ${type.includes('Gold') ? 'text-yellow-400' : type.includes('Lithium') ? 'text-purple-400' : type.includes('Hydrocarbon') ? 'text-red-400' : 'text-white'}`}>
                              {type}
                          </span>
                          <div className="text-right">
                              <span className="text-white font-mono">{data.vol.toFixed(0)}</span>
                              <span className="text-[9px] text-slate-500 ml-1">{data.unit}</span>
                          </div>
                      </div>
                  )})}
              </div>
          </div>
      )}

      {/* Bottom Right: Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-900/80 backdrop-blur p-2 rounded-lg border border-slate-700 text-[10px] text-slate-400 font-mono">
          {!autoFit && (
              <>
                <div className="font-bold text-slate-300 mb-1 border-b border-slate-700 pb-1">Current Mission</div>
                <div className="flex items-center space-x-2 mb-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span>CONFIRMED (&gt;70%)</span></div>
                <div className="flex items-center space-x-2 mb-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span>POSSIBLE (40-70%)</span></div>
              </>
          )}
          
          {showHistory && (
              <>
                  <div className="font-bold text-slate-300 mt-2 mb-1 border-b border-slate-700 pb-1">Discovery Type</div>
                  <div className="flex items-center space-x-2 mb-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div><span>GOLD/PRECIOUS</span></div>
                  <div className="flex items-center space-x-2 mb-1"><div className="w-2 h-2 rounded-full bg-purple-400"></div><span>LITHIUM/BATTERY</span></div>
                  <div className="flex items-center space-x-2 mb-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span>HYDROCARBONS</span></div>
              </>
          )}
      </div>
    </div>
  );
});

export default MapVisualization;
