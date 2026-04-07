import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, addDoc, updateDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
    const docRef = doc(firestore, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as User) : undefined;
  },
  async setUser(userId: string, user: User): Promise<void> {
    await setDoc(doc(firestore, 'users', userId), user);
  },
  async getAllUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(firestore, 'users'));
    return querySnapshot.docs.map(doc => doc.data() as User);
  },
  async getUserCount(): Promise<number> {
    const querySnapshot = await getDocs(collection(firestore, 'users'));
    return querySnapshot.size;
  },

  // Chats
  async addChat(chat: Chat): Promise<void> {
    await addDoc(collection(firestore, 'chats'), chat);
  },
  async getChats(limitCount: number = 50): Promise<Chat[]> {
    const q = query(collection(firestore, 'chats'), orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Chat);
  },

  // Emergencies
  async addEmergency(emergency: Emergency): Promise<string> {
    const docRef = await addDoc(collection(firestore, 'emergencies'), emergency);
    return docRef.id;
  },
  async getActiveEmergencyCount(): Promise<number> {
    const q = query(collection(firestore, 'emergencies'), where('status', '==', 'active'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  },
  async getAllEmergencies(limitCount: number = 50): Promise<Emergency[]> {
    const q = query(collection(firestore, 'emergencies'), orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Emergency));
  },
  async hasActiveEmergency(userId: string): Promise<boolean> {
    const q = query(collection(firestore, 'emergencies'), where('userId', '==', userId), where('status', '==', 'active'));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  // Locations
  async addLocation(userId: string, location: Location): Promise<void> {
    // We store locations in a subcollection for each user
    await addDoc(collection(firestore, 'users', userId, 'locations'), location);
  },
  async getUserLocations(userId: string): Promise<Location[]> {
    const q = query(collection(firestore, 'users', userId, 'locations'), orderBy('timestamp', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Location);
  },
  async getAllUserLocations(): Promise<Record<string, Location[]>> {
    const users = await this.getAllUsers();
    const allLocations: Record<string, Location[]> = {};
    for (const user of users) {
      allLocations[user.id] = await this.getUserLocations(user.id);
    }
    return allLocations;
  }
};
