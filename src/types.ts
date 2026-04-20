export type Role = 'coach' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  points: number;
  tier: string;
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
  completed: boolean;
  exercises: Exercise[];
}
