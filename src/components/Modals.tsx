import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, ShieldCheck, Key } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#1a1025] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            {title}
          </h2>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => Promise<void>;
  isJoining: boolean;
  success: boolean;
}

export const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose, onSubmit, isJoining, success }) => {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, phone);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join as Brother">
      {success ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
            <ShieldCheck size={32} />
          </div>
          <p className="text-green-400 font-medium">Shukriya Bhai! Aap register ho chuke hain. 🤍</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-400">Behno ki safety ke liye hamare saath judiye. Emergency mein aapko alert milega.</p>
          <input 
            type="text" 
            placeholder="Aapka Naam" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input 
            type="tel" 
            placeholder="WhatsApp Number (e.g. 919999999999)" 
            required 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            type="submit" 
            disabled={isJoining}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:opacity-90 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isJoining ? 'Registering...' : <><UserPlus size={18} /> Join Now</>}
          </button>
        </form>
      )}
    </Modal>
  );
};

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [key, setKey] = React.useState('');

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="API Key Required">
      <div className="space-y-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-2">
          <Key size={24} />
        </div>
        <p className="text-sm text-gray-400">AI se baat karne ke liye Gemini API key chahiye. Yeh sirf aapke browser mein save hogi.</p>
        <input 
          type="password" 
          placeholder="Paste Gemini API Key..." 
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button 
          onClick={() => onSave(key)}
          disabled={!key.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
        >
          Save & Continue
        </button>
        <p className="text-[10px] text-center text-gray-500">
          Aap apni key <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">yahan se</a> le sakte hain.
        </p>
      </div>
    </Modal>
  );
};
