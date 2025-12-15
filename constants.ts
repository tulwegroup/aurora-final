// Import all necessary types
import { 
    Satellite, 
    Anomaly, 
    LogEntry, 
    QuantumJob, 
    SystemStatus, 
    IngestionStream, 
    CausalNode, 
    IntelReport, 
    TaskingRequest,
    CampaignPhase,
    NeuralModule,
    Qubit
} from './types';

// ==================== CORE CONSTANTS ====================

// Campaign Phases
export const CAMPAIGN_PHASES: CampaignPhase[] = [
    'scoping', 'recon', 'drilling', 'analysis', 'reporting'
];

// Neural Modules
export const NEURAL_MODULES: NeuralModule[] = [
    {
        id: 'nm1',
        name: 'Spectral Classifier',
        type: 'classification',
        description: 'Multi-spectral pattern recognition',
        active: true,
        confidence: 92,
        status: 'online',
        icon: 'cpu'
    },
    {
        id: 'nm2',
        name: 'Geospatial Transformer',
        type: 'transform',
        description: '3D terrain feature extraction',
        active: true,
        confidence: 88,
        status: 'online',
        icon: 'layers'
    },
    {
        id: 'nm3',
        name: 'Anomaly Detector',
        type: 'regression',
        description: 'Statistical outlier detection',
        active: true,
        confidence: 95,
        status: 'online',
        icon: 'activity'
    },
    {
        id: 'nm4',
        name: 'Physics Simulator',
        type: 'generative',
        description: 'Subsurface property inference',
        active: false,
        confidence: 75,
        status: 'offline',
        icon: 'zap'
    },
    {
        id: 'nm5',
        name: 'Temporal Analyzer',
        type: 'transform',
        description: 'Time-series pattern analysis',
        active: true,
        confidence: 85,
        status: 'online',
        icon: 'activity'
    },
    {
        id: 'nm6',
        name: 'Feature Extractor',
        type: 'classification',
        description: 'High-dimensional feature detection',
        active: true,
        confidence: 90,
        status: 'online',
        icon: 'network'
    },
    {
        id: 'nm7',
        name: 'Confidence Scorer',
        type: 'regression',
        description: 'Prediction confidence estimation',
        active: false,
        confidence: 82,
        status: 'training',
        icon: 'cpu'
    },
    {
        id: 'nm8',
        name: 'Data Fusion Engine',
        type: 'generative',
        description: 'Multi-source data integration',
        active: true,
        confidence: 91,
        status: 'online',
        icon: 'layers'
    }
];

// ==================== TEMPORAL & GRAVITY DATA ====================

// Temporal Data (for TMALView.tsx)
export const TEMPORAL_DATA = [
    { timestamp: '2025-11-01', value: 0.45, anomaly: false },
    { timestamp: '2025-11-08', value: 0.52, anomaly: false },
    { timestamp: '2025-11-15', value: 0.61, anomaly: true },
    { timestamp: '2025-11-22', value: 0.58, anomaly: false },
    { timestamp: '2025-11-29', value: 0.72, anomaly: true },
    { timestamp: '2025-12-06', value: 0.65, anomaly: false },
    { timestamp: '2025-12-13', value: 0.79, anomaly: true },
    { timestamp: '2025-12-20', value: 0.68, anomaly: false }
];

