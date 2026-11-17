export type QuadrantType = 'RED' | 'YELLOW' | 'BLUE' | 'GREEN';
export type UserRole = 'student' | 'teacher';

export interface QuadrantMeta {
  type: QuadrantType;
  koreanName: string;
  englishName: string;
  themeColor: string;
  textColor: string;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  pinColorClass: string;
  icon: string;
  energyText: string;
  pleasantnessText: string;
  energyLevel: 'high' | 'low';
  pleasantnessLevel: 'unpleasant' | 'pleasant';
  title: string;
  desc: string;
  careActivityTitle: string;
  careActivityDesc: string;
  breatheMode: boolean;
  words: string[];
  tips: string[];
}

export interface MoodPoint {
  x: number; // 0 to 100 (pleasantness: 0=unpleasant, 100=pleasant)
  y: number; // 0 to 100 (energy: 0=high, 100=low or inverted standard Y)
  quadrant: QuadrantType;
}

export interface MoodLogEntry {
  id: string;
  timestamp: number;
  dateString?: string;
  quadrant: QuadrantType;
  selectedWord: string;
  x: number;
  y: number;
  pleasantness?: number;
  energy?: number;
  aiComment?: string;
  reflectionNote?: string;
  photoUrl?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  grade?: string;
  classRoom?: string;
  studentNumber?: string;
  teacherUid?: string;
  userUid?: string;
  userEmail?: string;
  teacherFeedback?: string;
  teacherFeedbackAt?: number;
  teacherFeedbackAuthor?: string;
}

export interface StudentAccount {
  id: string;
  studentCode: string;
  name: string;
  grade: string;
  classRoom: string;
  studentNumber: string;
  pinCode: string;
  teacherUid: string;
  teacherEmail?: string;
  linkedEmail?: string;
  totalLogsCount: number;
  lastLogAt?: number;
  lastQuadrant?: QuadrantType;
  lastWord?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  studentId?: string;
  studentCode?: string;
  grade?: string;
  classRoom?: string;
  studentNumber?: string;
  createdAt: string;
}

export interface AIAnalysisResult {
  detectedQuadrant: QuadrantType;
  x: number;
  y: number;
  confidence: number;
  expressionName: string;
  aiComment: string;
  recommendedWords: string[];
  actionSuggestion: string;
}
