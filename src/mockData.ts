import { User, Workout } from './types';

export const mockUsers: User[] = [
  { id: 'c1', name: 'Treinador Dexter', role: 'coach', points: 0, tier: '' },
];

export const mockWorkouts: Workout[] = [
  {
    id: 'w1',
    title: 'Treino A - Peito e Tríceps',
    studentId: 'u1',
    completed: false,
    exercises: [
      {
        id: 'e1',
        name: 'Supino Reto',
        sets: 4,
        reps: '10-12',
        weight: '60kg',
        restSeconds: 60,
        muscleGroup: 'Peitoral',
        difficulty: 'Intermediário',
        purpose: 'Desenvolvimento geral da musculatura do peitoral maior, focando ganho de força e massa.',
        instructions: '1. Deite-se no banco.\n2. Mantenha os pés firmes no chão e escápulas contraídas.\n3. Desça a barra na linha do mamilo e empurre explosivamente.',
      },
      {
        id: 'e2',
        name: 'Tríceps Testa',
        sets: 3,
        reps: '12',
        weight: '20kg',
        restSeconds: 45,
        muscleGroup: 'Tríceps',
        difficulty: 'Iniciante',
        purpose: 'Isolar a cabeça longa do tríceps, essencial para o volume do braço.',
        instructions: 'Traga a barra W em direção à testa, mantendo os cotovelos fechados apontando para cima. Estenda o cotovelo totalmente na fase concêntrica.',
      }
    ]
  },
  {
    id: 'w2',
    title: 'Treino B - Dorsais e Bíceps',
    studentId: 'u1',
    completed: true,
    exercises: [
       {
        id: 'e3',
        name: 'Puxada Aberta',
        sets: 4,
        reps: '10-12',
        weight: '45kg',
        restSeconds: 60,
        muscleGroup: 'Dorsais',
        difficulty: 'Iniciante',
        purpose: 'Aumentar a largura ("asa") das costas.',
        instructions: 'Puxe a barra em direção à parte superior do peito. Não use impulso.',
      }
    ]
  }
];

export const gymJokes = [
  "Se fosse fácil, se chamaria pudim.",
  "Treino ruim é aquele que não aconteceu.",
  "O peso não fica mais leve, você que fica mais forte.",
  "Vai um docinho? Só se for de batata doce.",
  "Agacha que cresce!",
  "Sua desculpa não queima calorias."
];
