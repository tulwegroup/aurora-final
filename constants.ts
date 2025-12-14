

import { Satellite, Anomaly, LogEntry, QuantumJob, SystemStatus, IngestionStream, CausalNode, IntelReport, TaskingRequest, LatentPoint, DataObject, TimeSeriesPoint, GravitySpectrum, NeuralModule, Qubit, ExplorationCampaign, CAMPAIGN_PHASES, Voxel, SeepageNode, PricingPackage, PricingAddOn, DrillRecord } from './types';

export { CAMPAIGN_PHASES };

// --- GLOBAL RESOURCE DATABASE (World Minerals & Hydrocarbons) ---
// Used for "Bayesian Prior" validation to reduce false positives.
export const GLOBAL_MINERAL_PROVINCES = [
    // --- AFRICA ---
    { name: 'Witwatersrand Basin', type: ['Gold', 'Uranium'], bounds: [-29, 26, -26, 29], desc: 'World\'s largest gold reserve.' },
    { name: 'Bushveld Complex', type: ['PGM', 'Chrome', 'Vanadium', 'Base Metal'], bounds: [-26, 26, -24, 31], desc: 'Largest layered igneous intrusion.' },
    { name: 'Ashanti Belt', type: ['Gold'], bounds: [5, -3, 8, -1], desc: 'Major Birimian gold belt (Ghana).' },
    { name: 'Tano Basin', type: ['Hydrocarbon', 'Oil', 'Gas'], bounds: [4.0, -4.0, 5.2, -1.0], desc: 'Transform margin deepwater turbidites (Ghana/Ivory Coast).' },
    { name: 'Niger Delta', type: ['Hydrocarbon', 'Oil', 'Gas'], bounds: [4, 5, 6, 9], desc: 'Prolific tertiary deltaic system.' },
    { name: 'Copperbelt', type: ['Copper', 'Cobalt'], bounds: [-14, 26, -11, 29], desc: 'Sediment-hosted stratiform copper (Zambia/DRC).' },
    { name: 'Ruvuma Basin', type: ['Gas', 'Noble Gas', 'Helium'], bounds: [-11, 39, -10, 41], desc: 'Offshore gas & rift-associated helium.' },
    { name: 'Guinea Bauxite Belt', type: ['Bauxite', 'Aluminum', 'Bulk'], bounds: [10, -15, 12, -10], desc: 'World-class surface lateritic bauxite (Guinea).' },
    
    // --- AMERICAS ---
    { name: 'Athabasca Basin', type: ['Uranium'], bounds: [56, -110, 59, -104], desc: 'High-grade unconformity uranium.' },
    { name: 'Carlin Trend', type: ['Gold'], bounds: [40, -117, 41, -116], desc: 'Sediment-hosted disseminated gold (Nevada).' },
    { name: 'Permian Basin', type: ['Hydrocarbon', 'Oil', 'Gas'], bounds: [31, -105, 33, -101], desc: 'Super-basin sedimentary oil province.' },
    { name: 'Lithium Triangle', type: ['Lithium', 'Potash'], bounds: [-26, -69, -18, -66], desc: 'High-altitude salar brines (Chile/Arg/Bolivia).' },
    { name: 'Carajas Province', type: ['Iron', 'Copper', 'Gold'], bounds: [-7, -52, -5, -49], desc: 'IOCG and massive iron deposits.' },
    { name: 'Santos Basin', type: ['Hydrocarbon', 'Oil'], bounds: [-28, -48, -23, -42], desc: 'Pre-salt carbonate reservoirs (Brazil).' },
    { name: 'Golden Triangle', type: ['Gold', 'Copper'], bounds: [55, -131, 57, -129], desc: 'VMS and Porphyry systems (BC).' },

    // --- AUSTRALIA / OCEANIA ---
    { name: 'Pilbara Craton', type: ['Iron', 'Lithium', 'Gold'], bounds: [-24, 115, -20, 121], desc: 'Archean craton, banded iron & pegmatites.' },
    { name: 'Kalgoorlie Terrane', type: ['Gold', 'Nickel'], bounds: [-32, 120, -30, 123], desc: 'Greenstone lode gold.' },
    { name: 'Olympic Dam Domain', type: ['Copper', 'Gold', 'Uranium'], bounds: [-31, 136, -30, 137], desc: 'Huge IOCG breccia complex.' },
    { name: 'Weipa', type: ['Bauxite', 'Aluminum'], bounds: [-13, 141, -12, 142], desc: 'Massive pisolitic bauxite (Australia).' },

    // --- ASIA / MIDDLE EAST ---
    { name: 'Ghawar Field', type: ['Hydrocarbon', 'Oil'], bounds: [24, 49, 26, 50], desc: 'Largest conventional oil field (Saudi Arabia).' },
    { name: 'Arabian Shield', type: ['Gold', 'Base Metal', 'REE'], bounds: [16, 39, 29, 48], desc: 'Neoproterozoic VMS and shear zone gold.' },
    { name: 'Norilsk-Talnakh', type: ['Nickel', 'PGM', 'Copper'], bounds: [69, 88, 70, 89], desc: 'Magmatic sulphide deposits.' },
    { name: 'Bayan Obo', type: ['Rare Earth Elements', 'Iron'], bounds: [41, 109, 42, 110], desc: 'World\'s largest REE deposit.' },

    // --- EUROPE ---
    { name: 'North Sea Graben', type: ['Hydrocarbon', 'Oil', 'Gas'], bounds: [56, 1, 62, 4], desc: 'Rift basin hydrocarbons.' },
    { name: 'Iberian Pyrite Belt', type: ['Base Metal', 'Copper', 'Zinc'], bounds: [37, -8, 38, -5], desc: 'Massive sulphide (VMS) province.' }
];

