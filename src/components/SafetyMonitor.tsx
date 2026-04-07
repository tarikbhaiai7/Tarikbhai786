import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

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
    <div className="flex justify-center items-center gap-3">
      <motion.button 
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-mono font-bold transition-all backdrop-blur-md border ${
          isActive 
            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_15px_rgba(255,165,0,0.2)]' 
            : 'bg-white/5 text-white/20 border-white/10 hover:bg-white/10'
        }`}
      >
        {isActive ? <ShieldCheck size={14} className="text-orange-400" /> : <ShieldAlert size={14} />}
        <span className="tracking-[0.2em] uppercase">
          {isActive ? 'MONITOR: ACTIVE' : 'MONITOR: OFFLINE'}
        </span>
      </motion.button>
      {isActive && onTest && (
        <motion.button 
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onTest} 
          className="text-[9px] glass-card px-3 py-2 rounded-full text-white/20 hover:text-white/60 transition-colors border-white/5 font-mono font-bold uppercase tracking-widest"
        >
          DEBUG_MODE
        </motion.button>
      )}
    </div>
  );
};
