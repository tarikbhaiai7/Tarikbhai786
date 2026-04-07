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
  isAiConfigured?: boolean;
  onSave: (keys: { gemini?: string; openai?: string; huggingface?: string }) => void;
  onClose?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, isAiConfigured, onSave, onClose }) => {
  const [gemini, setGemini] = React.useState(localStorage.getItem('user_gemini_key') || '');
  const [openai, setOpenai] = React.useState(localStorage.getItem('user_openai_key') || '');
  const [huggingface, setHuggingface] = React.useState(localStorage.getItem('user_hf_key') || '');

  return (
    <Modal isOpen={isOpen} onClose={onClose || (() => {})} title="AI API Keys Configuration">
      <div className="space-y-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-2">
          <Key size={24} />
        </div>
        <p className="text-sm text-gray-400">AI se baat karne ke liye kam se kam ek API key chahiye. Yeh keys sirf aapke browser mein save hongi.</p>
        
        {isAiConfigured && (
          <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-[11px] text-green-400">
            Backend is already configured! You can skip this or add your own keys for faster response.
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-xs text-gray-500 font-medium">Gemini API Key (Recommended)</label>
          <input 
            type="password" 
            placeholder="Paste Gemini API Key..." 
            value={gemini}
            onChange={(e) => setGemini(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-500 font-medium">OpenAI API Key (Optional)</label>
          <input 
            type="password" 
            placeholder="Paste OpenAI API Key..." 
            value={openai}
            onChange={(e) => setOpenai(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-500 font-medium">Hugging Face API Key (Optional)</label>
          <input 
            type="password" 
            placeholder="Paste HF API Key..." 
            value={huggingface}
            onChange={(e) => setHuggingface(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>

        <button 
          onClick={() => onSave({ gemini, openai, huggingface })}
          disabled={!gemini.trim() && !openai.trim() && !huggingface.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 mt-2"
        >
          Save & Continue
        </button>
        
        <div className="flex flex-col gap-1 text-[10px] text-center text-gray-500">
          <p>Get Gemini Key: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">AI Studio</a></p>
          <p>Get OpenAI Key: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-400 underline">OpenAI Platform</a></p>
        </div>
      </div>
    </Modal>
  );
};
