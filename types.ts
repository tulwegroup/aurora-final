

export type AppView = 'dashboard' | 'map' | 'portfolio' | 'osil' | 'seismic' | 'ushe' | 'pcfc' | 'tmal' | 'qse' | 'twin' | 'ietl' | 'data' | 'config';

export type MineralAgentType = 'Au' | 'Li' | 'Cx';

export enum SystemStatus {
  ONLINE = 'ONLINE',
  PROCESSING = 'PROCESSING',
  OFFLINE = 'OFFLINE',
  WARNING = 'WARNING'
}

export interface ScanSector {
    id: number;
    x: number;
    y: number;
    status: 'pending' | 'scanning' | 'analyzed' | 'anomaly';
    opacity: number;
}

export interface HiveMindState {
    isScanning: boolean;
    scanGrid: ScanSector[];
    activeAgents: MineralAgentType[];
    logs: string[];
    progress: number;
    hits: number;
    misses: number;
}

export interface DiscoveryRecord {
    id: string;
    lat: number;
    lon: number;
    resourceType: string;
    grade: number;
    depth: number;
    volume: number;
    confidence: number;
    agentVersion: string;
    timestamp: string;
    regionName: string;
}

export interface AgentResult {
    found: boolean;
    discovery?: DiscoveryRecord;
    rawSignal?: {
        gravity: number;
        magnetic: number;
        thermal: number;
        spectral: number;
    };
}

export interface Satellite {
    id: string;
    name: string;
    type: string;
    orbit: string;
    status: SystemStatus;
    lastPass: string;
    coverage: number;
}

export interface Anomaly {
    id: string;
    coordinates: number[]; // [lat, lon]
    depth: number;
    probability: number;
    type: string;
    description: string;
    physicsResidual: number;
    status: string;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    subsystem: string;
    message: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
}

export interface QuantumJob {
    id: string;
    targetRegion: string;
    qubitsUsed: number;
    status: 'Queued' | 'Running' | 'Completed' | 'Failed';
    progress: number;
}

export interface Qubit {
    id: string;
    row: number;
    col: number;
    coherenceTime: number;
    gateFidelity: number;
    status: 'Active' | 'Idle' | 'Calibrating' | 'Error';
}

export interface IngestionStream {
    id: string;
    source: string;
    type: string;
    throughput: number;
    status: SystemStatus;
    domain: 'Land' | 'Marine';
    stages: { name: string; status: string; progress: number }[];
}

export interface CausalNode {
    id: string;
    label: string;
    type: 'observable' | 'hidden' | 'physics';
    confidence: number;
    parents: string[];
    x: number;
    y: number;
}

export interface SeepageNode {
    id: string;
    label: string;
    type: 'Source' | 'Carrier' | 'Trap' | 'Seep';
    depth: number;
    pressure: number;
    probability: number;
    x: number;
    y: number;
    next: string[];
}

export interface LatentPoint {
    id: string;
    x: number;
    y: number;
    z: number;
    cluster: string;
    realLat: number;
    realLon: number;
    realDepth: number;
    grade: number;
    volume: number;
}

export interface NeuralModule {
    id: string;
    name: string;
    architecture: string;
    function: string;
    inputShape: string;
    status: string;
    loss: number;
    accuracy: number;
}

export interface IntelReport {
    id: string;
    title: string;
    date: string;
    region: string;
    priority: 'Low' | 'Medium' | 'High';
    summary: string;
    tags: string[];
    status: 'Draft' | 'Published' | 'Verified';
    validation?: ValidationReport;
}

export interface ValidationReport {
    status: 'APPROVED' | 'REJECTED';
    signature: string;
    agents: {
        methodology: { status: string };
        coverage: { status: string; coverage_pct: number };
        verifier: { status: string; unsupported_claims: string[] };
    };
}

export interface TaskingRequest {
    id: string;
    targetCoordinates: string;
    sensorType: string;
    priority: 'Routine' | 'Urgent' | 'Emergency';
    status: 'Pending' | 'Scheduled' | 'Completed';
    requestor: string;
    submittedAt: string;
}

export interface DataObject {
    id: string;
    name: string;
    bucket: 'Raw' | 'Processed' | 'Results' | 'Archive';
    size: string;
    type: string;
    lastModified: string;
    owner: string;
    status?: string;
}

export interface TimeSeriesPoint {
    date: string;
    deformation: number;
    thermalInertia: number;
    coherence: number;
}

