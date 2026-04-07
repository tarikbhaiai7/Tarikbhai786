import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { Search, Copy, Trash2, RefreshCw } from 'lucide-react';
import { Message, Brother } from '../types';

interface ChatMessageProps {
  msg: Message;
  isLast?: boolean;
  onDelete?: (id: string) => void;
  onRegenerate?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ msg, isLast, onDelete, onRegenerate }) => {
  const [brotherSearchQuery, setBrotherSearchQuery] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const isModel = msg.role === 'model';
  
  const controls = useAnimation();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 500) {
      if (isModel && isLast && onRegenerate) {
        onRegenerate();
      }
      controls.start({ x: 0 });
    } else if (offset < -100 || velocity < -500) {
      if (onDelete) {
        onDelete(msg.id);
      } else {
        controls.start({ x: 0 });
      }
    } else {
      controls.start({ x: 0 });
    }
  };

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      navigator.clipboard.writeText(msg.text);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`flex ${!isModel ? 'justify-end' : 'justify-start'} relative group`}
    >
      {isModel && (
        <div className="w-8 h-8 rounded-xl overflow-hidden mr-3 flex-shrink-0 mt-1 border border-white/10 shadow-lg z-10">
          <img 
            src="https://plain-apac-prod-public.komododecks.com/202604/03/fXlClkW2XbEL9JY4Wa64/image.jpg" 
            alt="Tarik" 
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 text-[15px] leading-relaxed shadow-2xl whitespace-pre-wrap relative z-10 transition-all duration-300 ${
          !isModel
            ? 'vip-gradient text-white rounded-2xl rounded-tr-sm font-medium border border-white/10'
            : msg.isPanicAlert 
              ? 'bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white rounded-2xl rounded-tl-sm'
              : 'glass-card text-gray-100 rounded-2xl rounded-tl-sm border-white/5'
        }`}
      >
        {isModel && (
          <div className="absolute top-2 right-3 flex gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
          </div>
        )}

        {showCopied && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-cyan-500/30 flex items-center gap-2 backdrop-blur-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Copy size={12} className="text-cyan-400" /> Copied to clipboard
          </motion.div>
        )}
        
        <div className={`relative ${isModel ? 'font-sans' : 'font-medium'}`}>
          {msg.text}
          {isModel && isLast && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 align-middle"
            />
          )}
          {isModel && isLast && !msg.text && (
            <div className="flex gap-1.5 py-1">
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full" />
            </div>
          )}
        </div>
        
        {msg.isPanicAlert && (
          <div className="mt-5 space-y-3">
            <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="tel:112" 
              className="flex items-center justify-center gap-3 w-full p-3.5 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all"
            >
              📞 Call Police (112)
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`sms:9999999999?body=${encodeURIComponent('HELP! My location: ' + (msg.mapsLink || ''))}`} 
              className="flex items-center justify-center gap-3 w-full p-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
            >
              📩 Send Emergency SMS
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`https://wa.me/918984473230?text=${encodeURIComponent('HELP! My location: ' + (msg.mapsLink || ''))}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full p-3.5 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-600/20 hover:bg-green-500 transition-all"
            >
              🟢 WhatsApp Emergency
            </motion.a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
