export type PersonaId = 'emma' | 'sophia' | 'chloe' | 'priya';

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  avatar: string;
  accent: string;
  voiceGender: 'female';
  recommendedVoice: string;
  description: string;
  systemStyle: string;
}

export interface CorrectionItem {
  id?: string;
  original: string;
  corrected: string;
  errorType: 'tense' | 'preposition' | 'article' | 'subject_verb_agreement' | 'spelling' | 'word_choice' | 'sentence_framing' | string;
  explanation: string;
  tamilExplanation: string;
  betterFraming?: BetterFraming;
  timestamp?: number;
  savedToVault?: boolean;
}

export interface BetterFraming {
  casual: string;
  professional: string;
  nativeIdiomOrPhrase?: string;
}

export interface VocabularyBooster {
  word: string;
  meaning: string;
  example: string;
}

export interface GrammarAnalysis {
  overallScore: number;
  hasErrors: boolean;
  summary: string;
  corrections: CorrectionItem[];
  betterFraming: BetterFraming;
  vocabularyBoosters: VocabularyBooster[];
  pronunciationTips?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  personaId?: PersonaId;
  grammarAnalysis?: GrammarAnalysis;
  audioBase64?: string;
  isPlaying?: boolean;
}

export interface PracticeScenario {
  id: string;
  title: string;
  category: string;
  prompt: string;
  starterUserText: string;
  iconName: string;
}

export interface UserStats {
  totalSentences: number;
  averageAccuracy: number;
  mistakesFixed: number;
  speakingTimeSeconds: number;
}
