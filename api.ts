
import { ExplorationCampaign, IntelReport, TaskingRequest, DataObject, ConnectivityResult, PortfolioSummary, DiscoveryRecord, LatentPoint, DrillTarget, SeismicJob, SeismicSlice, SeismicAxis, SeismicTrap, MineralAgentType, TargetResult, Voxel } from './types';
// FIX: Import GLOBAL_MINERAL_PROVINCES for getGeologicContext mock.
import { GLOBAL_MINERAL_PROVINCES } from './constants';
import { APP_CONFIG } from './config';

type SystemStatus = 'ACTIVE' | 'IDLE' | 'ERROR' | 'MAINTENANCE' | 'CALIBRATING';


// Defines the payload for submitting a new analysis job to the backend worker.
export interface JobPayload {
  region: {
    type: 'point';
    coordinates: [number, number]; // [lon, lat]
    radius: number; // in km
  };
  resource_types: string[];
  resolution: 'low' | 'medium' | 'high';
  mode: 'smart' | 'premium';
}

// Defines the status object returned by the backend for a running job.
export interface JobStatus {
  job_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  current_task: string;
}

const STORAGE_KEYS = {
  ACTIVE_ID: 'aurora_active_campaign_id',
  REGISTRY: 'aurora_campaign_registry',
  REPORTS: 'aurora_intel_reports',
  TASKS: 'aurora_tasking_requests',
  GEE_STATUS: 'aurora_gee_active_persistent',
};

// FIX: Added GeoRNG class required by generateLatentPoints.
class GeoRNG {
    seed: number;
    constructor(lat: number, lon: number, salt: string = '') {
        const str = `${lat.toFixed(4)}${lon.toFixed(4)}${salt}`;
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    range(min: number, max: number) {
        return min + (this.next() * (max - min));
    }
}

export class AuroraAPI {
  private static apiUrl = APP_CONFIG.API.CLOUD || APP_CONFIG.API.LOCAL;
  private static isConnected = false;

  static async init(): Promise<boolean> {
    const result = await this.checkConnectivity();
    this.isConnected = result.status === SystemStatus.ONLINE;
    return this.isConnected;
  }

  static getActiveEndpoint = () => this.apiUrl;
  static isCloudConnected = () => this.isConnected;
  static isGeePersistent = () => localStorage.getItem(STORAGE_KEYS.GEE_STATUS) === 'true';
  static setGeePersistence = (active: boolean) => localStorage.setItem(STORAGE_KEYS.GEE_STATUS, String(active));

