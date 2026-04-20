import { User, Workout } from './types';

export const mockUsers: User[] = [
  { id: 'coach_daniel', name: 'Daniel', role: 'coach', points: 0, tier: 'Treinador Alfa' },
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
  "O veneno está sendo inoculado.",
  "Predadores não pulam o leg day.",
  "A dor é o aviso de que a presa está cedendo.",
  "Sua fraqueza é o alimento da Atheris.",
  "Bote preciso, execução letal.",
  "Sinta as escamas arderem.",
  "Hierarquia se constrói com ferro e sangue."
];

export const predatorQuotes = [
  "Silencioso, preciso, letal.",
  "Quanto mais tóxico o ambiente, mais forte o predador.",
  "Seu cansaço é irrelevante para a sua evolução.",
  "O topo da cadeia alimentar não aceita desculpas.",
  "Domine a carga ou seja devorado por ela."
];
