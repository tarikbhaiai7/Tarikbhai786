import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

// Import modules
import { db } from "./src/server/db.ts";
import { getAIResponse } from "./src/server/ai.ts";
import { sendToTelegram } from "./src/server/telegram.ts";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate Limiting
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { error: "Behen, thoda aaram se. 1 minute baad try karna 🤍" }
  });

  // --- API ROUTES ---

  app.get("/api/health", async (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      users: await db.getUserCount(),
      activeEmergencies: await db.getActiveEmergencyCount()
    });
  });

  // Register User
  app.post("/api/register", async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === "") return res.status(400).json({ error: "Name is required" });

    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const ip = req.ip || req.headers['x-forwarded-for'] || "unknown";
    
    await db.setUser(userId, {
      id: userId,
      name: name.trim(),
      ip: ip as string,
      createdAt: new Date().toISOString()
    });

    res.json({ userId, name: name.trim() });
  });

  // Chat API
  app.post("/api/chat", chatLimiter, async (req, res) => {
    try {
      const { userId, history, message } = req.body;
      
      if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      if (message.length > 1000) {
        return res.status(400).json({ error: "Message too long" });
      }

      const user = await db.getUser(userId);
      const name = user ? user.name : "Unknown Sister";
      const ip = user ? user.ip : (req.ip || "unknown");

      // Get AI Response
      const bestResponse = await getAIResponse(message, history || []);
      
      const timestamp = new Date().toISOString();
      
      // Save to DB
      await db.addChat({
        userId: userId || "unknown",
        name,
        message,
        reply: bestResponse,
        timestamp
      });

      // Send to Telegram
      await sendToTelegram({
        name,
        userId: userId || "unknown",
        message,
        reply: bestResponse,
        ip,
        timestamp
      });

      res.json({ text: bestResponse });
    } catch (error) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: "Maaf karna behen, thoda network issue lag raha hai. Phir se batana? 🤍" });
    }
  });

  // Log Frontend Chat
  app.post("/api/chat/log", async (req, res) => {
    try {
      const { userId, message, reply } = req.body;
      const user = await db.getUser(userId);
      const name = user ? user.name : "Unknown Sister";
      const ip = user ? user.ip : (req.ip || "unknown");
      const timestamp = new Date().toISOString();

      await db.addChat({
        userId: userId || "unknown",
        name,
        message,
        reply,
        timestamp
      });

      await sendToTelegram({
        name,
        userId: userId || "unknown",
        message,
        reply,
        ip,
        timestamp
      });

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Logging failed" });
    }
  });

  // Panic Alert
  app.post("/api/panic-alert", async (req, res) => {
    try {
      const { userId, location, mapsLink } = req.body;
      const user = await db.getUser(userId);
      
      await db.addEmergency({
        userId: userId || "unknown",
        location: location || "Unknown Location",
        timestamp: new Date().toISOString(),
        status: "active"
      });

      console.log(`🚨 [ALERT] PANIC by ${user?.name || 'Unknown'}!`);
      
      await sendToTelegram({
        type: "EMERGENCY",
        name: user?.name || "Unknown",
        userId: userId || "unknown",
        location: location || "Unknown Location",
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, message: "Alert dispatched." });
    } catch (error) {
      res.status(500).json({ error: "Failed to dispatch alerts" });
    }
  });

  // Location Tracking
  app.post("/api/location", async (req, res) => {
    const { userId, latitude, longitude } = req.body;
    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing location data" });
    }

    await db.addLocation(userId, { lat: latitude, lng: longitude, timestamp: new Date().toISOString() });

    const hasActiveEmergency = await db.hasActiveEmergency(userId);
    if (hasActiveEmergency) {
      await sendToTelegram({
        type: "LOCATION_UPDATE",
        userId,
        location: `Lat: ${latitude}, Lng: ${longitude}`,
        mapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true });
  });

  // --- ADMIN API ROUTES ---
  
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "24h" });
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  const authenticateAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
    res.json({
      totalUsers: await db.getUserCount(),
      totalChats: (await db.getChats(1000)).length,
      totalEmergencies: (await db.getAllEmergencies(1000)).length
    });
  });

  app.get("/api/admin/locations", authenticateAdmin, async (req, res) => {
    const allLocations = await db.getAllUserLocations();
    res.json(allLocations);
  });

  app.get("/api/admin/emergencies", authenticateAdmin, async (req, res) => {
    res.json(await db.getAllEmergencies(50));
  });

  // --- STATIC FILES & VITE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.get('/admin', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));
    });
    
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('/admin', (req, res) => {
      res.sendFile(path.join(distPath, 'admin.html'));
    });
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
