import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { Message, Brother } from '../types';

interface ChatMessageProps {
  msg: Message;
  isLast?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ msg }) => {
  const [brotherSearchQuery, setBrotherSearchQuery] = useState('');

  const isModel = msg.role === 'model';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${!isModel ? 'justify-end' : 'justify-start'}`}
    >
      {isModel && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1 ring-2 ring-blue-500/20">
          <img 
            src="https://plain-apac-prod-public.komododecks.com/202604/03/fXlClkW2XbEL9JY4Wa64/image.jpg" 
            alt="Tarik" 
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
          !isModel
            ? 'bg-gradient-to-br from-[#6a11cb] to-[#5b0eb0] text-white rounded-2xl rounded-tr-sm'
            : msg.isPanicAlert 
              ? 'bg-red-900/40 border border-red-500/50 text-white rounded-2xl rounded-tl-sm'
              : 'bg-[#1e1e30] border border-white/5 text-gray-100 rounded-2xl rounded-tl-sm'
        }`}
      >
        {msg.text}
        
        {msg.isPanicAlert && msg.brothers && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-red-300/70" />
              </div>
              <input
                type="text"
                placeholder="Search brother..."
                value={brotherSearchQuery}
                onChange={(e) => setBrotherSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-red-500/30 rounded-xl pl-9 pr-3 py-2 text-white placeholder-red-300/50 focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {msg.brothers
                .filter(b => b.name.toLowerCase().includes(brotherSearchQuery.toLowerCase()) || b.whatsappNumber.includes(brotherSearchQuery))
                .map((b, i) => {
                  const waText = encodeURIComponent(`🚨 EMERGENCY! I need help! My location: ${msg.mapsLink || 'Location unavailable'}`);
                  let targetNumber = b.whatsappNumber;
                  if (!targetNumber.startsWith('+') && !targetNumber.startsWith('91') && targetNumber.length === 10) {
                    targetNumber = '91' + targetNumber;
                  }
                  targetNumber = targetNumber.replace(/[^\d+]/g, '');
                  const waLink = `https://wa.me/${targetNumber}?text=${waText}`;
                  
                  return (
                    <a 
                      key={i} 
                      href={waLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-between p-3 bg-red-500/20 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all active:scale-95"
                    >
                      <div>
                        <p className="font-bold text-white">{b.name}</p>
                        <p className="text-xs text-red-200">{b.whatsappNumber}</p>
                      </div>
                      <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                        WhatsApp
                      </div>
                    </a>
                  );
                })}
              {msg.brothers.filter(b => b.name.toLowerCase().includes(brotherSearchQuery.toLowerCase()) || b.whatsappNumber.includes(brotherSearchQuery)).length === 0 && (
                <p className="text-red-300 text-sm italic text-center py-2">No brothers found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
