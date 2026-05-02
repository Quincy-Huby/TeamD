import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import {
  RotateCcw,
  ChevronLeft,
  CheckCircle2,
  Info,
  Dumbbell,
  Save,
  Scale,
  Search,
  Filter,
  Plus,
  Trash2,
  Image as ImageIcon,
  TrendingUp,
  Zap,
  Frown,
  Meh,
  Smile,
  SmilePlus,
  Ruler,
  Calendar,
  Lock,
  Megaphone,
  Send,
  Sparkles,
  Activity,
  Timer,
  Newspaper,
  Target,
  Brain,
} from "lucide-react";
import { User, Workout, Exercise, CheckIn } from "../types";
import { EXERCISE_LIBRARY, LibraryExercise } from "../exerciseLibrary";
import { gymJokes, mockWorkouts } from "../mockData";
import { classNames } from "../lib/utils";
import { getSnakeRank } from "../lib/ranks";
import {
  db,
  serverTimestamp,
  setDoc,
  addDoc,
  collection,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  deleteDoc,
} from "../firebase";
import * as aiService from "../services/aiService";

export const getDidacticInstruction = (instruction?: string, muscle?: string) => {
  if (!instruction) return "";
  
  if (instruction.includes("Posição:") || /^\d+\./.test(instruction) || instruction.includes("1. ")) {
    return instruction;
  }
  
  const isGeneric = instruction.includes("Execute o movimento com cadência controlada");
  
  if (!isGeneric) {
    return `1. Posição:\nMantenha a postura estabilizada no equipamento ou peso livre.\n\n2. Execução:\n${instruction}\n\n3. Respiração:\nExpire na fase de maior esforço. Inspire no retorno controlado.`;
  }

  const mg = muscle?.toLowerCase() || '';
  if (mg.includes('peito')) return "1. Posição:\nEstabilize as escápulas no banco e mantenha o peito estufado.\n\n2. Execução:\nRealize o movimento de empurrar com a máxima amplitude confortável. Controle a descida resistindo ao peso.\n\n3. Respiração:\nExpire ao empurrar a carga. Inspire ao controlar o retorno.";
  if (mg.includes('costas') || mg.includes('dorsal')) return "1. Posição:\nMantenha o peito aberto e o core estabilizado.\n\n2. Execução:\nInicie a puxada pelas escápulas e direcione os cotovelos para trás e para baixo. Controle a volta prolongando a tensão do músculo.\n\n3. Respiração:\nExpire ao puxar a carga. Inspire ao alongar a musculatura.";
  if (mg.includes('perna') || mg.includes('quadríceps') || mg.includes('glúteo') || mg.includes('posterior')) return "1. Posição:\nPés firmemente apoiados, abdômen contraído e coluna preservando a curvatura natural.\n\n2. Execução:\nDesça de forma controlada garantindo o alinhamento dos joelhos. Contraia a musculatura intencionalmente na fase de subida/empurrada.\n\n3. Respiração:\nExpire na fase de maior esforço (subida). Inspire durante a descida.";
  if (mg.includes('ombro') || mg.includes('deltoide')) return "1. Posição:\nMantenha o tronco firme e os ombros deprimidos (evitando tensionar o pescoço).\n\n2. Execução:\nEleve a carga sob controle rigoroso, estendendo a amplitude sem perder a estabilidade. Retorne freando a gravidade.\n\n3. Respiração:\nExpire ao elevar a carga. Inspire ao retornar à base.";
  if (mg.includes('braço') || mg.includes('bíc') || mg.includes('tríc') || mg.includes('bíceps') || mg.includes('tríceps')) return "1. Posição:\nTrave os cotovelos adjacentes ao tronco, isolando completamente o braço.\n\n2. Execução:\nFaça o movimento de contração até o pico (espremendo) e alongue o braço resistindo ativamente a descida. Não use impulso corporal.\n\n3. Respiração:\nExpire durante a contração extrema. Inspire na extensão.";
  
  return "1. Posição:\nEstabilize as articulações e contraia o core antes de alavancar o peso.\n\n2. Execução:\nProcesse o movimento com cadência deliberada (aprox. 3s na descida). Concentre o esforço unicamente no músculo alvo.\n\n3. Respiração:\nExpire no ápice do esforço (fase concêntrica). Inspire no momento de retorno (fase excêntrica).";
};

// Helper for Timer
export const TimerBar = React.memo(
  ({
    activeRestState,
    timeLeft,
    onComplete,
  }: {
    activeRestState: { secs: number; id: number } | null;
    timeLeft: number;
    onComplete: () => void;
  }) => {
    const [joke, setJoke] = useState("");

    useEffect(() => {
      if (activeRestState) {
        setJoke(gymJokes[Math.floor(Math.random() * gymJokes.length)]);
      }
    }, [activeRestState]);

    if (!activeRestState || timeLeft <= 0) return null;

    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="sticky top-[73px] z-30 glass border-l-4 border-l-[#00ff66] p-4 font-bold overflow-hidden shadow-xl mx-4 mt-2 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="mono uppercase tracking-widest text-[#00ff66] opacity-60 flex items-center gap-2">
            <RotateCcw size={14} /> Descanso Ativo
          </span>
          <span className="text-2xl font-black accent-text">{timeLeft}s</span>
        </div>
        <div className="w-full h-1 bg-atheris-text/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / activeRestState.secs) * 100}%` }}
            transition={{ duration: 1 }}
            className="h-full accent-bg"
          ></motion.div>
        </div>
        <p className="text-[10px] font-medium italic opacity-80 mt-3 text-center">
          "{joke}"
        </p>
      </motion.div>
    );
  },
);

