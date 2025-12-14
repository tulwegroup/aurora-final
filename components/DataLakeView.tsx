

import React, { useState, useEffect, useRef } from 'react';
import { DATA_LAKE_FILES } from '../constants';
import { DataObject } from '../types';
import { Database, File, Folder, Search, Filter, Cloud, HardDrive, Archive, Eye, Play, CheckCircle2, AlertCircle, XCircle, Code, Layers, Activity, Maximize2 } from 'lucide-react';
import { AuroraAPI } from '../api';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

const DataLakeView: React.FC = () => {
  const [activeBucket, setActiveBucket] = useState<'Raw' | 'Processed' | 'Results' | 'Archive'>('Raw');
  const [files, setFiles] = useState<DataObject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<DataObject | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({ hot_storage_pb: 4.2, cold_storage_pb: 12.1, daily_ingest_tb: 1.4 });

  useEffect(() => {
     const fetchData = async () => {
         const remoteFiles = await AuroraAPI.getDataLakeFiles();
         const remoteStats = await AuroraAPI.getDataLakeStats();
         
         if (remoteFiles && remoteFiles.length > 0) {
             setFiles(remoteFiles);
         } else {
             // Fallback
             setFiles([
                 ...DATA_LAKE_FILES,
                 { id: 'raw-01', name: 'Sentinel-1_Grd_T36.zip', bucket: 'Raw', size: '850 MB', type: 'SAR (Raw)', lastModified: '2023-10-24 08:00', owner: 'Ingest', status: 'Synced' },
                 { id: 'gen-01', name: 'Anomaly_Heatmap_Target.asc', bucket: 'Results', size: '1.2 MB', type: 'ESRI Grid', lastModified: '2023-10-25 10:20', owner: 'PCFC-Core', status: 'Synced' },
                 { id: 'gen-02', name: 'Structural_Lineaments.geojson', bucket: 'Results', size: '450 KB', type: 'GeoJSON', lastModified: '2023-10-25 10:22', owner: 'PCFC-Core', status: 'Synced' },
                 { id: 'gen-03', name: 'Subsurface_Cube.csv', bucket: 'Results', size: '4.5 MB', type: 'CSV', lastModified: '2023-10-25 10:25', owner: 'PCFC-Core', status: 'Synced' }
             ] as DataObject[]);
         }

         if (remoteStats) {
             setStats(remoteStats);
         }
     };
     fetchData();
  }, []);

  const handleFileSelect = (file: DataObject) => {
      setSelectedFile(file);
      setFileContent(null); 
      
      if (file.name.endsWith('.asc') || file.name.endsWith('.csv') || file.name.endsWith('.geojson')) {
          let type: 'ASC' | 'CSV' | 'GeoJSON' | 'DXF' = 'ASC';
          if (file.name.endsWith('.csv')) type = 'CSV';
          else if (file.name.endsWith('.geojson')) type = 'GeoJSON';
          
          const content = AuroraAPI.generateFileContent(file.name, type);
          setFileContent(content);
      }
  };

  const handleProcessFile = async () => {
      if (!selectedFile) return;
      setIsProcessing(true);
      
      const newFile = await AuroraAPI.processFile(selectedFile.id, 'Harmonization');
      
      setFiles(prev => [newFile, ...prev]);
      setIsProcessing(false);
      setActiveBucket(newFile.bucket); 
      handleFileSelect(newFile); 
  };

  const filteredFiles = files.filter(file => 
    (activeBucket === 'Archive' ? true : file.bucket === activeBucket) && 
    (activeBucket === 'Archive' ? file.bucket === 'Archive' : true) &&
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ASCVisualizer = ({ content }: { content: string }) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      useEffect(() => {
          if (!canvasRef.current) return;
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;
          
          const lines = content.split('\n');
          const dataLines = lines.filter(l => !isNaN(parseFloat(l.trim().split(/\s+/)[0])) && l.trim().length > 0);
          const size = 50; 
          const pixelSize = canvasRef.current.width / size;
          const grid: number[][] = [];
          dataLines.forEach(line => {
              const row = line.trim().split(/\s+/).map(Number);
              if (row.length > 0) grid.push(row);
          });
          grid.forEach((row, y) => {
              row.forEach((val, x) => {
                   const intensity = val / 100;
                   const r = Math.floor(intensity * 255);
                   const b = Math.floor((1 - intensity) * 255);
                   ctx.fillStyle = `rgb(${r}, 0, ${b})`;
                   ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
              });
          });
      }, [content]);
      return <canvas ref={canvasRef} width={300} height={300} className="w-full h-auto bg-black rounded border border-slate-700" />;
  };

  const CSVVisualizer = ({ content }: { content: string }) => {
      const rows = content.split('\n').slice(1).map(line => {
          const cols = line.split(',');
          return { x: parseFloat(cols[1]), y: parseFloat(cols[2]), z: parseFloat(cols[3]), prob: parseFloat(cols[5]) };
      }).filter(d => !isNaN(d.x)).slice(0, 100); 

      return (
          <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" dataKey="x" name="X" stroke="#475569" tick={{fontSize: 10}} hide />
                    <YAxis type="number" dataKey="y" name="Y" stroke="#475569" tick={{fontSize: 10}} hide />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Scatter name="Voxel Prob" data={rows} fill="#8884d8">
                      {rows.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.prob > 0.8 ? '#10b981' : entry.prob > 0.5 ? '#3b82f6' : '#64748b'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
               </ResponsiveContainer>
               <p className="text-center text-[10px] text-slate-500 mt-2">Top-down projection of Probability Cloud</p>
          </div>
      );
  };

  return (
    <div className="space-y-6">
      {/* Storage Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center space-x-4">
           <div className="p-3 bg-aurora-500/10 rounded-full"><Cloud className="text-aurora-500" size={24} /></div>
           <div><p className="text-xs text-slate-400 font-mono">HOT STORAGE (GCP)</p><h3 className="text-2xl font-bold text-white">{stats.hot_storage_pb} <span className="text-base text-slate-500 font-normal">PB</span></h3></div>
        </div>
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center space-x-4">
           <div className="p-3 bg-emerald-500/10 rounded-full"><HardDrive className="text-emerald-500" size={24} /></div>
           <div><p className="text-xs text-slate-400 font-mono">INTELLIGENT TIERING</p><h3 className="text-2xl font-bold text-white">{stats.cold_storage_pb} <span className="text-base text-slate-500 font-normal">PB</span></h3></div>
        </div>
        <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex items-center space-x-4">
           <div className="p-3 bg-slate-700/30 rounded-full"><Archive className="text-slate-400" size={24} /></div>
           <div><p className="text-xs text-slate-400 font-mono">DAILY INGEST</p><h3 className="text-2xl font-bold text-white">{stats.daily_ingest_tb} <span className="text-base text-slate-500 font-normal">TB</span></h3></div>
        </div>
      </div>

      {/* Main Workbench Interface */}
      <div className="bg-aurora-950 border border-aurora-800 rounded-xl flex h-[650px] overflow-hidden">
         
         {/* Left: File Browser */}
         <div className="w-1/2 border-r border-aurora-800 flex flex-col">
             <div className="p-4 border-b border-aurora-800 flex justify-between items-center bg-aurora-900/20">
                <div className="flex items-center space-x-2">
                   <Database className="text-slate-400" size={18} />
                   <h2 className="font-semibold text-slate-200">Data Lake Browser</h2>
                </div>
             </div>
             
             {/* Bucket Tabs */}
             <div className="flex space-x-1 p-2 border-b border-aurora-800/50 overflow-x-auto">
                {['Raw', 'Processed', 'Results', 'Archive'].map(b => (
                    <button 
                        key={b} 
                        onClick={() => setActiveBucket(b as any)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${activeBucket === b ? 'bg-aurora-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {b}
                    </button>
                ))}
             </div>

             {/* File List */}
             <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {filteredFiles.map(file => (
                     <div 
                        key={file.id}
                        onClick={() => handleFileSelect(file)} 
                        className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all ${selectedFile?.id === file.id ? 'bg-aurora-500/10 border border-aurora-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                     >
                         <div className="flex items-center space-x-3 overflow-hidden">
                             <File size={16} className={selectedFile?.id === file.id ? 'text-aurora-400' : 'text-slate-500'} />
                             <div>
                                 <p className={`text-sm truncate font-mono ${selectedFile?.id === file.id ? 'text-white' : 'text-slate-300'}`}>{file.name}</p>
                                 <p className="text-[10px] text-slate-500">{file.size} • {file.type}</p>
                             </div>
                         </div>
                         {file.status === 'Synced' && <CheckCircle2 size={14} className="text-emerald-500" />}
                     </div>
                 ))}
             </div>
         </div>

         {/* Right: Data Inspector & Processor */}
         <div className="w-1/2 flex flex-col bg-slate-900/30">
             {selectedFile ? (
                 <>
                    <div className="p-4 border-b border-aurora-800 bg-aurora-900/20 flex justify-between items-center">
                        <h3 className="font-bold text-slate-200 flex items-center">
                            <Eye size={16} className="mr-2 text-aurora-500" /> Data Inspector
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">{selectedFile.id}</span>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* File Metadata Card */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-aurora-800 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                                <div><span className="text-slate-500 block">Filename</span><span className="text-white font-mono">{selectedFile.name}</span></div>
                                <div><span className="text-slate-500 block">Owner</span><span className="text-white">{selectedFile.owner}</span></div>
                                <div><span className="text-slate-500 block">Last Modified</span><span className="text-white">{selectedFile.lastModified}</span></div>
                                <div><span className="text-slate-500 block">Bucket</span><span className="text-aurora-400 font-bold">{selectedFile.bucket}</span></div>
                            </div>
                            
                            {/* Processor Action */}
                            {(selectedFile.bucket === 'Raw' || selectedFile.bucket === 'Processed') && (
                                <button 
                                    onClick={handleProcessFile}
                                    disabled={isProcessing}
                                    className="w-full bg-aurora-600 hover:bg-aurora-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    {isProcessing ? <Activity size={14} className="animate-spin mr-2" /> : <Play size={14} className="mr-2" />}
                                    {isProcessing ? 'Running ETL Pipeline...' : 'Run Processing Job'}
                                </button>
                            )}
                        </div>

                        {/* Preview Section */}
                        {fileContent && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                    <Maximize2 size={12} className="mr-2" /> Content Preview
                                </h4>
                                <div className="bg-black rounded-lg border border-slate-800 p-2 overflow-hidden flex items-center justify-center min-h-[200px]">
                                    {selectedFile.name.endsWith('.asc') && <ASCVisualizer content={fileContent} />}
                                    {selectedFile.name.endsWith('.csv') && <CSVVisualizer content={fileContent} />}
                                    {selectedFile.name.endsWith('.geojson') && (
                                        <div className="text-xs font-mono text-emerald-400 overflow-auto max-h-[300px] w-full p-2">
                                            <pre>{fileContent}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {!fileContent && (
                            <div className="text-center py-10 opacity-50">
                                <Code size={32} className="mx-auto text-slate-600 mb-2" />
                                <p className="text-xs text-slate-400">Binary format. Visualization not available.</p>
                            </div>
                        )}
                    </div>
                 </>
             ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
                     <Layers size={48} className="opacity-50" />
                     <p className="text-sm">Select a file to inspect or process.</p>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default DataLakeView;