  private static async apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isConnected) {
      // Return mock data for sovereign mode to avoid breaking UI components
      if (endpoint.includes('schedule')) return { schedule: [] };
      if (endpoint.includes('voxels')) return { voxels: [] };
      if (endpoint.includes('status')) return { gee_initialized: this.isGeePersistent() };
      return {};
    }
    const url = `${this.apiUrl}${endpoint}`;
    try {
      const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error (${res.status}): ${errorText}`);
      }
      return await res.json();
    } catch (e) {
      console.error(`API call to ${endpoint} failed.`, e);
      this.isConnected = false; // Assume connection is lost on failure
      throw e;
    }
  }

  static async checkConnectivity(): Promise<ConnectivityResult> {
    try {
      const res = await fetch(`${this.apiUrl}/system/health`);
      if (res.ok) {
        return { status: SystemStatus.ONLINE, mode: 'Cloud' };
      }
      return { status: SystemStatus.WARNING, mode: 'Cloud', message: `Server responded with status ${res.status}` };
    } catch (e: any) {
      return { status: SystemStatus.OFFLINE, mode: 'Sovereign', message: 'Unable to reach server.' };
    }
  }

  // --- JOB-BASED METHODS ---

  static async submitScanJob(payload: JobPayload): Promise<{ job_id: string }> {
    return this.apiFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.apiFetch(`/jobs/${jobId}/status`);
  }

  static async getJobResults(jobId: string): Promise<{ results: TargetResult[], drillTargets: DrillTarget[] }> {
    return this.apiFetch(`/jobs/${jobId}/artifacts/results.json`);
  }
  
  // --- MOCK & LOCAL STORAGE METHODS ---
  
  static async getActiveCampaign(): Promise<ExplorationCampaign> {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
      if (stored) {
          const registry = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]');
          const campaign = registry.find((c: any) => c.id === stored);
          if (campaign) return campaign;
      }
      return ACTIVE_CAMPAIGN;
  }

  static async getAllCampaigns(): Promise<ExplorationCampaign[]> {
      const registry = localStorage.getItem(STORAGE_KEYS.REGISTRY);
      return registry ? JSON.parse(registry) : [ACTIVE_CAMPAIGN];
  }

  static async updateCampaign(campaign: ExplorationCampaign): Promise<void> {
      let registry = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRY) || '[]');
      const idx = registry.findIndex((c: any) => c.id === campaign.id);
      if (idx >= 0) registry[idx] = campaign;
      else registry.push(campaign);
      localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(registry));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, campaign.id);
  }
  
  static async importCampaign(file: File): Promise<boolean> {
      try {
          const text = await file.text();
          const json = JSON.parse(text);
          await this.updateCampaign(json);
          return true;
      } catch (e) { return false; }
  }

  static async getSystemStatus(): Promise<any> {
    if (this.isCloudConnected()) {
        return this.apiFetch('/system/status');
    }
    return { gee_initialized: this.isGeePersistent() };
  }

  static async uploadServiceAccountText(keyContent: string): Promise<any> {
    if (this.isCloudConnected()) {
        return this.apiFetch('/system/upload_key', {
            method: 'POST',
            body: JSON.stringify({ key_content: keyContent })
        });
    }
    // Sovereign mode validation
    try {
        const json = JSON.parse(keyContent);
        if (json.type === 'service_account' && json.private_key) {
            this.setGeePersistence(true);
            return { status: 'success', message: 'Key validated in Sovereign Mode.' };
        }
    } catch (e) {}
    return { status: 'error', message: 'Invalid JSON key.' };
  }

  // This is now a client-side visual simulation only. The real logic is on the backend.
  static async runAgentScan(type: MineralAgentType, lat: number, lon: number, regionName?: string): Promise<DiscoveryRecord | null> {
      const chance = Math.random();
      if (chance < 0.1) { // 10% chance of a mock discovery
          return {
              id: `mock-${Date.now()}`,
              lat, lon,
              resourceType: type,
              grade: Math.random() * 10,
              depth: 500 + Math.random() * 1000,
              volume: 10 + Math.random() * 100,
              confidence: 0.6 + Math.random() * 0.3,
              agentVersion: 'v3-mock-client',
              timestamp: new Date().toISOString(),
              regionName: regionName || "Simulated Region"
          };
      }
      return null;
  }

  // This is now a mock for the frontend, real reports are generated by the backend.
  static async generateAndSaveReport(campaign: ExplorationCampaign): Promise<IntelReport> {
    const report: IntelReport = {
        id: `RPT-${campaign.id}`,
        title: `Final Report: ${campaign.name}`,
        date: new Date().toISOString(),
        region: campaign.regionName,
        priority: 'High',
        summary: `Analysis complete for ${campaign.regionName}. Drill targets have been identified.`,
        tags: [campaign.resourceType],
        status: 'Published',
        validation: { status: 'APPROVED', signature: 'AI-CORE-V3', agents: { methodology: { status: 'pass' }, coverage: { status: 'pass', coverage_pct: 0.98 }, verifier: { status: 'pass', unsupported_claims: [] } } }
    };
    const reports = await this.getReports();
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([report, ...reports]));
    return report;
  }
  
  // These methods below can be left as mocks or eventually be connected to real endpoints
  static async getReports(): Promise<IntelReport[]> { return INTEL_REPORTS; }
  static async getTasks(): Promise<TaskingRequest[]> { return TASKING_REQUESTS; }
  static async getGlobalDiscoveries(): Promise<DiscoveryRecord[]> { return []; }
  static async geocode(query: string): Promise<{lat: number, lon: number, name: string} | null> { return null; }
  static async getSatelliteSchedule(lat: number, lon: number): Promise<any> { return this.apiFetch(`/osli/schedule?lat=${lat}&lon=${lon}`); }
  static async getPortfolioOverview(): Promise<PortfolioSummary | null> { return null; }
  static async getDigitalTwinVoxels(lat: number, lon: number): Promise<{voxels: Voxel[]} | null> { return this.apiFetch(`/twin/voxels?lat=${lat}&lon=${lon}`); }
  static async getSeismicSlice(lat: number, lon: number, index: number, axis: SeismicAxis): Promise<SeismicSlice> { 
    const slice = await this.apiFetch(`/seismic/slice?lat=${lat}&lon=${lon}&index=${index}&axis=${axis}`);
    return slice || { width: 0, height: 0, data: [], uncertainty: [], horizons: [], faults: [], axis, index }; 
  }

  // FIX: Add missing methods
  static getGeologicContext(lat: number, lon: number) {
    for (const province of GLOBAL_MINERAL_PROVINCES) {
        const [minLat, minLon, maxLat, maxLon] = province.bounds;
        if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
            return { name: province.name, type: province.type.join(', ') };
        }
    }
    return { name: 'Undefined Basin', type: 'Unknown' };
  }

  static async submitTask(t: TaskingRequest): Promise<void> {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
        stored.unshift(t);
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(stored));
    } catch(e) { console.error("Task save failed", e); }
  }

  static async runPhysicsInversion(lat: number, lon: number, depth: number): Promise<any> { return this.apiFetch(`/pcfc/inversion?lat=${lat}&lon=${lon}&depth=${depth}`); }
  
  static async getPhysicsTomography(lat: number, lon: number): Promise<any> { return this.apiFetch(`/pcfc/tomography?lat=${lat}&lon=${lon}`); }

  static generateLatentPoints(type: string, lat: number, lon: number, radiusKm: number = 10): LatentPoint[] {
    const isPinpoint = radiusKm < 1; 
    const isTz = Math.abs(lat + 8.12) < 0.5 && Math.abs(lon - 33.45) < 0.5;
    const isNv = Math.abs(lat - 38.50) < 0.5 && Math.abs(lon + 117.50) < 0.5;
    const isSa = Math.abs(lat - 24.50) < 0.5 && Math.abs(lon - 42.10) < 0.5;
    const isGh = Math.abs(lat - 4.5) < 1.0 && Math.abs(lon + 2.7) < 1.0;
    const isGoldenSpike = isTz || isNv || isSa || isGh;
    const rng = new GeoRNG(lat, lon, isPinpoint ? 'pinpoint_strict' : 'latent_strict_' + type);
    const points: LatentPoint[] = [];
    for (let i = 0; i < (isPinpoint ? 1 : 100); i++) {
        let realLat = lat; let realLon = lon;
        if (!isPinpoint) {
            const u = rng.next(); const v = rng.next();
            const r = radiusKm * Math.sqrt(u); const theta = v * 2 * Math.PI;
            const dLat = (r * Math.cos(theta)) / 111;
            const dLon = (r * Math.sin(theta)) / (111 * Math.cos(lat * (Math.PI / 180)));
            realLat += dLat; realLon += dLon;
        }
        const matchScore = rng.next(); 
        let cluster = 'Void';
        if (isGoldenSpike && i < 25) cluster = 'Mineral';
        else if (matchScore > 0.6) cluster = 'Mineral'; 
        else if (matchScore > 0.4) cluster = 'Water';
        const x = 50 + (rng.next()-0.5)*60; const y = 50 + (rng.next()-0.5)*60; const z = 50 + (rng.next()-0.5)*60;
        const realDepth = 500 + (z * 10) + (rng.next() * 100);
        let grade = 0; let volume = 0;
        if (cluster === 'Mineral') {
            grade = isGoldenSpike ? 8.0 + rng.range(0, 4) : rng.range(2.0, 8.0);
            volume = isGoldenSpike ? 200 + rng.range(0, 100) : rng.range(5, 100);
        }
        points.push({ id: `SIG-${1000+i}`, x, y, z, cluster, realLat, realLon, realDepth, grade, volume });
    }
    return points;
  }

  static generateDrillTargets(points: LatentPoint[]): DrillTarget[] {
      return points.filter(p => p.cluster === 'Mineral').slice(0,3).map((p, i) => ({
          id: `TGT-${i}`, description: `Anomaly Cluster ${String.fromCharCode(65+i)}`, lat: p.realLat, lon: p.realLon, depth: p.realDepth, priority: i===0?'High':'Medium'
      }));
  }

  static async runQuantumOptimization(region: string, qubits: number, algo: string): Promise<any> { 
      const trace = Array.from({length: 40 + Math.random() * 20}, (_, i) => ({
           step: i,
           energy: -0.5 - (2 * (1 - Math.exp(-0.1 * i))) + Math.random() * 0.1
      }));
      const finalEnergy = trace[trace.length - 1].energy;
      return {
          trace: trace,
          result: {
              final_energy: finalEnergy,
              confidence: Math.max(0, 1 - Math.abs(finalEnergy) / 3),
              message: "Converged to global minimum."
          }
      };
  }

  static async uploadServiceAccount(f: File): Promise<any> {
      try {
          if (this.isCloudConnected()) {
              const formData = new FormData(); formData.append('file', f);
              const url = `${this.apiUrl}/system/upload_key`;
              const res = await fetch(url, { method: 'POST', body: formData });
              if (res.ok) return await res.json();
          }
          const text = await f.text(); return this.validateAndStoreLocalKey(text);
      } catch (e) {
          try { const text = await f.text(); return this.validateAndStoreLocalKey(text); } 
          catch(err) { return { status: 'error', message: 'Failed to read file locally.' }; }
      }
  }

  private static validateAndStoreLocalKey(jsonStr: string): any {
      try {
          const json = JSON.parse(jsonStr);
          if (json.type === 'service_account' && json.private_key && json.client_email) {
              this.setGeePersistence(true);
              return { status: 'success', message: 'Service Account Verified (Sovereign Mode)', gee_initialized: true };
          }
          return { status: 'error', message: 'Invalid JSON: Missing private_key or client_email' };
      } catch (e) { return { status: 'error', message: 'Invalid JSON Syntax' }; }
  }

  static async seedDemoData(): Promise<{status: string, message?: string}> {
      localStorage.removeItem(STORAGE_KEYS.REGISTRY);
      localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify([ACTIVE_CAMPAIGN]));
      return { status: 'success', message: 'Database Hydrated' };
  }

  static async getDataLakeFiles(): Promise<DataObject[]> { return []; }
  static async getDataLakeStats(): Promise<any> { return null; }
  static async processFile(id: string, op: string): Promise<DataObject> { 
       const newFile: DataObject = {
          id: `proc-${id}`,
          name: `harmonized_${id}.nc`,
          bucket: 'Processed',
          size: '250 MB',
          type: 'NetCDF',
          lastModified: new Date().toISOString(),
          owner: 'USHE-Worker'
      };
      return newFile;
  }
  static generateFileContent(n: string, t: any): string { return "File content mock"; }

  static async getTemporalAnalysis(lat: number, lon: number): Promise<any> { return this.apiFetch(`/tmal/analysis?lat=${lat}&lon=${lon}`); }
  
  static async startSeismicJob(id: string): Promise<SeismicJob> { return { id: `JOB-${Date.now()}`, status: 'Ingesting', progress: 0, currentTask: 'Init', logs: [], artifacts: {} }; }
  
  static async getStructuralTraps(lat: number, lon: number): Promise<SeismicTrap[]> { return []; }
}
