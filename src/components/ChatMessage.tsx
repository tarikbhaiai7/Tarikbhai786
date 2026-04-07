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

const TypewriterText = ({ text, isAnimated }: { text: string, isAnimated: boolean }) => {
  const [displayedText, setDisplayedText] = useState(isAnimated ? '' : text);
  const [hasAnimated, setHasAnimated] = useState(!isAnimated);

  useEffect(() => {
    if (!isAnimated || hasAnimated) {
      setDisplayedText(text);
      return;
    }
    
    let i = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
        setHasAnimated(true);
      }
    }, 15); // 15ms per character for a smooth, fast typing effect

    return () => clearInterval(interval);
  }, [text, isAnimated, hasAnimated]);

  return <span>{displayedText}</span>;
};

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
      // Swipe Right -> Regenerate (only for model messages if it's the last one)
      if (isModel && isLast && onRegenerate) {
        onRegenerate();
      }
      controls.start({ x: 0 });
    } else if (offset < -100 || velocity < -500) {
      // Swipe Left -> Delete
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
    }, 600); // 600ms for long press
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
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${!isModel ? 'justify-end' : 'justify-start'} relative overflow-hidden`}
    >
      {/* Background Action Indicators */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 opacity-0 pointer-events-none">
        <RefreshCw size={20} className="text-blue-400" />
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-4 opacity-0 pointer-events-none">
        <Trash2 size={20} className="text-red-400" />
      </div>

      {isModel && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1 ring-2 ring-blue-500/20 z-10">
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
        className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap relative z-10 ${
          !isModel
            ? 'bg-gradient-to-br from-[#6a11cb] to-[#5b0eb0] text-white rounded-2xl rounded-tr-sm'
            : msg.isPanicAlert 
              ? 'bg-red-900/40 border border-red-500/50 text-white rounded-2xl rounded-tl-sm'
              : 'bg-[#1e1e30] border border-white/5 text-gray-100 rounded-2xl rounded-tl-sm'
        }`}
      >
        {showCopied && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Copy size={12} /> Copied
          </div>
        )}
        <TypewriterText text={msg.text} isAnimated={isModel && isLast === true} />
        
        {msg.isPanicAlert && (
          <div className="mt-4 space-y-3">
            <a 
              href="tel:112" 
              className="flex items-center justify-center gap-2 w-full p-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all active:scale-95"
            >
              📞 Call Police (112)
            </a>
            <a 
              href={`sms:9999999999?body=${encodeURIComponent('HELP! My location: ' + (msg.mapsLink || ''))}`} 
              className="flex items-center justify-center gap-2 w-full p-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            >
              📩 Send Emergency SMS
            </a>
            <a 
              href={`https://wa.me/919999999999?text=${encodeURIComponent('HELP! My location: ' + (msg.mapsLink || ''))}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95"
            >
              🟢 WhatsApp Emergency Contact
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
