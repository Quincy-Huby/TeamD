import { User, Workout } from './types';
import { DAILY_CHALLENGES } from './dailyChallenges';

export const dailyChallenges = DAILY_CHALLENGES;

export const mockUsers: User[] = [
  { id: 'coach_daniel', name: 'Daniel', role: 'coach', points: 0, tier: 'Atheris Suprema' },
  { 
    id: 'u1', 
    name: 'Víbora Beta', 
    role: 'student', 
    points: 1250, 
    tier: 'Jararaca', 
    birthday: '1995-05-15', 
    heightCm: 175, 
    targetWeightKg: 80,
    coachId: 'coach_daniel'
  },
  { 
    id: 'u2', 
    name: 'Cobra Rei', 
    role: 'student', 
    points: 4500, 
    tier: 'Bungarus (Krait)', 
    birthday: '1988-10-22', 
    heightCm: 182, 
    targetWeightKg: 90,
    coachId: 'coach_daniel'
  },
  { 
    id: 'u3', 
    name: 'Titan Obscuro', 
    role: 'student', 
    points: 12500, 
    tier: 'Atheris Suprema', 
    coachId: 'coach_daniel'
  },
  { 
    id: 'u4', 
    name: 'Serpente Carmesim', 
    role: 'student', 
    points: 9200, 
    tier: 'Taipan-do-Interior', 
    coachId: 'coach_daniel'
  },
  { 
    id: 'u5', 
    name: 'Sombra Roxa', 
    role: 'student', 
    points: 7100, 
    tier: 'Mamba Negra', 
    coachId: 'coach_daniel'
  }
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
        difficulty: 'Cascavel',
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
        difficulty: 'Jararaca',
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
        difficulty: 'Jararaca',
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
  "Domine a carga ou seja devorado por ela.",
  "O veneno corre nas veias daqueles que não param.",
  "Trocar de pele dói, mas é a única forma de crescer.",
  "Um bote falho é apenas um ensaio para o bote perfeito.",
  "A serpente não apressa o bote. Ela se prepara e não erra.",
  "A fraqueza de hoje é eliminada no treino de amanhã.",
  "Inocule disciplina e seu corpo se tornará à prova de falhas.",
  "Escamas não se formam no conforto, elas nascem da raspagem contra o solo duro.",
  "Movimente-se friamente. Sem emoções, apenas execução.",
  "Predadores de elite respeitam a paciência tanto quanto a agressividade.",
  "Sua mente deve ser tão inabalável quanto as presas fixadas no alvo."
];

export const quickHits = [
  { id: 'qh1', title: 'Flow Predator', desc: '15 min • Mobilidade Total', color: 'border-l-blue-500' },
  { id: 'qh2', title: 'Inoculação HIT', desc: '20 min • Cardio Letal', color: 'border-l-atheris-toxic' },
  { id: 'qh3', title: 'Víbora Atenta', desc: '10 min • Foco e Mindset', color: 'border-l-purple-500' },
  { id: 'qh4', title: 'Camuflagem', desc: '12 min • Core Estabilizador', color: 'border-l-orange-500' },
  { id: 'qh5', title: 'Bote Rápido', desc: '8 min • Ativação Muscular', color: 'border-l-red-500' },
  { id: 'qh6', title: 'Troca de Pele', desc: '25 min • Flexibilidade', color: 'border-l-green-400' }
];
