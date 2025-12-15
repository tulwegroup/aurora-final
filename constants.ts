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
