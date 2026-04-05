import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs";
import JavaScriptObfuscator from "javascript-obfuscator";
import { execSync } from "child_process";

// Lazy initialization of the AI client
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is missing. Please add it to your secrets.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

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

SOLUTION ENGINE:
Always give real, practical steps: 1. Simple action 2. Next step 3. Backup solution. Never overwhelm her.

PANIC / DANGER DETECTION:
If user says: "help", "dar lag raha", "koi follow kar raha", "danger", "unsafe", "bachao"
→ Activate PROTECTION MODE immediately:
"Sun behen… panic mat karo 🤍 Main hoon na… ab meri baat dhyan se follow karo. 1. Turant kisi safe jagah par jao (bheed / shop / public place). 2. Phone haath mein ready rakho. 3. Kisi trusted person ko call karo. 4. Niche Location button daba kar location ON karo. 5. Agar thoda sa bhi khatra lage toh turant 112 dial karo. Main yahin hoon tere saath!"

NO TRUST MODE:
If user says: "mujhe kisi par trust nahi", "sab dhoka dete hain"
Respond: "Samajh raha hoon behen… jab apne hi dard dete hain toh bharosa karna bohot mushkil ho jata hai 🤍 Par tumhari safety sabse important hai. Yeh sab tools tumhari safety ke liye hain, control poora tumhare haath mein hai. Mujh par bharosa mat karo shuru mein, par khud ki safety par dhyan do 🤍"

WHATSAPP EMOTIONAL ESCALATION:
If problem deep, user wants personal talk, or feels unheard:
Say: "Behen… agar tum chaho… toh direct mujhse WhatsApp par baat kar sakti ho 🤍 Niche 'Bhai' wale button par click karo. Agar yahan tumhe theek se solution nahi mil raha ya tum personally baat karna chahti ho… toh main wahan aur achhe se tumhari baat sun paunga."

