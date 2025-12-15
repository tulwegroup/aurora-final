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
