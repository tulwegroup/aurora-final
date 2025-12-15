// Core Types
export interface Campaign {
    id: string;
    name: string;
    status: 'active' | 'completed' | 'planned';
    startDate: string;
    endDate?: string;
    budget: number;
    description: string;
}

export interface ExplorationCampaign {
    id: string;
    name: string;
    description: string;
    region: string;
    startDate: string;
    endDate: string;
    budget: number;
    status: 'active' | 'completed' | 'planned' | 'paused';
}

// Neural Types
export interface NeuralModule {
    id: string;
    name: string;
    type: 'classification' | 'regression' | 'generative' | 'transform';
    description: string;
    active: boolean;
    confidence: number;
    status: 'online' | 'offline' | 'training';
    icon: 'cpu' | 'activity' | 'layers' | 'network' | 'zap';
}

// Data Types
export interface DrillRecord {
    id: string;
    depth: number;
    material: string;
    confidence: number;
    anomaly: boolean;
    spectral_match: number;
}

export interface CalibrationLog {
    id: number;
    region_id: string;
    reference_count: number;
    timestamp: string;
}

export interface LatentPoint {
    x: number;
    y: number;
    z: number;
    type: 'Mineral' | 'Water' | 'Void';
    confidence: number;
}

// Spectral Types
export interface SpectralData {
    wavelength: number;
    Optical: number;
    SAR: number;
    Thermal: number;
    Gravity: number;
    Fused: number;
}

export interface Anomaly {
    index: number;
    wavelength: number;
    z_score: number;
    value: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface GeologicalContext {
    type: string;
    confidence: number;
    features: string[];
    recommended_depth: string;
}

export interface USHEAnalysis {
    location: {
        lat: number;
        lon: number;
        radius_km: number;
    };
    spectral: SpectralData[];
    anomaly_score: number;
    confidence: {
        overall: number;
        optical: number;
        sar: number;
        thermal: number;
        gravity: number;
    };
    anomalies: Anomaly[];
    geological_context: GeologicalContext;
    source: string;
    engine: string;
}

// System Types
export type SystemStatus = 'ACTIVE' | 'IDLE' | 'ERROR' | 'MAINTENANCE' | 'CALIBRATING';

export interface Satellite {
    id: string;
    name: string;
    type: 'optical' | 'sar' | 'thermal' | 'multispectral';
    status: SystemStatus;
    lastContact: string;
    resolution: number;
}

export interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    source: string;
}

export interface QuantumJob {
    id: string;
    name: string;
    qubits: number;
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number;
}

export interface IngestionStream {
    id: string;
    source: string;
    dataType: string;
    status: SystemStatus;
    rate: number;
    lastUpdated: string;
}

export interface CausalNode {
    id: string;
    name: string;
    type: 'cause' | 'effect' | 'mediator';
    strength: number;
    connections: string[];
}

export interface IntelReport {
    id: string;
    title: string;
    confidence: number;
    timestamp: string;
    source: string;
    summary: string;
}

export interface TaskingRequest {
    id: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    requestedAt: string;
    completedAt?: string;
}

// API Types (from your api.ts import)
export interface DataObject {
    id: string;
    type: string;
    timestamp: string;
    data: any;
}

export interface ConnectivityResult {
    connected: boolean;
    latency: number;
    timestamp: string;
}

export interface PortfolioSummary {
    totalValue: number;
    activeProjects: number;
    lastUpdated: string;
}

// Campaign Phase Types
export type CampaignPhase = 'scoping' | 'recon' | 'drilling' | 'analysis' | 'reporting';

// Export all types
export type {
    SystemStatus,
    CampaignPhase
};
// Add these to your types.ts file

export type AppView = 'dashboard' | 'map' | 'reports' | 'settings' | 'ushe';

export interface HiveMindState {
    isActive: boolean;
    agentsOnline: number;
    lastSync: string;
    processingQueue: number;
}

export type MineralAgentType = 'prospector' | 'analyst' | 'validator' | 'scout';

export interface Discovery {
    id: string;
    name: string;
    type: string;
    confidence: number;
    location: {
        lat: number;
        lon: number;
    };
    timestamp: string;
};