// Gravity Spectrum (for TMALView.tsx)
export const GRAVITY_SPECTRUM = [
    { frequency: 0.1, amplitude: 0.25, phase: 0.1 },
    { frequency: 0.2, amplitude: 0.38, phase: 0.3 },
    { frequency: 0.3, amplitude: 0.52, phase: 0.5 },
    { frequency: 0.4, amplitude: 0.67, phase: 0.7 },
    { frequency: 0.5, amplitude: 0.85, phase: 0.9 },
    { frequency: 0.6, amplitude: 0.72, phase: 1.1 },
    { frequency: 0.7, amplitude: 0.58, phase: 1.3 },
    { frequency: 0.8, amplitude: 0.45, phase: 1.5 },
    { frequency: 0.9, amplitude: 0.32, phase: 1.7 },
    { frequency: 1.0, amplitude: 0.28, phase: 1.9 }
];
// Drill Hole Database
export const DRILL_HOLE_DATABASE = [
    { id: 'dh001', depth: 120, material: 'Quartz Vein', confidence: 0.85, anomaly: true, spectral_match: 0.92 },
    { id: 'dh002', depth: 85, material: 'Basalt', confidence: 0.78, anomaly: false, spectral_match: 0.67 },
    { id: 'dh003', depth: 210, material: 'Granite', confidence: 0.91, anomaly: false, spectral_match: 0.88 },
    { id: 'dh004', depth: 150, material: 'Mineralized Zone', confidence: 0.93, anomaly: true, spectral_match: 0.95 },
    { id: 'dh005', depth: 95, material: 'Sandstone', confidence: 0.72, anomaly: false, spectral_match: 0.71 },
    { id: 'dh006', depth: 180, material: 'Ore Body', confidence: 0.96, anomaly: true, spectral_match: 0.97 },
    { id: 'dh007', depth: 130, material: 'Shale', confidence: 0.81, anomaly: false, spectral_match: 0.79 },
    { id: 'dh008', depth: 250, material: 'Fault Zone', confidence: 0.88, anomaly: true, spectral_match: 0.90 },
];

// System Status Constants
export const SYSTEM_STATUS: Record<SystemStatus, string> = {
    ACTIVE: 'System Active',
    IDLE: 'System Idle',
    ERROR: 'System Error',
    MAINTENANCE: 'Under Maintenance',
    CALIBRATING: 'Calibrating Sensors'
};

// ==================== SATELLITE & DATA CONSTANTS ====================

// Satellite Database
export const SATELLITES: Satellite[] = [
    { id: 's1', name: 'Sentinel-1A', type: 'sar', status: 'ACTIVE', lastContact: '2025-12-14T23:45:00Z', resolution: 5 },
    { id: 's2', name: 'Sentinel-2B', type: 'optical', status: 'ACTIVE', lastContact: '2025-12-14T23:40:00Z', resolution: 10 },
    { id: 's3', name: 'Landsat 9', type: 'multispectral', status: 'ACTIVE', lastContact: '2025-12-14T23:30:00Z', resolution: 15 },
    { id: 's4', name: 'TERRA', type: 'thermal', status: 'MAINTENANCE', lastContact: '2025-12-14T22:00:00Z', resolution: 90 },
];

// Ingestion Streams (for OSILView.tsx)
export const INGESTION_STREAMS: IngestionStream[] = [
    {
        id: 'stream-s1',
        source: 'Sentinel-1 SAR',
        dataType: 'Synthetic Aperture Radar',
        status: 'ACTIVE',
        rate: 125,
        lastUpdated: '2025-12-15T04:45:00Z'
    },
    {
        id: 'stream-s2',
        source: 'Sentinel-2 MSI',
        dataType: 'Multi-Spectral Imagery',
        status: 'ACTIVE',
        rate: 85,
        lastUpdated: '2025-12-15T04:30:00Z'
    },
    {
        id: 'stream-gravity',
        source: 'GRACE-FO',
        dataType: 'Gravity Anomaly',
        status: 'CALIBRATING',
        rate: 12,
        lastUpdated: '2025-12-15T03:15:00Z'
    },
    {
        id: 'stream-thermal',
        source: 'Landsat 9 TIRS',
        dataType: 'Thermal Infrared',
        status: 'ACTIVE',
        rate: 45,
        lastUpdated: '2025-12-15T02:45:00Z'
    }
];

// ==================== QUANTUM CONSTANTS ====================

// Quantum Jobs
export const QUANTUM_JOBS: QuantumJob[] = [
    {
        id: 'qjob-001',
        name: 'Spectral Deconvolution',
        qubits: 128,
        status: 'running',
        progress: 65
    },
    {
        id: 'qjob-002',
        name: 'Anomaly Correlation',
        qubits: 256,
        status: 'queued',
        progress: 0
    },
    {
        id: 'qjob-003',
        name: 'Entanglement Mapping',
        qubits: 512,
        status: 'completed',
        progress: 100
    }
];