// --- GROUND TRUTH DATABASE FOR CALIBRATION ---
// STRICT READ-ONLY CONSTANT: Reference Analog Sites
// Used in USHEView to calibrate the physics engine
export const DRILL_HOLE_DATABASE: Record<string, DrillRecord[]> = {
    // Tanzania (Helium) - Focus on Gas Concentration %
    'tz': [
        { 
            id: 'TZ-WELL-001', 
            lat: -8.12, 
            lon: 33.45, 
            depth_m: 1200, 
            measurement_value: 10.2, 
            measurement_unit: 'He %', 
            lithology: 'Reservoir (Frac)', 
            sample_date: '2016-04-12', 
            source: 'Tanzania Geological Survey', 
            license: 'Public Domain', 
            notes: 'High-grade intercept in fault trap.' 
        },
        { 
            id: 'TZ-WELL-002', 
            lat: -8.15, 
            lon: 33.48, 
            depth_m: 850, 
            measurement_value: 8.5, 
            measurement_unit: 'He %', 
            lithology: 'Reservoir (Sand)', 
            sample_date: '2016-06-01', 
            source: 'Tanzania Geological Survey', 
            license: 'Public Domain', 
            notes: 'Consistent porosity, high flow rate.' 
        },
        { 
            id: 'TZ-WELL-003', 
            lat: -8.11, 
            lon: 33.42, 
            depth_m: 450, 
            measurement_value: 0.3, 
            measurement_unit: 'He %', 
            lithology: 'Seal (Clay)', 
            sample_date: '2016-02-15', 
            source: 'Tanzania Geological Survey', 
            license: 'Public Domain', 
            notes: 'Competent seal, low leakage.' 
        },
        { 
            id: 'TZ-WELL-004', 
            lat: -8.20, 
            lon: 33.60, 
            depth_m: 1500, 
            measurement_value: 0.1, 
            measurement_unit: 'He %', 
            lithology: 'Basement Gneiss', 
            sample_date: '2017-01-20', 
            source: 'Tanzania Geological Survey', 
            license: 'Public Domain', 
            notes: 'Sterile basement rock.' 
        }
    ],
    // Nevada (Lithium) - Focus on Li ppm (converted to % for chart scale if needed, usually ppm/10000)
    'nv': [
        { 
            id: 'NV-CORE-101', 
            lat: 38.50, 
            lon: -117.50, 
            depth_m: 150, 
            measurement_value: 0.25, 
            measurement_unit: 'Li %', 
            lithology: 'Brine Aquifer', 
            sample_date: '2019-09-10', 
            source: 'USGS / Nevada Bureau of Mines', 
            license: 'Open Data', 
            notes: 'High concentration brine zone.' 
        },
        { 
            id: 'NV-CORE-102', 
            lat: 38.52, 
            lon: -117.52, 
            depth_m: 50, 
            measurement_value: 0.12, 
            measurement_unit: 'Li %', 
            lithology: 'Clay (Hectorite)', 
            sample_date: '2019-09-15', 
            source: 'USGS', 
            license: 'Open Data', 
            notes: 'Clay-hosted lithium mineralization.' 
        },
        { 
            id: 'NV-CORE-103', 
            lat: 38.48, 
            lon: -117.48, 
            depth_m: 300, 
            measurement_value: 0.04, 
            measurement_unit: 'Li %', 
            lithology: 'Bedrock', 
            sample_date: '2019-10-01', 
            source: 'USGS', 
            license: 'Open Data', 
            notes: 'Background values.' 
        }
    ],
    // Saudi (Gold) - Focus on Au g/t
    'sa': [
        { 
            id: 'SA-RC-007', 
            lat: 24.50, 
            lon: 42.10, 
            depth_m: 80, 
            measurement_value: 4.2, 
            measurement_unit: 'Au g/t', 
            lithology: 'Quartz Vein', 
            sample_date: '2021-11-05', 
            source: 'Saudi Geological Survey', 
            license: 'Public Domain', 
            notes: 'Shear zone hosted vein.' 
        },
        { 
            id: 'SA-RC-008', 
            lat: 24.51, 
            lon: 42.12, 
            depth_m: 120, 
            measurement_value: 12.5, 
            measurement_unit: 'Au g/t', 
            lithology: 'High Grade Zone', 
            sample_date: '2021-11-12', 
            source: 'Saudi Geological Survey', 
            license: 'Public Domain', 
            notes: 'Bonanza grade intercept.' 
        },
        { 
            id: 'SA-RC-009', 
            lat: 24.49, 
            lon: 42.08, 
            depth_m: 150, 
            measurement_value: 0.1, 
            measurement_unit: 'Au g/t', 
            lithology: 'Host Rock', 
            sample_date: '2021-11-20', 
            source: 'Saudi Geological Survey', 
            license: 'Public Domain', 
            notes: 'Mineralized halo.' 
        }
    ],
    // Ghana Jubilee / Odum (Offshore Hydrocarbons)
    'gh-jubilee': [
        // Commercial Discoveries (High Saturation)
        { 
            id: 'ODUM-1', 
            lat: 4.543548, 
            lon: -2.747007, 
            depth_m: 3200, 
            measurement_value: 88.5, 
            measurement_unit: 'Oil Sat %', 
            lithology: 'Campanian Turbidite', 
            sample_date: '2008-02-18', 
            source: 'Calibration Dataset', 
            license: 'Confidential (Auth)', 
            notes: 'Verified commercial quantity. High porosity channel.' 
        },
        { 
            id: 'ODUM-2', 
            lat: 4.565706, 
            lon: -2.716712, 
            depth_m: 3250, 
            measurement_value: 15.0, 
            measurement_unit: 'Oil Sat %', 
            lithology: 'Sandstone Reservoir', 
            sample_date: '2008-05-12', 
            source: 'Calibration Dataset', 
            license: 'Confidential (Auth)', 
            notes: 'Up-dip appraisal confirm. Low saturation/Water bearing.' 
        },
        // Representative Survey Points (Treated as "Background/Trace" for calibration)
        { 
            id: 'SURVEY-PT-01', 
            lat: 4.368808, 
            lon: -2.718954, 
            depth_m: 4100, 
            measurement_value: 5.0, 
            measurement_unit: 'Oil Sat %', 
            lithology: 'Basin Floor Fan', 
            sample_date: '2008-01-15', 
            source: 'Calibration Dataset', 
            license: 'Confidential (Auth)', 
            notes: 'Distal facies. Low saturation.' 
        },
        { 
            id: 'SURVEY-PT-15', 
            lat: 4.583459, 
            lon: -2.769825, 
            depth_m: 3800, 
            measurement_value: 12.0, 
            measurement_unit: 'Oil Sat %', 
            lithology: 'Mudstone / Silt', 
            sample_date: '2008-01-20', 
            source: 'Calibration Dataset', 
            license: 'Confidential (Auth)', 
            notes: 'Seal rock boundaries.' 
        },
        { 
            id: 'SURVEY-PT-30', 
            lat: 4.397132, 
            lon: -2.624987, 
            depth_m: 4200, 
            measurement_value: 2.0, 
            measurement_unit: 'Oil Sat %', 
            lithology: 'Basement', 
            sample_date: '2008-01-22', 
            source: 'Calibration Dataset', 
            license: 'Confidential (Auth)', 
            notes: 'Sterile basement contact.' 
        }
    ]
} as const;

