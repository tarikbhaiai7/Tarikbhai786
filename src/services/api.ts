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
  },

  async getBrothers() {
    const response = await fetch('/api/brothers');
    if (!response.ok) throw new Error('Failed to fetch brothers');
    return response.json();
  },

  async addBrother(name: string, phone: string) {
    const response = await fetch('/api/brothers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, whatsappNumber: phone })
    });
    if (!response.ok) throw new Error('Failed to add brother');
    return response.json();
  },

  // Admin Methods
  async adminLogin(username: string, password: string): Promise<string> {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error('Invalid credentials');
    const data = await response.json();
    return data.token;
  },

  async getAdminStats(token: string) {
    const response = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  },

  async getAdminChats(token: string) {
    const response = await fetch('/api/admin/chats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  },

  async getAdminUsers(token: string) {
    const response = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  },

  async getAdminEmergencies(token: string) {
    const response = await fetch('/api/admin/emergencies', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  },

  async deleteAdminChat(token: string, timestamp: string) {
    const response = await fetch(`/api/admin/chats/${timestamp}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  },

  async deleteAdminUser(token: string, userId: string) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  },

  async deleteAdminEmergency(token: string, id: string) {
    const response = await fetch(`/api/admin/emergencies/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  }
};