export interface GravitySpectrum {
    wavelength: string;
    power: number;
    depthEstimate: string;
}

export const CAMPAIGN_PHASES = ['Acquisition', 'Harmonization', 'Inversion', 'Validation', 'Appraisal'] as const;

export interface ExplorationCampaign {
    id: string;
    name: string;
    targetCoordinates: string;
    regionName: string;
    resourceType: string;
    targetElement: string;
    targets: { resourceType: string; targetElement: string }[];
    results: TargetResult[];
    drillTargets: DrillTarget[];
    environment?: 'Land' | 'Marine';
    radius: number;
    dataVolumeEstimate: number;
    currentPhase: typeof CAMPAIGN_PHASES[number];
    phaseIndex: number;
    phaseProgress: number;
    startDate: string;
    estimatedCompletion?: string;
    accuracyScore: number;
    status: 'Active' | 'Completed' | 'Paused';
    iteration: number;
    priorsLoaded: boolean;
    autoPlay?: boolean;
    jobId?: string; // Links campaign to a backend job
}

export interface TargetResult {
    element: string;
    resourceType: string;
    status: 'Pending' | 'Confirmed' | 'Possible' | 'Absent';
    probability: number;
    specifications: {
        grade?: number;
        tonnage?: number;
        depth?: number;
        purity?: number;
        estimatedReserves?: number;
        pressure?: number;
        porosity?: number;
    };
}

export interface DrillTarget {
    id: string;
    description: string;
    lat: number;
    lon: number;
    depth: number;
    priority: string;
}

export interface Voxel {
    id: string;
    x: number;
    y: number;
    z: number;
    lithology: string;
    density: number;
    mineralProb: number;
    uncertainty: number;
}

export interface PricingPackage {
    id: string;
    name: string;
    scope: string;
    features: string[];
    priceMin: number;
    priceMax: number;
    unit: string;
}

export interface PricingAddOn {
    id: string;
    name: string;
    price: number;
    unit: string;
    type: string;
    description: string;
}

export interface DrillRecord {
    id: string;
    lat: number;
    lon: number;
    depth_m: number;
    measurement_value: number;
    measurement_unit: string;
    lithology: string;
    sample_date: string;
    source: string;
    license: string;
    notes: string;
}

export interface CalibrationLog {
    id: string;
    user: string;
    region_id: string;
    timestamp: string;
    reference_count: number;
    model_version_before: string;
    model_version_after: string;
    metrics_delta: { r2: number; rmse: number };
}

export interface PortfolioSummary {
    summary: {
        total_npv_usd: number;
        asset_count: number;
        total_diesel_saved_l: number;
        total_water_saved_m3: number;
    };
    assets: PortfolioAsset[];
}

export interface PortfolioAsset {
    id: string;
    name: string;
    type: string;
    status: {
        risk_profile: 'Low' | 'Medium' | 'High';
        lifecycle_stage: string;
    };
    economics: {
        npv_usd: number;
        roi_percent: number;
        gross_value_usd: number;
    };
    esg: {
        carbon_intensity: number;
    };
}

export interface ConnectivityResult {
    status: SystemStatus;
    mode: 'Sovereign' | 'Cloud';
    message?: string;
}

export interface SystemMetrics {
    status: 'healthy' | 'degraded';
    avg_latency_ms: number;
    error_rate: number;
}

export type UserRole = 'admin' | 'viewer' | 'analyst';

export type SeismicAxis = 'inline' | 'crossline' | 'timeslice';

export interface SeismicSlice {
    width: number;
    height: number;
    data: number[][]; // 2D array of amplitudes
    uncertainty: number[][];
    horizons: { depth: number[], label: string, confidence: number }[];
    faults: { x: number, y1: number, y2: number, throw: number }[];
    axis: SeismicAxis;
    index: number;
}

export interface SeismicJob {
    id: string;
    status: 'Ingesting' | 'Harmonizing' | 'Inverting' | 'Synthesizing' | 'Completed' | 'Failed';
    progress: number;
    currentTask: string;
    logs: string[];
    artifacts: any;
}

export interface SeismicTrap {
    id: string;
    name: string;
    type: string;
    confidence: number;
    volumetrics: number;
    coordinates: { x: number, y: number, z: number };
}

export interface DeliverableArtifact {
    id: string;
    name: string;
    type: string;
    url: string;
}