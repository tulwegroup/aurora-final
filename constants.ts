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
    NeuralModule
} from './types';

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

// Satellite Database
export const SATELLITES: Satellite[] = [
    { id: 's1', name: 'Sentinel-1A', type: 'sar', status: 'ACTIVE', lastContact: '2025-12-14T23:45:00Z', resolution: 5 },
    { id: 's2', name: 'Sentinel-2B', type: 'optical', status: 'ACTIVE', lastContact: '2025-12-14T23:40:00Z', resolution: 10 },
    { id: 's3', name: 'Landsat 9', type: 'multispectral', status: 'ACTIVE', lastContact: '2025-12-14T23:30:00Z', resolution: 15 },
    { id: 's4', name: 'TERRA', type: 'thermal', status: 'MAINTENANCE', lastContact: '2025-12-14T22:00:00Z', resolution: 90 },
];

// ===== ALL MISSING CONSTANTS FOR DASHBOARD =====

// Resource Catalog
export const RESOURCE_CATALOG = [
    { id: 'res-001', name: 'Gold (Au)', type: 'precious', valuePerTon: 65000000, rarity: 'rare', applications: ['Electronics', 'Jewelry', 'Reserves'] },
    { id: 'res-002', name: 'Copper (Cu)', type: 'base', valuePerTon: 9500, rarity: 'common', applications: ['Wiring', 'Construction', 'Electronics'] },
    { id: 'res-003', name: 'Helium-3 (³He)', type: 'noble', valuePerTon: 1400000000, rarity: 'extremely-rare', applications: ['Nuclear Fusion', 'Medical', 'Space Propulsion'] },
    { id: 'res-004', name: 'Lithium (Li)', type: 'battery', valuePerTon: 78000, rarity: 'strategic', applications: ['Batteries', 'Ceramics', 'Pharmaceuticals'] },
    { id: 'res-005', name: 'Platinum Group (PGM)', type: 'precious', valuePerTon: 32000000, rarity: 'rare', applications: ['Catalysts', 'Electronics', 'Medical'] },
    { id: 'res-006', name: 'Rare Earth Elements', type: 'strategic', valuePerTon: 120000, rarity: 'critical', applications: ['Magnets', 'Lasers', 'Defense'] },
];

// Anomalies (for Dashboard)
export const ANOMALIES: Anomaly[] = [
    { index: 1, wavelength: 450, z_score: 2.3, value: 0.78, severity: 'MEDIUM' },
    { index: 2, wavelength: 750, z_score: 3.8, value: 0.92, severity: 'HIGH' },
    { index: 3, wavelength: 1200, z_score: 1.9, value: 0.65, severity: 'LOW' },
    { index: 4, wavelength: 1850, z_score: 4.2, value: 0.95, severity: 'HIGH' },
    { index: 5, wavelength: 2200, z_score: 2.1, value: 0.72, severity: 'MEDIUM' },
];

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
export const INTEL_REPORTS = [
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
export const TASKING_REQUESTS = [
    {
        id: 'task-001',
        priority: 'high' as const,
        status: 'pending' as const,
        requestedAt: '2025-12-14T14:00:00Z'
    },
    {
        id: 'task-002',
        priority: 'medium' as const,
        status: 'approved' as const,
        requestedAt: '2025-12-13T09:30:00Z',
        completedAt: '2025-12-14T11:45:00Z'
    }
];

// Global Mineral Provinces
export const GLOBAL_MINERAL_PROVINCES = [
    { id: 'prov-001', name: 'West African Craton', type: 'Gold', confidence: 0.92 },
    { id: 'prov-002', name: 'Andean Copper Belt', type: 'Copper', confidence: 0.88 },
    { id: 'prov-003', name: 'African Rift Valley', type: 'Helium', confidence: 0.95 },
    { id: 'prov-004', name: 'Bushveld Complex', type: 'PGM', confidence: 0.96 },
    { id: 'prov-005', name: 'Chilean Nitrate Fields', type: 'Nitrate', confidence: 0.85 }
];

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
