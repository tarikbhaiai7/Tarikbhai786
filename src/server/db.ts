// In-memory database for Tarik Bhai AI
// In a real production app, this would be replaced by a real DB like Firestore or MongoDB

interface User {
  id: string;
  name: string;
  ip: string;
  createdAt: string;
}

interface Chat {
  userId: string;
  name: string;
  message: string;
  reply: string;
  timestamp: string;
}

interface Emergency {
  userId: string;
  location: string;
  timestamp: string;
  status: string;
}

interface Location {
  lat: number;
  lng: number;
  timestamp: string;
}

export const db = {
  users: new Map<string, User>(),
  chats: [] as Chat[],
  emergencies: [] as Emergency[],
  locations: new Map<string, Location[]>()
};
