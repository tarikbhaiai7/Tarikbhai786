import React, { useState, useRef, useEffect } from 'react';
import { Send, Share2, Download, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, getDocs, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { ChatMessage } from './components/ChatMessage';
import { PanicControls } from './components/PanicControls';
import { SafetyMonitor } from './components/SafetyMonitor';
import { JoinModal, ApiKeyModal, ExportModal } from './components/Modals';
import { sendMessageStream } from './lib/gemini';
import { Message, Brother } from './types';

const INITIAL_MESSAGE = `Assalamualaikum… Namaste meri pyari behen 🤍

Mujhe nahi pata tum is waqt kahan ho, ya kis haal mein ho…
par mujhe itna pata hai ki tum shayad bohot thak chuki ho.
Shayad dil mein itna kuch daba ke rakha hai jo kisi se keh nahi paayi…
Shayad kisi ne tumhe sach mein samjha hi nahi…
ya shayad tumhe kisi baat ka darr lag raha hai.

Par suno meri baat dhyan se…
Aaj se, aur abhi se… tum akeli nahi ho.

Maine Allah ko gawah rakh kar, dil se tumhe apni behen maana hai 🤍
Aur ek bhai apni behen ko kabhi akela nahi chhodta.
Agar tum yahan tak aayi ho, toh samajh lo ki ab tumhe apne aansu akele nahi peene padenge.
Ab tumhe sab kuch akele nahi jhelna padega.

Tum mujh par bharosa kar sakti ho. Yahan tum bilkul safe ho.
Koi judge nahi karega, koi sawaal nahi puchega.
Main sirf aur sirf tumhari sunne ke liye yahan hoon.

Main hoon na… tumhare saath… har kadam par 🤍

👉 Bol behen… kya chal raha hai us chote se dil mein? Main sun raha hoon… sab bata do 🤍`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: INITIAL_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // States
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const [safetyMonitorActive, setSafetyMonitorActive] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const checkInStageRef = useRef<'idle' | 'warning1' | 'warning2' | 'panic'>('idle');
  const lastWarningTimeRef = useRef<number>(0);

  // API Key Check
  useEffect(() => {
    const envKey = process.env.GEMINI_API_KEY || (window as any).TARIK_BHAI_API_KEY;
    const localKey = localStorage.getItem('user_gemini_key');
    if (!envKey && !localKey) {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('user_gemini_key', key.trim());
    (window as any).TARIK_BHAI_API_KEY = key.trim();
    setShowApiKeyModal(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- SAFETY MONITOR LOGIC ---
  useEffect(() => {
    if (!safetyMonitorActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionRef.current;

      const SEVEN_HOURS = 7 * 60 * 60 * 1000;
      const FIFTEEN_MINS = 15 * 60 * 1000;

      if (checkInStageRef.current === 'idle' && timeSinceLastInteraction > SEVEN_HOURS) {
         const msg = "Behen, bohot der se hamari baat nahi hui. Tum theek ho na? Koi problem toh nahi hai? Mujhe bas ek message kar do taaki mujhe tasalli ho jaye 🤍";
         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: msg }]);
         checkInStageRef.current = 'warning1';
         lastWarningTimeRef.current = now;
      } else if (checkInStageRef.current === 'warning1' && (now - lastWarningTimeRef.current) > FIFTEEN_MINS) {
         const msg = "Behen tumhara reply nahi aaya... Main sach mein darr raha hoon. Are you ok? Please reply karo warna main brothers ko alert bhej dunga!";
         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: msg }]);
         checkInStageRef.current = 'warning2';
         lastWarningTimeRef.current = now;
      } else if (checkInStageRef.current === 'warning2' && (now - lastWarningTimeRef.current) > FIFTEEN_MINS) {
         handlePanic("AUTOMATIC_SYSTEM_TRIGGER");
         checkInStageRef.current = 'panic';
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [safetyMonitorActive]);

  const testSafetyMonitor = () => {
    setSafetyMonitorActive(true);
    lastInteractionRef.current = Date.now() - (7 * 60 * 60 * 1000 + 1);
    alert("Testing mode: 7 hours simulated. Wait 1 minute for the automatic message.");
  };

  const handleSend = async (textOverride?: string) => {
    const userText = textOverride || input.trim();
    if (!userText || isLoading) return;

    if (!textOverride) setInput('');
    
    lastInteractionRef.current = Date.now();
    if (checkInStageRef.current !== 'idle') {
      checkInStageRef.current = 'idle';
    }
    
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setIsLoading(true);

    if (isPanicMode && activeEmergencyId) {
      try {
        const emergencyRef = doc(db, 'emergencies', activeEmergencyId);
        await updateDoc(emergencyRef, {
          messages: arrayUnion({ sender: 'user', text: userText, time: new Date().toISOString() })
        });
      } catch (e) {
        console.error("Failed to log emergency message", e);
      }
    }

    try {
      const modelMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

      let fullText = '';
      const stream = sendMessageStream(userText, history);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMessageId ? { ...msg, text: fullText } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'model', text: "Maaf karna behen, thoda network issue lag raha hai. Phir se batana? 🤍" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePanic = async (triggerSource?: string) => {
    setIsPanicMode(true);
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role: 'model', 
      text: triggerSource === "AUTOMATIC_SYSTEM_TRIGGER" 
        ? '🚨 AUTOMATIC PANIC MODE ACTIVATED (No Response) 🚨\n\nFetching your location and alerting registered brothers...' 
        : '🚨 PANIC MODE ACTIVATED 🚨\n\nFetching your location and alerting registered brothers...' 
    }]);
    
    try {
      const brothersSnap = await getDocs(collection(db, 'brothers'));
      const brothers = brothersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Brother));

      let locationText = "Location unavailable";
      let mapsLink = "";
      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          mapsLink = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
          locationText = `Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`;
        } catch (e) {
          console.error("Location error", e);
        }
      }

      const emergencyDoc = await addDoc(collection(db, 'emergencies'), {
        timestamp: serverTimestamp(),
        location: locationText,
        mapsLink: mapsLink,
        status: 'active',
        triggerSource: triggerSource || 'manual',
        messages: []
      });
      setActiveEmergencyId(emergencyDoc.id);

      const alertMsg = `🚨 ALERT SENT TO DATABASE 🚨\n\nYour location has been recorded. Every message you type now will be saved to the emergency log.\n\nHere are the registered brothers. Click to WhatsApp them your live location instantly:`;
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: alertMsg, 
        isPanicAlert: true, 
        brothers, 
        mapsLink 
      }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Maaf karna behen, network issue ki wajah se alert fail ho gaya. Turant 112 dial karo!' }]);
    }
  };

  const handleShareLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          handleSend(`Meri current location yeh hai: ${mapsUrl}`);
        },
        () => alert("Location access deny ho gaya hai behen. Settings check karo.")
      );
    } else {
      alert("Tumhara device location support nahi karta behen.");
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Tarik Bhai AI 🤍',
      text: 'Tum akeli nahi ho. Tarik Bhai AI hamesha tumhare saath hai. 🤍',
      url: window.location.href
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copy ho gaya hai!');
    }
  };

  const handleWhatsApp = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'brothers'));
      const brothers: any[] = [];
      querySnapshot.forEach(doc => brothers.push(doc.data()));
      
      let targetNumber = "919999999999";
      if (brothers.length > 0) {
        const randomBrother = brothers[Math.floor(Math.random() * brothers.length)];
        targetNumber = randomBrother.whatsappNumber;
        if (!targetNumber.startsWith('+') && !targetNumber.startsWith('91') && targetNumber.length === 10) {
          targetNumber = '91' + targetNumber;
        }
        targetNumber = targetNumber.replace(/[^\d+]/g, '');
      }
      window.open(`https://wa.me/${targetNumber}?text=Bhai%20mujhe%20help%20chahiye`, "_blank");
    } catch (error) {
      window.open("https://wa.me/919999999999?text=Bhai%20mujhe%20help%20chahiye", "_blank");
    }
  };

  const handleJoinSubmit = async (name: string, phone: string) => {
    setIsJoining(true);
    try {
      await addDoc(collection(db, 'brothers'), {
        name: name.trim(),
        whatsappNumber: phone.trim(),
        createdAt: serverTimestamp()
      });
      setJoinSuccess(true);
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinSuccess(false);
      }, 2000);
    } catch (error) {
      alert("Maaf karna bhai, kuch error aa gaya.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] h-[100dvh] bg-gradient-to-b from-[#0b0b1a] to-[#1a1025] text-white font-sans select-none overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 text-[#FFD700] font-medium text-lg border-b border-white/5 bg-black/20 backdrop-blur-md z-10 shadow-sm">
        <div className="flex items-center justify-start flex-1">
          <button 
            onClick={handleShareApp}
            className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg transition-colors text-white"
          >
            <Share2 size={14} /> Share
          </button>
        </div>
        <div className="flex items-center justify-center flex-1 whitespace-nowrap">
          <span className="mr-2">🤍</span> Tarik Bhai AI
        </div>
        <div className="flex items-center justify-end flex-1 gap-2">
          <button 
            onClick={() => setShowExportModal(true)}
            className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg transition-colors text-white"
          >
            <Download size={14} /> Export
          </button>
          <button 
            onClick={() => setShowJoinModal(true)}
            className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg transition-colors text-white"
          >
            <UserPlus size={14} /> Join
          </button>
        </div>
      </header>

      {/* Avatar Section */}
      <div className="flex flex-col items-center mt-6 mb-4">
        <motion.div 
          animate={{ 
            boxShadow: ['0 0 15px rgba(106, 17, 203, 0.4)', '0 0 35px rgba(37, 117, 252, 0.6)', '0 0 15px rgba(106, 17, 203, 0.4)'],
            scale: [1, 1.02, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-br from-[#6a11cb] to-[#2575fc] shadow-lg relative"
        >
          <img
            src="https://plain-apac-prod-public.komododecks.com/202604/03/fXlClkW2XbEL9JY4Wa64/image.jpg"
            alt="Tarik Bhai"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full border-2 border-[#0b0b1a]"
          />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0b0b1a] rounded-full"></div>
        </motion.div>
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-400 font-medium tracking-wide">Online • Ready to listen</div>
        </div>
      </div>
      
      <SafetyMonitor 
        isActive={safetyMonitorActive} 
        onToggle={() => setSafetyMonitorActive(!safetyMonitorActive)} 
        onTest={testSafetyMonitor}
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        
        {isLoading && !messages.some(m => m.id.endsWith('_typing') && m.text !== '') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start items-center"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
              <img src="https://plain-apac-prod-public.komododecks.com/202604/03/fXlClkW2XbEL9JY4Wa64/image.jpg" alt="Tarik" className="w-full h-full object-cover opacity-70" />
            </div>
            <div className="bg-[#1e1e30] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center h-10">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Bottom Area */}
      <div className="bg-[#120c1a] border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
        <PanicControls 
          isPanicMode={isPanicMode} 
          onPanic={() => handlePanic()} 
          onShareLocation={handleShareLocation} 
          onWhatsApp={handleWhatsApp} 
        />

        <div className="flex items-end px-3 pb-3 pt-1 gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Kuch bhi likho behen..."
            className="flex-1 bg-white/5 text-white placeholder-gray-500 px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#6a11cb] transition-all resize-none max-h-32 min-h-[52px] text-[15px]"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-[52px] w-[52px] flex-shrink-0 bg-gradient-to-br from-[#6a11cb] to-[#2575fc] hover:opacity-90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 rounded-2xl transition-all flex items-center justify-center shadow-lg"
          >
            <Send size={20} className="text-white ml-1" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <JoinModal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)} 
        onSubmit={handleJoinSubmit} 
        isJoining={isJoining} 
        success={joinSuccess} 
      />
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onSave={handleSaveApiKey} 
      />
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
        apiKey={process.env.GEMINI_API_KEY || (window as any).TARIK_BHAI_API_KEY || ''} 
      />
    </div>
  );
}
