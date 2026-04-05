import React from 'react';
import { AlertTriangle, MapPin, MessageCircle } from 'lucide-react';

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
    <div className="flex justify-between px-3 pt-3 pb-2 gap-2">
      <button 
        onClick={onPanic}
        disabled={isPanicMode}
        className={`flex-1 flex items-center justify-center gap-1.5 py-3 transition-all rounded-xl text-xs sm:text-sm font-bold border ${
          isPanicMode 
            ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)] cursor-default' 
            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 active:scale-95'
        }`}
      >
        <AlertTriangle size={16} className={isPanicMode ? 'animate-bounce' : ''} /> 
        {isPanicMode ? 'PANIC ACTIVE' : 'PANIC'}
      </button>
      <button 
        onClick={onShareLocation}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all rounded-xl text-xs sm:text-sm font-semibold border border-blue-500/20"
      >
        <MapPin size={14} /> Location
      </button>
      <button 
        onClick={onWhatsApp}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-500/10 text-green-500 hover:bg-green-500/20 active:scale-95 transition-all rounded-xl text-xs sm:text-sm font-semibold border border-green-500/20"
      >
        <MessageCircle size={14} /> Bhai
      </button>
    </div>
  );
};
