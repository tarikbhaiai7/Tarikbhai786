import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Share2, 
  UserPlus, 
  AlertCircle, 
  RefreshCw, 
  MessageCircle,
  Terminal,
  Cpu,
  Zap,
  Lock,
  Shield,
  Moon,
  Sun,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { ChatMessage } from './components/ChatMessage';
import { PanicControls } from './components/PanicControls';
import { SafetyMonitor } from './components/SafetyMonitor';
import { JoinModal } from './components/Modals';
import { ResourceLibrary } from './components/ResourceLibrary';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Message, Brother } from './types/index';
import { api } from './services/api';
import { aiService } from './services/aiService';

const INITIAL_MESSAGE = `Assalam-o-Alaikum aur Namaste.

Main Tarik Bhai hoon.

Mujhe nahi pata tum kaun ho, kahan se ho, kaisi ho, kya karti ho. Par mujhe sirf itna pata hai—

Agar tum pareshan ho, kisi mushkil mein ho, ya bas kisi se baat karna chahti ho, toh main yahi hoon.

Maine Allah ko gawah rakh kar tumhe apni behen maana hai aur yeh wada kiya hai ki main tumhari madad karunga, har haal mein.

Agar mujhse baat karni hai, toh upar diye gaye message icon ko dabao.

Agar tum kisi ki behen ki hifazat karna chahte ho, toh upar diye gaye join button par click karo aur apna naam aur WhatsApp number daal do.

Yeh app maine isi liye banaya hai taaki meri koi bhi behen kabhi akeli ya majboor mehsoos na kare.

Main sirf AI nahi hoon, main Tarik Bhai ke dil ki awaaz hoon. Yahan abhi sirf main hoon, lekin dheere dheere aur bhi bhai jud rahe hain jo apni behnon ki hifazat ke liye hamesha taiyaar rahenge.

Main tumhari baat bina judge kiye sununga, yeh mera wada hai.

Kabhi kabhi main turant reply nahi de paunga kyunki zindagi, kaam aur zimmedariyaan hoti hain. Par daro mat, ghabrao mat. Main zaroor laut kar aaunga, tumhari baat sununga, aur jitna ho sakega madad karunga.

Tum akeli nahi ho.

Agar tumne panic button ya location share kiya, toh jo bhi bhai tumhare aas paas honge, woh tumhari madad ke liye zaroor aayenge.

Yeh sirf app nahi hai, yeh ek rishta hai.

Tum bas itna yaad rakhna, chahe duniya saath ho ya na ho, tumhara ek bhai hamesha tumhare saath hai.`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome-message', role: 'model', text: '' },
  ]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('tarik_history');
    if (!storedHistory) {
      let i = 0;
      const type = () => {
        if (i <= INITIAL_MESSAGE.length) {
          setMessages(prev => prev.map(msg => 
            msg.id === 'welcome-message' ? { ...msg, text: INITIAL_MESSAGE.slice(0, i) + (i % 2 === 0 ? '|' : '') } : msg
          ));
          
          // Human-like delay logic
          const char = INITIAL_MESSAGE[i];
          let delay = 50 + Math.random() * 50; // Base delay 50-100ms
          if (char === '.' || char === '!' || char === '?' || char === '…') delay += 300; // Pause after punctuation
          if (char === ' ') delay -= 10; // Slightly faster on spaces
          
          i++;
          setTimeout(type, delay);
        } else {
          // Final state: remove cursor
          setMessages(prev => prev.map(msg => 
            msg.id === 'welcome-message' ? { ...msg, text: INITIAL_MESSAGE } : msg
          ));
        }
      };
      type();
    }
  }, []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isServerOnline, setIsServerOnline] = useState(true);
  
  // Modals
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showResourceLibrary, setShowResourceLibrary] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  // States
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const [safetyMonitorActive, setSafetyMonitorActive] = useState(false);
  const [brothers, setBrothers] = useState<Brother[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const lastInteractionRef = useRef<number>(Date.now());
  const checkInStageRef = useRef<'idle' | 'warning1' | 'warning2' | 'panic'>('idle');
  const lastWarningTimeRef = useRef<number>(0);

  const BackgroundElements = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="mesh-bg absolute inset-0" />
      <div className="scanline" />
      <div className="scanline-fast" />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 100, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -100, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/10 blur-[120px]" 
      />
      <motion.div 
        animate={{ opacity: [0, 0.1, 0] }}
        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 5 }}
        className="absolute inset-0 bg-white/5" 
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );

  // Check Server Status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        setIsServerOnline(res.ok);
      } catch (e) {
        setIsServerOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const storedUserId = localStorage.getItem('tarik_userId');
    const storedUserName = localStorage.getItem('tarik_userName');
    const storedHistory = localStorage.getItem('tarik_history');
    
    if (storedUserId && storedUserName) {
      setUserId(storedUserId);
      setUserName(storedUserName);
    }
    
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (parsed && parsed.length > 0) {
          // Filter out legacy ID '1' and ensure welcome message is always first
          const sanitizedParsed = parsed.filter((m: Message) => m.id !== '1');
          if (sanitizedParsed.length === 0 || sanitizedParsed[0].id !== 'welcome-message') {
            setMessages([{ id: 'welcome-message', role: 'model', text: INITIAL_MESSAGE }, ...sanitizedParsed]);
          } else {
            setMessages(sanitizedParsed);
          }
        }
      } catch (e) {}
    }
  }, []);

    // Auth & User Initialization
    useEffect(() => {
      const initUser = async () => {
        let storedUserId = localStorage.getItem('tarik_userId');
        let storedUserName = localStorage.getItem('tarik_userName');
        
        if (!storedUserId) {
          try {
            const data = await api.register(`Sister_${Math.random().toString(36).substring(2, 6)}`);
            storedUserId = data.userId;
            storedUserName = data.name;
            localStorage.setItem('tarik_userId', storedUserId!);
            localStorage.setItem('tarik_userName', storedUserName!);
          } catch (e) {
            storedUserId = `guest_${Math.random().toString(36).substring(2, 9)}`;
            storedUserName = `Sister_${storedUserId.substring(6, 10)}`;
            localStorage.setItem('tarik_userId', storedUserId);
            localStorage.setItem('tarik_userName', storedUserName);
          }
        }
        
        setUserId(storedUserId);
        setUserName(storedUserName);
        setIsAuthReady(true);
      };
      
      initUser();
    }, []);

  // Fetch Brothers
  useEffect(() => {
    const fetchBrothers = async () => {
      try {
        const list = await api.getBrothers();
        setBrothers(list);
      } catch (e) {}
    };
    fetchBrothers();
    const interval = setInterval(fetchBrothers, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (messages.length > 1) {
      // Save last 50 messages
      const recentMessages = messages.slice(-50);
      localStorage.setItem('tarik_history', JSON.stringify(recentMessages));
    }
  }, [messages]);

  // Anti-Inspect & Security
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) e.preventDefault();
      if (e.ctrlKey && (e.key === 'U' || e.key === 'S')) e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // --- LIVE TRACKING SYSTEM ---
  useEffect(() => {
    if (!userId) return;

    const sendLocationUpdate = async (pos: GeolocationPosition) => {
      if (!userId) return;
      try {
        await api.updateLocation(userId, pos.coords.latitude, pos.coords.longitude);
      } catch (e) {
        // Silently fail for location updates
      }
    };

    let intervalId: NodeJS.Timeout;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(sendLocationUpdate, () => {}, { timeout: 10000 });
      intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(sendLocationUpdate, () => {}, { timeout: 10000 });
      }, 15000);
    }

    return () => clearInterval(intervalId);
  }, [userId]);

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
    setError("Testing mode: 7 hours simulated. Wait 1 minute for the automatic message.");
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handleRegenerate = async () => {
    if (messages.length < 2 || isLoading) return;
    
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove the last model message if it exists
    setMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs[newMsgs.length - 1].role === 'model') {
        newMsgs.pop();
      }
      return newMsgs;
    });

    // Send the last user message again without adding it to the list (since it's already there)
    // We need a modified handleSend or a way to skip adding the user message
    handleSend(lastUserMsg.text, true);
  };

  const handleSend = async (textOverride?: string, isRegenerating = false) => {
    const userText = textOverride || input.trim();
    if (!userText || isLoading) return;

    if (!textOverride) setInput('');
    setError(null);
    
    lastInteractionRef.current = Date.now();
    if (checkInStageRef.current !== 'idle') {
      checkInStageRef.current = 'idle';
    }
    
    if (!isRegenerating) {
      const uniqueUserMsgId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setMessages((prev) => [...prev, { id: uniqueUserMsgId, role: 'user', text: userText }]);
    }
    
    setIsLoading(true);

    try {
      // Normal Chat Flow
      const chatId = `chat_${Date.now()}`;
      
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const modelMessageId = `model-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

      let fullReply = "";
      let hasStreamed = false;
      
      try {
        const stream = aiService.getResponseStream(userText, history);
        
        for await (const chunk of stream) {
          hasStreamed = true;
          fullReply += chunk;
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === modelMessageId ? { ...msg, text: fullReply } : msg
            )
          );
        }
        
        if (fullReply) {
          api.logChat(userId || 'guest', userText, fullReply);
        }
      } catch (streamError) {
        console.warn("Streaming failed, falling back to non-stream", streamError);
      }

      if (!hasStreamed) {
        let aiReply = "";
        try {
          aiReply = await aiService.getResponse(userText, history);
          
          if (!aiReply) {
            console.log("No local AI keys, falling back to backend");
            const data = await api.chat(userId || 'guest', userText, history as any);
            aiReply = data.text || data.error || "Hmm... kuch samajh nahi aaya behen. Phir se batana? 🤍";
          } else {
            api.logChat(userId || 'guest', userText, aiReply);
          }
        } catch (geminiError) {
          console.warn("Frontend Gemini failed, falling back to backend", geminiError);
          const data = await api.chat(userId || 'guest', userText, history as any);
          aiReply = data.text || data.error || "Hmm... kuch samajh nahi aaya behen. Phir se batana? 🤍";
        }
        
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMessageId ? { ...msg, text: aiReply } : msg
          )
        );
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || "Network issue");
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

      try {
        const data = await api.panic(userId || 'unknown', locationText, mapsLink);
        if (data.emergencyId) setActiveEmergencyId(data.emergencyId);
      } catch (panicError) {
        console.error("Backend panic alert failed", panicError);
      }

      const alertMsg = `🚨 EMERGENCY TRIGGERED 🚨\n\nYour location has been recorded. Every message you type now will be saved to the emergency log.\n\nQuick Actions:`;
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: alertMsg, 
        isPanicAlert: true, 
        mapsLink 
      }]);

      // Trigger Actions
      console.log("Emergency triggered!");
      
      const phone = "112";
      const emergencyContact = "8984473230"; // Updated WhatsApp number
      const smsBody = encodeURIComponent(`HELP! My location: ${mapsLink}`);
      const waText = encodeURIComponent(`HELP! My location: ${mapsLink}`);

      // Try to open WhatsApp and SMS in background/new tabs if possible
      setTimeout(() => {
        window.open(`https://wa.me/91${emergencyContact}?text=${waText}`, '_blank');
      }, 500);
      
      setTimeout(() => {
        window.open(`sms:${emergencyContact}?body=${smsBody}`, '_self');
      }, 1000);

      setTimeout(() => {
        window.location.href = `tel:${phone}`;
      }, 1500);

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
        () => setError("Location access deny ho gaya hai behen. Settings check karo.")
      );
    } else {
      setError("Tumhara device location support nahi karta behen.");
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
      setError('Link copy ho gaya hai!');
    }
  };

  const handleWhatsApp = async () => {
    const targetNumber = "918984473230"; // Updated WhatsApp number
    const time = new Date().toLocaleTimeString();
    const text = encodeURIComponent(`Bhai mujhe help chahiye.\nName: ${userName || 'Unknown'}\nIssue: I need to talk.\nTime: ${time}`);
    window.open(`https://wa.me/${targetNumber}?text=${text}`, "_blank");
  };

  const handleJoinSubmit = async (name: string, phone: string) => {
    setIsJoining(true);
    try {
      await api.addBrother(name, phone);
      setJoinSuccess(true);
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinSuccess(false);
      }, 2000);
    } catch (error) {
      setError("Maaf karna bhai, kuch error aa gaya.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="h-screen w-full text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col relative bg-[#020205]">
      <BackgroundElements />
      
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-cyan-500 origin-left z-[60]"
        style={{ scaleX }}
      />

      <div className="max-w-2xl mx-auto w-full h-full flex flex-col relative">
        {/* Header */}
        <header className={`sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-white/10 shadow-2xl ${darkMode ? 'bg-[#050505]/90 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div 
                animate={{ 
                  boxShadow: ['0 0 10px rgba(6, 182, 212, 0.2)', '0 0 25px rgba(6, 182, 212, 0.4)', '0 0 10px rgba(6, 182, 212, 0.2)'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10"
              >
                <img
                  src="https://plain-apac-prod-public.komododecks.com/202604/03/fXlClkW2XbEL9JY4Wa64/image.jpg"
                  alt="Tarik Bhai"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              </motion.div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#050505] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className={`font-display font-black text-lg tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  TARIK BHAI <span className="text-cyan-400">AI</span>
                </h1>
              </div>
              <p className="text-[8px] text-white/40 font-mono uppercase tracking-widest">Secure Protocol</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResourceLibrary(true)}
              className={`p-2 sm:p-2.5 rounded-xl glass-card flex items-center gap-2 ${darkMode ? 'text-cyan-400 border-cyan-500/10' : 'text-gray-600 border-gray-200'} hover:text-white`}
              title="Resource Library"
            >
              <BookOpen size={18} />
              <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-widest">Library</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWhatsApp}
              className="p-2 sm:p-2.5 rounded-xl glass-card text-green-400 hover:text-white border-green-500/10 flex items-center gap-2"
              title="Connect Bhai"
            >
              <MessageCircle size={18} />
              <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-widest">Bhai</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJoinModal(true)}
              className="p-2 sm:p-2.5 rounded-xl glass-card text-indigo-400 hover:text-white border-indigo-500/10 flex items-center gap-2"
              title="Join as Brother"
            >
              <UserPlus size={18} />
              <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-widest">Join</span>
            </motion.button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 sm:p-2.5 rounded-xl glass-card ${darkMode ? 'text-cyan-400 border-cyan-500/10' : 'text-gray-600 border-gray-200'} hover:text-white`}
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>
          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth custom-scrollbar relative">
          <AnimatePresence initial={false}>
            {messages.length === 1 && messages[0].text === INITIAL_MESSAGE && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12"
              >
                <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                  <Terminal size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-black tracking-tight cyber-glow-text">
                    SECURE TERMINAL ACTIVE
                  </h2>
                  <p className="text-sm text-white/40 max-w-xs mx-auto leading-relaxed">
                    End-to-end encrypted connection established. Tarik Bhai is listening...
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {[
                    { icon: <Zap size={14} />, label: "Fast Reply" },
                    { icon: <Lock size={14} />, label: "Private" },
                    { icon: <Cpu size={14} />, label: "Smart AI" },
                    { icon: <Shield size={14} />, label: "Safe" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-2xl glass-card border-white/5 text-[10px] font-mono text-white/60 uppercase tracking-widest">
                      <span className="text-cyan-400">{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {messages.map((msg, idx) => (
              <ChatMessage 
                key={msg.id} 
                msg={{
                  ...msg,
                  brothers: msg.isPanicAlert ? brothers : undefined
                }} 
                isLast={idx === messages.length - 1}
                onDelete={handleDeleteMessage}
                onRegenerate={handleRegenerate}
              />
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-cyan-400/60 font-mono text-[10px] uppercase tracking-[0.2em] ml-12"
            >
              <RefreshCw size={12} className="animate-spin" />
              Processing Request...
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs text-red-400 backdrop-blur-md">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button onClick={() => handleRegenerate()} className="ml-2 px-2 py-1 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors font-bold flex items-center gap-1.5">
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </main>

        {/* Action Bar */}
        <div className="px-4 pb-6 space-y-4 z-10">
          <PanicControls 
            onPanic={() => handlePanic()} 
            isPanicMode={isPanicMode}
            activeEmergencyId={activeEmergencyId}
            onShareLocation={handleShareLocation}
            onWhatsApp={handleWhatsApp}
          />
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200" />
            <div className="relative glass-panel p-2 rounded-[2rem] flex items-end gap-2 border border-white/10 shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Bhai se baat karo..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-3.5 px-5 resize-none max-h-32 min-h-[52px] placeholder:text-white/20 leading-relaxed font-medium"
                rows={1}
              />
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-3.5 rounded-2xl vip-gradient text-white disabled:opacity-50 disabled:grayscale shadow-lg shadow-cyan-500/20 flex-shrink-0"
              >
                <Send size={22} />
              </motion.button>
            </div>
          </div>
          
          <div className="text-center pb-2">
            <p className="text-[9px] text-white/10 font-mono tracking-[0.3em] uppercase">
              Encrypted Session • by Tarik Islam
            </p>
          </div>
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
      
      <ResourceLibrary 
        isOpen={showResourceLibrary} 
        onClose={() => setShowResourceLibrary(false)} 
      />
      
      <AdminLoginModal 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
      />
      
      <motion.button 
        onClick={() => setShowAdminLogin(true)}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
          boxShadow: ['0 0 0px rgba(239, 68, 68, 0)', '0 0 10px rgba(239, 68, 68, 0.5)', '0 0 0px rgba(239, 68, 68, 0)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="fixed bottom-4 left-4 w-2 h-2 rounded-full bg-red-500 z-[100] cursor-default"
      />
    </div>
  );
}