export const SATELLITES: Satellite[] = [
  { id: 'sat-1', name: 'Sentinel-1A', type: 'SAR', orbit: 'LEO', status: SystemStatus.ONLINE, lastPass: '10m ago', coverage: 98 },
  { id: 'sat-2', name: 'Landsat 9', type: 'Hyperspectral', orbit: 'LEO', status: SystemStatus.PROCESSING, lastPass: '45m ago', coverage: 92 },
  { id: 'sat-3', name: 'GOCE-2', type: 'Gravimetric', orbit: 'LEO', status: SystemStatus.ONLINE, lastPass: '2h ago', coverage: 100 },
  { id: 'sat-4', name: 'O3b mPOWER', type: 'Thermal', orbit: 'MEO', status: SystemStatus.WARNING, lastPass: '5m ago', coverage: 78 },
  { id: 'sat-5', name: 'Jason-3', type: 'Bathymetry', orbit: 'LEO', status: SystemStatus.ONLINE, lastPass: '1h ago', coverage: 88 },
];

export const ANOMALIES: Anomaly[] = [
  { id: 'anom-alpha', coordinates: [-8.12, 33.45], depth: 1200, probability: 0.94, type: 'Helium Reservoir', description: 'Nitrogen-rich gas seep coincident with basement faulting. Thermal anomalies suggest advective flow.', physicsResidual: 0.03, status: 'Confirmed' },
  { id: 'anom-beta', coordinates: [-8.45, 33.80], depth: 300, probability: 0.82, type: 'Carbonatite REE', description: 'Spectral absorption features (Nd-Pr) aligned with ring structure.', physicsResidual: 0.12, status: 'Verifying' },
  { id: 'anom-gamma', coordinates: [-7.90, 33.10], depth: 2500, probability: 0.65, type: 'Natural Hydrogen', description: 'Deep crustal flux detected via H2-pulsing proxy. Requires verification.', physicsResidual: 0.25, status: 'Detected' },
  { id: 'anom-delta', coordinates: [-8.20, 33.60], depth: 800, probability: 0.45, type: 'False Positive', description: 'Vegetation stress mimicry ruled out by multi-temporal coherence.', physicsResidual: 0.40, status: 'False Positive' },
];

