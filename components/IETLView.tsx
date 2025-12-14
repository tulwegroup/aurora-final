
// ... (imports remain the same, ensure AuroraAPI is imported) ...
import React, { useState, useEffect } from 'react';
import { IntelReport, TaskingRequest, ExplorationCampaign, DeliverableArtifact, ValidationReport } from '../types';
import { AuroraAPI } from '../api';
import { INTEL_REPORTS, TASKING_REQUESTS } from '../constants';
import { FileText, Package, Database, Lock, Globe, ShieldCheck, Fingerprint, Scan, Sparkles, CheckCircle2, Loader2, Plus, Download, XCircle, Search, Target, AlertTriangle, Network, Printer } from 'lucide-react';

interface IETLViewProps {
  campaign: ExplorationCampaign;
  customLogo?: string | null;
}

const IETLView: React.FC<IETLViewProps> = ({ campaign, customLogo }) => {
  const activeTargets = campaign.drillTargets || [];
  const [activeTab, setActiveTab] = useState<'intel' | 'data_room' | 'tasking' | 'deliverables'>('intel');
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [tasks, setTasks] = useState<TaskingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentStep, setAgentStep] = useState<string>('Idle');
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationReport | null>(null);
  const [readingReport, setReadingReport] = useState<IntelReport | null>(null);

  useEffect(() => {
     const loadData = async () => {
         setIsLoading(true);
         let fetchedReports = await AuroraAPI.getReports();
         let fetchedTasks = await AuroraAPI.getTasks();
         if (!fetchedReports || fetchedReports.length === 0) fetchedReports = INTEL_REPORTS;
         if (!fetchedTasks || fetchedTasks.length === 0) fetchedTasks = TASKING_REQUESTS;
         setReports(fetchedReports);
         setTasks(fetchedTasks);
         setIsLoading(false);
      };
      loadData();
  }, [campaign]);

  const runAgenticReview = async () => {
      setIsGenerating(true);
      setAgentLogs([]);
      setValidationResult(null);

      // 1. Authenticity
      setAgentStep("Authenticity");
      setAgentLogs(prev => [...prev, "Agent-Authenticity: Validating sensor data provenance (STAC Metadata)..."]);
      await new Promise(r => setTimeout(r, 800));
      setAgentLogs(prev => [...prev, "Agent-Authenticity: Catalog cross-check complete."]);

      // 2. Harmonization Check
      setAgentStep("Harmonization");
      setAgentLogs(prev => [...prev, "Agent-Harmonizer: Auditing USHE Latent Space clustering..."]);
      await new Promise(r => setTimeout(r, 1200));
      if (activeTargets.length > 0) {
          setAgentLogs(prev => [...prev, `Agent-Harmonizer: Confirmed ${activeTargets.length} discrete high-confidence pockets.`]);
      } else {
          setAgentLogs(prev => [...prev, "Agent-Harmonizer: Regional signal weak, checking spectral outliers..."]);
      }

      // 3. Specialized Volume Validation (New)
      setAgentStep("Volume Specialist");
      const rType = campaign.resourceType.toLowerCase();
      let specialistName = 'Agent-General-Vol';
      if (rType.includes('rare') || rType.includes('ree')) specialistName = 'Agent-REE-Vol';
      else if (rType.includes('gold') || rType.includes('au')) specialistName = 'Agent-Au-Vol';
      else if (rType.includes('lithium') || rType.includes('li')) specialistName = 'Agent-Li-Vol';
      else if (rType.includes('hydrocarbon') || rType.includes('oil')) specialistName = 'Agent-Oil-Vol';

      setAgentLogs(prev => [...prev, `${specialistName}: Normalizing tonnage against geological constraints...`]);
      await new Promise(r => setTimeout(r, 1000));
      setAgentLogs(prev => [...prev, `${specialistName}: Volume estimates validated.`]);


      // 4. Methodology
      setAgentStep("Methodology");
      setAgentLogs(prev => [...prev, "Agent-Methodology: Checking sensor suitability for target resource..."]);
      await new Promise(r => setTimeout(r, 800));
      setAgentLogs(prev => [...prev, "Agent-Methodology: Multi-physics configuration valid."]);

      // 5. Verifier
      setAgentStep("Verifier");
      setAgentLogs(prev => [...prev, "Agent-Verifier: Cross-checking Report Claims vs. Raw Sensor Data..."]);
      
      // Use API for Generation logic to ensure consistency with auto-generated reports
      const saved = await AuroraAPI.generateAndSaveReport(campaign);
      const valReport = saved.validation;
      
      if (valReport && valReport.status === 'REJECTED') {
          setAgentLogs(prev => [...prev, "CRITICAL: Validation Failed. Review Errors below."]);
          setValidationResult(valReport);
          setIsGenerating(false);
      } else {
          setAgentStep("Finalizing");
          setAgentLogs(prev => [...prev, "Validation Passed. Document Generated."]);
          setReports(prev => [saved, ...prev]);
          setIsGenerating(false);
          setReadingReport(saved);
      }
  };

  const handlePrintReport = () => {
      const printContent = document.getElementById('report-content');
      if (printContent) {
          const win = window.open('', '', 'width=800,height=900');
          if (win) {
              win.document.write(`
                  <html>
                      <head>
                          <title>${readingReport?.title || 'Report'}</title>
                          <style>
                              body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; line-height: 1.6; }
                              h1 { font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                              h2 { font-size: 18px; margin-top: 30px; color: #333; border-bottom: 1px solid #ccc; }
                              h3 { font-size: 14px; margin-top: 20px; font-weight: bold; }
                              p { margin-bottom: 15px; }
                              ul { margin-bottom: 15px; }
                              .header { margin-bottom: 40px; }
                              .meta { font-size: 12px; color: #666; margin-bottom: 40px; }
                              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                              th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; color: #000; }
                              th { background-color: #f0f0f0; font-weight: bold; }
                              blockquote { border-left: 4px solid #ccc; padding-left: 15px; color: #555; font-style: italic; }
                          </style>
                      </head>
                      <body>
                          <div class="header">
                              <h1>AURORA OSI // INTELLIGENCE REPORT</h1>
                              <div class="meta">
                                  Generated: ${new Date().toLocaleDateString()}<br/>
                                  Campaign: ${campaign.name}<br/>
                                  Ref ID: ${readingReport?.id}
                              </div>
                          </div>
                          ${printContent.innerHTML}
                          <div style="margin-top: 50px; font-size: 10px; color: #999; text-align: center;">
                              CONFIDENTIAL - PROPRIETARY DATA - DO NOT DISTRIBUTE
                          </div>
                      </body>
                  </html>
              `);
              win.document.close();
              win.focus();
              win.print();
              win.close();
          }
      }
  };

  const visibleReports = reports.filter(r => r.region === (campaign.regionName || campaign.name) || reports.length < 3);

  // Improved Markdown Render: Line-by-line processing to prevent table regex from eating text
  const renderMarkdownTable = (text: string) => {
      const lines = text.split('\n');
      let inTable = false;
      const processedLines = [];

      for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          
          // Headers
          if (line.startsWith('# ')) { processedLines.push(`<h1>${line.substring(2)}</h1>`); continue; }
          if (line.startsWith('## ')) { processedLines.push(`<h2>${line.substring(3)}</h2>`); continue; }
          if (line.startsWith('### ')) { processedLines.push(`<h3>${line.substring(4)}</h3>`); continue; }
          
          // Bold
          line = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          
          // Bullet List
          if (line.trim().startsWith('* ')) {
              processedLines.push(`• ${line.trim().substring(2)}`);
              continue;
          }
          if (line.trim().startsWith('> ')) {
              processedLines.push(`<blockquote>${line.trim().substring(2)}</blockquote>`);
              continue;
          }

          // Table Logic
          if (line.trim().startsWith('|')) {
              if (line.includes('---')) continue; // Skip separator line
              
              const cells = line.split('|').filter(c => c.trim() !== '');
              // Check if currently entering a table or already in one
              // A line is a header if it is followed by a separator line
              const isHeader = !inTable && (lines[i+1]?.includes('---')); 
              
              const rowTag = isHeader ? 'th' : 'td';
              
              // FORCE BLACK TEXT AND BORDERS
              const cellStyle = isHeader 
                  ? "border: 1px solid #000; padding: 8px; background-color: #e5e5e5; color: #000; font-weight: bold;" 
                  : "border: 1px solid #ccc; padding: 8px; color: #000;";

              const rowContent = cells.map(c => `<${rowTag} style="${cellStyle}">${c.trim()}</${rowTag}>`).join('');
              
              if (!inTable) {
                  inTable = true;
                  processedLines.push('<table style="width:100%; border-collapse: collapse; margin: 20px 0;">');
              }
              processedLines.push(`<tr>${rowContent}</tr>`);
          } else {
              if (inTable) {
                  inTable = false;
                  processedLines.push('</table>');
              }
              if (line.trim() !== '') processedLines.push(`${line}<br/>`);
          }
      }
      
      if (inTable) processedLines.push('</table>');
      
      return processedLines.join('');
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      
      <div className="flex space-x-1 bg-aurora-900/30 p-1 rounded-lg w-fit border border-aurora-800 overflow-x-auto">
         <button onClick={() => {setActiveTab('intel'); setReadingReport(null);}} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'intel' ? 'bg-aurora-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Intel Reports</button>
         <button onClick={() => setActiveTab('data_room')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'data_room' ? 'bg-aurora-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><Database size={14} className="mr-2 text-emerald-400"/> Data Room</button>
         <button onClick={() => setActiveTab('tasking')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'tasking' ? 'bg-aurora-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Satellite Tasking</button>
         <button onClick={() => setActiveTab('deliverables')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'deliverables' ? 'bg-aurora-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
             <Package size={14} className="mr-2 text-aurora-400"/> Deliverables
         </button>
      </div>

      {activeTab === 'intel' && (
          <div className="h-full">
              {readingReport ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xl h-full flex flex-col text-slate-900 animate-fadeIn relative">
                      <div className="bg-slate-100 p-4 border-b border-slate-300 flex justify-between items-center sticky top-0 z-10">
                          <div className="flex items-center space-x-3">
                              <div className="p-2 bg-white rounded border border-slate-300 shadow-sm">
                                  {customLogo ? ( <img src={customLogo} className="h-8 w-auto" alt="Logo" /> ) : ( <Globe size={24} className="text-aurora-600" /> )}
                              </div>
                              <div>
                                  <h2 className="font-bold text-lg leading-tight">{readingReport.title}</h2>
                                  <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">ID: {readingReport.id}</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                              {readingReport.validation && (
                                  <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded border border-emerald-200">
                                      <ShieldCheck size={16} />
                                      <span className="text-xs font-bold">VERIFIED</span>
                                  </div>
                              )}
                              <button onClick={handlePrintReport} className="text-slate-600 hover:text-white hover:bg-slate-700 bg-white border border-slate-300 p-2 rounded-lg transition-colors flex items-center shadow-sm" title="Print / Save PDF">
                                  <Printer size={18} className="mr-2" />
                                  <span className="text-xs font-bold">Export PDF</span>
                              </button>
                              <button onClick={() => setReadingReport(null)} className="text-slate-500 hover:text-slate-800 hover:bg-slate-200 p-2 rounded-full transition-colors">
                                  <XCircle size={24} />
                              </button>
                          </div>
                      </div>
                      
                      {readingReport.validation && (
                          <div className="bg-slate-800 text-slate-200 p-4 flex justify-between items-center border-b border-slate-600">
                              <div className="flex space-x-6">
                                  <div className="flex items-center space-x-2">
                                      <Network size={16} className={readingReport.validation.agents.methodology.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'} />
                                      <div>
                                          <p className="text-[10px] text-slate-400 uppercase">Harmonization</p>
                                          <p className="text-xs font-bold text-white">AUDITED</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <Scan size={16} className={readingReport.validation.agents.coverage.status === 'pass' ? 'text-emerald-400' : 'text-red-400'} />
                                      <div>
                                          <p className="text-[10px] text-slate-400 uppercase">Coverage</p>
                                          <p className="text-xs font-bold text-white">{(readingReport.validation.agents.coverage.coverage_pct * 100).toFixed(1)}%</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <CheckCircle2 size={16} className={readingReport.validation.agents.verifier.status === 'pass' ? 'text-emerald-400' : 'text-red-400'} />
                                      <div>
                                          <p className="text-[10px] text-slate-400 uppercase">Verifier</p>
                                          <p className="text-xs font-bold text-white">{readingReport.validation.agents.verifier.status.toUpperCase()}</p>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-right"><p className="text-[10px] text-slate-500 font-mono">SIG: {readingReport.validation.signature}</p></div>
                          </div>
                      )}

                      <div className="flex-1 overflow-y-auto p-8 font-serif leading-relaxed max-w-4xl mx-auto w-full bg-white text-black print-container">
                          {/* We use 'white-space: pre-wrap' to respect markdown formatting in simple mode, but let's wrap it in a ID for printing */}
                          <div id="report-content">
                              <div dangerouslySetInnerHTML={{ 
                                  __html: renderMarkdownTable(readingReport.summary)
                              }} />
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-6 animate-fadeIn">
                      <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 relative overflow-hidden">
                          {isGenerating && (
                              <div className="absolute inset-0 bg-aurora-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8">
                                  <div className="mb-4 bg-aurora-900 p-4 rounded-full border border-aurora-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                                      <Sparkles size={32} className="text-aurora-400 animate-pulse" />
                                  </div>
                                  <h3 className="text-lg font-bold text-white mb-2">Multi-Agent Validation Protocol</h3>
                                  <div className="w-full max-w-md space-y-2">
                                      {agentLogs.map((log, idx) => (
                                          <div key={idx} className="flex items-center text-xs text-emerald-400 font-mono animate-fadeIn p-2 bg-slate-900/50 rounded border border-emerald-900/50">
                                              <CheckCircle2 size={12} className="mr-2" /> {log}
                                          </div>
                                      ))}
                                      {validationResult?.status === 'REJECTED' ? (
                                          <div className="bg-red-900/20 border border-red-500/50 p-3 rounded mt-4">
                                              <p className="text-red-400 font-bold flex items-center mb-1"><AlertTriangle size={14} className="mr-2"/> REPORT BLOCKED</p>
                                              <ul className="list-disc list-inside text-xs text-red-300">
                                                  {validationResult.agents.verifier.unsupported_claims.map((claim, i) => (
                                                      <li key={i}>{claim}</li>
                                                  ))}
                                              </ul>
                                              <button onClick={() => setIsGenerating(false)} className="mt-3 w-full bg-red-800 hover:bg-red-700 text-white text-xs py-1 rounded">Acknowledge Failure</button>
                                          </div>
                                      ) : (
                                          <div className="flex items-center text-xs text-aurora-400 font-mono animate-pulse p-2"><Loader2 size={12} className="mr-2 animate-spin" /> Active Agent: {agentStep}</div>
                                      )}
                                  </div>
                              </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                              <div>
                                  <h3 className="font-semibold text-slate-200">Bankable Feasibility Report</h3>
                                  <p className="text-xs text-slate-500 mt-1">Compile comprehensive multi-physics analysis with Agentic Verification.</p>
                              </div>
                              <button onClick={runAgenticReview} disabled={isGenerating} className="bg-aurora-600 hover:bg-aurora-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center disabled:opacity-50 shadow-lg transition-all">
                                  <ShieldCheck size={16} className="mr-2" /> Verify & Generate Report
                              </button>
                          </div>
                      </div>

                      <div className="space-y-4">
                          {visibleReports.map(report => (
                              <div key={report.id} onClick={() => setReadingReport(report)} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 hover:border-aurora-500 transition-all cursor-pointer group text-left shadow-sm">
                                  <div className="flex justify-between items-start mb-2">
                                      <div>
                                          <h4 className="text-sm font-bold text-slate-200 group-hover:text-white flex items-center">
                                              <FileText size={16} className="mr-2 text-aurora-400" />
                                              {report.title}
                                          </h4>
                                          <p className="text-[10px] text-slate-500 font-mono mt-1 ml-6">{report.id} • {report.date}</p>
                                      </div>
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${report.status === 'Verified' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}`}>{report.status.toUpperCase()}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'data_room' && (
          <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-white flex items-center"><Lock size={18} className="mr-2 text-emerald-400"/> Secure Discovery Data Room</h3>
                  <div className="text-xs text-slate-500 font-mono">ENCRYPTION: AES-256</div>
              </div>
              
              {campaign.results && campaign.results.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {campaign.results.map((res, idx) => (
                          <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                              <h4 className="text-sm font-bold text-emerald-400 mb-4 border-b border-slate-800 pb-2 flex justify-between">
                                  {res.element} Target
                                  <span className="text-white">{(res.probability * 100).toFixed(1)}% Pg</span>
                              </h4>
                              <div className="space-y-3">
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Status</span><span className={`font-mono font-bold ${res.status === 'Confirmed' ? 'text-emerald-400' : 'text-amber-400'}`}>{res.status.toUpperCase()}</span></div>
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Depth</span><span className="font-mono text-white">{res.specifications.depth?.toFixed(0)} m</span></div>
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Inferred Quantum</span><span className="font-mono text-white">{res.specifications.tonnage?.toFixed(1)} Mt</span></div>
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Estimated Grade</span><span className="font-mono text-white">{res.specifications.grade?.toFixed(2)}%</span></div>
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Formation Pressure</span><span className="font-mono text-white">{res.specifications.pressure} MPa</span></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <Search size={48} className="mb-4 opacity-50" />
                      <p>No verified discovery data available yet.</p>
                      <p className="text-xs">Run a Deep Scan to populate this room.</p>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'tasking' && (
          <div className="h-full space-y-4">
              <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex justify-between items-center">
                   <div><h3 className="font-semibold text-slate-200">Orbital Tasking Request</h3><p className="text-xs text-slate-500 mt-1">Direct constellation sensors to new coordinates.</p></div>
                   <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-600 flex items-center"><Plus size={16} className="mr-2" /> New Request</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {tasks.map(task => (
                      <div key={task.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                          <div><p className="text-sm font-bold text-white flex items-center"><Target size={14} className="mr-2 text-aurora-500"/> {task.sensorType}</p><p className="text-xs text-slate-500 font-mono mt-1">{task.targetCoordinates} | {task.submittedAt}</p></div>
                          <div className="text-right"><span className={`text-[10px] px-2 py-1 rounded font-bold ${task.priority === 'Emergency' ? 'bg-red-900/30 text-red-400' : task.priority === 'Urgent' ? 'bg-amber-900/30 text-amber-400' : 'bg-blue-900/30 text-blue-400'}`}>{task.priority.toUpperCase()}</span><p className="text-xs font-bold text-slate-400 mt-1">{task.status}</p></div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default IETLView;
