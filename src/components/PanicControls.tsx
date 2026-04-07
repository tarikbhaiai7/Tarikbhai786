import React, { useState } from 'react';
import { AlertTriangle, MapPin, MessageCircle, Phone } from 'lucide-react';
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
  const [activeIcon, setActiveIcon] = useState<string | null>(null);

  const handleIconClick = (iconName: string, action: () => void) => {
    if (activeIcon === iconName) {
      action();
      setActiveIcon(null);
    } else {
      setActiveIcon(iconName);
      setTimeout(() => setActiveIcon(null), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 px-2 py-2">
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => handleIconClick('panic', onPanic)}
        className={`p-3 rounded-full relative ${
          isPanicMode 
            ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)]' 
            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
        }`}
      >
        <AlertTriangle size={24} className={isPanicMode ? 'animate-bounce' : ''} /> 
        {activeIcon === 'panic' && (
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">
            {isPanicMode ? 'Tap again to Stop Panic' : 'Tap again for Panic'}
          </span>
        )}
      </motion.button>
      
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => handleIconClick('location', onShareLocation)}
        className="p-3 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 relative"
      >
        <MapPin size={24} />
        {activeIcon === 'location' && (
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">
            Tap again for Location
          </span>
        )}
      </motion.button>

      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => handleIconClick('whatsapp', onWhatsApp)}
        className="p-3 rounded-full bg-[#00a884]/10 text-[#00a884] hover:bg-[#00a884]/20 relative"
      >
        <MessageCircle size={24} />
        {activeIcon === 'whatsapp' && (
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">
            Tap again for WhatsApp
          </span>
        )}
      </motion.button>

      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => handleIconClick('call', () => window.location.href = 'tel:9114411026')}
        className="p-3 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 relative"
      >
        <Phone size={24} />
        {activeIcon === 'call' && (
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">
            Tap again to Call
          </span>
        )}
      </motion.button>
    </div>
  );
};
