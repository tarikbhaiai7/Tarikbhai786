import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Book, Phone, X, ChevronRight, ExternalLink, Heart, Scale, Info } from 'lucide-react';

interface ResourceLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { 
      id: 'defense',
      title: 'Self-Defense', 
      icon: Shield, 
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      desc: 'Practical safety techniques and awareness.',
      content: [
        { title: 'Situational Awareness', text: 'Always be aware of your surroundings. Avoid using phones in isolated areas.' },
        { title: 'Vulnerable Points', text: 'If attacked, aim for the eyes, throat, or groin to create a window to escape.' },
        { title: 'Voice as a Weapon', text: 'Shout "FIRE" instead of "HELP" to attract more immediate attention.' },
        { title: 'Safety in Numbers', text: 'Try to stay in well-lit, populated areas when traveling alone.' }
      ]
    },
    { 
      id: 'legal',
      title: 'Legal Rights', 
      icon: Scale, 
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      desc: 'Know your rights under Indian Law.',
      content: [
        { title: 'Zero FIR', text: 'You can file an FIR at any police station, regardless of where the incident happened.' },
        { title: 'Right to Privacy', text: 'A woman has the right to record her statement in private with a female officer.' },
        { title: 'Arrest Rules', text: 'Women cannot be arrested before 6 AM or after 6 PM, except in extreme cases.' },
        { title: 'Free Legal Aid', text: 'Women are entitled to free legal services from the Legal Services Authority.' }
      ]
    },
    { 
      id: 'helplines',
      title: 'Helplines', 
      icon: Phone, 
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      desc: '24/7 Emergency support numbers.',
      content: [
        { title: 'National Emergency', text: '112', link: 'tel:112' },
        { title: 'Women Helpline', text: '1091', link: 'tel:1091' },
        { title: 'Domestic Abuse', text: '181', link: 'tel:181' },
        { title: 'Tarik Bhai Support', text: '9114411026', link: 'tel:9114411026' }
      ]
    },
    { 
      id: 'mental',
      title: 'Emotional Support', 
      icon: Heart, 
      color: 'text-fuchsia-400',
      bg: 'bg-fuchsia-500/10',
      desc: 'Coping with stress and trauma.',
      content: [
        { title: 'You are not alone', text: 'Healing takes time. Talking to someone you trust is the first step.' },
        { title: 'Grounding Technique', text: '5-4-3-2-1: Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.' },
        { title: 'Safe Space', text: 'Create a mental safe space where you feel calm and protected.' }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-500" />
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                  <Book size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Safety Library</h2>
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Knowledge is Protection</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
              <AnimatePresence mode="wait">
                {!selectedCategory ? (
                  <motion.div 
                    key="grid"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {categories.map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 text-left transition-all group"
                      >
                        <div className={`w-12 h-12 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <cat.icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{cat.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{cat.desc}</p>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          Explore <ChevronRight size={12} />
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-2 mb-6 transition-colors"
                    >
                      <ChevronRight size={14} className="rotate-180" /> Back to Categories
                    </button>
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`w-14 h-14 rounded-2xl ${categories.find(c => c.id === selectedCategory)?.bg} ${categories.find(c => c.id === selectedCategory)?.color} flex items-center justify-center`}>
                        {React.createElement(categories.find(c => c.id === selectedCategory)?.icon || Shield, { size: 28 })}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{categories.find(c => c.id === selectedCategory)?.title}</h2>
                        <p className="text-xs text-gray-500">{categories.find(c => c.id === selectedCategory)?.desc}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {categories.find(c => c.id === selectedCategory)?.content.map((item, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between items-center group"
                        >
                          <div className="flex-grow">
                            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">{(item as any).text}</p>
                          </div>
                          {(item as any).link && (
                            <a 
                              href={(item as any).link} 
                              className="ml-4 p-3 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all shadow-lg shadow-cyan-500/10"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Info size={16} />
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">
                This library is for informational purposes. In a real emergency, prioritize your immediate safety and call 112.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