export const MOCK_LOGS: LogEntry[] = [
  { id: 'log-1', timestamp: '10:42:05', subsystem: 'PCFC', message: 'Physics constraint converged for Sector 4.', level: 'SUCCESS' },
  { id: 'log-2', timestamp: '10:41:58', subsystem: 'OSIL', message: 'Packet loss detected on Ground Station 7.', level: 'WARN' },
  { id: 'log-3', timestamp: '10:41:12', subsystem: 'QSE', message: 'Job #8821 completed. 128 qubits used.', level: 'INFO' },
  { id: 'log-4', timestamp: '10:40:55', subsystem: 'USHE', message: 'Latent space re-alignment successful.', level: 'INFO' },
  { id: 'log-5', timestamp: '10:39:20', subsystem: 'TMAL', message: 'Temporal coherence below threshold.', level: 'ERROR' },
];

export const QUANTUM_JOBS: QuantumJob[] = [
  { id: 'QJ-8821', targetRegion: 'Tanzania Rift Block A', qubitsUsed: 128, status: 'Running', progress: 45 },
  { id: 'QJ-8820', targetRegion: 'Arabian Shield North', qubitsUsed: 64, status: 'Completed', progress: 100 },
  { id: 'QJ-8819', targetRegion: 'Yukon VMS Target', qubitsUsed: 256, status: 'Queued', progress: 0 },
];

export const MOCK_QUBITS: Qubit[] = Array.from({ length: 64 }, (_, i) => ({
  id: `q-${i}`,
  row: Math.floor(i / 8),
  col: i % 8,
  coherenceTime: 100 + Math.random() * 50, // µs
  gateFidelity: 0.99 + Math.random() * 0.009,
  status: Math.random() > 0.9 ? 'Calibrating' : Math.random() > 0.95 ? 'Error' : Math.random() > 0.3 ? 'Active' : 'Idle'
}));

export const INGESTION_STREAMS: IngestionStream[] = [
  { 
    id: 'pipe-01', source: 'Sentinel-1 Constellation', type: 'SAR (C-Band)', throughput: 1.2, status: SystemStatus.ONLINE, domain: 'Land',
    stages: [
      { name: 'Ingest', status: 'completed', progress: 100 },
      { name: 'Radiometric', status: 'active', progress: 65 },
      { name: 'Terrain', status: 'waiting', progress: 0 }
    ]
  },
  { 
    id: 'pipe-02', source: 'Landsat 9', type: 'Multispectral', throughput: 0.8, status: SystemStatus.ONLINE, domain: 'Land',
    stages: [
      { name: 'Ingest', status: 'completed', progress: 100 },
      { name: 'Atmos Corr', status: 'completed', progress: 100 },
      { name: 'Cloud Mask', status: 'active', progress: 32 }
    ]
  },
  { 
    id: 'pipe-03', source: 'Jason-3 / Sentinel-6', type: 'Altimetry/Bathymetry', throughput: 0.9, status: SystemStatus.ONLINE, domain: 'Marine',
    stages: [
      { name: 'Ingest', status: 'completed', progress: 100 },
      { name: 'Wave Height', status: 'completed', progress: 100 },
      { name: 'Hydrolight', status: 'active', progress: 45 } // Marine Correction
    ]
  },
  { 
    id: 'pipe-04', source: 'GOCE Re-analysis', type: 'Gravimetry', throughput: 0.4, status: SystemStatus.WARNING, domain: 'Land',
    stages: [
      { name: 'Ingest', status: 'error', progress: 45 },
      { name: 'Harmonic', status: 'waiting', progress: 0 },
      { name: 'Inversion', status: 'waiting', progress: 0 }
    ]
  }
];

export const CAUSAL_NODES: CausalNode[] = [
  { id: 'n1', label: 'Surface Deformation', type: 'observable', confidence: 0.95, parents: ['n4'], x: 400, y: 50 },
  { id: 'n2', label: 'Gravity Gradient', type: 'observable', confidence: 0.88, parents: ['n5'], x: 200, y: 50 },
  { id: 'n3', label: 'Thermal Anomaly', type: 'observable', confidence: 0.72, parents: ['n6'], x: 600, y: 50 },
  { id: 'n4', label: 'Volume Change', type: 'hidden', confidence: 0.82, parents: ['n7'], x: 400, y: 200 },
  { id: 'n5', label: 'Density Contrast', type: 'hidden', confidence: 0.85, parents: ['n7'], x: 200, y: 200 },
  { id: 'n6', label: 'Fluid Flow', type: 'hidden', confidence: 0.65, parents: ['n7'], x: 600, y: 200 },
  { id: 'n7', label: 'Geological Structure', type: 'hidden', confidence: 0.78, parents: ['n8'], x: 400, y: 350 },
  { id: 'n8', label: 'Poisson Equation', type: 'physics', confidence: 1.0, parents: [], x: 400, y: 500 },
];

