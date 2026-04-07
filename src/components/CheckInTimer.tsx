import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, X } from 'lucide-react';

interface CheckInTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckInTimer: React.FC<CheckInTimerProps> = ({ isOpen, onClose }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Safety Check-in</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        {!isActive ? (
          <div className="space-y-4">
            <button onClick={() => { setSeconds(300); setIsActive(true); }} className="w-full bg-cyan-600 p-3 rounded-xl text-white font-bold">5 Minutes</button>
            <button onClick={() => { setSeconds(1800); setIsActive(true); }} className="w-full bg-cyan-600 p-3 rounded-xl text-white font-bold">30 Minutes</button>
          </div>
        ) : (
          <div className="text-center">
            <Clock size={48} className="mx-auto text-cyan-400 mb-4" />
            <div className="text-4xl font-bold text-white">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</div>
            <p className="text-gray-400 mt-2">Time remaining until alert</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
