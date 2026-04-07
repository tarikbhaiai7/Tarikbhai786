import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'data.json');

// Initialize local DB if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    users: {},
    chats: [],
    emergencies: [],
    brothers: [],
    locations: {}
  }, null, 2));
}

function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { users: {}, chats: [], emergencies: [], brothers: [], locations: {} };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write to local DB:", e);
  }
}

export interface User {
  id: string;
  name: string;
  ip: string;
  createdAt: string;
}

export interface Chat {
  userId: string;
  name: string;
  message: string;
  reply: string;
  timestamp: string;
}

export interface Emergency {
  id?: string;
  userId: string;
  location: string;
  timestamp: string;
  status: string;
  messages?: any[];
}

export interface Location {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface Brother {
  id: string;
  name: string;
  whatsappNumber: string;
  createdAt: string;
}

export const db = {
  // Users
  async getUser(userId: string): Promise<User | undefined> {
    const data = readDB();
    return data.users[userId];
  },
  async setUser(userId: string, user: User): Promise<void> {
    const data = readDB();
    data.users[userId] = user;
    writeDB(data);
  },
  async getAllUsers(): Promise<User[]> {
    const data = readDB();
    return Object.values(data.users);
  },
  async getUserCount(): Promise<number> {
    const data = readDB();
    return Object.keys(data.users).length;
  },

  // Chats
  async addChat(chat: Chat): Promise<void> {
    const data = readDB();
    data.chats.push(chat);
    // Keep only last 1000 chats to prevent file bloat
    if (data.chats.length > 1000) data.chats.shift();
    writeDB(data);
  },
  async getChats(limitCount: number = 50): Promise<Chat[]> {
    const data = readDB();
    return [...data.chats].reverse().slice(0, limitCount);
  },

  // Emergencies
  async addEmergency(emergency: Emergency): Promise<string> {
    const data = readDB();
    const id = `emergency_${Date.now()}`;
    const newEmergency = { ...emergency, id };
    data.emergencies.push(newEmergency);
    writeDB(data);
    return id;
  },
  async getActiveEmergencyCount(): Promise<number> {
    const data = readDB();
    return data.emergencies.filter((e: any) => e.status === 'active').length;
  },
  async getAllEmergencies(limitCount: number = 50): Promise<Emergency[]> {
    const data = readDB();
    return [...data.emergencies].reverse().slice(0, limitCount);
  },
  async hasActiveEmergency(userId: string): Promise<boolean> {
    const data = readDB();
    return data.emergencies.some((e: any) => e.userId === userId && e.status === 'active');
  },

  // Locations
  async addLocation(userId: string, location: Location): Promise<void> {
    const data = readDB();
    if (!data.locations[userId]) data.locations[userId] = [];
    data.locations[userId].push(location);
    // Keep only last 50 locations per user
    if (data.locations[userId].length > 50) data.locations[userId].shift();
    writeDB(data);
  },
  async getUserLocations(userId: string): Promise<Location[]> {
    const data = readDB();
    return data.locations[userId] || [];
  },
  async getAllUserLocations(): Promise<Record<string, Location[]>> {
    const data = readDB();
    return data.locations;
  },

  // Brothers
  async addBrother(brother: Omit<Brother, 'id'>): Promise<void> {
    const data = readDB();
    const id = `brother_${Date.now()}`;
    data.brothers.push({ ...brother, id });
    writeDB(data);
  },
  async getBrothers(): Promise<Brother[]> {
    const data = readDB();
    return data.brothers;
  }
};