export const SEEPAGE_NETWORK: SeepageNode[] = [
    { id: 's1', label: 'Deep Basement Source', type: 'Source', depth: 4500, pressure: 95, probability: 0.9, x: 100, y: 350, next: ['c1', 'c2'] },
    { id: 'c1', label: 'Rift Boundary Fault', type: 'Carrier', depth: 3200, pressure: 65, probability: 0.88, x: 250, y: 280, next: ['t1'] },
    { id: 'c2', label: 'Fractured Gneiss', type: 'Carrier', depth: 3400, pressure: 68, probability: 0.75, x: 250, y: 320, next: ['t1'] },
    { id: 't1', label: 'Structural Trap (Dome)', type: 'Trap', depth: 1200, pressure: 42, probability: 0.94, x: 400, y: 200, next: ['c3'] },
    { id: 'c3', label: 'Micro-seepage', type: 'Carrier', depth: 400, pressure: 12, probability: 0.72, x: 550, y: 120, next: ['o1'] },
    { id: 'o1', label: 'Soil Gas Anomaly', type: 'Seep', depth: 0, pressure: 1, probability: 0.95, x: 700, y: 50, next: [] },
];

export const LATENT_POINTS: LatentPoint[] = Array.from({length: 100}, (_, i) => ({
  id: `LP-${1000 + i}`,
  x: Math.random() * 100,
  y: Math.random() * 100,
  z: Math.random() * 100,
  cluster: Math.random() > 0.6 ? 'Mineral' : Math.random() > 0.3 ? 'Water' : 'Void',
  realLat: -8.12 + (Math.random() * 0.1),
  realLon: 33.45 + (Math.random() * 0.1),
  realDepth: 500 + (Math.random() * 2000),
  grade: Math.random() * 10,
  volume: Math.random() * 100
}));

export const NEURAL_MODULES: NeuralModule[] = [
  { id: 'm1', name: 'SpectralNet-v4', architecture: 'Transformer (ViT)', function: 'Band Alignment', inputShape: '(13, 256, 256)', status: 'Converged', loss: 0.0023, accuracy: 0.992 },
  { id: 'm2', name: 'SAR-Harmonizer', architecture: 'U-Net ResNet50', function: 'Speckle Reduction', inputShape: '(2, 512, 512)', status: 'Training', loss: 0.1450, accuracy: 0.885 },
  { id: 'm3', name: 'GeoScaler', architecture: 'GAN (Super-Res)', function: 'Resolution Equalization', inputShape: '(1, 64, 64)', status: 'Active', loss: 0.0890, accuracy: 0.941 },
];

export const INTEL_REPORTS: IntelReport[] = [
  { id: 'RPT-2023-089', title: 'Helium Discovery, Tanzania (Rukwa)', date: '2023-10-12', region: 'Tanzania', priority: 'High', summary: 'Major Helium (He) accumulation identified in rift-associated fault trap. Est. 10.5% concentration. Strategic relevance: High.', tags: ['Noble Gas', 'Helium', 'Confirmed'], status: 'Published' },
  { id: 'RPT-2023-090', title: 'REE Mineralization, Arabian Shield', date: '2023-10-11', region: 'Saudi Arabia', priority: 'High', summary: 'Carbonatite complexes identified with high Neodymium/Praseodymium potential. Follow-up drilling recommended.', tags: ['REE', 'Critical Minerals', 'Draft'], status: 'Draft' },
  { id: 'RPT-2023-091', title: 'Offshore Seepage, Namibia', date: '2023-10-10', region: 'Africa', priority: 'Medium', summary: 'Multiple oil slicks detected via SAR. Correlates with deepwater channel turbidites.', tags: ['Hydrocarbon', 'Offshore', 'Analysis'], status: 'Published' },
];

export const TASKING_REQUESTS: TaskingRequest[] = [
  { id: 'TSK-9921', targetCoordinates: '23.44 S, 67.89 W', sensorType: 'Hyperspectral', priority: 'Urgent', status: 'Pending', requestor: 'Ops Team', submittedAt: '10m ago' },
  { id: 'TSK-9920', targetCoordinates: '-22.10, 14.50', sensorType: 'SAR (L-Band)', priority: 'Routine', status: 'Scheduled', requestor: 'Auto-Tasker', submittedAt: '1h ago' },
  { id: 'TSK-9919', targetCoordinates: '62.30, 98.10', sensorType: 'Gravimetry', priority: 'Emergency', status: 'Completed', requestor: 'Geophysics Lead', submittedAt: '4h ago' },
];

