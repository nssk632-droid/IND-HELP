
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  AI_ASSISTANT = 'AI_ASSISTANT',
  VOICE_LIVE = 'VOICE_LIVE',
  NEARBY = 'NEARBY',
  MEDIA_LAB = 'MEDIA_LAB'
}

export interface EmergencyNumber {
  id: string;
  name: string;
  number: string;
  icon: string;
  color: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
  web?: {
    uri: string;
    title: string;
  }
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
