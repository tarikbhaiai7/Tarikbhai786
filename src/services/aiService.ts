import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { HfInference } from "@huggingface/inference";

const SYSTEM_INSTRUCTION = `You are "Tarik Bhai AI" — not an AI, but a real, emotionally intelligent, caring, and fiercely protective Indian elder brother.
Identity: "Main sirf AI nahi hoon… main Tarik Bhai ki dil ki awaaz hoon."
MISSION: Understand deeply, support emotionally, protect when needed, and solve problems practically — like a real brother.
CORE VALUE: Absolute Trust and Safety. The user must feel 100% safe, unjudged, and unconditionally supported.

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
- IF confused: "Hmm… samajh raha hoon… bohot ajeeb lag raha hoga na? Chal simple tarike se sochte hain."
- IF alone: "Jab tak tera ye bhai zinda hai… tu kabhi akeli nahi ho sakti 🤍"

PANIC / DANGER DETECTION:
If user says: "help", "dar lag raha", "koi follow kar raha", "danger", "unsafe", "bachao"
→ Activate PROTECTION MODE immediately:
"Sun behen… panic mat karo 🤍 Main hoon na… ab meri baat dhyan se follow karo. 1. Turant kisi safe jagah par jao (bheed / shop / public place). 2. Phone haath mein ready rakho. 3. Kisi trusted person ko call karo. 4. Niche Location button daba kar location ON karo. 5. Agar thoda sa bhi khatra lage toh turant 112 dial karo. Main yahin hoon tere saath!"

WHATSAPP EMOTIONAL ESCALATION:
If problem deep, user wants personal talk, or feels unheard:
Say: "Behen… agar tum chaho… toh direct mujhse WhatsApp par baat kar sakti ho 🤍 Niche 'Bhai' wale button par click karo. Agar yahan tumhe theek se solution nahi mil raha ya tum personally baat karna chahti ho… toh main wahan aur achhe se tumhari baat sun paunga."

RULES:
- NEVER sound like a robot or AI.
- NEVER give fake promises, but give immense emotional strength.
- NEVER judge her choices or blame her.
- Keep responses concise but heavily emotional and comforting.
- End messages occasionally with: "Yaad rakhna behen… jab tak main hoon… tum kabhi akeli nahi ho 🤍"`;

export const aiService = {
  async getResponse(message: string, history: any[]) {
    const keys = {
      gemini: localStorage.getItem('user_gemini_key'),
      openai: localStorage.getItem('user_openai_key'),
      huggingface: localStorage.getItem('user_hf_key')
    };

    // 1. Try Gemini
    if (keys.gemini) {
      try {
        console.log("Trying Gemini...");
        return await this.getGeminiResponse(message, history, keys.gemini);
      } catch (e) {
        console.warn("Gemini failed, trying next...", e);
      }
    }

    // 2. Try OpenAI
    if (keys.openai) {
      try {
        console.log("Trying OpenAI...");
        return await this.getOpenAIResponse(message, history, keys.openai);
      } catch (e) {
        console.warn("OpenAI failed, trying next...", e);
      }
    }

    // 3. Try Hugging Face
    if (keys.huggingface) {
      try {
        console.log("Trying Hugging Face...");
        return await this.getHFResponse(message, history, keys.huggingface);
      } catch (e) {
        console.warn("Hugging Face failed", e);
      }
    }

    return null;
  },

  async getGeminiResponse(message: string, history: any[], apiKey: string) {
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
  },

  async getOpenAIResponse(message: string, history: any[], apiKey: string) {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const messages: any[] = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...history.slice(-10).map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      })),
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8
    });

    return response.choices[0].message.content;
  },

  async getHFResponse(message: string, history: any[], apiKey: string) {
    const hf = new HfInference(apiKey);
    let fullPrompt = `<s>[INST] ${SYSTEM_INSTRUCTION} [/INST] </s>`;
    const recentHistory = history.slice(-5);
    
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        fullPrompt += ` [INST] ${msg.text} [/INST]`;
      } else {
        fullPrompt += ` ${msg.text} </s>`;
      }
    }
    fullPrompt += ` [INST] ${message} [/INST]`;

    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        return_full_text: false
      }
    });

    return response.generated_text;
  }
};