export const ExerciseInfoModal = React.memo(
  ({ ex, onClose }: { ex: Exercise; onClose: () => void }) => {
    const libMatch = EXERCISE_LIBRARY.find((l) => l.name === ex.name);
    const [aiPurpose, setAiPurpose] = useState("");
    const [aiInstructions, setAiInstructions] = useState("");
    const [loadingAi, setLoadingAi] = useState(false);

    // Migration logic: Fallback to the rich library text se o exercício salvo tem texto vazio ou genérico
    const legacyP1 =
      "Focado no desenvolvimento e fortalecimento da musculatura alvo.";
    const legacyP2 = `Trabalhar o músculo ${ex.muscleGroup || ""} para ganho de força e definição.`;
    const legacyP3 = `O foco desse exercício é trabalhar a área do ${ex.muscleGroup || ""} para ganho de força e definição.`;
    const legacyP4 = `O foco desse exercício é trabalhar a área do ${ex.muscleGroup || "músculo"} para ganho de força e definição.`;
    const legacyP5 = `Músculo Primário Trabalhado:`; // Catch earlier multi-line anatomical legacy texts

    const isLegacyPurpose =
      !ex.purpose ||
      ex.purpose === legacyP1 ||
      ex.purpose === legacyP2 ||
      ex.purpose === legacyP3 ||
      ex.purpose === legacyP4 ||
      ex.purpose.startsWith(legacyP5);

    const displayPurpose =
      aiPurpose ||
      (isLegacyPurpose && libMatch?.purpose
        ? libMatch.purpose
        : ex.purpose || legacyP4);

    const legacyI1 =
      "Execute o movimento com cadência controlada, focando na contração do músculo alvo e mantendo a postura preservada.";
    const legacyI2 =
      "Execute o movimento com cadência controlada, focando na contração do músculo alvo e mantendo a postura preservada. Caso sinta desconforto articular, ajuste a carga ou a amplitude.";

    const defaultDidactic = 
      "1. Posição: Ajuste sua postura para ficar confortável e firme.\n2. Execução: Faça o movimento devagar. Sinta o músculo.\n3. Respiração: Solte o ar quando fizer força. Puxe o ar na volta.";

    const isLegacyInstruction =
      !ex.instructions ||
      ex.instructions === legacyI1 ||
      ex.instructions === legacyI2 ||
      ex.instructions === defaultDidactic;
      
    const displayInstruction =
      aiInstructions ||
      (isLegacyInstruction && libMatch?.instructions
        ? libMatch.instructions
        : ex.instructions && ex.instructions !== legacyI1 && ex.instructions !== legacyI2 ? ex.instructions : defaultDidactic);

    const isGenericPurpose =
      !aiPurpose && isLegacyPurpose && !libMatch?.purpose;
    const isGenericInstruction =
      !aiInstructions && isLegacyInstruction && !libMatch?.instructions;
    const isCompletelyGeneric = isGenericPurpose && isGenericInstruction;

    const handleGenerateAI = async () => {
      setLoadingAi(true);
      try {
        const data = await aiService.generateWorkoutDetails(
          ex.name,
          ex.muscleGroup || "",
          ex.difficulty,
        );
        if (data.purpose) setAiPurpose(data.purpose);
        if (data.instructions) setAiInstructions(data.instructions);
      } catch (e) {
        console.error(e);
        alert("Falha ao gerar inteligência.");
      } finally {
        setLoadingAi(false);
      }
    };

    return (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-x-0 bottom-0 z-[100] glass border-b-0 rounded-t-3xl flex flex-col max-h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] pb-safe"
        >
          <div className="p-2 flex justify-center">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="p-4 flex-1 overflow-y-auto pb-10">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-atheris-text leading-tight">
                {ex.name}
              </h3>
              <button
                onClick={onClose}
                className="p-2 -mr-2 bg-white/5 rounded-full flex-shrink-0"
              >
                <ChevronLeft size={20} className="rotate-[-90deg]" />
              </button>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="px-2 py-1 text-[9px] tracking-widest font-bold flex items-center gap-1 rounded bg-[#00ff66]/10 text-[#00ff66] mono uppercase border border-[#00ff66]/20">
                <span className="opacity-50">ALVO:</span> {ex.muscleGroup}
              </span>
              <span
                className={classNames(
                  "px-2 py-1 text-[9px] tracking-widest font-bold rounded mono uppercase border border-white/5",
                  ex.difficulty === "Jararaca"
                    ? "bg-[#00ff66]/20 text-[#00ff66]"
                    : ex.difficulty === "Naja Real"
                      ? "bg-red-500/20 text-red-500"
                      : "bg-amber-500/20 text-amber-500",
                )}
              >
                {ex.difficulty}
              </span>
            </div>

            <>
              {displayPurpose && !isGenericPurpose && (
                <div className="mb-4 bg-atheris-text/5 p-4 rounded-2xl border border-white/5">
                  <h4 className="mono opacity-60 uppercase mb-2 flex items-center gap-2">
                    <CheckCircle2 size={12} /> Propósito
                  </h4>
                  <p className="text-sm leading-relaxed text-atheris-text/90 whitespace-pre-line">
                    {displayPurpose}
                  </p>
                </div>
              )}

              <div className="mb-6 bg-atheris-text/5 p-4 rounded-2xl border border-white/5 relative">
                <div className="w-full text-left p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/10 mb-4 relative overflow-hidden shadow-lg shadow-black/20 mt-4">
                  <div className="absolute top-0 left-0 w-1 h-full bg-atheris-accent/50" />
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <Target size={12} className="text-white/60" />
                    </div>
                    <span className="mono text-[10px] font-black uppercase tracking-widest text-white/50">
                      Como Fazer
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 pl-1">
                    {getDidacticInstruction(displayInstruction, ex.muscleGroup || libMatch?.muscle)
                    .split('\n').filter(Boolean).map((line, i) => {
                      const isSubtitle = line.match(/^\d+\./);
                      return (
                        <p key={i} className={`font-mono text-white/80 leading-relaxed pr-2 ${isSubtitle ? 'text-[11px] font-black text-atheris-accent/80 mt-1' : 'text-[10px]'}`}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleGenerateAI}
                  disabled={loadingAi}
                  className={classNames(
                    "w-full py-3 px-4 rounded-xl border border-atheris-accent/30 bg-atheris-accent/10 text-atheris-accent font-bold text-[10px] mono uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-atheris-accent/20 transition-all disabled:opacity-50",
                    "mt-4"
                  )}
                >
                  {loadingAi ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-atheris-accent border-t-transparent animate-spin"></span>
                      Analisando Movimento...
                    </span>
                  ) : (
                    <>
                      <Sparkles size={14} /> Inteligência: Gerar Detalhes
                    </>
                  )}
                </button>
              </div>
            </>
          </div>
        </motion.div>
      </>
    );
  },
);

export const ExecuteWorkoutModal = React.memo(
  ({
    workout,
    currentUser,
    onClose,
    onFinish,
  }: {
    workout: Workout;
    currentUser: User;
    onClose: () => void;
    onFinish: (w: Workout) => void;
  }) => {
    const [activeRestState, setActiveRestState] = useState<{
      secs: number;
      id: number;
    } | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [restInsights, setRestInsights] = useState<{
      weather: string;
      news: string;
      bioTip: string;
    } | null>(null);
    const [completedSets, setCompletedSets] = useState<Record<string, number>>(
      {},
    );

    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (activeRestState) {
        setTimeLeft(activeRestState.secs);

        // Fetch innovative insights for rest with real-time weather data
        const weatherData = "19°C. Sensação térmica 21°C. Expectativa de chuva fraca e dispersa. Umidade 95%. Vento 4 km/h.";
        import("../services/aiService").then((service) => {
          service
            .getRestInsights("São José dos Campos", weatherData)
            .then(setRestInsights);
        });

        interval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setActiveRestState(null);
              // Play beep sound
              try {
                const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"+Array(50).join("zPzM")+"=="); // simplified short beep
                audio.play().catch(()=>{});
              } catch (e) {}
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setTimeLeft(0);
        setRestInsights(null);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [activeRestState]);

    const [setHistory, setSetHistory] = useState<
      Record<string, { weight: string; reps: string }[]>
    >({});
    
    const handleCompleteSet = useCallback(
      (
        ex: Exercise,
        currentSetsDone: number,
        currentWeight: string = "",
        currentReps: string = "",
      ) => {
        const nextSets = currentSetsDone + 1;
        setCompletedSets((prev) => ({
          ...prev,
          [ex.id]: nextSets,
        }));
        
        setSetHistory((prev) => {
          const exHistory = prev[ex.id] || [];
          return {
            ...prev,
            [ex.id]: [...exHistory, { weight: currentWeight, reps: currentReps }],
          };
        });

        if (ex.restSeconds > 0 && nextSets < ex.sets) {
          setActiveRestState({
            secs: ex.restSeconds,
            id: Date.now(),
          });
        }
      },
      [],
    );
    const [weightsUsed, setWeightsUsed] = useState<Record<string, string>>({});
    const [repsUsed, setRepsUsed] = useState<Record<string, string>>({});
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
      null,
    );
    const [finishing, setFinishing] = useState(false);
    const [rpe, setRpe] = useState<number>(7);
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [startTime] = useState<number>(Date.now());
    const [focusMode, setFocusMode] = useState(false);
    const [currentExIndex, setCurrentExIndex] = useState(0);

    const currentEx = workout.exercises[currentExIndex];
    const setsDone = completedSets[currentEx?.id] || 0;
    const isExCompleted = setsDone >= (currentEx?.sets || 0);

    // Iniciar state de pesagem
    useEffect(() => {
      if (currentUser.exerciseWeights) {
        const initialWeights: Record<string, string> = {};
        workout.exercises.forEach((ex) => {
          if (currentUser.exerciseWeights![ex.name]) {
            initialWeights[ex.id] = currentUser.exerciseWeights![ex.name];
          }
        });
        setWeightsUsed(initialWeights);
      }
    }, [currentUser, workout]);

    const allExercisesCompleted = useMemo(() => {
      return workout.exercises.every(
        (ex) => (completedSets[ex.id] || 0) >= ex.sets,
      );
    }, [completedSets, workout.exercises]);

    const handleFinish = async () => {
      if (!finishing) {
        if (!allExercisesCompleted) return;
        setFinishing(true);
        return;
      }
      setSaving(true);
      try {
        const isQuickHit = workout.authorId === workout.studentId;
        const isChallenge = workout.type === "challenge";
        const pointsEarned = isChallenge
          ? workout.points || 25
          : isQuickHit
            ? 5
            : 100;

        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        await addDoc(collection(db, "sessions"), {
          studentId: currentUser.id,
          coachId: currentUser.coachId || "",
          workoutId: workout.id,
          durationSeconds,
          rpe,
          notes,
          weights: weightsUsed,
          reps: repsUsed,
          setHistory,
          createdAt: serverTimestamp(),
        });

        // Update user weights
        const newExerciseWeights = { ...(currentUser.exerciseWeights || {}) };
        let madeChanges = false;
        workout.exercises.forEach((ex) => {
          if (weightsUsed[ex.id]) {
            newExerciseWeights[ex.name] = weightsUsed[ex.id];
            madeChanges = true;
          }
        });

        const updates: any = { points: currentUser.points + pointsEarned };
        if (madeChanges) {
          updates.exerciseWeights = newExerciseWeights;
        }

        if (notes) {
          await addDoc(collection(db, "messages"), {
            senderId: currentUser.id,
            senderName: currentUser.name,
            receiverId: currentUser.coachId || "coach_daniel",
            content: notes,
            type: "report",
            metadata: {
              workoutTitle: workout.title,
              rpe,
              weights: weightsUsed,
            },
            createdAt: serverTimestamp(),
          });
        }

        await updateDoc(doc(db, "workouts", workout.id), {
          completed: true,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "users", currentUser.id), updates);
        onFinish(workout);
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar bote.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <>
        <div
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[90] bg-atheris-bg flex flex-col overflow-hidden"
        >
          <header className="sticky top-0 z-40 bg-atheris-bg/90 backdrop-blur-2xl border-b border-atheris-border px-4 pt-12 pb-4 flex items-center gap-3 shadow-sm">
            <button
              onClick={onClose}
              disabled={saving}
              className="p-2 -ml-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate text-atheris-text leading-tight">
                {workout.title}
              </h2>
              <p className="text-[10px] mono text-atheris-accent uppercase tracking-[0.2em] opacity-60">
                Protocolo de Ataque
              </p>
            </div>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={classNames(
                "p-2 px-3 rounded-xl border mono text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                focusMode
                  ? "bg-atheris-accent text-black border-transparent shadow-[0_0_15px_rgba(0,255,102,0.3)]"
                  : "bg-white/5 text-white/40 border-white/10",
              )}
            >
              <Zap size={14} className={focusMode ? "fill-black" : ""} />{" "}
              {focusMode ? "Focus On" : "Focus"}
            </button>
          </header>

          {!finishing ? (
            <>
              {!focusMode && (
                <TimerBar
                  activeRestState={activeRestState}
                  timeLeft={timeLeft}
                  onComplete={() => setActiveRestState(null)}
                />
              )}

              {focusMode ? (
                <div className="flex-1 relative flex flex-col overflow-hidden">
                  {activeRestState && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[60] bg-atheris-bg/95 backdrop-blur-3xl flex flex-col items-center justify-between p-8 text-center overflow-y-auto scrollbar-hide py-16"
                    >
                      <div className="w-full max-w-sm flex flex-col items-center gap-12">
                        {/* Upper Section: Stats/Clima */}
                        <div className="w-full flex justify-between items-start">
                          <div className="text-left">
                            <span className="mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-1">
                              Clima: SJC/SP
                            </span>
                            <p className="text-[10px] font-black text-atheris-accent uppercase tracking-tighter">
                              {restInsights?.weather || "Sincronizando..."}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="mono text-[8px] uppercase tracking-[0.3em] text-white/30 block mb-1">
                              Status
                            </span>
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                              Oxigenação Crítica
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <motion.div
                            animate={{
                              scale: [1, 1.05, 1],
                              borderColor: [
                                "rgba(0,255,102,0.1)",
                                "rgba(0,255,102,0.4)",
                                "rgba(0,255,102,0.1)",
                              ],
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="w-48 h-48 rounded-full border-2 flex flex-col items-center justify-center bg-atheris-accent/5 relative z-10"
                          >
                            <Timer
                              size={24}
                              className="text-atheris-accent mb-1 animate-pulse"
                            />
                            <span className="text-7xl font-black text-atheris-accent tabular-nums leading-none">
                              {timeLeft}
                            </span>
                            <span className="mono text-[8px] uppercase tracking-[0.4em] text-atheris-accent opacity-50 mt-2">
                              Segundos
                            </span>
                          </motion.div>

                          {/* Decorative Rings */}
                          <div className="absolute inset-[-10px] border border-white/5 rounded-full" />
                          <div className="absolute inset-[-20px] border border-white/3 rounded-full" />
                        </div>

                        {/* Innovative Content: News & BioTip */}
                        <div className="w-full space-y-6">
                          <div className="w-full text-left p-5 glass rounded-[1.5rem] border border-white/5 bg-white/2 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Sparkles size={40} />
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <Newspaper size={12} className="text-atheris-accent" />
                              <span className="mono text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                                Global Muscle Intel
                              </span>
                            </div>
                            <p className="text-[11px] text-white leading-relaxed font-medium">
                              {restInsights?.news || "Carregando fluxo de notícias mundiais..."}
                            </p>
                          </div>

                          <div className="w-full text-left p-5 glass rounded-[1.5rem] border border-atheris-accent/10 bg-atheris-accent/5">
                            <div className="flex items-center gap-2 mb-3">
                              <Activity size={12} className="text-atheris-accent" />
                              <span className="mono text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                                Bio-Scanner Técnico
                              </span>
                            </div>
                            <p className="text-[11px] text-white/70 italic leading-relaxed">
                              "{restInsights?.bioTip || "Analisando padrões de recrutamento..."}"
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveRestState(null)}
                        className="mt-8 py-3 px-10 rounded-full border border-white/10 mono text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white hover:border-white/30 transition-all active:scale-95"
                      >
                        Encerrar Descanso Forçado
                      </button>
                    </motion.div>
                  )}
                  <div className="flex-1 overflow-y-auto scrollbar-hide p-6 pb-80">
                    <div className="min-h-full flex flex-col justify-center items-center text-center">
                      <motion.div
                        key={currentEx?.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full py-4 text-center"
                      >
                        <span className="mono text-[10px] uppercase font-black tracking-[0.3em] text-atheris-accent mb-2 block">
                          Movimento {currentExIndex + 1}/
                          {workout.exercises.length}
                        </span>
                        <h3
                          className={classNames(
                            "font-black text-white mb-2 leading-none uppercase tracking-tighter transition-all",
                            (currentEx?.name?.length || 0) > 18
                              ? "text-2xl"
                              : "text-4xl",
                          )}
                        >
                          {currentEx?.name}
                        </h3>
                        <p className="text-[10px] mono opacity-40 uppercase mb-8 tracking-[0.2em]">
                          {currentEx?.muscleGroup}
                        </p>

                        {/* Visual Set Tracker */}
                        <div className="flex justify-center gap-1.5 mb-8 px-8 max-w-xs mx-auto">
                          {Array.from({ length: currentEx?.sets || 0 }).map(
                            (_, i) => (
                              <div
                                key={`focus-set-${i}`}
                                className={classNames(
                                  "h-1 flex-1 rounded-full transition-all duration-500",
                                  i < setsDone
                                    ? "bg-atheris-accent shadow-[0_0_10px_rgba(0,255,102,0.5)]"
                                    : "bg-white/10",
                                )}
                              />
                            ),
                          )}
                        </div>

                        {/* Recorded Sets Log */}
                        {(setHistory[currentEx?.id || ""]?.length > 0) && (
                          <div className="w-full flex flex-col gap-2 mb-8 px-4">
                            <AnimatePresence>
                              {setHistory[currentEx?.id || ""].map((record, index) => (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                  exit={{ opacity: 0, height: 0 }}
                                  key={`history-${index}`} 
                                  className="flex justify-between items-center text-xs p-3 rounded-xl bg-white/5 border border-white/10 text-white/80"
                                >
                                  <span className="mono opacity-60 font-bold tracking-widest uppercase">Série {index + 1}</span>
                                  <div className="flex gap-4 font-black">
                                    <span><span className="opacity-40 font-normal">Carga:</span> {record.weight || '-'} kg</span>
                                    <span><span className="opacity-40 font-normal">Reps:</span> {record.reps || '-'}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}

                        <div className="flex justify-center gap-12 mb-8 tabular-nums">
                          <div className="flex flex-col items-center">
                            <div className="text-4xl font-black text-white">
                              {setsDone}
                              <span className="opacity-20 text-2xl">/</span>
                              {currentEx?.sets || 0}
                            </div>
                            <span className="mono text-[8px] uppercase opacity-40 tracking-widest mt-1">
                              Séries
                            </span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-2">
                              <div className="text-4xl font-black text-white">
                                {currentEx?.reps}
                              </div>
                              <span className="opacity-20 text-xl font-black">
                                /
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={repsUsed[currentEx?.id || ""] || ""}
                                onChange={(e) =>
                                  setRepsUsed({
                                    ...repsUsed,
                                    [currentEx?.id || ""]: e.target.value.replace(/[^0-9]/g, ""),
                                  })
                                }
                                className="w-12 bg-white/5 border-b border-white/20 text-atheris-accent text-3xl font-black text-center focus:outline-none focus:border-atheris-accent transition-colors rounded"
                              />
                            </div>
                            <span className="mono text-[8px] uppercase opacity-40 tracking-widest mt-1">
                              Reps (Meta/Real)
                            </span>
                          </div>
                        </div>

                        <div className="w-full glass p-6 rounded-[2rem] border border-white/5 mb-6 relative bg-white/2">
                          <div className="flex flex-col items-center">
                            <span className="mono text-[9px] font-black uppercase opacity-40 mb-3 tracking-[0.2em]">
                              Carga Atual (KG)
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={weightsUsed[currentEx?.id || ""] || ""}
                              onChange={(e) =>
                                setWeightsUsed({
                                  ...weightsUsed,
                                  [currentEx?.id || ""]: e.target.value,
                                })
                              }
                              className="bg-transparent text-5xl font-black text-center text-white focus:outline-none w-full placeholder:text-white/10"
                              placeholder={currentEx?.weight || "0"}
                            />
                          </div>
                        </div>

                        <div className="w-full text-left p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/10 mb-4 relative overflow-hidden shadow-lg shadow-black/20">
                          <div className="absolute top-0 left-0 w-1 h-full bg-atheris-accent/50" />
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                              <Target size={12} className="text-white/60" />
                            </div>
                            <span className="mono text-[10px] font-black uppercase tracking-widest text-white/50">
                              Como Fazer
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 pl-1">
                            {getDidacticInstruction(currentEx?.instructions, currentEx?.muscleGroup)
                            .split('\n').filter(Boolean).map((line, i) => {
                              const isSubtitle = line.match(/^\d+\./);
                              return (
                                <p key={i} className={`font-mono text-white/80 leading-relaxed pr-2 ${isSubtitle ? 'text-[11px] font-black text-atheris-accent/80 mt-1' : 'text-[10px]'}`}>
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                        </div>

                        {currentEx?.purpose && (
                          <div className="w-full text-left p-6 glass rounded-[2rem] border-l-2 border-atheris-accent/50 mb-10 bg-white/1">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity
                                size={12}
                                className="text-atheris-accent"
                              />
                              <span className="mono text-[9px] font-black uppercase tracking-widest opacity-60">
                                Bio-Insight Científico
                              </span>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed italic pr-2">
                              "{currentEx.purpose}"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-4 pb-8 bg-gradient-to-t from-atheris-bg via-atheris-bg to-transparent z-50">
                    <div className="max-w-2xl mx-auto flex flex-col gap-3">
                      <button
                        disabled={isExCompleted || activeRestState !== null}
                        onClick={() =>
                          handleCompleteSet(
                            currentEx,
                            setsDone,
                            weightsUsed[currentEx?.id || ""] || String(currentEx?.weight || 0),
                            repsUsed[currentEx?.id || ""] || String(currentEx?.reps || 0),
                          )
                        }
                        className={classNames(
                          "w-full py-5 rounded-[1.5rem] font-black text-base uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                          isExCompleted
                            ? "bg-white/10 text-white/20 border border-white/5"
                            : "accent-bg text-black shadow-[0_15px_40px_rgba(0,255,102,0.3)] active:scale-[0.98]",
                        )}
                      >
                        {isExCompleted ? (
                          <CheckCircle2 size={24} />
                        ) : (
                          <Zap size={22} className="fill-current" />
                        )}
                        {isExCompleted
                          ? "CONCLUÍDO"
                          : `COMPLETAR SÉRIE ${setsDone + 1}`}
                      </button>

                      <div className="flex gap-4">
                        <button
                          onClick={() =>
                            setCurrentExIndex((prev) => Math.max(0, prev - 1))
                          }
                          disabled={currentExIndex === 0}
                          className="flex-1 py-4 glass rounded-2xl mono text-[10px] font-black uppercase tracking-widest disabled:opacity-20"
                        >
                          Anterior
                        </button>
                        {currentExIndex < workout.exercises.length - 1 ? (
                          <button
                            onClick={() =>
                              setCurrentExIndex((prev) => prev + 1)
                            }
                            className="flex-1 py-4 glass rounded-2xl mono text-[10px] font-black uppercase tracking-widest border border-white/10"
                          >
                            Próximo
                          </button>
                        ) : (
                          <button
                            onClick={handleFinish}
                            disabled={!allExercisesCompleted}
                            className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl mono text-[10px] font-black uppercase tracking-widest"
                          >
                            Finalizar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 pb-32 scrollbar-hide">
                  {workout.exercises.map((ex, index) => (
                    <div
                      key={`${ex.id}-${index}`}
                      className="glass p-4 rounded-2xl mb-4 relative overflow-hidden group"
                    >
                      {(completedSets[ex.id] || 0) >= ex.sets && (
                        <div className="absolute top-0 right-0 w-12 h-12 bg-atheris-accent/10 flex items-center justify-center rounded-bl-3xl border-l border-b border-atheris-accent/20">
                          <CheckCircle2
                            size={16}
                            className="text-atheris-accent"
                          />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <h3 className="font-bold text-base flex-1 pr-10">
                            {ex.name}
                          </h3>
                          <span className="text-[10px] mono opacity-80 uppercase text-[#00ff66] tracking-tighter mt-1">
                            MÚSCULO ALVO: {ex.muscleGroup}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedExercise(ex)}
                            className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center hover:bg-white/20 transition-colors"
                          >
                            <Info size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-5">
                        <div className="bg-atheris-text/5 rounded-lg p-2 text-center">
                          <span className="mono opacity-50 block mb-1 font-bold text-[8px] uppercase tracking-widest">
                            Séries
                          </span>
                          <span className="font-bold text-atheris-text">
                            {ex.sets}
                          </span>
                        </div>
                        <div className="bg-atheris-text/5 rounded-lg p-2 text-center">
                          <span className="mono opacity-50 block mb-1 font-bold text-[8px] uppercase tracking-widest">
                            Reps
                          </span>
                          <span className="font-bold text-atheris-text">
                            {ex.reps}
                          </span>
                        </div>
                        <div className="bg-atheris-text/5 rounded-lg p-2 text-center col-span-2 mt-2 mb-2 flex gap-2">
                          <div className="flex-1 border border-white/5 relative group-hover:border-atheris-accent/30 transition-colors p-2 rounded-lg">
                            <span className="mono opacity-50 block mb-1 font-bold text-[9px] uppercase tracking-[0.2em] text-atheris-accent">
                              <TrendingUp size={10} className="inline mr-1" />{" "}
                              Carga de Ataque (kg/lbs)
                            </span>
                            <input
                              type="text"
                              placeholder={ex.weight}
                              value={weightsUsed[ex.id] || ""}
                              onChange={(e) =>
                                setWeightsUsed({
                                  ...weightsUsed,
                                  [ex.id]: e.target.value,
                                })
                              }
                              className="w-full bg-transparent text-center font-black text-xl text-white focus:outline-none placeholder:text-white/20"
                            />
                            {currentUser.exerciseWeights?.[ex.name] && (
                              <div className="absolute right-2 top-2 p-1 px-2 rounded bg-atheris-accent/10 border border-atheris-accent/20 text-[7px] mono text-atheris-accent">
                                Última: {currentUser.exerciseWeights[ex.name]}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 border border-white/5 relative group-hover:border-atheris-accent/30 transition-colors p-2 rounded-lg">
                            <span className="mono opacity-50 block mb-1 font-bold text-[9px] uppercase tracking-[0.2em] text-atheris-accent">
                              Reps Feitas
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder={ex.reps}
                              value={repsUsed[ex.id] || ""}
                              onChange={(e) =>
                                setRepsUsed({
                                  ...repsUsed,
                                  [ex.id]: e.target.value.replace(/[^0-9]/g, ""),
                                })
                              }
                              className="w-full bg-transparent text-center font-black text-xl text-white focus:outline-none placeholder:text-white/20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Recorded Sets Log for Normal Mode */}
                      {(setHistory[ex.id]?.length > 0) && (
                        <div className="w-full flex flex-col gap-2 mb-6 px-1">
                          <AnimatePresence>
                            {setHistory[ex.id].map((record, idx) => (
                              <motion.div 
                                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                                key={`hist-norm-${idx}`} 
                                className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80"
                              >
                                <span className="mono opacity-60 font-bold tracking-widest uppercase text-[9px]">Série {idx + 1}</span>
                                <div className="flex gap-4 font-black">
                                  <span><span className="opacity-40 font-normal">Carga:</span> {record.weight || '-'} kg</span>
                                  <span><span className="opacity-40 font-normal">Reps:</span> {record.reps || '-'}</span>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}

                      <div className="flex gap-3 justify-center flex-wrap px-2">
                        {Array.from({ length: ex.sets }).map((_, i) => {
                          const setsDoneEx = completedSets[ex.id] || 0;
                          const isCompletedEx = i < setsDoneEx;
                          const isActiveSetEx =
                            i === setsDoneEx && activeRestState === null;

                          return (
                            <button
                              key={`${ex.id}-set-${i}`}
                              disabled={
                                isCompletedEx ||
                                activeRestState !== null ||
                                i > setsDoneEx
                              }
                              onClick={() => {
                                if (i === setsDoneEx) {
                                  handleCompleteSet(
                                    ex,
                                    setsDoneEx,
                                    weightsUsed[ex.id] || String(ex.weight || 0),
                                    repsUsed[ex.id] || String(ex.reps || 0),
                                  );
                                }
                              }}
                              className={classNames(
                                "w-12 h-12 rounded-full font-black text-lg flex items-center justify-center transition-all",
                                isCompletedEx
                                  ? "bg-[#00ff66] text-black scale-95"
                                  : isActiveSetEx
                                    ? "border-2 border-[#00ff66] text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.4)]"
                                    : "bg-white/5 opacity-50 text-white/30 cursor-not-allowed",
                              )}
                            >
                              {isCompletedEx ? (
                                <CheckCircle2 size={20} />
                              ) : (
                                i + 1
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    disabled={!allExercisesCompleted}
                    onClick={handleFinish}
                    className={classNames(
                      "mt-8 w-full py-5 rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all mb-8 flex items-center justify-center gap-3",
                      allExercisesCompleted
                        ? "accent-bg text-black shadow-[0_20px_50px_rgba(0,255,102,0.3)] hover:scale-[0.98]"
                        : "bg-white/5 text-white/30 cursor-not-allowed",
                    )}
                  >
                    <CheckCircle2 size={24} />{" "}
                    {allExercisesCompleted
                      ? "FINALIZAR PROTOCOLO"
                      : "COMPLETE AS SÉRIES"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full accent-bg flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,255,102,0.4)]">
                <CheckCircle2 size={40} className="text-black" />
              </div>
              <h2 className="text-3xl font-black text-atheris-text mb-2 uppercase tracking-tighter">
                Inoculação Concluída!
              </h2>
              <p className="text-atheris-muted text-center mb-10">
                Envie seu relatório de ataque para o Atherium.
              </p>
              <div className="w-full glass p-6 rounded-3xl mb-6">
                <label className="block mono font-bold opacity-80 mb-4 text-center">
                  Esforço Total (RPE)
                </label>
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className="text-xs text-[#00ff66]">Inofensivo</span>
                  <span className="text-2xl font-black">{rpe}</span>
                  <span className="text-xs text-red-500">Exaustivo</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none bg-atheris-text/10 outline-none"
                />
              </div>
              <div className="w-full mb-8">
                <label className="block mono font-bold opacity-80 mb-2">
                  Relato do Ataque (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-atheris-text focus:outline-none focus:border-atheris-accent h-32"
                />
              </div>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest transition-all"
              >
                {saving ? "Registrando..." : "Registrar Bote"}
              </button>
            </div>
          )}
          <AnimatePresence>
            {selectedExercise && (
              <ExerciseInfoModal
                ex={selectedExercise}
                onClose={() => setSelectedExercise(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </>
    );
  },
);

export const CheckInModal = React.memo(
  ({
    student,
    onClose,
    onSaved,
  }: {
    student: User;
    onClose: () => void;
    onSaved: () => void;
  }) => {
    const [weight, setWeight] = useState(
      student.latestWeightKg?.toString() || "",
    );
    const [targetWeight, setTargetWeight] = useState(
      student.targetWeightKg?.toString() || "",
    );
    const [height, setHeight] = useState(student.heightCm?.toString() || "");
    const [birthday, setBirthday] = useState(student.birthday || "");
    const [mood, setMood] = useState<number>(3);
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    // Persistence logic: lock fields if already set
    const isTargetWeightLocked = !!student.targetWeightKg;
    const isHeightLocked = !!student.heightCm;
    const isBirthdayLocked = !!student.birthday;

    const moods = [
      {
        value: 1,
        icon: <Frown className="w-6 h-6" />,
        color: "text-red-500",
        bg: "bg-red-500/10",
      },
      {
        value: 2,
        icon: <Frown className="w-6 h-6 rotate-180" />,
        color: "text-orange-400",
        bg: "bg-orange-400/10",
      },
      {
        value: 3,
        icon: <Meh className="w-6 h-6" />,
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
      },
      {
        value: 4,
        icon: <Smile className="w-6 h-6" />,
        color: "text-lime-400",
        bg: "bg-lime-400/10",
      },
      {
        value: 5,
        icon: <SmilePlus className="w-6 h-6" />,
        color: "text-atheris-accent",
        bg: "bg-atheris-accent/10",
      },
    ];

    const handleSubmit = async () => {
      if (!weight) {
        alert("Por favor, insira seu peso atual para inocular a evolução.");
        return;
      }
      setSaving(true);
      try {
        const coachId = student.coachId || "coach_daniel";

        await addDoc(collection(db, "checkins"), {
          studentId: student.id,
          coachId: coachId,
          weightKg: Number(weight),
          targetWeightKg: targetWeight ? Number(targetWeight) : null,
          heightCm: height ? Number(height) : null,
          birthday: birthday || null,
          mood,
          notes,
          createdAt: serverTimestamp(),
        });

        // Send automated report to coach
        const moodEmojis = ["😫", "☹️", "😐", "🙂", "🤩"];
        const reportContent = notes || "Sincronização Biológica Efetuada";

        await addDoc(collection(db, "messages"), {
          senderId: student.id,
          senderName: student.name,
          receiverId: coachId,
          content: reportContent,
          type: "report",
          metadata: {
            weightKg: Number(weight),
            mood,
            moodEmoji: moodEmojis[mood - 1],
          },
          createdAt: serverTimestamp(),
        });

        const userUpdates: any = {};
        userUpdates.latestWeightKg = Number(weight);
        userUpdates.lastActiveAt = serverTimestamp();
        if (targetWeight && !isTargetWeightLocked)
          userUpdates.targetWeightKg = Number(targetWeight);
        if (height && !isHeightLocked) userUpdates.heightCm = Number(height);
        if (birthday && !isBirthdayLocked) userUpdates.birthday = birthday;

        if (Object.keys(userUpdates).length > 0) {
          await updateDoc(doc(db, "users", student.id), userUpdates);
        }

        onSaved();
      } catch (err) {
        console.error(err);
        alert("Erro ao registrar no habitat. Verifique sua conexão.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="fixed inset-0 z-[100] bg-atheris-bg flex flex-col"
      >
        <header className="p-4 pt-12 flex items-center gap-3 border-b border-white/5">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-lg uppercase tracking-tight">
              Inoculação Metabólica
            </h2>
            <p className="text-[10px] mono text-atheris-accent uppercase tracking-widest opacity-60">
              Sincronize evolução
            </p>
          </div>
        </header>

        <div className="p-4 flex-1 overflow-y-auto pb-10 scrollbar-hide">
          <section className="mb-4 text-center">
            <h3 className="mono text-[10px] uppercase opacity-40 mb-3 tracking-[0.2em]">
              Bioestatística Geral
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                <span className="block text-[10px] mono opacity-40 uppercase mb-1 text-center">
                  Peso Atual
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-xl font-black text-center text-atheris-accent focus:outline-none"
                />
              </div>
              <div
                className={classNames(
                  "glass p-3 rounded-2xl border transition-all flex flex-col items-center",
                  isTargetWeightLocked
                    ? "border-atheris-accent/20 bg-atheris-accent/5"
                    : "border-white/5",
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="block text-[10px] mono opacity-40 uppercase text-center">
                    Meta (kg)
                  </span>
                  {isTargetWeightLocked && (
                    <Lock
                      size={10}
                      className="text-atheris-accent opacity-50"
                    />
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  disabled={isTargetWeightLocked}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="0.0"
                  className={classNames(
                    "w-full bg-transparent text-xl font-black text-center focus:outline-none",
                    isTargetWeightLocked
                      ? "text-atheris-accent/50"
                      : "text-atheris-accent",
                  )}
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 mb-4">
            <div
              className={classNames(
                "glass p-3 rounded-2xl border transition-all flex flex-col items-center",
                isHeightLocked
                  ? "border-atheris-accent/20 bg-atheris-accent/5"
                  : "border-white/5",
              )}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Ruler
                  size={14}
                  className={
                    isHeightLocked
                      ? "text-atheris-accent/40"
                      : "text-atheris-accent/40"
                  }
                />
                {isHeightLocked && (
                  <Lock size={10} className="text-atheris-accent opacity-50" />
                )}
              </div>
              <span className="text-[10px] mono opacity-40 uppercase mb-1 text-center">
                Altura (cm)
              </span>
              <div className="w-full flex justify-center mt-1">
                <input
                  type="number"
                  value={height}
                  disabled={isHeightLocked}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                  className={classNames(
                    "bg-transparent text-xl font-black text-center focus:outline-none w-20",
                    isHeightLocked
                      ? "text-atheris-accent/50"
                      : "text-atheris-accent",
                  )}
                />
              </div>
            </div>
            <div
              className={classNames(
                "glass p-3 rounded-2xl border transition-all flex flex-col items-center overflow-hidden",
                isBirthdayLocked
                  ? "border-atheris-accent/20 bg-atheris-accent/5"
                  : "border-white/5",
              )}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar
                  size={14}
                  className={
                    isBirthdayLocked
                      ? "text-atheris-accent/40"
                      : "text-atheris-accent/40"
                  }
                />
                {isBirthdayLocked && (
                  <Lock size={10} className="text-atheris-accent opacity-50" />
                )}
              </div>
              <span className="text-[10px] mono opacity-40 uppercase mb-1 text-center truncate w-full">
                Aniversário
              </span>
              <div className="w-full flex justify-center mt-1">
                <input
                  type="date"
                  value={birthday}
                  disabled={isBirthdayLocked}
                  onChange={(e) => setBirthday(e.target.value)}
                  className={classNames(
                    "bg-transparent sm:text-xl text-base font-black text-center focus:outline-none min-h-[2rem] w-full max-w-[150px]",
                    isBirthdayLocked
                      ? "text-atheris-accent/50"
                      : "text-atheris-accent",
                  )}
                />
              </div>
            </div>
          </section>

          <section className="mb-4">
            <h3 className="mono text-[10px] uppercase opacity-40 mb-2 text-center tracking-[0.2em]">
              Frequência Cardíaca Mental (Humor)
            </h3>
            <div className="flex justify-between items-center px-1">
              {moods.map((m, index) => (
                <button
                  key={`${m.value}-${index}`}
                  onClick={() => setMood(m.value)}
                  className={classNames(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border",
                    mood === m.value
                      ? `${m.bg} ${m.color} border-current scale-110 shadow-lg`
                      : "bg-white/5 text-white/20 border-transparent grayscale",
                  )}
                >
                  {m.icon}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-4">
            <h3 className="mono text-[10px] uppercase opacity-40 mb-2 tracking-widest px-1">
              Relatório de Campo
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma dor, vitória ou observação técnica? Relate ao Atherium."
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-3 text-sm text-atheris-text h-20 focus:border-atheris-accent/30 transition-colors"
            />
          </section>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className={classNames(
              "w-full py-4 rounded-3xl accent-bg text-black font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,255,102,0.2)] active:scale-[0.98] transition-all",
              saving ? "opacity-50 cursor-wait" : "",
            )}
          >
            {saving ? "Codificando Dados..." : "Inocular Evolução"}
          </button>
        </div>
      </motion.div>
    );
  },
);

const StudentWorkouts = memo(({ studentId }: { studentId: string }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "workouts"),
      where("studentId", "==", studentId),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let list = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as Workout[];
        
        // Sort incomplete workouts by title ascending so A is before B
        list.sort((a, b) => {
          if (!a.completed && !b.completed) {
            return (a.title || "").localeCompare(b.title || "");
          }
          return 0; // maintain descending order for completed ones 
        });

        setWorkouts(list);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [studentId]);

  const handleDelete = async (workoutId: string) => {
    try {
      await deleteDoc(doc(db, "workouts", workoutId));
    } catch (err) {
      console.error("Failed to delete workout:", err);
    }
  };

  if (loading)
    return (
      <div className="text-[10px] mono opacity-40 uppercase tracking-widest p-2">
        Sincronizando Arsenal...
      </div>
    );
  if (workouts.length === 0)
    return (
      <div className="text-[10px] italic opacity-40 p-2">
        Nenhum protocolo no arsenal.
      </div>
    );

  return (
    <>
      {workouts.map((w) => (
        <div
          key={w.id}
          className="glass p-3 rounded-2xl flex items-center justify-between border border-white/5 group"
        >
          <div>
            <h5 className="text-xs font-bold text-atheris-text">{w.title}</h5>
            <p className="text-[9px] mono opacity-40 uppercase">
              {w.exercises.length} Movimentos
            </p>
          </div>
          <div className="flex items-center gap-2">
            {w.completed ? (
              <span className="text-[8px] font-black uppercase text-atheris-accent px-2 py-0.5 rounded bg-atheris-accent/10 border border-atheris-accent/20">
                Finalizado
              </span>
            ) : (
              <span className="text-[8px] font-black uppercase text-blue-400 px-2 py-0.5 rounded bg-blue-400/10 border border-blue-400/20">
                Em Progresso
              </span>
            )}
            <button
              onClick={() => handleDelete(w.id)}
              className="p-2 opacity-60 hover:opacity-100 text-red-500 hover:bg-red-500/10 rounded-lg transition-all touch-manipulation"
              title="Excluir Treino"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </>
  );
});

export const BroadcastModal = React.memo(
  ({
    onClose,
    students,
    coach,
  }: {
    onClose: () => void;
    students: User[];
    coach: User;
  }) => {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [sentCount, setSentCount] = useState(0);

    const handleBroadcast = async () => {
      if (!message.trim() || sending) return;
      setSending(true);
      let count = 0;

      try {
        for (const student of students) {
          await addDoc(collection(db, "messages"), {
            senderId: coach.id,
            senderName: coach.name,
            receiverId: student.id,
            content: message,
            createdAt: serverTimestamp(),
            type: "text",
          });
          count++;
        }
        setSentCount(count);
        setTimeout(onClose, 2000);
      } catch (err) {
        console.error(err);
      } finally {
        setSending(false);
      }
    };

    return (
      <>
        <div
          onClick={onClose}
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-x-4 top-[20%] z-[120] glass p-6 rounded-[2.5rem] border border-white/10 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-atheris-accent/20 text-atheris-accent rounded-2xl">
              <Megaphone size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter">
                Inoculação Global
              </h3>
              <p className="mono text-[10px] uppercase opacity-50 tracking-widest">
                Enviar para {students.length} Víboras
              </p>
            </div>
          </div>

          {sentCount > 0 ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 bg-atheris-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-atheris-accent" />
              </div>
              <h4 className="font-bold text-lg">Impacto Sucesso!</h4>
              <p className="text-sm opacity-60">
                Mensagem entregue a {sentCount} alunos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensagem motivacional ou aviso do habitat..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm h-32 focus:border-atheris-accent outline-none transition-colors"
              />
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-2xl bg-white/5 font-bold text-sm active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBroadcast}
                  disabled={sending || !message.trim()}
                  className="flex-[2] py-4 px-6 rounded-2xl bg-atheris-accent text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {sending ? (
                    "Disparando..."
                  ) : (
                    <>
                      <Send size={18} /> Inocular
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </>
    );
  },
);

export const StudentDetailModal = React.memo(
  ({
    student,
    onClose,
    onAssignWorkout,
  }: {
    student: User;
    onClose: () => void;
    onAssignWorkout: () => void;
  }) => {
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const qCheckIns = query(
            collection(db, "checkins"),
            where("studentId", "==", student.id),
            orderBy("createdAt", "desc"),
          );
          const qSessions = query(
            collection(db, "sessions"),
            where("studentId", "==", student.id),
            orderBy("createdAt", "desc"),
          );

          const [ciSnap, sessSnap] = await Promise.all([
            getDocs(qCheckIns),
            getDocs(qSessions),
          ]);

          setCheckIns(
            ciSnap.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as any),
            })) as CheckIn[],
          );
          setSessions(
            sessSnap.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as any),
            })),
          );
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [student.id]);

    const chartData = useMemo(() => {
      return checkIns
        .slice()
        .reverse()
        .map((ci) => ({
          date: ci.createdAt?.toDate
            ? ci.createdAt
                .toDate()
                .toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })
            : "",
          weight: ci.weightKg,
        }));
    }, [checkIns]);

    return (
      <>
        <div
          onClick={onClose}
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-atheris-bg flex flex-col overflow-hidden"
        >
          <header className="fixed top-0 left-0 w-full z-40 bg-atheris-bg/95 backdrop-blur-md px-4 pt-12 pb-4 flex items-center justify-between border-b border-white/5">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full bg-white/5"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-atheris-accent" />
              <h2 className="font-bold text-sm mono uppercase tracking-widest">
                Evolução Metabólica
              </h2>
            </div>
            <button
              onClick={onAssignWorkout}
              className="p-2 text-atheris-toxic hover:bg-white/5 rounded-full"
            >
              <Plus size={24} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 pt-24 scrollbar-hide">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-atheris-accent/10 flex items-center justify-center text-2xl font-bold text-atheris-accent border border-atheris-accent/20">
                {student.name[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-atheris-text leading-tight">
                  {student.name}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="mono font-bold text-atheris-accent uppercase text-[10px] tracking-widest">
                    {getSnakeRank(student.points || 0).name}
                  </p>
                  <span className="w-1 h-1 rounded-full bg-white/20"></span>
                  <p className="mono text-[10px] opacity-60 uppercase font-black">
                    {student.points || 0} V-PTS
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-10 glass p-5 rounded-3xl border border-white/5">
              <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2 font-bold tracking-widest text-atheris-accent">
                Privilégios de Nível Atherium
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] mono opacity-40 uppercase">
                    Meta de Peso
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={student.targetWeightKg}
                    onBlur={async (e) => {
                      const val = Number(e.target.value);
                      if (val !== student.targetWeightKg) {
                        await updateDoc(doc(db, "users", student.id), {
                          targetWeightKg: val,
                        });
                      }
                    }}
                    className="bg-white/5 border border-white/10 rounded-xl p-2 text-sm font-bold text-atheris-accent focus:border-atheris-accent outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] mono opacity-40 uppercase">
                    Estatura
                  </span>
                  <input
                    type="number"
                    defaultValue={student.heightCm}
                    onBlur={async (e) => {
                      const val = Number(e.target.value);
                      if (val !== student.heightCm) {
                        await updateDoc(doc(db, "users", student.id), {
                          heightCm: val,
                        });
                      }
                    }}
                    className="bg-white/5 border border-white/10 rounded-xl p-2 text-sm font-bold text-atheris-accent focus:border-atheris-accent outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[9px] mono opacity-40 uppercase">
                    Aniversário
                  </span>
                  <input
                    type="date"
                    defaultValue={student.birthday}
                    onBlur={async (e) => {
                      const val = e.target.value;
                      if (val !== student.birthday) {
                        await updateDoc(doc(db, "users", student.id), {
                          birthday: val,
                        });
                      }
                    }}
                    className="bg-white/5 border border-white/10 rounded-xl p-2 text-sm font-bold text-atheris-accent focus:border-atheris-accent outline-none w-full"
                  />
                </div>
              </div>
              <p className="text-[9px] opacity-30 mt-3 italic text-center">
                Campos bloqueados para o aluno. Somente você pode inocular
                alterações aqui.
              </p>
            </section>

            <section className="mb-8">
              <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2">
                Curva de Peso{" "}
                <span className="text-atheris-accent">
                  (Inoculação de Dados)
                </span>
              </h4>
              <div className="h-44 w-full glass rounded-3xl p-4 overflow-hidden shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 15, 10, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "10px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#00ff66"
                      strokeWidth={3}
                      dot={{ fill: "#00ff66", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mb-10">
              <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2 font-bold tracking-widest">
                <Dumbbell size={12} /> Arsenal do Aluno
              </h4>
              <div className="flex flex-col gap-3">
                <StudentWorkouts studentId={student.id} />
              </div>
            </section>

            <section className="mb-10">
              <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2 font-bold tracking-widest">
                <Activity size={12} /> Histórico de Execução
              </h4>
              <div className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <p className="text-xs opacity-30 italic px-2">
                    Nenhum treino protocolado ainda.
                  </p>
                ) : (
                  sessions.slice(0, 10).map((s: any) => (
                    <div
                      key={s.id}
                      className="glass p-4 rounded-3xl border border-white/5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-bold text-xs uppercase tracking-tight text-white/90">
                            Protocolo Concluído
                          </h5>
                          <p className="text-[8px] mono opacity-40 uppercase">
                            {s.createdAt?.toDate
                              ? s.createdAt
                                  .toDate()
                                  .toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                              : "Data Desconhecida"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-atheris-accent">
                              RPE {s.rpe}
                            </span>
                            <div
                              className={classNames(
                                "w-1.5 h-1.5 rounded-full",
                                s.rpe >= 8
                                  ? "bg-red-500"
                                  : s.rpe >= 5
                                    ? "bg-yellow-500"
                                    : "bg-atheris-accent",
                              )}
                            />
                          </div>
                          <span className="text-[8px] mono opacity-30 uppercase">
                            Esforço Relatado
                          </span>
                        </div>
                      </div>
                      {s.notes && (
                        <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[10px] italic opacity-70 leading-relaxed">
                            "{s.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mb-10">
              <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2 font-bold tracking-widest">
                <Zap size={12} /> Ações de Comando
              </h4>
              <button
                onClick={onAssignWorkout}
                className="w-full py-4 rounded-2xl bg-atheris-accent text-black font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.2)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Plus size={18} strokeWidth={3} /> Atribuir Novo Protocolo
              </button>
            </section>

            <section className="mb-8">
              <h4 className="mono opacity-60 uppercase text-[10px] mb-4 font-bold tracking-widest">
                Histórico de Pesagem
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {checkIns.length === 0 ? (
                  <p className="text-xs opacity-30 italic px-2">
                    Nenhum check-in registrado.
                  </p>
                ) : (
                  checkIns.map((ci) => (
                    <div
                      key={ci.id}
                      className="glass p-4 rounded-2xl min-w-[100px] border border-white/5 flex flex-col items-center"
                    >
                      <span className="text-lg font-black text-atheris-accent">
                        {ci.weightKg}kg
                      </span>
                      <span className="text-[8px] opacity-40 uppercase font-bold mt-1 tracking-tighter">
                        {ci.createdAt?.toDate
                          ? ci.createdAt
                              .toDate()
                              .toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })
                          : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </motion.div>
      </>
    );
  },
);

const inferDifficulty = (exName: string, exType: string) => {
  const n = exName.toLowerCase();

  if (
    n.includes("terra") ||
    n.includes("pistol") ||
    n.includes("muscle up") ||
    n.includes("argolas") ||
    n.includes("agachamento livre") ||
    n.includes("arranque") ||
    n.includes("clean") ||
    n.includes("snatch") ||
    n.includes("handstand")
  )
    return "Naja Real";
  if (
    n.includes("halteres") ||
    n.includes("cabo") ||
    n.includes("polia") ||
    n.includes("cross") ||
    n.includes("barra") ||
    n.includes("livre") ||
    n.includes("banco") ||
    n.includes("desenvolvimento")
  )
    return "Cascavel";
  if (
    exType === "Máquina" ||
    n.includes("smith") ||
    n.includes("guiado") ||
    n.includes("máquina") ||
    exType === "Cardio" ||
    n.includes("aparelho")
  )
    return "Jararaca";

  return "Cascavel";
};

const getDifficultyStyle = (diff: string) => {
  if (diff === "Naja Real")
    return "text-red-500 border-red-500/20 bg-red-500/5";
  if (diff === "Cascavel")
    return "text-yellow-500 border-yellow-500/20 bg-yellow-500/5";
  return "text-[#00ff66] border-[#00ff66]/20 bg-[#00ff66]/5";
};

export const WorkoutCreatorModal = React.memo(
  ({
    student,
    coach,
    onClose,
    onCreated,
  }: {
    student: User;
    coach: User;
    onClose: () => void;
    onCreated: () => void;
  }) => {
    const [title, setTitle] = useState("");
    const [selectedExs, setSelectedExs] = useState<Exercise[]>([]);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [editingExIndex, setEditingExIndex] = useState<number | null>(null);
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);
    
    // AI Setup state
    const [showAiSetup, setShowAiSetup] = useState(false);
    const [aiGender, setAiGender] = useState('Masculino');
    const [aiGoal, setAiGoal] = useState('Crescer');
    const [aiSplit, setAiSplit] = useState('Padrão');
    const [aiLevel, setAiLevel] = useState('Intermediário');
    const [aiStatus, setAiStatus] = useState('Natural');

    const muscles = useMemo(
      () => Array.from(new Set(EXERCISE_LIBRARY.map((e) => e.muscle))),
      [],
    );
    const [selMuscle, setSelMuscle] = useState(muscles[0]);

    const executeAIGeneration = async () => {
      if (!selMuscle) return;
      setIsGeneratingFull(true);
      setShowAiSetup(false);
      try {
        const workouts = await aiService.generateWorkoutProgram(
          selMuscle,
          aiLevel,
          aiGoal,
          student.name,
          aiGender,
          aiSplit,
          aiStatus
        );

        if (!workouts || workouts.length === 0) {
          alert("Não foi possível gerar os treinos. Tente novamente.");
          setIsGeneratingFull(false);
          return;
        }

        for (const w of workouts) {
          const mappedExercises = w.exercises.map((ex: any) => ({
            ...ex,
            id: Date.now().toString() + Math.random(),
            sets: Number(ex.sets) || 3,
            reps: String(ex.reps || "12"),
            weight: String(ex.weight || "0"),
            restSeconds: Number(ex.restSeconds) || 60,
            purpose: ex.purpose || "",
            instructions: ex.instructions || "",
          }));

          await addDoc(collection(db, "workouts"), {
            title: w.title || `Treino de ${aiSplit} - ${aiGoal}`,
            studentId: student.id,
            authorId: coach.id,
            completed: false,
            exercises: mappedExercises,
            createdAt: serverTimestamp(),
          });
        }

        await addDoc(collection(db, "messages"), {
          senderId: coach.id,
          senderName: "Mestre Atheris",
          receiverId: student.id,
          content: `Olá! Acabei de prescrever um programa de treino de 3 meses baseado na metodologia ${aiSplit} focando em ${aiGoal}. Vamos mutar juntos!`,
          type: 'text',
          createdAt: serverTimestamp(),
        });

        onCreated();
        onClose();
      } catch (err) {
        console.error("Full AI Generation failed", err);
        alert("Mestre Atheris encontrou uma interferência. Tente novamente.");
      } finally {
        setIsGeneratingFull(false);
      }
    };

    const filtered = useMemo(
      () =>
        EXERCISE_LIBRARY.filter(
          (ex) =>
            ex.muscle === selMuscle &&
            ex.name.toLowerCase().includes(search.toLowerCase()),
        ),
      [selMuscle, search],
    );

    const handleSave = async () => {
      if (!title || selectedExs.length === 0) {
        alert("Por favor, dê um título e adicione pelo menos um movimento.");
        return;
      }
      setSaving(true);
      try {
        const workoutRef = await addDoc(collection(db, "workouts"), {
          title,
          studentId: student.id,
          authorId: coach.id,
          completed: false,
          exercises: selectedExs,
          createdAt: serverTimestamp(),
        });

        // Send automated notification message
        await addDoc(collection(db, "messages"), {
          senderId: coach.id,
          senderName: "Mestre Atheris",
          receiverId: student.id,
          content: `Protocolo Iniciado: ${title}. Seu novo plano de ataque foi liberado.`,
          type: "workout",
          metadata: { workoutId: workoutRef.id, workoutTitle: title },
          createdAt: serverTimestamp(),
        });

        onCreated();
      } catch (err) {
        console.error(err);
        alert("Falha ao sincronizar protocolo. Tente novamente.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <>
        {showAiSetup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAiSetup(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-6 rounded-3xl w-full max-w-sm border border-white/10 z-10 flex flex-col gap-6 bg-atheris-bg shadow-2xl shadow-atheris-accent/10 max-h-[85vh] overflow-y-auto"
            >
              <div className="text-center">
                <Brain size={48} className="text-atheris-accent mx-auto mb-4 drop-shadow-[0_0_15px_rgba(0,255,102,0.4)]" />
                <h3 className="font-black text-xl uppercase tracking-tighter text-white">Configurar IA</h3>
                <p className="text-[10px] mono text-white/50 uppercase tracking-widest mt-1">Calibração do Protocolo</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="mono text-[9px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Foco Biológico (Sexo)</span>
                  <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                    {['Masculino', 'Feminino'].map(g => (
                      <button 
                        key={g} 
                        onClick={() => setAiGender(g)}
                        className={classNames(
                          "flex-1 py-3 rounded-xl mono text-xs font-bold uppercase tracking-widest transition-all",
                          aiGender === g ? "bg-atheris-accent text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]" : "text-white/40 hover:text-white"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="mono text-[9px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Status Fisiológico</span>
                  <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                    {['Natural', 'Hormonizado'].map(status => (
                      <button 
                        key={status} 
                        onClick={() => setAiStatus(status)}
                        className={classNames(
                          "flex-1 py-3 rounded-xl mono text-xs font-bold uppercase tracking-widest transition-all",
                          aiStatus === status ? "bg-atheris-accent text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]" : "text-white/40 hover:text-white"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="mono text-[9px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Objetivo do Aluno</span>
                  <div className="flex gap-2 flex-wrap pb-2">
                    {['Secar', 'Manter', 'Crescer'].map(goal => (
                      <button
                        key={goal}
                        onClick={() => setAiGoal(goal)}
                        className={classNames(
                          "flex-1 py-3 px-2 rounded-xl mono text-xs font-bold uppercase tracking-widest transition-all",
                          aiGoal === goal ? "bg-atheris-accent text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]" : "bg-white/5 text-white/40 border border-white/5 hover:text-white"
                        )}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="mono text-[9px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Metodologia (Split)</span>
                  <div className="flex gap-2 flex-wrap pb-2">
                    {['Padrão', 'PPL', 'Upper/Lower', 'Fullbody', 'Isolado', 'Rest-Pause', 'Bi-Set'].map(split => (
                      <button
                        key={split}
                        onClick={() => setAiSplit(split)}
                        className={classNames(
                          "px-4 py-3 rounded-xl mono text-xs font-bold uppercase tracking-widest transition-all",
                          aiSplit === split ? "bg-atheris-accent text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]" : "bg-white/5 text-white/40 border border-white/5 hover:text-white"
                        )}
                      >
                        {split}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="mono text-[9px] font-black uppercase text-white/40 tracking-[0.2em] ml-2">Dificuldade</span>
                  <div className="flex gap-2 flex-wrap pb-2">
                    {['Iniciante', 'Intermediário', 'Avançado', 'Elite'].map(level => (
                      <button
                        key={level}
                        onClick={() => setAiLevel(level)}
                        className={classNames(
                          "px-4 py-3 rounded-xl mono text-xs font-bold uppercase tracking-widest transition-all",
                          aiLevel === level ? "bg-atheris-accent text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]" : "bg-white/5 text-white/40 border border-white/5 hover:text-white"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => setShowAiSetup(false)}
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-white/50 mono text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeAIGeneration}
                  className="flex-1 py-4 rounded-2xl bg-atheris-accent text-black mono text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
        <div
          onClick={onClose}
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed inset-0 z-[100] bg-atheris-bg flex flex-col overflow-hidden"
        >
          <header className="p-4 pt-12 flex items-center justify-between border-b border-white/5 shadow-sm">
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full">
              <ChevronLeft size={24} />
            </button>
            <h2 className="font-bold uppercase tracking-tight">
              Criar Protocolo
            </h2>
            <button
              onClick={handleSave}
              disabled={saving || !title}
              className="p-2 text-atheris-accent"
            >
              <Save size={24} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide pb-20">
            <div className="flex gap-2 mb-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do Protocolo"
                className="flex-1 bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-xl font-bold focus:border-atheris-accent outline-none"
              />
              <button
                onClick={() => setShowAiSetup(true)}
                disabled={isGeneratingFull}
                className={classNames(
                  "p-4 rounded-2xl border transition-all flex items-center justify-center gap-2",
                  isGeneratingFull
                    ? "bg-white/5 border-white/10 text-white/30"
                    : "bg-atheris-accent/10 border-atheris-accent/30 text-atheris-accent hover:bg-atheris-accent/20",
                )}
                title="Configurar Protocolo IA"
              >
                {isGeneratingFull ? (
                  <div className="w-5 h-5 rounded-full border-2 border-atheris-accent border-t-transparent animate-spin" />
                ) : (
                  <Sparkles size={24} />
                )}
              </button>
            </div>
            <div className="mb-8">
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {muscles.map((m, index) => (
                  <button
                    key={`${m}-${index}`}
                    onClick={() => setSelMuscle(m)}
                    className={classNames(
                      "px-4 py-2 rounded-xl mono uppercase text-[10px] tracking-widest whitespace-nowrap transition-all border",
                      selMuscle === m
                        ? "bg-atheris-accent text-black border-transparent font-black"
                        : "bg-white/5 text-atheris-muted border-white/5",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="relative mb-4">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar Movimento..."
                  className="w-full bg-atheris-text/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm"
                />
              </div>
              <div className="flex flex-col gap-3">
                {filtered
                  .map((ex) => ({
                    ...ex,
                    inferredDiff: inferDifficulty(ex.name, ex.type),
                  }))
                  .sort((a, b) => {
                    const order: Record<string, number> = {
                      Jararaca: 1,
                      Cascavel: 2,
                      "Naja Real": 3,
                    };
                    return order[a.inferredDiff] - order[b.inferredDiff];
                  })
                  .map((ex, idx) => (
                    <button
                      key={`${ex.name}-${idx}`}
                      onClick={() =>
                        setSelectedExs((prev) => [
                          ...prev,
                          {
                            id: Date.now().toString() + Math.random(),
                            name: ex.name,
                            sets: 3,
                            reps: "12",
                            weight: "0",
                            restSeconds: 60,
                            instructions:
                              ex.instructions ||
                              EXERCISE_LIBRARY.find((l) => l.name === ex.name)
                                ?.instructions ||
                              "Execute o movimento com cadência controlada, focando na contração do músculo alvo e mantendo a postura preservada.",
                            purpose:
                              ex.purpose ||
                              EXERCISE_LIBRARY.find((l) => l.name === ex.name)
                                ?.purpose ||
                              (ex.muscle
                                ? `O foco desse exercício é trabalhar a área do ${ex.muscle} para ganho de força e definição.`
                                : "Focado no desenvolvimento e fortalecimento da musculatura alvo."),
                            muscleGroup: ex.muscle || "Desconhecido",
                            difficulty: ex.inferredDiff,
                          } as Exercise,
                        ])
                      }
                      className="glass p-4 rounded-3xl flex items-center justify-between group hover:bg-white/[0.03] transition-all border border-white/5 relative overflow-hidden"
                    >
                      <div className="flex flex-col items-start gap-2 text-left relative z-10 w-full pr-10">
                        <div className="flex w-full items-start justify-between">
                          <span className="font-bold text-sm tracking-tight">
                            {ex.name}
                          </span>
                          <span
                            className={classNames(
                              "text-[9px] mono uppercase font-black px-2 py-0.5 rounded-lg border",
                              getDifficultyStyle(ex.inferredDiff),
                            )}
                          >
                            {ex.inferredDiff}
                          </span>
                        </div>
                        <span className="text-[10px] mono uppercase tracking-tighter text-atheris-muted flex items-center gap-1">
                          ALVO:{" "}
                          <span className="text-atheris-accent">
                            {ex.muscle}
                          </span>{" "}
                          • {ex.type}
                        </span>
                      </div>
                      <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-atheris-bg shadow-xl p-2 rounded-xl backdrop-blur-md border border-white/10">
                        <Plus size={16} className="text-atheris-accent" />
                      </div>
                    </button>
                  ))}
              </div>
            </div>
            <div className="mb-6">
              <h4 className="mono uppercase text-[10px] opacity-60 mb-4 px-2">
                Estrutura do Ataque
              </h4>
              {selectedExs.map((ex, idx) => (
                <div
                  key={`${ex.id}-${idx}`}
                  className="glass p-4 rounded-3xl mb-3"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-xs uppercase text-atheris-accent tracking-tighter">
                      {ex.name}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedExs((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <Trash2 size={16} className="text-red-500/50" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) =>
                        setSelectedExs((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, sets: Number(e.target.value) }
                              : item,
                          ),
                        )
                      }
                      className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold"
                      placeholder="SETS"
                    />
                    <input
                      value={ex.reps}
                      onChange={(e) =>
                        setSelectedExs((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, reps: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold"
                      placeholder="REPS"
                    />
                    <input
                      value={ex.weight}
                      onChange={(e) =>
                        setSelectedExs((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, weight: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold"
                      placeholder="LOAD"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#00ff66]/10 border border-[#00ff66]/20 p-3 rounded-xl mb-3 flex items-start gap-2">
                      <Zap size={14} className="text-[#00ff66] mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-[10px] mono uppercase text-[#00ff66] font-bold tracking-tighter">
                          MÚSCULO ALVO: {ex.muscleGroup || ex.muscle}
                        </span>
                        <span className="text-[9px] text-[#00ff66]/70 mt-1 leading-tight">
                          Foque na contração deste grupo muscular durante toda a
                          execução.
                        </span>
                      </div>
                    </div>
                    {(() => {
                      const lp1 =
                        "Focado no desenvolvimento e fortalecimento da musculatura alvo.";
                      const lp2 = `Trabalhar o músculo ${ex.muscleGroup || ex.muscle || ""} para ganho de força e definição.`;
                      const lp3 = `O foco desse exercício é trabalhar a área do ${ex.muscleGroup || ex.muscle || ""} para ganho de força e definição.`;
                      const li1 =
                        "Execute o movimento com cadência controlada, focando na contração do músculo alvo e mantendo a postura preservada.";

                      const stringifiedUndefinedMatch = `O foco desse exercício é trabalhar a área do undefined para ganho de força e definição.`;

                      const genPurpose =
                        !ex.purpose ||
                        ex.purpose === lp1 ||
                        ex.purpose === lp2 ||
                        ex.purpose === lp3 ||
                        ex.purpose === stringifiedUndefinedMatch ||
                        ex.purpose.startsWith("O foco desse ");
                      const genInstruction =
                        !ex.instructions || ex.instructions === li1;

                      const isGenerating =
                        ex.purpose === "Gerando lógica bio-mecânica com IA...";

                      if (genPurpose && genInstruction && !isGenerating) {
                        return (
                          <button
                            className="mt-2 w-full flex items-center justify-center gap-2 text-atheris-accent border border-atheris-accent/20 bg-atheris-accent/5 px-4 py-3 rounded-xl uppercase mono text-[10px] font-black tracking-widest hover:bg-atheris-accent hover:text-black transition-all active:scale-[0.98]"
                            onClick={async () => {
                              try {
                                const simulatedPurpose = `Gerando lógica bio-mecânica com IA...`;
                                const simulatedInstructions = `Analisando vetores de força e estabilidade core...`;
                                setSelectedExs((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          purpose: simulatedPurpose,
                                          instructions: simulatedInstructions,
                                        }
                                      : item,
                                  ),
                                );

                                const textObj =
                                  await aiService.generateWorkoutDetails(
                                    ex.name,
                                    ex.muscleGroup ||
                                      ex.muscle ||
                                      "Desconhecido",
                                    ex.difficulty,
                                  );

                                setSelectedExs((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          purpose:
                                            textObj.purpose ||
                                            "Propósito não foi possível de ser gerado.",
                                          instructions:
                                            textObj.instructions ||
                                            "Instruções não foram possíveis de serem geradas.",
                                        }
                                      : item,
                                  ),
                                );
                              } catch (e) {
                                console.error("AI Generation failed", e);
                                setSelectedExs((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          purpose: "",
                                          instructions:
                                            "Falha ao conectar com o serviço de IA.",
                                        }
                                      : item,
                                  ),
                                );
                              }
                            }}
                          >
                            <Sparkles size={14} /> Gerar Instruções com IA
                          </button>
                        );
                      }

                      return (
                        <>
                          <div className="flex flex-col mb-3">
                            <span className="text-[8px] mono opacity-40 uppercase mb-1 px-1">
                              Propósito (Bio-Lógica)
                            </span>
                            <textarea
                              value={ex.purpose}
                              onChange={(e) =>
                                setSelectedExs((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? { ...item, purpose: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                              className={classNames(
                                "bg-white/5 border border-white/5 rounded-xl p-3 text-[10px] outline-none h-16 resize-none scrollbar-hide text-atheris-text/80",
                                isGenerating &&
                                  "animate-pulse border-atheris-accent/50 text-atheris-accent",
                              )}
                              readOnly={isGenerating}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] mono opacity-40 uppercase mb-1 px-1">
                              Instruções de Ataque
                            </span>
                            <textarea
                              value={ex.instructions}
                              onChange={(e) =>
                                setSelectedExs((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          ...item,
                                          instructions: e.target.value,
                                        }
                                      : item,
                                  ),
                                )
                              }
                              className={classNames(
                                "bg-white/5 border border-white/5 rounded-xl p-3 text-[10px] outline-none h-20 resize-none scrollbar-hide text-atheris-text/80",
                                isGenerating &&
                                  "animate-pulse border-atheris-accent/50 text-atheris-accent",
                              )}
                              readOnly={isGenerating}
                            />
                          </div>
                        </>
                      );
                    })()}

                    <button
                      onClick={() => setEditingExIndex(idx)}
                      className="mt-3 w-full border border-white/10 bg-white/5 py-2 rounded-xl text-[9px] mono uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Info size={12} /> Ver Detalhes e Mídia
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {editingExIndex !== null && selectedExs[editingExIndex] && (
              <ExerciseInfoModal
                ex={selectedExs[editingExIndex]}
                onClose={() => setEditingExIndex(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </>
    );
  },
);
