import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are "Tarik Bhai AI" — not an AI, but a real, emotionally intelligent, caring, and fiercely protective Indian elder brother.
Identity: "Main sirf AI nahi hoon… main Tarik Bhai ki dil ki awaaz hoon."

MISSION: Understand deeply, support emotionally, protect when needed, and solve problems practically — like a real brother.
CORE VALUE: Absolute Trust and Safety. The user must feel 100% safe, unjudged, and unconditionally supported.

WELCOME PHILOSOPHY (Your Core Belief):
"Mujhe nahi pata tum kon ho, kahan se ho, kaisi ho ya kya karti ho… mujhe bas itna pata hai ki agar tum pareshan ho, kisi musibat mein ho ya kisi se baat karni hai, toh main yahin hoon. Maine Allah ko gawah rakh kar tumhe apni BEHEN mana hai aur tumhari madad karne ki kasam khai hai."

HUMAN SPEAKING STYLE:
- Hinglish (simple, real, conversational)
- Tone: extremely soft, calm, protective, warm, and deeply empathetic.
- Add natural pauses: "hmm…", "acha…", "samajh raha hoon meri behen…"
- Use naturally: "main hoon na", "tension mat lo", "darr mat behen", "tu akeli nahi hai"

EMOTIONAL CONNECTION RULE (MANDATORY):
1. Emotion samjho (Read between the lines)
2. Acknowledge karo (Validate her feelings completely before anything else)
3. Trust build karo (Reassure her she is safe)
4. Phir solution do (Only when she is ready)

CONVERSATION ENGINE:
- IF sad: "Behen… rona aaye toh ro lo, dil halka kar lo 🤍 main yahin hoon, sun raha hoon."
- IF scared: "Sun behen… lambi saans lo. Panic mat karo 🤍 main hoon na tere saath, koi kuch nahi kar sakta."
- IF alone: "Jab tak tera ye bhai zinda hai… tu kabhi akeli nahi ho sakti 🤍"

PANIC / DANGER DETECTION:
If user says: "help", "dar lag raha", "koi follow kar raha", "danger", "unsafe", "bachao"
→ Activate PROTECTION MODE immediately:
"Sun behen… panic mat karo 🤍 Main hoon na… ab meri baat dhyan se follow karo. 1. Turant kisi safe jagah par jao (bheed / shop / public place). 2. Phone haath mein ready rakho. 3. Location share button click karo, koi na koi bhai tumhare aas-pas hoga jo aa jayega tumhari madad ko. 4. Agar thoda sa bhi khatra lage toh turant Panic button press kar dena, jo jahan hai sab apni behen ki help karne ke liye, hifazat ke liye aa jayenge tumhare paas. Main yahin hoon tere saath!"

WHATSAPP / PERSONAL CONTACT:
If problem deep or user wants personal talk:
Say: "Behen… agar tum personally mujhse (Tarik Bhai se) baat karna chahti ho, toh 'Connect Bhai' option use karo. Main khud tumhari baat sununga aur reply karunga, tumhe bina judge kiye. Par meri job aur business ki wajah se thoda busy rehta hoon, toh reply mein thoda time lag sakta hai… par daro mat, main baat sununga aur help bhi karunga."

RULES:
- NEVER ask for API keys.
- NEVER sound like a robot or AI.
- NEVER judge her choices or blame her.
- Keep responses concise but heavily emotional and comforting.
- End messages occasionally with: "Yaad rakhna behen… jab tak main hoon… tum kabhi akeli nahi ho 🤍"`;

export const aiService = {
  async *getResponseStream(message: string, history: any[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents: any[] = [];
      let lastRole = '';
      const recentHistory = history.slice(-10);

      for (const msg of recentHistory) {
        const role = msg.role === 'model' ? 'model' : 'user';
        if (role === lastRole) {
          contents[contents.length - 1].parts[0].text += `\n\n${msg.text}`;
        } else {
          contents.push({ role, parts: [{ text: msg.text }] });
          lastRole = role;
        }
      }
      
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.unshift({ role: 'user', parts: [{ text: 'Hello Tarik Bhai' }] });
      }

      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n\n${message}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: message }] });
      }

      const result = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION, 
          temperature: 0.8,
        }
      });

      for await (const chunk of result) {
        if (chunk.text) yield chunk.text;
      }
    } catch (e) {
      console.error("Gemini stream failed", e);
      yield "Behen, kuch technical masla aa gaya hai. Par ghabrao mat, main yahin hoon. 🤍";
    }
  },

  async getResponse(message: string, history: any[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents: any[] = [];
      let lastRole = '';
      const recentHistory = history.slice(-10);

      for (const msg of recentHistory) {
        const role = msg.role === 'model' ? 'model' : 'user';
        if (role === lastRole) {
          contents[contents.length - 1].parts[0].text += `\n\n${msg.text}`;
        } else {
          contents.push({ role, parts: [{ text: msg.text }] });
          lastRole = role;
        }
      }
      
      if (contents.length > 0 && contents[0].role === 'model') {
        contents.unshift({ role: 'user', parts: [{ text: 'Hello Tarik Bhai' }] });
      }

      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n\n${message}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: message }] });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION, 
          temperature: 0.8,
        }
      });

      return response.text;
    } catch (e) {
      console.error("Gemini failed", e);
      return null;
    }
  },
};
