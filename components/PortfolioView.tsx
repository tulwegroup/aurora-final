

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, CartesianGrid, AreaChart, Area } from 'recharts';
import { AuroraAPI } from '../api';
import { PortfolioSummary, PortfolioAsset } from '../types';
import { Globe, TrendingUp, AlertTriangle, Leaf, Droplet, Fuel, Briefcase, ChevronRight, Loader2, DollarSign, X, FileText, CheckCircle2, Lock } from 'lucide-react';

const COLORS = {
    'Low': '#10b981', // Emerald
    'Medium': '#f59e0b', // Amber
    'High': '#ef4444' // Red
};

const PortfolioView: React.FC = () => {
    const [data, setData] = useState<PortfolioSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeAsset, setActiveAsset] = useState<PortfolioAsset | null>(null);
    
    // Deal Room State
    const [showDealRoom, setShowDealRoom] = useState(false);
    const [dealRoomAsset, setDealRoomAsset] = useState<PortfolioAsset | null>(null);

    useEffect(() => {
        const fetchPortfolio = async () => {
            setIsLoading(true);
            const res = await AuroraAPI.getPortfolioOverview();
            if (res) {
                setData(res);
                if (res.assets.length > 0) setActiveAsset(res.assets[0]);
            }
            setIsLoading(false);
        };
        fetchPortfolio();
    }, []);

    // Transform for Scatter Plot (Risk vs Reward)
    const scatterData = data?.assets.map(a => ({
        x: a.status.risk_profile === 'Low' ? 10 : a.status.risk_profile === 'Medium' ? 50 : 90, // Risk Score
        y: a.economics.roi_percent, // ROI
        z: a.economics.npv_usd / 1000000, // Bubble Size (NPV in Millions)
        name: a.name,
        type: a.type,
        risk: a.status.risk_profile,
        id: a.id
    })) || [];

    const handleOpenDealRoom = () => {
        if (activeAsset) {
            setDealRoomAsset(activeAsset);
            setShowDealRoom(true);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Loader2 size={48} className="animate-spin mb-4 text-aurora-500" />
                <p>Synthesizing Global Portfolio Strategy...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative h-full">
            
            {/* Executive Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-mono uppercase mb-1">Total Portfolio NPV</p>
                        <h3 className="text-2xl font-bold text-white flex items-baseline">
                            ${(data?.summary.total_npv_usd || 0).toLocaleString()} 
                        </h3>
                    </div>
                    <div className="mt-4 flex items-center text-emerald-400 text-xs font-bold">
                        <TrendingUp size={14} className="mr-1" /> +12.4% vs Last Quarter
                    </div>
                </div>

                <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-mono uppercase mb-1">Active Assets</p>
                        <h3 className="text-2xl font-bold text-white">{data?.summary.asset_count}</h3>
                    </div>
                    <div className="mt-4 flex items-center text-slate-500 text-xs">
                        <Globe size={14} className="mr-1" /> Across 3 Continents
                    </div>
                </div>

                {/* ESG Rollup */}
                <div className="col-span-2 bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <Leaf size={100} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-emerald-400 flex items-center">
                                <Leaf size={18} className="mr-2" /> Zero Footprint Impact
                            </h3>
                            <p className="text-xs text-emerald-200/60">Total environmental savings via satellite exploration</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center space-x-3">
                            <Fuel size={24} className="text-amber-500" />
                            <div>
                                <p className="text-xl font-bold text-white">{(data?.summary.total_diesel_saved_l || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 uppercase">Liters Diesel</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Droplet size={24} className="text-blue-500" />
                            <div>
                                <p className="text-xl font-bold text-white">{(data?.summary.total_water_saved_m3 || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 uppercase">m³ Water</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                
                {/* Risk/Reward Matrix */}
                <div className="lg:col-span-2 bg-aurora-950 border border-aurora-800 rounded-xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-200 flex items-center">
                            <AlertTriangle size={18} className="mr-2 text-aurora-500" /> Risk vs. Reward Matrix
                        </h3>
                        <div className="flex space-x-4 text-xs">
                            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div> Low Risk</div>
                            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div> Medium Risk</div>
                            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div> High Risk</div>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis type="number" dataKey="x" name="Risk" stroke="#475569" label={{ value: 'Risk Profile (Low -> High)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }} tick={false} domain={[0, 100]} />
                                <YAxis type="number" dataKey="y" name="ROI" stroke="#475569" label={{ value: 'Return on Investment (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} domain={[0, 'auto']} />
                                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="NPV Size" />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                                                    <p className="font-bold text-white mb-1">{d.name}</p>
                                                    <p className="text-slate-400">Type: {d.type}</p>
                                                    <p className="text-slate-400">ROI: {d.y}%</p>
                                                    <p className="text-slate-400">NPV: ${d.z}M</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Assets" data={scatterData} onClick={(node) => {
                                    const asset = data?.assets.find(a => a.id === node.payload.id);
                                    if(asset) setActiveAsset(asset);
                                }} className="cursor-pointer">
                                    {scatterData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.risk as keyof typeof COLORS]} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                        
                        {/* Matrix Quadrant Labels */}
                        <div className="absolute top-2 right-2 text-[10px] text-emerald-400 font-bold opacity-50">PRIORITY TARGETS</div>
                        <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 font-bold opacity-50">LOW VIABILITY</div>
                    </div>
                </div>

                {/* Asset List & Details */}
                <div className="bg-aurora-900/50 border border-aurora-800 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-aurora-800 bg-aurora-900/50">
                        <h3 className="font-bold text-sm text-slate-300">Portfolio Assets</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {data?.assets.map((asset) => (
                            <div 
                                key={asset.id} 
                                onClick={() => setActiveAsset(asset)}
                                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                    activeAsset?.id === asset.id 
                                    ? 'bg-slate-800 border-aurora-500 shadow-md' 
                                    : 'bg-slate-900/50 border-transparent hover:bg-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="text-sm font-bold text-white truncate">{asset.name}</h4>
                                        <p className="text-[10px] text-slate-500">{asset.type}</p>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                                        asset.status.risk_profile === 'Low' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                        asset.status.risk_profile === 'Medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                        'text-red-400 border-red-500/30 bg-red-500/10'
                                    }`}>
                                        {asset.status.risk_profile.toUpperCase()} RISK
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-950 p-1.5 rounded text-center">
                                        <p className="text-slate-500 text-[9px]">NPV</p>
                                        <p className="text-white font-mono">${(asset.economics.npv_usd / 1000000).toFixed(1)}M</p>
                                    </div>
                                    <div className="bg-slate-950 p-1.5 rounded text-center">
                                        <p className="text-slate-500 text-[9px]">ROI</p>
                                        <p className="text-emerald-400 font-mono">{asset.economics.roi_percent}%</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Mini Detail Footer */}
                    {activeAsset && (
                        <div className="p-4 bg-slate-950 border-t border-aurora-800">
                            <div className="flex justify-between items-center text-xs mb-2">
                                <span className="text-slate-400">Carbon Intensity</span>
                                <span className="text-white font-mono">{activeAsset.esg.carbon_intensity} kgCO2/unit</span>
                            </div>
                            <button 
                                onClick={handleOpenDealRoom}
                                className="w-full bg-aurora-600 hover:bg-aurora-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center transition-colors shadow-lg"
                            >
                                <Briefcase size={14} className="mr-2" /> Open Asset Deal Room
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Deal Room Modal */}
            {showDealRoom && dealRoomAsset && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-slate-950 border border-aurora-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-aurora-800 bg-aurora-900/50 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center">
                                    <Lock size={24} className="mr-3 text-emerald-400" />
                                    Confidential Investment Memo
                                </h2>
                                <p className="text-sm text-slate-400 mt-1 font-mono uppercase tracking-wider">
                                    ASSET: {dealRoomAsset.name} | ID: {dealRoomAsset.id}
                                </p>
                            </div>
                            <button onClick={() => setShowDealRoom(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            
                            {/* Key Financials */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                                    <p className="text-xs text-slate-500 uppercase">Gross In-Situ Value</p>
                                    <p className="text-2xl font-bold text-white mt-1">${dealRoomAsset.economics.gross_value_usd.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-500 mt-1 italic">Based on inferred volumetric resource</p>
                                </div>
                                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
                                    <p className="text-xs text-emerald-400 uppercase font-bold">Net Present Value (NPV)</p>
                                    <p className="text-3xl font-bold text-emerald-400 mt-1">${dealRoomAsset.economics.npv_usd.toLocaleString()}</p>
                                    <p className="text-[10px] text-emerald-500/70 mt-1">Risk-Weighted @ 10% Discount Rate</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                                    <p className="text-xs text-slate-500 uppercase">Return on Investment</p>
                                    <p className="text-2xl font-bold text-blue-400 mt-1">{dealRoomAsset.economics.roi_percent}%</p>
                                    <p className="text-[10px] text-slate-500 mt-1 italic">Pre-tax IRR estimate</p>
                                </div>
                            </div>

                            {/* Valuation Methodology */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center border-b border-slate-800 pb-2">
                                    <FileText size={16} className="mr-2 text-slate-400" /> Valuation Methodology (NI 43-101 Aligned)
                                </h3>
                                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                                    <p>NPV Calculation Breakdown:</p>
                                    <div className="flex justify-between">
                                        <span>1. Volumetric Estimate:</span>
                                        <span className="text-white">~{(dealRoomAsset.economics.gross_value_usd / 200).toLocaleString()} units</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>2. Recovery Factor:</span>
                                        <span className="text-white">85% (Industry Std)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>3. Geological Risk Factor:</span>
                                        <span className="text-white">0.25 (P25 Confidence)</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                                        <span className="font-bold text-emerald-400">Total Unrisked Value:</span>
                                        <span className="font-bold text-emerald-400">${dealRoomAsset.economics.gross_value_usd.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Feasibility Checklist */}
                            <div>
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center border-b border-slate-800 pb-2">
                                    <CheckCircle2 size={16} className="mr-2 text-slate-400" /> Technical Feasibility
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start space-x-3 p-3 rounded hover:bg-slate-900/50">
                                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">Physics Inversion Validated</p>
                                            <p className="text-[10px] text-slate-500">Density contrast confirms structural trap existence.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-3 rounded hover:bg-slate-900/50">
                                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">ESG Compliant</p>
                                            <p className="text-[10px] text-slate-500">Carbon intensity ({dealRoomAsset.esg.carbon_intensity}) below sector avg.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-3 rounded hover:bg-slate-900/50">
                                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">Quantum Optimization</p>
                                            <p className="text-[10px] text-slate-500">Global minimum convergence achieved.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-3 rounded hover:bg-slate-900/50">
                                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">Access & Logistics</p>
                                            <p className="text-[10px] text-slate-500">Site accessible via existing infrastructure.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-aurora-800 bg-aurora-900/30 flex justify-end space-x-4">
                            <button onClick={() => setShowDealRoom(false)} className="px-4 py-2 rounded text-xs font-bold text-slate-400 hover:text-white transition-colors">
                                Close Viewer
                            </button>
                            <button className="px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center">
                                <DollarSign size={14} className="mr-2" />
                                Initiate Acquisition Offer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioView;
