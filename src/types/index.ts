export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  text: string;
  isPanicAlert?: boolean;
  brothers?: Brother[];
  mapsLink?: string;
  timestamp?: number;
}

export interface Brother {
  id?: string;
  name: string;
  whatsappNumber: string;
  createdAt?: any;
}

export interface Emergency {
  id?: string;
  timestamp: any;
  location: string;
  mapsLink: string;
  status: 'active' | 'resolved';
  triggerSource: string;
  messages: EmergencyMessage[];
}

export interface EmergencyMessage {
  sender: Role;
  text: string;
  time: string;
}
