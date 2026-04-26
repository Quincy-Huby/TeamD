export type Role = 'coach' | 'student';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  avatar?: string;
  points: number;
  tier: string;
  coachId?: string;
  heightCm?: number;
  birthday?: string;
  targetWeightKg?: number;
  latestWeightKg?: number;
  lastActiveAt?: any;
  createdAt?: any;
  exerciseWeights?: Record<string, string>;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
  demoUrl?: string;
  instructions: string;
  purpose: string;
  muscleGroup: string;
  difficulty: 'Jararaca' | 'Cascavel' | 'Naja Real';
}

export interface Workout {
  id: string;
  title: string;
  studentId: string;
  authorId?: string;
  assignedTo?: string;
  completed: boolean;
  exercises: Exercise[];
  createdAt?: any;
  expiresAt?: any;
  points?: number;
  type?: 'challenge' | 'regular';
}

export interface CheckIn {
  id: string;
  studentId: string;
  coachId: string;
  weightKg: number;
  targetWeightKg?: number;
  heightCm?: number;
  birthday?: string;
  mood: number;
  notes: string;
  createdAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  type: 'report' | 'checkin' | 'text' | 'image' | 'workout';
  metadata?: any;
  createdAt: any;
}

export interface Challenge {
  id: string;
  title: string;
  task: string;
  points: number;
  icon: string;
  location: 'home' | 'gym' | 'both';
}
