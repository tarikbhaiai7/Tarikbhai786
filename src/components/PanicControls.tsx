import React from 'react';
import { AlertTriangle, MapPin, MessageCircle, Phone, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface PanicControlsProps {
  isPanicMode: boolean;
  onPanic: () => void;
  onShareLocation: () => void;
  onWhatsApp: () => void;
}

export const PanicControls: React.FC<PanicControlsProps> = ({ 
  isPanicMode, 
  onPanic, 
  onShareLocation, 
  onWhatsApp
}) => {
  return (
    <div className="flex flex-col px-1 pt-2 pb-1 gap-3">
      <motion.button 
        whileHover={{ scale: 1.02, backgroundColor: isPanicMode ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.15)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onPanic}
        className={`w-full flex items-center justify-center gap-3 py-4 transition-all rounded-2xl text-base sm:text-lg font-black border-2 relative overflow-hidden ${
          isPanicMode 
            ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.8)]' 
            : 'bg-red-500/5 text-red-500 hover:text-red-400 border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.1)]'
        }`}
      >
        {isPanicMode && (
          <motion.div 
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        )}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <AlertTriangle size={24} className={isPanicMode ? 'animate-bounce' : 'relative z-10'} /> 
        <span className="tracking-[0.2em] uppercase relative z-10 font-mono">
          {isPanicMode ? 'STOP EMERGENCY PROTOCOL' : 'INITIATE PANIC PROTOCOL'}
        </span>
      </motion.button>
      
      <div className="grid grid-cols-2 gap-3">
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onShareLocation}
          className="flex items-center justify-center gap-2 py-3.5 glass-card text-cyan-400 hover:text-cyan-300 transition-all rounded-2xl text-[10px] sm:text-xs font-mono font-bold border border-cyan-500/20 shadow-lg uppercase tracking-widest"
        >
          <MapPin size={14} /> Location
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onWhatsApp}
          className="flex items-center justify-center gap-2 py-3.5 glass-card text-green-400 hover:text-green-300 transition-all rounded-2xl text-[10px] sm:text-xs font-mono font-bold border border-green-500/20 shadow-lg uppercase tracking-widest"
        >
          <MessageCircle size={14} /> WhatsApp
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = 'tel:9114411026'}
          className="flex items-center justify-center gap-2 py-3.5 glass-card text-red-400 hover:text-red-300 transition-all rounded-2xl text-[10px] sm:text-xs font-mono font-bold border border-red-500/20 shadow-lg uppercase tracking-widest"
        >
          <Phone size={14} /> Call Emergency
        </motion.button>
      </div>
    </div>
  );
};
