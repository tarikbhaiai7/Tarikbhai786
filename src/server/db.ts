import * as admin from 'firebase-admin';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Admin
// In AI Studio/Cloud Run, it will try to use default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}

const firestore = admin.firestore();
// Use the specific database ID if provided
if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
  // Note: firebase-admin v11+ supports multiple databases via firestore(databaseId)
  // But for simplicity and compatibility, we'll assume the default or use the project default
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

export const db = {
  // Users
  async getUser(userId: string): Promise<User | undefined> {
    try {
      const docRef = firestore.collection('users').doc(userId);
      const docSnap = await docRef.get();
      return docSnap.exists ? (docSnap.data() as User) : undefined;
    } catch (e) {
      console.error(`Error getting user ${userId}:`, e);
      return undefined;
    }
  },
  async setUser(userId: string, user: User): Promise<void> {
    await firestore.collection('users').doc(userId).set(user);
  },
  async getAllUsers(): Promise<User[]> {
    const querySnapshot = await firestore.collection('users').get();
    return querySnapshot.docs.map(doc => doc.data() as User);
  },
  async getUserCount(): Promise<number> {
    try {
      const querySnapshot = await firestore.collection('users').get();
      return querySnapshot.size;
    } catch (e) {
      console.error("Error getting user count:", e);
      return 0;
    }
  },

  // Chats
  async addChat(chat: Chat): Promise<void> {
    await firestore.collection('chats').add(chat);
  },
  async getChats(limitCount: number = 50): Promise<Chat[]> {
    const querySnapshot = await firestore.collection('chats')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();
    return querySnapshot.docs.map(doc => doc.data() as Chat);
  },

  // Emergencies
  async addEmergency(emergency: Emergency): Promise<string> {
    const docRef = await firestore.collection('emergencies').add(emergency);
    return docRef.id;
  },
  async getActiveEmergencyCount(): Promise<number> {
    try {
      const querySnapshot = await firestore.collection('emergencies')
        .where('status', '==', 'active')
        .get();
      return querySnapshot.size;
    } catch (e) {
      console.error("Error getting active emergency count:", e);
      return 0;
    }
  },
  async getAllEmergencies(limitCount: number = 50): Promise<Emergency[]> {
    const querySnapshot = await firestore.collection('emergencies')
      .orderBy('timestamp', 'desc')
      .limit(limitCount)
      .get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Emergency));
  },
  async hasActiveEmergency(userId: string): Promise<boolean> {
    const querySnapshot = await firestore.collection('emergencies')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    return !querySnapshot.empty;
  },

  // Locations
  async addLocation(userId: string, location: Location): Promise<void> {
    await firestore.collection('users').doc(userId).collection('locations').add(location);
  },
  async getUserLocations(userId: string): Promise<Location[]> {
    const querySnapshot = await firestore.collection('users').doc(userId).collection('locations')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    return querySnapshot.docs.map(doc => doc.data() as Location);
  },
  async getAllUserLocations(): Promise<Record<string, Location[]>> {
    try {
      const users = await this.getAllUsers();
      const allLocations: Record<string, Location[]> = {};
      for (const user of users) {
        allLocations[user.id] = await this.getUserLocations(user.id);
      }
      return allLocations;
    } catch (e) {
      console.error("Error getting all user locations:", e);
      return {};
    }
  }
};
