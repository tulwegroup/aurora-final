// Aurora OSI System Configuration
// Defines connection parameters for Sovereign (Local) vs Cloud (GCP) modes.

export const APP_CONFIG = {
    // DEFAULT TO CLOUD to try the live link immediately
    DEFAULT_MODE: 'Cloud' as 'Sovereign' | 'Cloud',
    
    // API Endpoints
    API: {
        // Local Python FastAPI (Phase 1)
        LOCAL: 'http://localhost:8000',
        
        // GCP Cloud Run / Cloud Shell (Phase 2)
        // Hardcoded URL as per user request to fix connection issues.
        CLOUD: 'https://8000-cs-995126546405-default.cs-europe-west4-fycr.cloudshell.dev',
        
        // Increased timeout to 60s to allow Cloud SQL Cold Start & Handshake
        TIMEOUT_MS: 60000,
        
        // Polling interval for checking job status.
        POLLING_INTERVAL_MS: 5000 
    },

    // Feature Flags
    FEATURES: {
        ENABLE_QUANTUM_BRIDGE: true, 
        ENABLE_LIVE_SATELLITE_FEED: true,
        // New Flag: Disables procedural generation if real data is missing
        STRICT_DATA_MODE: true 
    }
};
