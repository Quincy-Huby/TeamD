import { GoogleGenAI, Type } from "@google/genai";
import { EXERCISE_LIBRARY } from "../exerciseLibrary";
import { User, CheckIn, Exercise } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface GeneratedWorkout {
  title: string;
  exercises: Partial<Exercise>[];
}

/**
 * Gera um programa de treino personalizado baseado em parâmetros
 */
export async function generateWorkoutProgram(
  muscleGroup: string, 
  difficulty: string, 
  goal: string, 
  studentName: string = 'Víbora',
  gender: string = 'Indefinido',
  splitType: string = 'Padrão',
  status: string = 'Natural'
): Promise<GeneratedWorkout[]> {
  const model = "gemini-3.1-pro-preview";
  
  const availableExercises = splitType !== 'Padrão' && splitType !== 'Isolado'
    ? EXERCISE_LIBRARY
    : EXERCISE_LIBRARY.filter(ex => ex.muscle.toLowerCase() === muscleGroup.toLowerCase() || ex.type === 'Cardio');
  
  const availableExercisesNames = availableExercises.map(ex => ex.name);

  const prompt = `Você é a "Atheris Suprema", uma inteligência artificial mestre em musculação e performance.
  Sua missão é gerar um protocolo de treino "venenoso" (intenso e eficiente) estruturado para o período de 3 meses para o aluno ${studentName}.
  
  DIRETRIZES FUNDAMENTAIS (CRÍTICO):
  1. Base Científica: O treino DEVE ser baseado na literatura científica e na prática dos maiores profissionais de educação física.
  2. Ajuste Fisiológico pelo Objetivo (${goal}): 
     - "Secar" (Cutting): ajuste descanso, densidade e cardio para focar na queima de gordura e manutenção da massa magra.
     - "Crescer" (Bulking): priorize tensão mecânica e progressão de carga.
     - "Manter": equilíbrio, saúde e simetria.
  3. Status Fisiológico (${status}): 
     - Se "Natural": Estruture um treino que naturais REAIS conseguem fazer e recuperar. Menos volume inútil, altíssima intensidade relativa. Foco em movimentos compostos, progressão de carga e descanso adequado (o limite do natural é a recuperação). Utilize o melhor da ciência para naturais.
     - Se "Hormonizado": O aluno utiliza recursos ergogênicos (esteroides anabolizantes), tendo síntese proteica e recuperação amplificadas. Aumente o estresse metabólico, a fadiga, o número de séries e a densidade total para explorar o teto fisiológico elevado. Pode abusar mais de técnicas avançadas e sobrecarga muscular aguda.
     
  Parâmetros:
  - Foco / Grupo Muscular (se aplicável): ${muscleGroup}
  - Sexo Fisiológico: ${gender} 
  - Status Fisiológico (Natural/Hormonizado): ${status}
  - Metodologia / Divisão (CRÍTICO): ${splitType}
  - Dificuldade: ${difficulty}
  - Objetivo: ${goal}
  
  Exercícios disponíveis no sistema (USE APENAS ESTES NOMES):
  ${availableExercisesNames.join(', ')}
  
  ESTRUTURA DE SAÍDA:
  Como a divisão é "${splitType}", gere o número correto de treinos para esta metodologia em uma sequência lógica e contínua seguindo o padrão de nomenclatura "Treino A", "Treino B", "Treino C", etc.
  Por exemplo, se for "PPL", gere EXATAMENTE 3 treinos nas sequências corretas: "Treino A - Push (Peito, Ombro e Tríceps)", "Treino B - Pull (Costas e Bíceps)", e "Treino C - Legs (Pernas e Panturrilhas)", NESTA exata ordem.
  Se for "Upper/Lower", gere "Treino A - Superior" e "Treino B - Inferior".
  Se for "Padrão", gere apenas "Treino A - [Nome do Músculo]".
  
  CRÍTICO: O array retornado deve OBRIGATORIAMENTE vir na ordem cronológica (A primeiro, depois B, depois C, etc.).
  Para NENHUM DESSES treinos coloque "IA" ou palavras robóticas no título ("title"). O "title" DEVE seguir rigorosamente o padrão "Treino [Letra] - [Foco]".

  Instruções para os exercícios de cada treino:
  1. Escolha de 4 a 8 exercícios por treino.
  2. Defina "sets", "reps" e "weight" sugerido. Defina "restSeconds" baseado em fisiologia/ciência (ex: 90-120s para hipertrofia pesada).
  3. Preencha "instructions" com guia didático maduro (1. Posição, 2. Execução, 3. Respiração).
  4. Preencha "purpose" explicando aBiomecânica e relação com o objetivo de ${goal}.
  
  Retorne APENAS um array JSON válido contendo os treinos estruturados. Exemplo: 
  [ { "title": "Treino A - Push", "exercises": [ { "name": "...", "sets": 3, ... } ] }, ... ]`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.NUMBER },
                    reps: { type: Type.STRING },
                    weight: { type: Type.STRING },
                    restSeconds: { type: Type.NUMBER },
                    instructions: { type: Type.STRING },
                    purpose: { type: Type.STRING }
                  },
                  required: ["name", "sets", "reps", "weight", "restSeconds", "instructions"]
                }
              }
            },
            required: ["title", "exercises"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const program = JSON.parse(text);
    
    return program.map((workout: any) => ({
      title: workout.title,
      exercises: workout.exercises.map((ge: any) => {
        const match = availableExercises.find(a => a.name === ge.name);
        return {
          ...ge,
          muscleGroup: match?.muscle || muscleGroup
        };
      })
    }));
  } catch (error) {
    console.error("AI Generation Error:", error);
    return [];
  }
}

