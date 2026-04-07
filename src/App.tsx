import React, { useState, useRef, useEffect } from 'react';
import { Send, Share2, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, getDocs, serverTimestamp, updateDoc, doc, arrayUnion, setDoc, getDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';
import { ChatMessage } from './components/ChatMessage';
import { PanicControls } from './components/PanicControls';
import { SafetyMonitor } from './components/SafetyMonitor';
import { JoinModal, ApiKeyModal } from './components/Modals';
import { Message, Brother } from './types/index';
import { api } from './services/api';
import { aiService } from './services/aiService';

const INITIAL_MESSAGE = `Assalamualaikum… Namaste meri pyari behen 🤍

Mujhe nahi pata tum is waqt kahan ho, ya kis haal mein ho… par mujhe itna pata hai ki tum shayad bohot thak chuki ho. Zindagi kabhi kabhi bohot bhari lagne lagti hai, aur lagta hai jaise koi samajhne wala nahi hai.

Par suno meri baat dhyan se…
Tumhari himmat us pareshani se bohot badi hai jo tum abhi mehsoos kar rahi ho. Tum akeli nahi ho. Aaj se, aur abhi se… tumhara ye bhai tumhare saath khada hai. Har kadam par.

Ek lambi saans lo… aur pehle apna pyara sa naam bata do 🤍`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: INITIAL_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  
  // Modals
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // States
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const [safetyMonitorActive, setSafetyMonitorActive] = useState(false);
  const [brothers, setBrothers] = useState<Brother[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const checkInStageRef = useRef<'idle' | 'warning1' | 'warning2' | 'panic'>('idle');
  const lastWarningTimeRef = useRef<number>(0);

  // Check Server Status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setIsServerOnline(res.ok);
        setIsAiConfigured(!!data.aiConfigured);
      } catch (e) {
        setIsServerOnline(false);
        setIsAiConfigured(false);
      } finally {
        setIsCheckingHealth(false);
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
          setMessages(parsed);
        }
      } catch (e) {}
    }
  }, []);

    // Auth Listener
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setUserName(user.displayName || `Sister_${user.uid.substring(0, 4)}`);
          
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: user.uid,
              name: user.displayName || `Sister_${user.uid.substring(0, 4)}`,
              email: user.email || 'anonymous',
              createdAt: new Date().toISOString()
            });
          }
        } else {
          try {
            await signInAnonymously(auth);
          } catch (e: any) {
            console.warn("Anonymous auth disabled in console. Using local guest mode.", e.message);
            // Fallback to local ID if anonymous auth is disabled
            const localId = localStorage.getItem('tarik_localId') || `guest_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('tarik_localId', localId);
            setUserId(localId);
            setUserName(`Sister_${localId.substring(6, 10)}`);
          }
        }
        setIsAuthReady(true);
      });
      return () => unsubscribe();
    }, []);

  // Check for API Keys
  useEffect(() => {
    if (isCheckingHealth) return;

    // Only show modal if NO local keys AND backend says it's NOT configured
    const gemini = localStorage.getItem('user_gemini_key');
    const openai = localStorage.getItem('user_openai_key');
    const hf = localStorage.getItem('user_hf_key');
    
    if (!gemini && !openai && !hf && !isAiConfigured) {
      setShowApiKeyModal(true);
    }
  }, [isAiConfigured, isCheckingHealth]);

  // Fetch Brothers
  useEffect(() => {
    const q = query(collection(db, 'brothers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const brothersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Brother[];
      setBrothers(brothersList);
    });
    return () => unsubscribe();
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- LIVE TRACKING SYSTEM ---
  useEffect(() => {
    if (!userId) return;

    const sendLocationUpdate = async (pos: GeolocationPosition) => {
      if (!userId) return;
      try {
        const locId = `loc_${Date.now()}`;
        await setDoc(doc(db, 'locations', locId), {
          id: locId,
          userId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toISOString()
        });
        
        // Also update backend for legacy support if needed
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
    if (messages.length < 2) return;
    const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIndex === -1) return;
    
    // Remove the last model message
    const newMessages = [...messages];
    if (newMessages[newMessages.length - 1].role === 'model') {
      newMessages.pop();
    }
    setMessages(newMessages);
    
    const lastUserMsg = newMessages[newMessages.length - 1 - lastUserMsgIndex];
    if (lastUserMsg) {
      handleSend(lastUserMsg.text);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const userText = textOverride || input.trim();
    if (!userText || isLoading) return;

    if (!textOverride) setInput('');
    setError(null);
    
    lastInteractionRef.current = Date.now();
    if (checkInStageRef.current !== 'idle') {
      checkInStageRef.current = 'idle';
    }
    
    const uniqueUserMsgId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setMessages((prev) => [...prev, { id: uniqueUserMsgId, role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // Normal Chat Flow
      const chatId = `chat_${Date.now()}`;
      const chatData = {
        id: chatId,
        userId: userId || 'guest',
        name: userName || 'Anonymous',
        message: userText,
        reply: '...',
        timestamp: new Date().toISOString()
      };

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

      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const modelMessageId = `model-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', text: '...' }]);

      let aiReply = "";
      
      try {
        aiReply = await aiService.getResponse(userText, history);
        
        if (!aiReply) {
          console.log("No local AI keys, falling back to backend");
          const data = await api.chat(userId || 'guest', userText, history as any);
          aiReply = data.text || data.error || "Hmm... kuch samajh nahi aaya behen. Phir se batana? 🤍";
        } else {
          // Save Chat to Firestore (Try-catch to handle permission errors if not authed)
          try {
            await setDoc(doc(db, 'chats', chatId), {
              ...chatData,
              reply: aiReply
            });
          } catch (dbErr) {
            console.warn("Firestore save failed (likely unauthenticated)", dbErr);
          }

          api.logChat(userId || 'guest', userText, aiReply);
        }
      } catch (geminiError) {
        console.warn("Frontend Gemini failed, falling back to backend", geminiError);
        const data = await api.chat(userId || 'guest', userText, history as any);
        aiReply = data.text || data.error || "Hmm... kuch samajh nahi aaya behen. Phir se batana? 🤍";
        
        try {
          await setDoc(doc(db, 'chats', chatId), {
            ...chatData,
            reply: aiReply
          });
        } catch (dbErr) {}
      }
      
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === modelMessageId ? { ...msg, text: aiReply } : msg
        )
      );
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
        const emergencyId = `emergency_${Date.now()}`;
        await setDoc(doc(db, 'emergencies', emergencyId), {
          id: emergencyId,
          userId: userId || 'unknown',
          location: locationText,
          mapsLink,
          timestamp: new Date().toISOString(),
          status: 'active'
        });
        setActiveEmergencyId(emergencyId);
        
        await api.panic(userId || 'unknown', locationText, mapsLink);
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
      const emergencyContact = "9999999999"; // Placeholder
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
    const targetNumber = "919999999999"; // Placeholder for Bhai's number
    const time = new Date().toLocaleTimeString();
    const text = encodeURIComponent(`Bhai mujhe help chahiye.\nName: ${userName || 'Unknown'}\nIssue: I need to talk.\nTime: ${time}`);
    window.open(`https://wa.me/${targetNumber}?text=${text}`, "_blank");
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
      setError("Maaf karna bhai, kuch error aa gaya.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] h-[100dvh] bg-gradient-to-b from-[#0b0b1a] to-[#1a1025] text-white font-sans select-none overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 text-[#FFD700] font-medium text-lg border-b border-white/5 bg-black/20 backdrop-blur-md z-10 shadow-sm">
        <div className="flex items-center justify-start flex-1 gap-2">
          <button 
            onClick={handleShareApp}
            className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg transition-colors text-white"
          >
            <Share2 size={14} /> Share
          </button>
          <a 
            href={`https://wa.me/919999999999?text=${encodeURIComponent(`Bhai mujhe help chahiye.\nName: ${userName || 'Unknown'}\nTime: ${new Date().toLocaleString()}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-2 py-1.5 rounded-lg transition-colors"
          >
            Contact Bhai
          </a>
        </div>
        <div className="flex items-center justify-center flex-1 whitespace-nowrap">
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isServerOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="mr-2">🤍</span> Tarik Bhai AI
        </div>
        <div className="flex items-center justify-end flex-1 gap-2">
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
        {messages.map((msg, index) => (
          <ChatMessage 
            key={msg.id} 
            msg={{
              ...msg,
              brothers: msg.isPanicAlert ? brothers : undefined
            }} 
            isLast={index === messages.length - 1}
            onDelete={handleDeleteMessage}
            onRegenerate={handleRegenerate}
          />
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

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-900/20 border border-red-500/30 px-4 py-2 rounded-full flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={14} />
              <span>{error}</span>
              <button onClick={() => handleRegenerate()} className="ml-2 underline font-bold flex items-center gap-1">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Bottom Area */}
      <div className="glass-panel border-t-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)] mt-2">
        <PanicControls 
          isPanicMode={isPanicMode} 
          onPanic={() => handlePanic()} 
          onShareLocation={handleShareLocation} 
          onWhatsApp={handleWhatsApp} 
        />

        <div className="flex items-end px-3 pb-4 pt-1 gap-2">
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
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-400 px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6a11cb]/50 transition-all resize-none max-h-32 min-h-[52px] text-[15px] backdrop-blur-sm"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-[52px] w-[52px] flex-shrink-0 bg-gradient-to-br from-[#6a11cb] to-[#2575fc] hover:shadow-[0_0_15px_rgba(37,117,252,0.5)] active:scale-90 disabled:opacity-50 disabled:active:scale-100 rounded-2xl transition-all flex items-center justify-center shadow-lg"
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
        isAiConfigured={isAiConfigured}
        onClose={() => setShowApiKeyModal(false)}
        onSave={(keys) => {
          if (keys.gemini) localStorage.setItem('user_gemini_key', keys.gemini);
          if (keys.openai) localStorage.setItem('user_openai_key', keys.openai);
          if (keys.huggingface) localStorage.setItem('user_hf_key', keys.huggingface);
          setShowApiKeyModal(false);
        }} 
      />
    </div>
  );
}
