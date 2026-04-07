import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { HfInference } from "@huggingface/inference";
import "dotenv/config";

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

const AI_PROVIDERS = [
  { 
    name: "gemini", 
    apiKey: process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY, 
    model: "gemini-1.5-flash" 
  },
  { 
    name: "openai", 
    apiKey: process.env.OPENAI_API_KEY, 
    model: "gpt-4o" 
  },
  {
    name: "huggingface",
    apiKey: process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY_1 || process.env.HF_API_KEY_2,
    model: "mistralai/Mistral-7B-Instruct-v0.3"
  }
].filter(p => p.apiKey && p.apiKey.trim() !== "" && !p.apiKey.includes("YOUR_"));

async function fetchOpenAI(prompt: string, history: any[], apiKey: string, model: string) {
  const openai = new OpenAI({ apiKey });
  const messages: any[] = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...history.slice(-50).map((msg: any) => ({ 
      role: msg.role === 'model' ? 'assistant' : 'user', 
      content: msg.text 
    })),
    { role: "user", content: prompt }
  ];

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
  });
  
  return response.choices[0].message.content;
}

async function fetchHuggingFace(prompt: string, history: any[], apiKey: string, model: string) {
  const hf = new HfInference(apiKey);
  
  // Format for Mistral/Llama style
  let fullPrompt = `<s>[INST] ${SYSTEM_INSTRUCTION} [/INST] </s>`;
  const recentHistory = history.slice(-20);
  
  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      fullPrompt += ` [INST] ${msg.text} [/INST]`;
    } else {
      fullPrompt += ` ${msg.text} </s>`;
    }
  }
  
  fullPrompt += ` [INST] ${prompt} [/INST]`;

  const response = await hf.textGeneration({
    model,
    inputs: fullPrompt,
    parameters: {
      max_new_tokens: 4000,
      temperature: 0.7,
      return_full_text: false
    }
  });

  return response.generated_text;
}

async function fetchGemini(prompt: string, history: any[], apiKey: string, model: string) {
  const ai = new GoogleGenAI({ apiKey });
  
  const contents: any[] = [];
  let lastRole = '';

  // Truncate history for performance and limits (Increased for VIP Max Pro)
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
    contents[contents.length - 1].parts[0].text += `\n\n${prompt}`;
  } else {
    contents.push({ role: 'user', parts: [{ text: prompt }] });
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 }
  });
  return response.text;
}

export async function getAIResponse(message: string, history: any[]) {
  if (AI_PROVIDERS.length === 0) {
    console.error("[AI] No API keys configured on backend!");
    return "Behen, main abhi thoda busy hoon (Backend configuration missing). Par tum tension mat lo, main yahin hoon. 🤍";
  }

  // Try providers in sequence
  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`[AI] Trying ${provider.name}...`);
      let responseText = "";
      
      if (provider.name === 'openai') {
        responseText = await fetchOpenAI(message, history, provider.apiKey!, provider.model);
      } else if (provider.name === 'gemini') {
        responseText = await fetchGemini(message, history, provider.apiKey!, provider.model);
      } else if (provider.name === 'huggingface') {
        responseText = await fetchHuggingFace(message, history, provider.apiKey!, provider.model);
      }

      if (responseText && responseText.length > 2) {
        return responseText;
      }
    } catch (error) {
      console.error(`[AI] ${provider.name} failed:`, error);
    }
  }

  return "Behen, network thoda weak lag raha hai. Par main yahin hoon, tension mat lo. Ek baar phir se bhejogi? 🤍";
}
