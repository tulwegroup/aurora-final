import React from 'react';
import { TargetResult, Satellite } from '../types';

interface MapVisualizationProps {
  targets: TargetResult[];
  satellites: Satellite[];
  onCoordinateSelect: (coord: { lat: number; lon: number }) => void;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({
  targets,
  satellites,
  onCoordinateSelect
}) => {
  const handleMapClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Mock coordinates based on click position
    const lat = 4.5 + (y / rect.height) * 0.2;
    const lon = -3.0 + (x / rect.width) * 0.2;
    
    onCoordinateSelect({ lat, lon });
  };

  return (
    <div 
      className="w-full h-full bg-slate-950 relative rounded-lg overflow-hidden"
      onClick={handleMapClick}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(to right, #334155 1px, transparent 1px),
            linear-gradient(to bottom, #334155 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Targets */}
      {targets.map((target) => (
        <div
          key={target.id}
          className="absolute w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500/20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${((target.location.lon + 3.0) / 0.2) * 100}%`,
            top: `${((target.location.lat - 4.5) / 0.2) * 100}%`,
          }}
          title={`${target.type} - ${(target.confidence * 100).toFixed(0)}% confidence`}
        />
      ))}
      
      {/* Satellites */}
      {satellites.map((sat) => (
        <div
          key={sat.id}
          className="absolute w-3 h-3 rounded-full border border-aurora-500 bg-aurora-500/30 animate-pulse"
          style={{
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 90 + 5}%`,
          }}
          title={`${sat.name} - ${sat.type}`}
        />
      ))}
      
      {/* Click Hint */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-500">
        Click anywhere to select coordinates
      </div>
    </div>
  );
};

export default MapVisualization;