// Mock Qubits (for QSEView.tsx)
export const MOCK_QUBITS: Qubit[] = [
    { id: 'q1', state: '|0⟩', coherence: 0.95, temperature: 0.015, errorRate: 0.0012 },
    { id: 'q2', state: '|1⟩', coherence: 0.92, temperature: 0.018, errorRate: 0.0018 },
    { id: 'q3', state: '|+⟩', coherence: 0.88, temperature: 0.022, errorRate: 0.0023 },
    { id: 'q4', state: '|-⟩', coherence: 0.91, temperature: 0.016, errorRate: 0.0015 },
    { id: 'q5', state: '|0⟩', coherence: 0.94, temperature: 0.014, errorRate: 0.0011 },
    { id: 'q6', state: '|1⟩', coherence: 0.89, temperature: 0.020, errorRate: 0.0020 },
    { id: 'q7', state: '|+⟩', coherence: 0.93, temperature: 0.017, errorRate: 0.0016 },
    { id: 'q8', state: '|-⟩', coherence: 0.90, temperature: 0.019, errorRate: 0.0019 }
];

// ==================== RESOURCE & GEOLOGY CONSTANTS ====================

// Resource Catalog
export const RESOURCE_CATALOG = [
    { 
        id: 'res-001', 
        name: 'Gold (Au)', 
        category: 'Precious Metals',
        type: 'precious', 
        valuePerTon: 65000000, 
        rarity: 'rare', 
        applications: ['Electronics', 'Jewelry', 'Reserves'] 
    },
    { 
        id: 'res-002', 
        name: 'Copper (Cu)', 
        category: 'Base Metals',
        type: 'base', 
        valuePerTon: 9500, 
        rarity: 'common', 
        applications: ['Wiring', 'Construction', 'Electronics'] 
    },
    { 
        id: 'res-003', 
        name: 'Helium-3 (³He)', 
        category: 'Noble Gases',
        type: 'noble', 
        valuePerTon: 1400000000, 
        rarity: 'extremely-rare', 
        applications: ['Nuclear Fusion', 'Medical', 'Space Propulsion'] 
    },
    { 
        id: 'res-004', 
        name: 'Lithium (Li)', 
        category: 'Battery Metals',
        type: 'battery', 
        valuePerTon: 78000, 
        rarity: 'strategic', 
        applications: ['Batteries', 'Ceramics', 'Pharmaceuticals'] 
    },
    { 
        id: 'res-005', 
        name: 'Platinum Group (PGM)', 
        category: 'Precious Metals',
        type: 'precious', 
        valuePerTon: 32000000, 
        rarity: 'rare', 
        applications: ['Catalysts', 'Electronics', 'Medical'] 
    },
    { 
        id: 'res-006', 
        name: 'Rare Earth Elements', 
        category: 'Strategic Minerals',
        type: 'strategic', 
        valuePerTon: 120000, 
        rarity: 'critical', 
        applications: ['Magnets', 'Lasers', 'Defense'] 
    },
];

// Anomalies (for Dashboard and USHEView)
export const ANOMALIES: Anomaly[] = [
    { index: 1, wavelength: 450, z_score: 2.3, value: 0.78, severity: 'MEDIUM' },
    { index: 2, wavelength: 750, z_score: 3.8, value: 0.92, severity: 'HIGH' },
    { index: 3, wavelength: 1200, z_score: 1.9, value: 0.65, severity: 'LOW' },
    { index: 4, wavelength: 1850, z_score: 4.2, value: 0.95, severity: 'HIGH' },
    { index: 5, wavelength: 2200, z_score: 2.1, value: 0.72, severity: 'MEDIUM' },
];

// Global Mineral Provinces
export const GLOBAL_MINERAL_PROVINCES = [
    { id: 'prov-001', name: 'West African Craton', type: 'Gold', confidence: 0.92 },
    { id: 'prov-002', name: 'Andean Copper Belt', type: 'Copper', confidence: 0.88 },
    { id: 'prov-003', name: 'African Rift Valley', type: 'Helium', confidence: 0.95 },
    { id: 'prov-004', name: 'Bushveld Complex', type: 'PGM', confidence: 0.96 },
    { id: 'prov-005', name: 'Chilean Nitrate Fields', type: 'Nitrate', confidence: 0.85 }
];