export const DATA_LAKE_FILES: DataObject[] = [
  { id: 'obj-1', name: 'S1A_IW_GRDH_1SDV_20231012.zip', bucket: 'Raw', size: '1.2 GB', type: 'SAR', lastModified: '2023-10-12 10:00', owner: 'Ingest-Service' },
  { id: 'obj-2', name: 'L9_OLI_TIRS_C2_L2_20231012.tar', bucket: 'Raw', size: '950 MB', type: 'Multispectral', lastModified: '2023-10-12 10:05', owner: 'Ingest-Service' },
  { id: 'obj-3', name: 'tile_34_112_harmonized.nc', bucket: 'Processed', size: '450 MB', type: 'NetCDF', lastModified: '2023-10-12 10:15', owner: 'USHE-Worker' },
  { id: 'obj-4', name: 'anomaly_map_v3.geojson', bucket: 'Results', size: '12 MB', type: 'GeoJSON', lastModified: '2023-10-12 10:20', owner: 'PCFC-Core' },
  { id: 'obj-5', name: 'S1A_2022_archive_manifest.json', bucket: 'Archive', size: '45 KB', type: 'JSON', lastModified: '2023-01-01 00:00', owner: 'System' },
];

export const TEMPORAL_DATA: TimeSeriesPoint[] = [
  { date: 'Jan', deformation: 2, thermalInertia: 850, coherence: 0.9 },
  { date: 'Feb', deformation: 3, thermalInertia: 840, coherence: 0.88 },
  { date: 'Mar', deformation: 5, thermalInertia: 820, coherence: 0.85 },
  { date: 'Apr', deformation: 12, thermalInertia: 780, coherence: 0.75 },
  { date: 'May', deformation: 18, thermalInertia: 720, coherence: 0.65 },
  { date: 'Jun', deformation: 22, thermalInertia: 680, coherence: 0.60 },
  { date: 'Jul', deformation: 25, thermalInertia: 650, coherence: 0.55 },
  { date: 'Aug', deformation: 28, thermalInertia: 640, coherence: 0.52 },
];

export const GRAVITY_SPECTRUM: GravitySpectrum[] = [
  { wavelength: 'Short (Shallow)', power: 120, depthEstimate: '< 2km' },
  { wavelength: 'Medium (Crust)', power: 450, depthEstimate: '2-15km' },
  { wavelength: 'Long (Deep)', power: 280, depthEstimate: '> 15km' },
];

// --- RESOURCE CATALOG (PHYSICS-FIRST DEFINITION) ---
// Note: "Morphology" field distinguishes between Structural (Risky) and Continuous (Reliable) targets.
export const RESOURCE_CATALOG = [
  { 
      category: 'Precious Metal', 
      default: 'Au', 
      examples: 'Au (Gold), Ag (Silver), PGM', 
      primaryMethod: 'Gravity Gradiometry (Density / Alteration Halo)', 
      secondaryMethod: 'SWIR–VNIR Alteration Mapping', 
      maxDepth: '600–900 m',
      morphology: 'Structural' 
  },
  { 
      category: 'Base Metal', 
      default: 'Cu', 
      examples: 'Cu (Copper), Zn (Zinc), Pb (Lead)', 
      primaryMethod: 'Gravity Gradiometry (Mass Contrast)', 
      secondaryMethod: 'Hyperspectral Gossan Mapping (Surface Oxides)', 
      maxDepth: '2,000 m (up to 3.5 km)',
      morphology: 'Structural'
  },
  { 
      category: 'Lithium (Brine/Clay)', 
      default: 'Li', 
      examples: 'Li (Lithium), Salar, Clay', 
      primaryMethod: 'Thermal Inertia + Gravity (Brine Signatures)', 
      secondaryMethod: 'InSAR Subsidence (Brine)', 
      maxDepth: 'Brine: 300–800 m',
      morphology: 'Continuous' // Brines are large pools = Like Iron
  },
  { 
      category: 'Lithium (Hard Rock)', 
      default: 'Li', 
      examples: 'Spodumene, Pegmatite', 
      primaryMethod: 'Gravity + Spectral (Alteration Halo)', 
      secondaryMethod: 'Magnetic Lineaments (Rock)', 
      maxDepth: 'Rock: up to 1.2 km',
      morphology: 'Structural' // Pegmatites are narrow veins = Risky
  },
  {
      category: 'Battery Metal (Ni/Co)',
      default: 'Ni',
      examples: 'Ni (Nickel), Co (Cobalt)',
      primaryMethod: 'Gravity + Magnetics',
      secondaryMethod: 'Hyperspectral (Gossan)',
      maxDepth: 'Surface - 1000m',
      morphology: 'Structural'
  },
  { 
      category: 'Rare Earth Elements', 
      default: 'NdPr', 
      examples: 'Nd, Pr, Dy, Tb', 
      primaryMethod: 'Radiometric Th/K Ratios (Orbital Gamma Proxy)', 
      secondaryMethod: 'Spectral Mineral Association Mapping', 
      maxDepth: 'Surface – 150 m',
      morphology: 'Structural'
  },
  { 
      category: 'Hydrocarbon (Onshore)', 
      default: 'Oil', 
      examples: 'Oil, Gas, Condensate', 
      primaryMethod: 'Thermal Hydrocarbon Anomaly Detection (Micro-seepage)', 
      secondaryMethod: 'Radiometric Potassium/Uranium Normalization', 
      maxDepth: 'Reservoir: 2,500–4,500 m',
      morphology: 'Structural' // High Risk of "Dry Well"
  },
  { 
      category: 'Hydrocarbon (Offshore)', 
      default: 'Oil', 
      examples: 'Oil, Gas, Condensate', 
      primaryMethod: 'SAR Slick Detection (Repetitive Seep Clustering)', 
      secondaryMethod: 'Gravity/Magnetics (Basement Structure)', 
      maxDepth: 'Reservoir: 3,000–6,000 m',
      morphology: 'Structural' // High Risk of "Dry Well"
  },
  { 
      category: 'Bulk Commodity (Reliable)', 
      default: 'Al', 
      examples: 'Bauxite, Aluminum, Iron Ore', 
      primaryMethod: 'Spectral Reflectance (Al-OH / Fe-Oxide)', 
      secondaryMethod: 'Geomorphology (Plateau Mapping)', 
      maxDepth: 'Surface – 50 m',
      morphology: 'Continuous' // ZERO FALSE POSITIVES. If it's red, it's bauxite.
  },
  { 
      category: 'Gemstones', 
      default: 'C', 
      examples: 'Diamond, Ruby, Emerald', 
      primaryMethod: 'Magnetic Kimberlite Pipe Detection', 
      secondaryMethod: 'Indicator Mineral Spectral Proxies', 
      maxDepth: 'Surface – 200 m (up to 500 m)',
      morphology: 'Structural'
  },
  { 
      category: 'Noble Gas', 
      default: 'He', 
      examples: 'He (Helium), Ne, Ar', 
      primaryMethod: 'Thermal/SAR Microseepage Anomaly Detection', 
      secondaryMethod: 'Structural Trap Modeling (Gravity/Mag)', 
      maxDepth: '1,500–3,000 m',
      morphology: 'Structural'
  },
  { 
      category: 'Aquifer / Water', 
      default: 'H2O', 
      examples: 'Fresh, Fossil, Brine', 
      primaryMethod: 'Gravity Mass Change (GRACE/GOCE) + Aurora Hydrology Model', 
      secondaryMethod: 'L-band SAR Moisture Mapping + Structural AI', 
      maxDepth: '200–800 m',
      morphology: 'Continuous'
  }
];

