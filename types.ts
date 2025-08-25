
export interface Message {
  role: 'user' | 'assistant';
  text: string;
  correction?: string | null;
  explanation?: string | null;
}

export type AppState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface AIResponse {
  correction: string | null;
  explanation: string | null;
  followUpQuestion: string;
}
