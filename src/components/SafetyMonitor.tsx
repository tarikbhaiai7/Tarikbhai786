import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface SafetyMonitorProps {
  isActive: boolean;
  onToggle: () => void;
  onTest?: () => void;
}

export const SafetyMonitor: React.FC<SafetyMonitorProps> = ({ 
  isActive, 
  onToggle, 
  onTest 
}) => {
  return (
    <div className="flex justify-center items-center gap-2 mb-4">
      <button 
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isActive 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
        }`}
      >
        {isActive ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
        {isActive ? 'Safety Monitor: ON' : 'Safety Monitor: OFF'}
      </button>
      {isActive && onTest && (
        <button 
          onClick={onTest} 
          className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-400 hover:text-white transition-colors"
        >
          Test (Skip 7h)
        </button>
      )}
    </div>
  );
};