export const WORKFLOW_GUIDE = [
    { step: 1, title: 'Mission Tasking', desc: 'Define Area of Interest (AOI) and Target Resource. System tasks optimal satellite constellation.' },
    { step: 2, title: 'OSIL Ingestion', desc: 'Raw data (SAR, Optical, Gravity) is ingested, calibrated, and atmospherically corrected.' },
    { step: 3, title: 'USHE Harmonization', desc: 'Multi-modal data is fused into a single latent vector space using contrastive learning.' },
    { step: 4, title: 'PCFC Inversion', desc: 'Physics-Informed Neural Networks (PINNs) solve for subsurface density/structure.' },
    { step: 5, title: 'Quantum Validation', desc: 'Complex inversion problems are verified using VQE/QAOA to escape local minima.' },
    { step: 6, title: 'Intel Synthesis', desc: 'Final probabilities are compiled into anomaly maps, voxel cubes, and discovery claims.' },
];

export const ACTIVE_CAMPAIGN: ExplorationCampaign = {
  id: 'CMP-2023-9981',
  name: 'Project Rift Valley: Strategic Gas & Critical Minerals',
  targetCoordinates: '8.12° S, 33.45° E',
  regionName: 'Tanzania / Mozambique Belt',
  resourceType: 'Multi-Objective',
  targetElement: 'He, REE, H2',
  targets: [
    { resourceType: 'Noble Gas', targetElement: 'He' },
    { resourceType: 'Rare Earth Elements', targetElement: 'NdPr' },
    { resourceType: 'Future Energy', targetElement: 'H2 (Natural)' }
  ],
  results: [
    {
        element: 'He',
        resourceType: 'Noble Gas',
        status: 'Confirmed',
        probability: 0.94,
        specifications: { grade: 10.5, tonnage: 135000, depth: 1200, purity: 98.5 } // 10.5% He is huge
    },
    {
        element: 'NdPr',
        resourceType: 'Rare Earth Elements',
        status: 'Confirmed',
        probability: 0.88,
        specifications: { grade: 4.2, tonnage: 8.5, depth: 150, purity: 92.0 } // 4.2% REE is very high
    },
    {
        element: 'H2 (Natural)',
        resourceType: 'Future Energy',
        status: 'Possible',
        probability: 0.65,
        specifications: { estimatedReserves: 50000000, depth: 2500, porosity: 12 }
    }
  ],
  drillTargets: [],
  environment: 'Land',
  radius: 120, // km
  dataVolumeEstimate: 5.2, // TB
  currentPhase: CAMPAIGN_PHASES[0], // Start at Acquisition
  phaseIndex: 0,
  phaseProgress: 25,
  startDate: '2023-10-25',
  estimatedCompletion: '2023-11-05',
  accuracyScore: 0.25,
  status: 'Active',
  iteration: 1,
  priorsLoaded: true
};

