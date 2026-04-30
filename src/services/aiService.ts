import { GoogleGenAI, Type } from "@google/genai";
import { EXERCISE_LIBRARY } from "../exerciseLibrary";
import { User, CheckIn, Exercise } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Gera um treino personalizado baseado em parâmetros
 */
export async function generateWorkout(muscleGroup: string, difficulty: string, goal: string, studentName: string = 'Víbora'): Promise<Partial<Exercise>[]> {
  const model = "gemini-3.1-pro-preview"; // Using a valid model name for complex tasks
  
  const availableExercises = EXERCISE_LIBRARY.filter(ex => ex.muscle.toLowerCase() === muscleGroup.toLowerCase() || ex.type === 'Cardio');
  const availableExercisesNames = availableExercises.map(ex => ex.name);

  const prompt = `Você é a "Atheris Suprema", uma inteligência artificial mestre em musculação e performance.
  Sua missão é gerar um protocolo de treino "venenoso" (intenso e eficiente) para o aluno ${studentName}.
  
  Parâmetros:
  - Grupo Muscular: ${muscleGroup}
  - Dificuldade: ${difficulty}
  - Objetivo: ${goal}
  
  Exercícios disponíveis no nosso sistema (USE APENAS ESTES NOMES):
  ${availableExercisesNames.join(', ')}
  
  Instruções:
  1. Retorne entre 4 a 6 exercícios.
  2. Para cada exercício, defina séries (sets), repetições (reps), peso sugerido (weight) e tempo de descanso (restSeconds).
  3. Adicione uma "instrução secreta" ou dica de execução curta e motivadora no estilo Atheris (brutalista, focado).
  
  Retorne APENAS um array JSON válido.`;

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
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const generatedExs = JSON.parse(text);
    
    // Inject correct muscle group from library if possible
    return generatedExs.map((ge: any) => {
      const match = availableExercises.find(a => a.name === ge.name);
      return {
        ...ge,
        muscleGroup: match?.muscle || muscleGroup
      };
    });
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
  
  const prompt = `Você é o "Mestre Atheris", um especialista em biomecânica e fisiologia do exercício de elite. 
  Sua tarefa é fornecer o detalhamento técnico para o exercício: "${name}".
  Músculo Alvo: "${muscleGroup}". Dificuldade: "${difficulty}".
  
  REQUISITOS:
  1. Propósito (Bio-Lógica): Explique a fundamentação biomecânica baseada em artigos científicos recentes (ex: foco na fase excêntrica, braço de momento, tensão mecânica). Máximo 2 linhas.
  2. Instruções de Ataque: Passo a passo técnico, direto, focando na segurança e máxima ativação neuromuscular (Mind-Muscle Connection).
  
  O tom deve ser técnico, brutalista e autoritário. Sem elogios.
  
  Retorne em formato JSON.`;

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

    return response.text || "O silência da víbora é o prelúdio do bote. Continue caçando.";
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Sua pele ainda é frágil. Treine até que ela se torne escamas de aço.";
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