// ==================== CAMPAIGN & MISSION CONSTANTS ====================

// Active Campaign
export const ACTIVE_CAMPAIGN = {
    id: 'camp-001',
    name: 'Ghana Jubilee Offshore Analysis',
    description: 'Deepwater hydrocarbon prospect evaluation',
    region: 'Ghana Offshore',
    startDate: '2025-12-01',
    endDate: '2026-03-31',
    budget: 2500000,
    status: 'active' as const
};

// Intel Reports
export const INTEL_REPORTS: IntelReport[] = [
    {
        id: 'intel-001',
        title: 'Subsurface Anomaly Detected',
        confidence: 0.87,
        timestamp: '2025-12-14T10:30:00Z',
        source: 'Sentinel-2 Analysis',
        summary: 'Spectral signature indicates potential hydrocarbon accumulation'
    },
    {
        id: 'intel-002',
        title: 'Geochemical Correlation Match',
        confidence: 0.92,
        timestamp: '2025-12-13T14:20:00Z',
        source: 'Core Sample Analysis',
        summary: 'Elemental ratios match known productive reservoirs'
    }
];

// Tasking Requests
export const TASKING_REQUESTS: TaskingRequest[] = [
    {
        id: 'task-001',
        priority: 'high',
        status: 'pending',
        requestedAt: '2025-12-14T14:00:00Z'
    },
    {
        id: 'task-002',
        priority: 'medium',
        status: 'approved',
        requestedAt: '2025-12-13T09:30:00Z',
        completedAt: '2025-12-14T11:45:00Z'
    }
];

// ==================== PCFC & CAUSAL ANALYSIS CONSTANTS ====================

// Causal Nodes (for PCFCView.tsx)
export const CAUSAL_NODES: CausalNode[] = [
    {
        id: 'node-001',
        name: 'Subsurface Permeability',
        type: 'cause',
        strength: 0.87,
        connections: ['node-002', 'node-003']
    },
    {
        id: 'node-002',
        name: 'Mineral Precipitation',
        type: 'effect',
        strength: 0.92,
        connections: ['node-001']
    },
    {
        id: 'node-003',
        name: 'Thermal Gradient',
        type: 'cause',
        strength: 0.78,
        connections: ['node-002', 'node-004']
    },
    {
        id: 'node-004',
        name: 'Fluid Migration',
        type: 'mediator',
        strength: 0.85,
        connections: ['node-001', 'node-003']
    }
];

// Seepage Network (for PCFCView.tsx)
export const SEEPAGE_NETWORK = [
    { depth: 0, seepage: 0.2, anomaly: false },
    { depth: 50, seepage: 0.3, anomaly: false },
    { depth: 100, seepage: 0.5, anomaly: true },
    { depth: 150, seepage: 0.8, anomaly: true },
    { depth: 200, seepage: 0.6, anomaly: false },
    { depth: 250, seepage: 0.4, anomaly: false },
    { depth: 300, seepage: 0.7, anomaly: true },
    { depth: 350, seepage: 0.9, anomaly: true },
    { depth: 400, seepage: 0.5, anomaly: false }
];

// ==================== ADDITIONAL SYSTEM CONSTANTS ====================

// Log Entries
export const LOG_ENTRIES: LogEntry[] = [
    {
        id: 1,
        timestamp: '2025-12-14T23:49:12Z',
        message: 'AURORA OSI v3.1.0 initialized',
        type: 'system',
        source: 'Kernel'
    },
    {
        id: 2,
        timestamp: '2025-12-14T23:49:15Z',
        message: 'Neural modules: 8/8 loaded',
        type: 'success',
        source: 'USHE'
    }
];

// ==================== APP CONFIGURATION ====================

// APP_CONFIG for config.ts (if needed)
export const APP_CONFIG = {
    appName: 'Aurora OSI v3',
    version: '3.1.0',
    environment: process.env.NODE_ENV || 'production',
    apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    sentinelApiKey: process.env.REACT_APP_SENTINEL_KEY || '',
    maxUploadSize: 100 * 1024 * 1024, // 100MB
    API: {
        POLLING_INTERVAL_MS: 5000
    }
};
