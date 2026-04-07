// Frontend API service for Tarik Bhai AI

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatResponse {
  text?: string;
  error?: string;
}

export const api = {
  async checkBackend(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { method: 'HEAD' }).catch(() => null);
      return !!response && response.ok;
    } catch (e) {
      return false;
    }
  },

  async register(name: string) {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  async chat(userId: string, message: string, history: ChatMessage[]): Promise<ChatResponse> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message, history })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Network response was not ok');
    }
    return response.json();
  },

  async logChat(userId: string, message: string, reply: string) {
    try {
      await fetch('/api/chat/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message, reply })
      });
    } catch (e) {
      console.error("Failed to log chat to backend", e);
    }
  },

  async panic(userId: string, location: string, mapsLink: string) {
    const response = await fetch('/api/panic-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, location, mapsLink })
    });
    if (!response.ok) throw new Error('Panic alert failed');
    return response.json();
  },

  async updateLocation(userId: string, latitude: number, longitude: number) {
    const response = await fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      })
    });
    if (!response.ok) throw new Error('Location update failed');
    return response.json();
  }
};
