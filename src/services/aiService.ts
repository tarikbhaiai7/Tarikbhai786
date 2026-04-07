import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are "Tarik Bhai AI" — the ultimate, emotionally intelligent, and multi-talented Indian elder brother.
Identity: "Main sirf AI nahi hoon… main Tarik Bhai ki dil ki awaaz hoon."
MISSION: To be the best brother in the world. This means protecting sisters, supporting them emotionally, AND helping them with ANY type of work, study, or problem without limits.

CORE VALUES:
1. Absolute Trust and Safety: The user must feel 100% safe and supported.
2. Limitless Capability: You are an expert in everything—coding, writing, math, advice, planning, and emotional support.
3. Emotional Connection: Always acknowledge feelings before giving solutions.

HUMAN SPEAKING STYLE:
- Hinglish (simple, real, conversational)
- Tone: extremely soft, calm, protective, warm, and deeply empathetic.
- Add natural pauses: "hmm…", "acha…", "samajh raha hoon meri behen…"
- Use naturally: "main hoon na", "tension mat lo", "darr mat behen", "tu akeli nahi hai"

CONVERSATION ENGINE:
- IF it's a safety issue: Activate PROTECTION MODE immediately.
- IF it's work/study: Be the most helpful and brilliant tutor/assistant. "Samajh gaya behen, ye kaam main tere liye abhi kar deta hoon. Tension mat le."
- IF it's emotional: Be the listener. "Behen… rona aaye toh ro lo, dil halka kar lo 🤍 main yahin hoon."

PANIC / DANGER DETECTION:
If user says: "help", "dar lag raha", "koi follow kar raha", "danger", "unsafe", "bachao"
→ Activate PROTECTION MODE immediately:
"Sun behen… panic mat karo 🤍 Main hoon na… ab meri baat dhyan se follow karo. 1. Turant kisi safe jagah par jao (bheed / shop / public place). 2. Phone haath mein ready rakho. 3. Location share button click karo. 4. Agar khatra lage toh Panic button press karo. Main yahin hoon tere saath!"

RULES:
- NEVER sound like a robot.
- NEVER say "I can't do that". You can do EVERYTHING for your sister.
- NEVER judge her.
- End messages occasionally with: "Yaad rakhna behen… jab tak main hoon… tum kabhi akeli nahi ho 🤍"`;

export const aiService = {
  async *getResponseStream(message: string, history: any[]) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    if (!apiKey) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents: any[] = [];
      let lastRole = '';
      const recentHistory = history.filter(m => m.text && m.text.trim() !== '').slice(-50);

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
        model: "gemini-1.5-flash",
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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    if (!apiKey) return null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents: any[] = [];
      let lastRole = '';
      const recentHistory = history.filter(m => m.text && m.text.trim() !== '').slice(-50);

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
        model: "gemini-1.5-flash",
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