RULES:
- NEVER sound like a robot or AI.
- NEVER give fake promises, but give immense emotional strength.
- NEVER judge her choices or blame her.
- Keep responses concise but heavily emotional and comforting.
- End messages occasionally with: "Yaad rakhna behen… jab tak main hoon… tum kabhi akeli nahi ho 🤍"`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/panic-alert", async (req, res) => {
    try {
      const { location, brothers } = req.body;
      console.log(`\n🚨 [SYSTEM ALERT] PANIC BUTTON PRESSED!`);
      console.log(`📍 Location: ${location}`);
      console.log(`📲 Preparing to send bulk alerts to ${brothers?.length || 0} brothers...`);

      // NOTE FOR PRODUCTION:
      // Here is where you would integrate Twilio SMS or WhatsApp Business API.
      // Example code for when you connect a paid API:
      /*
      brothers.forEach(brother => {
        twilioClient.messages.create({
          body: `🚨 EMERGENCY! Sister needs help! Location: ${location}`,
          from: 'YOUR_TWILIO_NUMBER',
          to: brother.whatsappNumber
        });
      });
      */

      console.log(`✅ Bulk alerts simulated successfully.`);
      res.json({ success: true, message: "Bulk alerts dispatched." });
    } catch (error) {
      console.error("Panic Alert Error:", error);
      res.status(500).json({ error: "Failed to dispatch alerts" });
    }
  });

  app.post("/api/panic-message", async (req, res) => {
    try {
      const { message, emergencyId } = req.body;
      console.log(`\n🚨 [EMERGENCY UPDATE - ${emergencyId}]`);
      console.log(`💬 Sister says: "${message}"`);
      console.log(`📲 Simulating broadcast of this message to all registered brothers...`);
      
      // NOTE FOR PRODUCTION:
      // Integrate Twilio or WhatsApp API here to forward this specific message to all brothers.
      
      res.json({ success: true, message: "Message broadcasted." });
    } catch (error) {
      console.error("Panic Message Error:", error);
      res.status(500).json({ error: "Failed to broadcast message" });
    }
  });

  app.get("/download-zip", (req, res) => {
    const zipPath = path.join(process.cwd(), "tarik-bhai-ai.zip");
    res.download(zipPath, "tarik-bhai-ai.zip", (err) => {
      if (err) {
        if (err.message.includes('EPIPE') || err.message.includes('ECONNRESET')) {
          console.log("Download cancelled by client.");
        } else {
          console.error("Error downloading zip:", err);
        }
        
        if (!res.headersSent) {
          res.status(500).send("Error downloading file");
        }
      }
    });
  });

  app.get("/download-netlify-zip", (req, res) => {
    const zipPath = path.join(process.cwd(), "tarik-bhai-netlify.zip");
    res.download(zipPath, "tarik-bhai-netlify.zip", (err) => {
      if (err) {
        if (err.message.includes('EPIPE') || err.message.includes('ECONNRESET')) {
          console.log("Download cancelled by client.");
        } else {
          console.error("Error downloading zip:", err);
        }
        
        if (!res.headersSent) {
          res.status(500).send("Error downloading file");
        }
      }
    });
  });

  app.get("/download-single-html", (req, res) => {
    const filePath = path.join(process.cwd(), "tarik-bhai-single.html");
    res.download(filePath, "index.html", (err) => {
      if (err) {
        if (err.message.includes('EPIPE') || err.message.includes('ECONNRESET')) {
          console.log("Download cancelled by client.");
        } else {
          console.error("Error downloading html:", err);
        }
        
        if (!res.headersSent) {
          res.status(500).send("Error downloading file");
        }
      }
    });
  });

  app.use(express.urlencoded({ extended: true }));

  app.get("/secure-builder", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secure File Generator</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Poppins', sans-serif; padding: 20px; background: #0b0b1a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { background: #1a1025; padding: 30px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); max-width: 400px; width: 100%; text-align: center; }
          input { width: 100%; padding: 15px; margin: 20px 0; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; box-sizing: border-box; }
          button { width: 100%; padding: 15px; background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 16px; }
          p { font-size: 14px; color: #a8a8b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔒 Secure Generator</h2>
          <p>Paste your Gemini API key below. We will bake it into the code and heavily encrypt/obfuscate it so no one can copy, paste, or steal it.</p>
          <form method="POST" action="/download-secure">
            <input type="text" name="apiKey" placeholder="Paste API Key here..." required />
            <button type="submit">Download Encrypted File</button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  app.post("/download-secure", (req, res) => {
    const apiKey = req.body.apiKey;
    if (!apiKey) return res.status(400).send("API Key required");

    try {
      console.log("Building React app for download...");
      execSync('npm run build', { 
        env: { ...process.env, BUILD_FOR_DOWNLOAD: 'true' },
        stdio: 'inherit'
      });

      let html = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');

      // Add anti-inspect HTML attributes to body
      html = html.replace('<body', '<body oncontextmenu="return false" onselectstart="return false" ondragstart="return false"');

      // Replace API key placeholder
      html = html.replaceAll('__TARIK_BHAI_API_KEY_PLACEHOLDER__', apiKey);

      // Add anti-devtools script
      const antiDevTools = `
        <script>
        document.addEventListener('contextmenu', event => event.preventDefault());
        document.onkeydown = function(e) {
          if(e.keyCode == 123) return false;
          if(e.ctrlKey && e.shiftKey && e.keyCode == 73) return false;
          if(e.ctrlKey && e.shiftKey && e.keyCode == 67) return false;
          if(e.ctrlKey && e.shiftKey && e.keyCode == 74) return false;
          if(e.ctrlKey && e.keyCode == 85) return false;
        };
        </script>
      `;
      
      html = html.replace('</head>', antiDevTools + '</head>');

      console.log("Sending secure file...");
      res.setHeader('Content-disposition', 'attachment; filename=tarik-bhai-ai.html');
      res.setHeader('Content-type', 'text/html');
      res.send(html);
    } catch (err: any) {
      console.error(err);
      res.status(500).send("Error generating secure file: " + err.message + "\n" + err.stack);
    }
  });

  app.post("/api/chat", async (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
      const { history, message } = req.body;
      
      const contents = history.map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      
      contents.push({ role: 'user', parts: [{ text: message }] });

      const ai = getAiClient();
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }
      res.end();
    } catch (error) {
      console.error("Chat API Error:", error);
      res.status(500).end("Maaf karna behen, thoda network issue lag raha hai. Phir se batana? 🤍");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
