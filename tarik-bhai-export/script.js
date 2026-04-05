const API_KEY = "YOUR_API_KEY"; // ⚠️ REPLACE THIS WITH YOUR GEMINI API KEY

const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const emergencyBtn = document.getElementById('emergency-btn');
const typingIndicator = document.getElementById('typing-indicator');
const safeModeUi = document.getElementById('safe-mode-ui');
const dailyMessage = document.getElementById('daily-message');

// Daily Messages
const messages = [
    "Yaad rakhna behen, tum kabhi akeli nahi ho 🤍",
    "Koi baat nahi agar aaj ka din bura tha, main hoon na 🤍",
    "Tum bohot strong ho, darrna mat 🤍",
    "Apne aansu akele mat peena, mujhe batao 🤍"
];
dailyMessage.innerText = messages[Math.floor(Math.random() * messages.length)];

let chatHistory = [];

const SYSTEM_PROMPT = "You are Tarik Bhai, a caring, protective Indian brother. You speak in Hinglish, never judge, always support emotionally, and guide users calmly. If user is in danger, give clear practical steps and suggest contacting emergency help. Never sound like an AI. Keep responses short and warm.";

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
    msgDiv.innerText = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function generateResponse(userText) {
    if (API_KEY === "YOUR_API_KEY") {
        setTimeout(() => {
            addMessage("Behen, mera API key set nahi hai. Please script.js mein apna Gemini API key daalo 🤍", 'bot');
            typingIndicator.style.display = 'none';
        }, 1000);
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nUser says: " + userText }] }
                ]
            })
        });
        const data = await response.json();
        const botReply = data.candidates[0].content.parts[0].text;
        
        typingIndicator.style.display = 'none';
        addMessage(botReply, 'bot');
        speakText(botReply);
    } catch (error) {
        typingIndicator.style.display = 'none';
        addMessage("Maaf karna behen, network issue hai. Phir se batana? 🤍", 'bot');
    }
}

function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    safeModeUi.style.display = 'none';
    addMessage(text, 'user');
    chatInput.value = '';
    typingIndicator.style.display = 'block';
    
    // Human-like delay
    setTimeout(() => {
        generateResponse(text);
    }, 1000 + Math.random() * 1000);
}

sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

window.sendQuickMessage = function(text) {
    chatInput.value = text;
    handleSend();
};

// Voice AI (Speech Recognition)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi/Indian English
    
    recognition.onstart = () => {
        voiceBtn.classList.add('recording');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        handleSend();
    };
    
    recognition.onend = () => {
        voiceBtn.classList.remove('recording');
    };
    
    voiceBtn.addEventListener('click', () => {
        recognition.start();
    });
} else {
    voiceBtn.style.display = 'none';
}

// Voice AI (Speech Synthesis)
function speakText(text) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9; // Slightly slower, calmer
    utterance.pitch = 0.8; // Deeper voice
    synth.speak(utterance);
}

// Emergency System
emergencyBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        emergencyBtn.classList.add('pulse-red');
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
            const sosMessage = encodeURIComponent(`🚨 EMERGENCY! I need help immediately. My live location: ${mapsLink}`);
            window.open(`https://wa.me/?text=${sosMessage}`, '_blank');
            emergencyBtn.classList.remove('pulse-red');
        }, () => {
            alert("Location access denied. Please dial 112 immediately!");
            emergencyBtn.classList.remove('pulse-red');
        });
    } else {
        alert("Geolocation is not supported by this browser. Dial 112!");
    }
});

// Direct WhatsApp Redirect
document.getElementById('direct-wa-btn').addEventListener('click', () => {
    const msg = encodeURIComponent("Bhai, mujhe aapse baat karni hai.");
    window.open(`https://wa.me/918984473230?text=${msg}`, '_blank'); // Primary number
});

// Primary WhatsApp (Tarik Bhai Chat)
const primaryWaBtn = document.getElementById('primary-wa-btn');
if (primaryWaBtn) {
    primaryWaBtn.addEventListener('click', () => {
        const msg = "Assalamualaikum Tarik Bhai, mujhe aapse baat karni hai. Mujhe thodi help chahiye...";
        const encodedMsg = encodeURIComponent(msg);
        window.open(`https://wa.me/918984473230?text=${encodedMsg}`, '_blank');
    });
}

// Emergency WhatsApp System
const emergencyWaBtn = document.getElementById('emergency-wa-btn');
const waLoadingText = document.getElementById('wa-loading-text');

if (emergencyWaBtn) {
    emergencyWaBtn.addEventListener('click', () => {
        // Vibration effect (if supported)
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        waLoadingText.style.display = 'block';
        emergencyWaBtn.disabled = true;
        emergencyWaBtn.style.opacity = '0.5';

        const emergencyNumber = "917787860016";

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Success
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
                    const msg = `Mujhe turant help chahiye! Yeh meri location hai:\n${mapsLink}`;
                    const encodedMsg = encodeURIComponent(msg);
                    
                    setTimeout(() => {
                        waLoadingText.style.display = 'none';
                        emergencyWaBtn.disabled = false;
                        emergencyWaBtn.style.opacity = '1';
                        window.open(`https://wa.me/${emergencyNumber}?text=${encodedMsg}`, '_blank');
                    }, 1500); // Smooth redirect after 1.5s
                },
                (error) => {
                    // Fallback (Denied or Error)
                    const msg = "Mujhe help chahiye, lekin location access nahi mila. Please jaldi contact karein.";
                    const encodedMsg = encodeURIComponent(msg);
                    
                    setTimeout(() => {
                        waLoadingText.style.display = 'none';
                        emergencyWaBtn.disabled = false;
                        emergencyWaBtn.style.opacity = '1';
                        window.open(`https://wa.me/${emergencyNumber}?text=${encodedMsg}`, '_blank');
                    }, 1500);
                },
                { timeout: 10000 }
            );
        } else {
            // Fallback (Not supported)
            const msg = "Mujhe help chahiye, lekin location access nahi mila. Please jaldi contact karein.";
            const encodedMsg = encodeURIComponent(msg);
            
            setTimeout(() => {
                waLoadingText.style.display = 'none';
                emergencyWaBtn.disabled = false;
                emergencyWaBtn.style.opacity = '1';
                window.open(`https://wa.me/${emergencyNumber}?text=${encodedMsg}`, '_blank');
            }, 1500);
        }
    });
}

// Initial greeting
setTimeout(() => {
    addMessage("Assalamualaikum… Namaste meri pyari behen 🤍 Main Tarik Bhai hoon. Batao, kya chal raha hai dil mein?", 'bot');
}, 500);
