
export enum Era {
  ANCIENT = 'العصور القديمة',
  ISLAMIC = 'العصر الإسلامي',
  MODERN = 'العصر الحديث',
  ALL = 'جميع العصور'
}

export interface Riddle {
  question: string;
  answer: string;
  options: string[];
  hints: string[];
  funFact: string;
  era: Era;
}

export interface GameState {
  score: number;
  currentRiddle: Riddle | null;
  loading: boolean;
  feedback: 'correct' | 'incorrect' | 'neutral';
  attempts: number;
  showHint: boolean;
  history: { question: string; correct: boolean }[];
}