export const PINN_LAYERS = [
  { id: 'input', type: 'Input Layer', neurons: 4, function: 'Lat/Long/Depth/Time' },
  { id: 'hidden1', type: 'Dense (Bayesian)', neurons: 64, function: 'Feature Extraction' },
  { id: 'hidden2', type: 'Dense (SiLU)', neurons: 64, function: 'Non-linear Mapping' },
  { id: 'physics1', type: 'PDE Solver', neurons: 32, function: 'Poisson Eq (Gravity)' },
  { id: 'physics2', type: 'PDE Solver', neurons: 32, function: 'Darcy Flow (Fluids)' },
  { id: 'output', type: 'Output', neurons: 3, function: 'Density/Porosity/Sat' },
];

export const MOCK_VOXELS: Voxel[] = Array.from({length: 64}, (_, i) => {
    const layer = Math.floor(i / 16); // 4 layers
    const mineralProb = layer === 2 ? 0.85 + Math.random() * 0.1 : 0.1 + Math.random() * 0.2;
    return {
        id: `v-${i}`,
        x: (i % 4),
        y: Math.floor((i % 16) / 4),
        z: layer,
        lithology: layer === 0 ? 'Sediment' : layer === 1 ? 'Cap Rock' : layer === 2 ? 'Reservoir' : 'Basement',
        density: 2.1 + (layer * 0.3) + Math.random() * 0.1,
        mineralProb,
        uncertainty: 0.2 - (layer * 0.02)
    };
});

// --- LICENSING & COMMERCIAL DATA ---

export const LICENSING_PACKAGES: PricingPackage[] = [
  {
    id: 'pkg-regional',
    name: 'Regional Subsurface Intelligence Package',
    scope: '20,000–70,000 km²',
    features: ['Fused multi-physics anomaly maps', 'Hydrocarbon seep probability', 'Fault/structural interpretation', '3D anomaly voxel cube', 'Web Viewer Access'],
    priceMin: 250000,
    priceMax: 1200000,
    unit: 'project'
  },
  {
    id: 'pkg-national',
    name: 'National Digital Subsurface Twin (N-DST)',
    scope: 'Entire Country',
    features: ['National mineral system map', 'Hydrocarbon play risk map', 'Structural deformation model', 'Predictive mineralization clustering', 'Selective deep inversion'],
    priceMin: 2500000,
    priceMax: 6000000,
    unit: 'project'
  },
  {
    id: 'pkg-offshore',
    name: 'Offshore Hydrocarbon Reconnaissance Layer',
    scope: 'EEZ Offshore',
    features: ['SAR-based oil seep detection', 'Gravity + magnetics structural model', 'Offshore source maturity indicators'],
    priceMin: 500000,
    priceMax: 2000000,
    unit: 'project'
  },
  {
    id: 'pkg-mineral',
    name: 'Mineral Targeting Portfolio',
    scope: '1–5 Key Mineral Belts',
    features: ['Alteration zone analysis', 'Hydrothermal signature detection', 'REEs, Ni, Cu, Au indicators'],
    priceMin: 150000,
    priceMax: 1000000,
    unit: 'belt'
  },
  {
    id: 'pkg-subscription',
    name: 'Sovereign Annual Subscription',
    scope: 'Continuous Updates',
    features: ['Monthly regional updates', 'Anomaly change detection', 'New targets', 'Sovereign Early Warning module'],
    priceMin: 750000,
    priceMax: 3000000,
    unit: 'year'
  },
  {
    id: 'pkg-custom',
    name: 'Custom / Add-ons Only',
    scope: 'A la carte configuration',
    features: ['Build your own package', 'Select specific add-ons', 'No base fee'],
    priceMin: 0,
    priceMax: 0,
    unit: 'project'
  }
];

export const COMMERCIAL_ADDONS: PricingAddOn[] = [
  { 
      id: 'add-investor', 
      name: 'Custom Investor Reports', 
      price: 50000, 
      unit: 'flat', 
      type: 'Add-On', 
      description: 'Executive-grade slide decks and prospectuses tailored for capital raising and board presentations.' 
  },
  { 
      id: 'add-seismic', 
      name: 'Seismic Integration Package', 
      price: 120000, 
      unit: 'flat', 
      type: 'Add-On',
      description: 'Ingestion and processing of 2D/3D SEG-Y data to constrain density models and improve structural trap definition.' 
  },
  { 
      id: 'add-inversion', 
      name: '3D Deep Inversion (Premium)', 
      price: 500000, 
      unit: 'flat', 
      type: 'Add-On',
      description: 'High-resolution quantum-assisted inversion targeting depths >3km for blind deposits.' 
  },
  { 
      id: 'add-monitoring', 
      name: 'Offshore Seep Monitoring', 
      price: 75000, 
      unit: 'month', 
      type: 'Add-On',
      description: 'Monthly SAR acquisition and analysis to track natural oil seep periodicity and pollution events.' 
  }
];