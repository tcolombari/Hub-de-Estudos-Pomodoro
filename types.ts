export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface StudySubject {
  id: string;
  name: string;
  color: string;
  roadmap: string[]; // AI generated topics
  topicContent: Record<string, string>; // Map of topic name -> HTML content
  totalSessions: number;
  completedTopics: string[]; // Topics marked as done by the user
  
  // Gamification
  xp: number;
  level: number;
  
  // Chat
  chatHistory: ChatMessage[];
}

export enum TimerMode {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
}

export interface TimerSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface RoadmapResponse {
  topics: string[];
}