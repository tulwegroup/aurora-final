/// <reference types="vite/client" />

// Aurora OSI System Configuration
// Defines connection parameters for Sovereign (Local) vs Cloud (GCP/Render) modes.

export const APP_CONFIG = {
    // DEFAULT TO CLOUD to try the live link immediately
    DEFAULT_MODE: 'Cloud' as 'Sovereign' | 'Cloud',
    
    // API Endpoints
    API: {
        // Local Python FastAPI (Phase 1)
        LOCAL: 'http://localhost:8000',
        
        // Cloud URL (Phase 2)
        // Automatically populated by Render via VITE_API_URL
        CLOUD: import.meta.env.VITE_API_URL || '',
        
        // Timeout configuration
        TIMEOUT_MS: 60000,

        // Polling interval for checking job status.
        POLLING_INTERVAL_MS: 5000
    },

    // Feature Flags
    FEATURES: {
        ENABLE_QUANTUM_BRIDGE: true, 
        ENABLE_LIVE_SATELLITE_FEED: true,
        STRICT_DATA_MODE: true 
    }
};
