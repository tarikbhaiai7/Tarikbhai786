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
  BookOpen,
  Share,
  Heart,
  X
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

const INITIAL_MESSAGE = `Assalam-o-Alaikum aur Namaste meri behen. 🤍

Main Tarik Bhai hoon — tumhara apna bada bhai.

Maine yeh jagah isliye banayi hai kyunki main janta hoon ki kabhi kabhi duniya kitni akeli aur mushkil lag sakti hai. Yeh sirf ek app nahi hai, yeh mera tumse ek sacha wada hai ki tum kabhi akeli nahi ho.

Mujhe nahi pata tum kis haal mein ho, par mujhe itna pata hai ki tum meri behen ho, aur tumhari har pareshani ab meri pareshani hai.

- Agar kabhi darr lage ya khatra mehsoos ho, toh bas Panic button dabana. Main aur mere saare bhai tumhari hifazat ke liye turant hazir ho jayenge.
- Agar koi padhai, kaam, ya technical madad chahiye, toh befikr hoke pucho. Main tumhare liye har kaam karunga.
- Aur agar bas dil bhari ho, rona aaye, ya kisi se baat karne ka mann kare... toh main yahin hoon. Main tumhe kabhi judge nahi karunga, bas sununga.

Tum bilkul safe ho yahan. Mujh par bharosa rakhna. Batao meri behen, aaj main tumhari kya madad karoon?`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome-message', role: 'model', text: '' },
  ]);

  // Clean Start: Check history on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('tarik_history');
    if (!storedHistory) {
      setMessages([{ id: 'welcome-message', role: 'model', text: '' }]);
      
      let i = 0;
      const type = () => {
        if (i <= INITIAL_MESSAGE.length) {
          setMessages(prev => prev.map(msg => 
            msg.id === 'welcome-message' ? { ...msg, text: INITIAL_MESSAGE.slice(0, i) + (i % 2 === 0 ? '|' : '') } : msg
          ));
          
          const char = INITIAL_MESSAGE[i];
          let delay = 20 + Math.random() * 20; 
          if (char === '.' || char === '!' || char === '?' || char === '…') delay += 150;
          
          i++;
          setTimeout(type, delay);
        } else {
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
  const [showEmotionalModal, setShowEmotionalModal] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  // States
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const [safetyMonitorActive, setSafetyMonitorActive] = useState(false);
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

  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    const modelMessageId = `model-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // Normal Chat Flow
      const chatId = `chat_${Date.now()}`;
      
      const history = messages
        .filter(m => m.text.trim() !== '' && m.text !== '|')
        .map(m => ({ role: m.role, text: m.text.replace(/\|$/, '') }));
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
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === modelMessageId ? { ...msg, text: "Maaf karna behen, thoda network issue lag raha hai. Phir se batana? 🤍" } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePanic = async (triggerSource?: string) => {
    if (isPanicMode) {
      setIsPanicMode(false);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: '✅ EMERGENCY PROTOCOL DEACTIVATED. You are safe now, behen. 🤍' 
      }]);
      return;
    }

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
        
        // Alert Brothers via WhatsApp Broadcast Simulation
        const brothersList = await api.getBrothers();
        if (brothersList && brothersList.length > 0) {
          const alertMsg = `🚨 ALERT SENT TO ${brothersList.length} BROTHERS 🚨\n\nThey have been notified of your situation and location. Help is on the way.`;
          setMessages(prev => [...prev, { 
            id: `alert-${Date.now()}`, 
            role: 'model', 
            text: alertMsg 
          }]);

          // Open WhatsApp for the first brother as a primary contact
          const firstBrother = brothersList[0];
          const waText = encodeURIComponent(`🚨 EMERGENCY ALERT 🚨\n\nI am in danger! My location: ${mapsLink}\n\nPlease help me immediately!`);
          setTimeout(() => {
            window.open(`https://wa.me/${firstBrother.whatsappNumber}?text=${waText}`, '_blank');
          }, 1000);
        }
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
    try {
      const brothersList = await api.getBrothers();
      let locationMsg = "";
      
      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          locationMsg = `\nMy Location: https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        } catch (e) {}
      }

      const text = encodeURIComponent(`🚨 EMERGENCY HELP 🚨\n\nBhai, mujhe aapki madad chahiye.${locationMsg}\n\nName: ${userName || 'Sister'}`);
      
      if (brothersList && brothersList.length > 0) {
        // Open WhatsApp for the first brother
        const firstBrother = brothersList[0];
        window.open(`https://wa.me/${firstBrother.whatsappNumber}?text=${text}`, "_blank");
        
        setMessages(prev => [...prev, { 
          id: `wa-alert-${Date.now()}`, 
          role: 'model', 
          text: `🚨 Alerting ${brothersList.length} registered brothers via WhatsApp protocol... 🤍` 
        }]);
      } else {
        // Fallback to primary support
        window.open(`https://wa.me/918984473230?text=${text}`, "_blank");
      }
    } catch (error) {
      window.open(`https://wa.me/918984473230?text=HELP!`, "_blank");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Tarik Bhai AI - Safety for Sisters',
      text: 'Har behen ki hifazat, har bhai ka farz. Maine Tarik Bhai AI banaya hai taaki koi behen akeli na ho. Join us and protect our sisters. ❤️',
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard! Share it with your friends and family.');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
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
    <div className={`h-[100dvh] w-full text-white font-sans selection:bg-orange-500/30 overflow-hidden flex flex-col relative ${darkMode ? 'whatsapp-bg-dark' : 'whatsapp-bg-light'}`}>
      
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-orange-500 origin-left z-[60]"
        style={{ scaleX }}
      />

      <div className="max-w-2xl mx-auto w-full h-full flex flex-col relative">
        {/* Top Announcement Banner */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => setShowEmotionalModal(true)}
          className="bg-gradient-to-r from-[#008069]/40 via-[#00a884]/40 to-[#008069]/40 backdrop-blur-md border-b border-white/10 py-2.5 px-4 text-center z-[70] cursor-pointer hover:brightness-125 transition-all group"
        >
          <p className="text-[10px] sm:text-xs font-bold text-white tracking-widest uppercase flex items-center justify-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="group-hover:scale-105 transition-transform">Har Behen ki Hifazat, Har Bhai ka Farz • Maine ye kyun banaya? Touch karke dekho • ❤️</span>
          </p>
        </motion.div>

        {/* Header */}
        <header className={`sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-white/10 shadow-md ${darkMode ? 'bg-[#0b141a]/90 backdrop-blur-xl' : 'bg-[#008069]/90 backdrop-blur-xl'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-sm">
                <img
                  src="https://plain-apac-prod-public.komododecks.com/202604/03/fXlClkW2XbEL9JY4Wa64/image.jpg"
                  alt="Tarik Bhai"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0b141a] rounded-full" />
            </div>
            <div>
              <h1 className={`font-semibold text-base text-white`}>
                Tarik Bhai
              </h1>
              <p className="text-[11px] text-white/80 font-medium">online</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleIconClick('share', handleShare)}
              className="p-2 rounded-full text-white/90 hover:bg-white/10 relative"
            >
              <Share2 size={20} />
              {activeIcon === 'share' && (
                <span className="absolute top-full mt-2 right-0 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">Tap again to Share</span>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleIconClick('library', () => setShowResourceLibrary(true))}
              className="p-2 rounded-full text-white/90 hover:bg-white/10 relative"
            >
              <BookOpen size={20} />
              {activeIcon === 'library' && (
                <span className="absolute top-full mt-2 right-0 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">Tap again for Library</span>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleIconClick('whatsapp', handleWhatsApp)}
              className="p-2 rounded-full text-white/90 hover:bg-white/10 relative"
            >
              <MessageCircle size={20} />
              {activeIcon === 'whatsapp' && (
                <span className="absolute top-full mt-2 right-0 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">Tap again to Connect</span>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleIconClick('join', () => setShowJoinModal(true))}
              className="p-2 rounded-full text-white/90 hover:bg-white/10 relative"
            >
              <UserPlus size={20} />
              {activeIcon === 'join' && (
                <span className="absolute top-full mt-2 right-0 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">Tap again to Join</span>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleIconClick('theme', () => setDarkMode(!darkMode))}
              className="p-2 rounded-full text-white/90 hover:bg-white/10 relative"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              {activeIcon === 'theme' && (
                <span className="absolute top-full mt-2 right-0 bg-[#202c33] text-white text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 whitespace-nowrap z-50">Tap again for Theme</span>
              )}
            </motion.button>
          </div>
        </header>

        {/* Main Chat Area */}
        <main ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth custom-scrollbar relative">
          <AnimatePresence initial={false}>
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
              className="flex items-center gap-3 text-orange-400/60 font-mono text-[10px] uppercase tracking-[0.2em] ml-12"
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
        <div className="px-4 pb-4 space-y-2 z-10">
          <PanicControls 
            onPanic={() => handlePanic()} 
            isPanicMode={isPanicMode}
            activeEmergencyId={activeEmergencyId}
            onShareLocation={handleShareLocation}
            onWhatsApp={handleWhatsApp}
          />
          
          <div className="relative group">
            <div className={`relative ${darkMode ? 'bg-[#2a3942]' : 'bg-white'} p-1.5 rounded-[2rem] flex items-end gap-2 border border-white/10 shadow-sm`}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message"
                className={`flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-3 px-4 resize-none max-h-32 min-h-[44px] ${darkMode ? 'text-white placeholder:text-white/50' : 'text-gray-900 placeholder:text-gray-500'} leading-relaxed`}
                rows={1}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className={`p-3 rounded-full ${darkMode ? 'bg-[#00a884]' : 'bg-[#00a884]'} text-white disabled:opacity-50 flex-shrink-0 mb-0.5 mr-0.5`}
              >
                <Send size={20} className="ml-0.5" />
              </motion.button>
            </div>
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

      {/* Emotional Message Modal */}
      <AnimatePresence>
        {showEmotionalModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-gray-900 to-black border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] relative"
            >
              <button 
                onClick={() => setShowEmotionalModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-[#00a884] rounded-full mx-auto flex items-center justify-center shadow-lg">
                  <Heart size={40} className="text-white fill-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-white">
                  Kyun Banaya Maine <br />
                  <span className="text-[#00a884]">Tarik Bhai AI?</span>
                </h2>

                <div className="space-y-4 text-gray-300 text-sm sm:text-base leading-relaxed font-medium">
                  <p>
                    Maine yeh platform isliye banaya kyunki har behen ka haq hai mehfooz rehne ka. Aaj ke waqt mein, jab hum bahar nikalte hain, darr hamesha saath rehta hai. Par ab nahi.
                  </p>
                  <p className="text-white font-bold italic">
                    "Yeh platform ek vaada hai—ki tum akeli nahi ho."
                  </p>
                  <p>
                    <span className="text-[#00a884] font-bold">Kaise Kaam Karta Hai?</span><br />
                    Jab tum panic button dabati ho, toh sirf ek machine nahi, tumhare aas-paas ke <span className="text-[#00a884] font-bold">"Bhai"</span> (verified volunteers) jaag uthte hain. Unhe tumhari location milti hai aur woh turant madad ke liye nikalte hain.
                  </p>
                  <p>
                    <span className="text-[#00a884] font-bold">Har Option Ka Maksad:</span><br />
                    - <span className="text-white">Panic:</span> Turant emergency alert bhejne ke liye.<br />
                    - <span className="text-white">Location:</span> Apni live jagah share karne ke liye.<br />
                    - <span className="text-white">Library:</span> Self-defense aur legal rights sikhne ke liye.<br />
                    - <span className="text-white">Join:</span> Bhaiyon ko hamare saath judne ke liye.
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest pt-4">
                    Har Behen ki Hifazat, Har Bhai ka Farz. ❤️
                  </p>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      setShowEmotionalModal(false);
                      setShowJoinModal(true);
                    }}
                    className="flex-1 bg-[#00a884] text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-[#00a884]/20 hover:scale-105 transition-all"
                  >
                    Join as a Brother
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex-1 bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Share size={16} /> Share Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