/**
 * Gera detalhes (propósito e instruções) para um exercício específico
 */
export async function generateWorkoutDetails(name: string, muscleGroup: string, difficulty: string): Promise<{ purpose: string, instructions: string }> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Você é o "Mestre Atheris", um grande professor de musculação e cientista do exercício.
  Sua tarefa é fornecer o detalhamento para o exercício: "${name}".
  Músculo Alvo: "${muscleGroup}". Dificuldade: "${difficulty}".
  
  REQUISITOS:
  1. Propósito (Bio-Insight Científico): Explique o objetivo biomecânico do exercício fundamentado na literatura científica (sem jargões incompreensíveis, mas preciso). Máximo 2 linhas.
  2. Instruções de Execução: Forneça um guia prático, direto e maduro (1. Posição, 2. Execução, 3. Respiração). Seja extremamente didático para iniciantes, porém mantenha um vocabulário sério e profissional focado em biomecânica básica e segurança (sem parecer infantil).
  
  Retorne APENAS um formato JSON válido (chaves "purpose" e "instructions").`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            purpose: { type: Type.STRING },
            instructions: { type: Type.STRING }
          },
          required: ["purpose", "instructions"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Details Error:", error);
    return { 
      purpose: "Focado no desenvolvimento e fortalecimento da musculatura alvo.", 
      instructions: "Execute o movimento com cadência controlada, focando na contração do músculo alvo." 
    };
  }
}

/**
 * Gera um conselho motivador baseado no progresso do usuário
 */
export async function getViperAdvice(user: User, checkins: CheckIn[]): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const latestWeight = checkins.length > 0 ? checkins[0].weightKg : (user.latestWeightKg || 0);
  const targetWeight = user.targetWeightKg || 0;
  const progress = latestWeight && targetWeight ? (latestWeight - targetWeight) : 0;

  const prompt = `Você é a "Atheris Suprema". Dê um conselho curto, impactante e com temática de serpente (venenoso, frio, focado, persistente) para o aluno ${user.name}.
  
  Contexto do Aluno:
  - Patente: ${getSnakeRank(user.points || 0).name}
  - Peso Atual: ${latestWeight}kg
  - Meta: ${targetWeight}kg
  - Diferença para a meta: ${progress.toFixed(1)}kg
  
  O conselho deve ter no máximo 2 frases. Use termos como "Trocar de pele", "Bote preciso", "Ninho", "Veneno", "Frio e Calculista".
  Não seja bonzinho, seja desafiador.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt
    });

    return response.text || "O silêncio da víbora é o prelúdio do bote. Continue caçando.";
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Sua pele ainda é frágil. Treine até que ela se torne escamas de aço.";
  }
}

/**
 * Gera insights para o período de descanso (Clima, Notícias, Bio-Dicas)
 */
export async function getRestInsights(city: string, rawWeatherData?: string): Promise<{ weather: string, news: string, bioTip: string }> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Você é a "Atheris Suprema". O aluno iniciou o período de descanso.
  Forneça um relatório rápido de "Intel de Campo" em Português.
  
  CIDADE: ${city}
  DADOS REAIS DE CLIMA (MSN): ${rawWeatherData || "Não disponível"}
  
  REQUISITOS:
  1. Weather: RESUMA o clima atual em ${city} de forma exata e brutalista em uma frase curta (máximo 40 caracteres). Ex: "19°C | Sensação 21°C | Chuva Fraca".
  2. News: Uma notícia REAL, ATUAL de 2026 (hoje) do mundo da musculação/bodybuilding (máximo 12 palavras). PROIBIDO falar sobre IA. Foque em Arnold Classic 2026, Olympia 2026 ou novos recordes.
  3. BioTip: Uma dica técnica ultra-curta de fisiologia para o treino.
  
  Retorne APENAS JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weather: { type: Type.STRING },
            news: { type: Type.STRING },
            bioTip: { type: Type.STRING }
          },
          required: ["weather", "news", "bioTip"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Rest Insights Error:", error);
    return {
      weather: "Clima hostil em São José dos Campos. Mantenha-se hidratado.",
      news: "Estudos sugerem que o descanso intra-set de 90s otimiza a ressíntese de fosfocreatina.",
      bioTip: "Mantenha a tensão mecânica constante; não relaxe no topo do movimento."
    };
  }
}

// Helper local para evitar dependência circular de tipos se necessário, 
// mas importamos de ranks.ts no App, vamos duplicar a lógica simples ou importar se possível.
function getSnakeRank(points: number) {
  if (points >= 12000) return { name: 'Atheris Suprema' };
  if (points >= 9000) return { name: 'Taipan' };
  if (points >= 7000) return { name: 'Mamba Negra' };
  if (points >= 5000) return { name: 'Naja Real' };
  if (points >= 3500) return { name: 'Bungarus' };
  if (points >= 2000) return { name: 'Surucucu' };
  if (points >= 500) return { name: 'Cascavel' };
  return { name: 'Jararaca' };
}
