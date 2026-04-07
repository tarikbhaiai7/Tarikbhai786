import React from 'react';
import { motion } from 'motion/react';
import { Shield, Book, Phone, X } from 'lucide-react';

interface ResourceLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const resources = [
    { title: 'Self-Defense Basics', icon: Shield, desc: 'Simple techniques for safety.' },
    { title: 'Legal Rights', icon: Book, desc: 'Know your rights and laws.' },
    { title: 'Emergency Helplines', icon: Phone, desc: 'Important numbers to call.' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Safety Resources</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="space-y-4">
          {resources.map((res, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-cyan-500/20 p-3 rounded-xl text-cyan-400"><res.icon size={24} /></div>
              <div>
                <h3 className="font-bold text-white">{res.title}</h3>
                <p className="text-xs text-gray-400">{res.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
