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
  createdAt?: any;
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
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
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
}

export interface CheckIn {
  id: string;
  studentId: string;
  coachId: string;
  weightKg: number;
  notes: string;
  createdAt: any;
}
