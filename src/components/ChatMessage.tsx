import React, { useState, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { Copy, Phone, MessageSquare, MessageCircle } from 'lucide-react';
import { Message, Brother } from '../types';

interface ChatMessageProps {
  msg: Message & { brothers?: Brother[] };
  isLast?: boolean;
  onDelete?: (id: string) => void;
  onRegenerate?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ msg, isLast, onDelete, onRegenerate }) => {
  const [showCopied, setShowCopied] = useState(false);
  const isModel = msg.role === 'model';
  
  const controls = useAnimation();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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
        className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap relative z-10 transition-all duration-300 ${
          !isModel
            ? 'bg-[#005c4b] text-white rounded-2xl rounded-tr-sm font-normal'
            : msg.isPanicAlert 
              ? 'bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white rounded-2xl rounded-tl-sm'
              : 'bg-[#202c33] text-gray-100 rounded-2xl rounded-tl-sm'
        }`}
      >
        {isModel && (
          <div className="absolute top-2 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Removed the 3 dots for simpler UI */}
          </div>
        )}

        {showCopied && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-orange-500/30 flex items-center gap-2 backdrop-blur-xl shadow-[0_0_15px_rgba(255,165,0,0.3)]"
          >
            <Copy size={12} className="text-orange-400" /> Copied to clipboard
          </motion.div>
        )}
        
        <div className={`relative ${isModel ? 'font-sans' : 'font-medium'}`}>
          {msg.text}
          {isModel && isLast && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-1.5 h-4 ml-1 bg-white/50 align-middle"
            />
          )}
          {isModel && isLast && !msg.text && (
            <div className="flex gap-1.5 py-1">
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            </div>
          )}
        </div>
        
        {msg.isPanicAlert && (
          <div className="mt-5 space-y-3">
            {msg.brothers && msg.brothers.length > 0 && (
              <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400 mb-2">Brothers Notified:</p>
                <div className="flex flex-wrap gap-2">
                  {msg.brothers.map((b, i) => (
                    <div key={i} className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-white/70 border border-white/5">
                      {b.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => handleIconClick('police', () => window.location.href = 'tel:112')}
                className="p-4 bg-red-600/20 text-red-500 rounded-full hover:bg-red-600/30 relative"
              >
                <Phone size={24} />
                {activeIcon === 'police' && (
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-50">
                    Tap again to Call Police
                  </span>
                )}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => handleIconClick('sms', () => window.location.href = `sms:918984473230?body=${encodeURIComponent('HELP! My location: ' + (msg.mapsLink || ''))}`)}
                className="p-4 bg-yellow-600/20 text-yellow-500 rounded-full hover:bg-yellow-600/30 relative"
              >
                <MessageSquare size={24} />
                {activeIcon === 'sms' && (
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-50">
                    Tap again for SMS
                  </span>
                )}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => handleIconClick('wa', () => window.open(`https://wa.me/918984473230?text=${encodeURIComponent('HELP! My location: ' + (msg.mapsLink || ''))}`, '_blank'))}
                className="p-4 bg-green-600/20 text-green-500 rounded-full hover:bg-green-600/30 relative"
              >
                <MessageCircle size={24} />
                {activeIcon === 'wa' && (
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-50">
                    Tap again for WhatsApp
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
