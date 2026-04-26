import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { RotateCcw, ChevronLeft, CheckCircle2, Info, Dumbbell, Save, Scale, Search, Filter, Plus, Trash2, Image as ImageIcon, TrendingUp, Zap, Frown, Meh, Smile, SmilePlus, Ruler, Calendar, Lock, Megaphone, Send, Sparkles } from 'lucide-react';
import { User, Workout, Exercise, CheckIn } from '../types';
import { EXERCISE_LIBRARY, LibraryExercise } from '../exerciseLibrary';
import { gymJokes, mockWorkouts } from '../mockData';
import { classNames } from '../lib/utils';
import { getSnakeRank } from '../lib/ranks';
import { db, serverTimestamp, setDoc, addDoc, collection, updateDoc, doc, getDoc, query, where, getDocs, orderBy, onSnapshot, deleteDoc } from '../firebase';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper for Timer
export const TimerBar = React.memo(({ activeRestState, onComplete }: { activeRestState: { secs: number, id: number } | null, onComplete: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [joke, setJoke] = useState('');

  useEffect(() => {
     if (activeRestState) {
       setTimeLeft(activeRestState.secs);
       setJoke(gymJokes[Math.floor(Math.random() * gymJokes.length)]);
     }
  }, [activeRestState]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (activeRestState) onComplete();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, activeRestState, onComplete]);

  if (!activeRestState || timeLeft <= 0) return null;

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="sticky top-[73px] z-30 glass border-l-4 border-l-[#00ff66] p-4 font-bold overflow-hidden shadow-xl mx-4 mt-2 rounded-2xl">
       <div className="flex items-center justify-between mb-2">
         <span className="mono uppercase tracking-widest text-[#00ff66] opacity-60 flex items-center gap-2"><RotateCcw size={14} /> Descanso Ativo</span>
         <span className="text-2xl font-black accent-text">{timeLeft}s</span>
       </div>
       <div className="w-full h-1 bg-atheris-text/5 rounded-full overflow-hidden">
         <motion.div initial={{ width: '100%' }} animate={{ width: `${(timeLeft / activeRestState.secs) * 100}%` }} transition={{ duration: 1 }} className="h-full accent-bg"></motion.div>
       </div>
       <p className="text-[10px] font-medium italic opacity-80 mt-3 text-center">"{joke}"</p>
    </motion.div>
  )
});

export const ExerciseInfoModal = React.memo(({ ex, onClose }: { ex: Exercise, onClose: () => void }) => {
  const libMatch = EXERCISE_LIBRARY.find(l => l.name === ex.name);
  const [aiPurpose, setAiPurpose] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Migration logic: Fallback to the rich library text se o exercício salvo tem texto vazio ou genérico
  const legacyP1 = 'Focado no desenvolvimento e fortalecimento da musculatura alvo.';
  const legacyP2 = `Trabalhar o músculo ${ex.muscleGroup || ''} para ganho de força e definição.`;
  const legacyP3 = `O foco desse exercício é trabalhar a área do ${ex.muscleGroup || ''} para ganho de força e definição.`;
  const legacyP4 = `O foco desse exercício é trabalhar a área do ${ex.muscleGroup || 'músculo'} para ganho de força e definição.`;
  const legacyP5 = `Músculo Primário Trabalhado:`; // Catch earlier multi-line anatomical legacy texts
  
  const isLegacyPurpose = !ex.purpose || 
    ex.purpose === legacyP1 || ex.purpose === legacyP2 || 
    ex.purpose === legacyP3 || ex.purpose === legacyP4 || 
    ex.purpose.startsWith(legacyP5);
    
  const displayPurpose = aiPurpose || ((isLegacyPurpose && libMatch?.purpose) ? libMatch.purpose : (ex.purpose || legacyP4));

  const legacyI1 = 'Execute o movimento com cadência controlada, focando na contração do músculo alvo e mantendo a postura preservada.';
  const legacyI2 = 'Execute o movimento com cadência controlada, focando na contração do músculo alvo e mantendo a postura preservada. Caso sinta desconforto articular, ajuste a carga ou a amplitude.';
  
  const isLegacyInstruction = !ex.instructions || ex.instructions === legacyI1 || ex.instructions === legacyI2;
  const displayInstruction = aiInstructions || ((isLegacyInstruction && libMatch?.instructions) ? libMatch.instructions : (ex.instructions || legacyI2));

  const isGenericPurpose = !aiPurpose && isLegacyPurpose && !libMatch?.purpose;
  const isGenericInstruction = !aiInstructions && isLegacyInstruction && !libMatch?.instructions;
  const isCompletelyGeneric = isGenericPurpose && isGenericInstruction;

  const handleGenerateAI = async () => {
    setLoadingAi(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Você é um treinador de elite. O exercício atual é: "${ex.name}". 
        O músculo alvo é: "${ex.muscleGroup}". A dificuldade é: "${ex.difficulty}".
        Descreva o propósito deste exercício (explicando porque ele é usado e em qual parte do músculo ele foca) e as instruções perfeitas passo a passo de como executar.
        Retorne em formato JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              purpose: { type: Type.STRING, description: "Propósito detalhado mas conciso em pt-br." },
              instructions: { type: Type.STRING, description: "Instruções passo a passo em pt-br." }
            },
            required: ["purpose", "instructions"]
          }
        }
      });
      const data = JSON.parse(response.text.trim());
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
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 z-[100] glass border-b-0 rounded-t-3xl flex flex-col max-h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] pb-safe"
      >
        <div className="p-2 flex justify-center">
           <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="p-4 flex-1 overflow-y-auto pb-10">
           <div className="flex justify-between items-start mb-3">
             <h3 className="text-xl font-bold text-atheris-text leading-tight">{ex.name}</h3>
             <button onClick={onClose} className="p-2 -mr-2 bg-white/5 rounded-full flex-shrink-0"><ChevronLeft size={20} className="rotate-[-90deg]" /></button>
           </div>
           
           <div className="flex gap-2 mb-4 flex-wrap">
              <span className="px-2 py-1 text-[9px] tracking-widest font-bold flex items-center gap-1 rounded bg-[#00ff66]/10 text-[#00ff66] mono uppercase border border-[#00ff66]/20">
                <span className="opacity-50">ALVO:</span> {ex.muscleGroup}
              </span>
              <span className={classNames("px-2 py-1 text-[9px] tracking-widest font-bold rounded mono uppercase border border-white/5", 
                 ex.difficulty === 'Jararaca' ? 'bg-[#00ff66]/20 text-[#00ff66]' : 
                 ex.difficulty === 'Naja Real' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
              )}>{ex.difficulty}</span>
           </div>

           <>
              {displayPurpose && !isGenericPurpose && (
                <div className="mb-4 bg-atheris-text/5 p-4 rounded-2xl border border-white/5">
                 <h4 className="mono opacity-60 uppercase mb-2 flex items-center gap-2"><CheckCircle2 size={12}/> Propósito</h4>
                 <p className="text-sm leading-relaxed text-atheris-text/90 whitespace-pre-line">{displayPurpose}</p>
               </div>
              )}

             <div className="mb-6 bg-atheris-text/5 p-4 rounded-2xl border border-white/5 relative">
               {!isGenericInstruction && (
                 <>
                   <h4 className="mono opacity-60 uppercase mb-2 flex items-center gap-2"><Info size={12}/> Instruções</h4>
                   <p className="text-sm leading-relaxed text-atheris-text/90 whitespace-pre-line">{displayInstruction}</p>
                 </>
               )}
               
               <button 
                 onClick={handleGenerateAI}
                 disabled={loadingAi}
                 className={classNames("w-full py-3 px-4 rounded-xl border border-atheris-accent/30 bg-atheris-accent/10 text-atheris-accent font-bold text-[10px] mono uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-atheris-accent/20 transition-all disabled:opacity-50", !isGenericInstruction && "mt-4")}
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
  )
});

export const ExecuteWorkoutModal = React.memo(({ workout, currentUser, onClose, onFinish }: { workout: Workout, currentUser: User, onClose: () => void, onFinish: (w: Workout) => void }) => {
  const [activeRestState, setActiveRestState] = useState<{secs: number, id: number} | null>(null);
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [weightsUsed, setWeightsUsed] = useState<Record<string, string>>({});
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [rpe, setRpe] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // Iniciar state de pesagem
  useEffect(() => {
    if (currentUser.exerciseWeights) {
      const initialWeights: Record<string, string> = {};
      workout.exercises.forEach(ex => {
        if (currentUser.exerciseWeights![ex.name]) {
          initialWeights[ex.id] = currentUser.exerciseWeights![ex.name];
        }
      });
      setWeightsUsed(initialWeights);
    }
  }, [currentUser, workout]);

  const allExercisesCompleted = useMemo(() => {
     return workout.exercises.every(ex => (completedSets[ex.id] || 0) >= ex.sets);
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
        const isChallenge = workout.type === 'challenge';
        const pointsEarned = isChallenge ? (workout.points || 25) : (isQuickHit ? 5 : 100);

        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        await addDoc(collection(db, 'sessions'), {
            studentId: currentUser.id,
            coachId: currentUser.coachId || '',
            workoutId: workout.id,
            durationSeconds,
            rpe,
            notes,
            weights: weightsUsed,
            createdAt: serverTimestamp()
        });

        // Update user weights
        const newExerciseWeights = { ...(currentUser.exerciseWeights || {}) };
        let madeChanges = false;
        workout.exercises.forEach(ex => {
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
            await addDoc(collection(db, 'messages'), {
                senderId: currentUser.id,
                senderName: currentUser.name,
                receiverId: currentUser.coachId || 'coach_daniel',
                content: notes,
                type: 'report',
                metadata: { workoutTitle: workout.title, rpe, weights: weightsUsed },
                createdAt: serverTimestamp()
            });
        }

        await updateDoc(doc(db, 'workouts', workout.id), { completed: true, updatedAt: serverTimestamp() });
        await updateDoc(doc(db, 'users', currentUser.id), updates);
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
      <div onClick={onClose} className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
      <motion.div 
         initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
         className="fixed inset-0 z-[90] bg-atheris-bg flex flex-col overflow-hidden"
      >
       <header className="sticky top-0 z-40 bg-atheris-bg/90 backdrop-blur-2xl border-b border-atheris-border px-4 pt-12 pb-4 flex items-center gap-3 shadow-sm">
         <button onClick={onClose} disabled={saving} className="p-2 -ml-2 rounded-full bg-atheris-text/5 hover:bg-atheris-text/10 transition-colors">
           <ChevronLeft size={24} />
         </button>
         <h2 className="font-bold text-lg truncate flex-1 text-atheris-text">{workout.title}</h2>
       </header>

       {!finishing ? (
         <>
           <TimerBar activeRestState={activeRestState} onComplete={() => setActiveRestState(null)} />
           <div className="flex-1 overflow-y-auto p-4 pb-32 scrollbar-hide">
             {workout.exercises.map((ex, index) => (
               <div key={`${ex.id}-${index}`} className="glass p-4 rounded-2xl mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-base flex-1 pr-4">{ex.name}</h3>
                        <span className="text-[10px] mono opacity-80 uppercase text-[#00ff66] tracking-tighter mt-1">MÚSCULO ALVO: {ex.muscleGroup}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {/* Demonstration removed */}
                      <button onClick={() => setSelectedExercise(ex)} className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                        <Info size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                      <div className="bg-atheris-text/5 rounded-lg p-2 text-center">
                        <span className="mono opacity-50 block mb-1 font-bold">SÉRIES</span>
                        <span className="font-bold text-atheris-text">{ex.sets}</span>
                      </div>
                      <div className="bg-atheris-text/5 rounded-lg p-2 text-center">
                        <span className="mono opacity-50 block mb-1 font-bold">REPS</span>
                        <span className="font-bold text-atheris-text">{ex.reps}</span>
                      </div>
                      <div className="bg-atheris-text/5 rounded-lg p-2 text-center col-span-2 mt-2 mb-2 border border-white/5 relative">
                        <span className="mono opacity-50 block mb-1 font-bold text-[10px] uppercase tracking-widest text-atheris-accent"><TrendingUp size={10} className="inline mr-1" /> Carga Utilizada Hoje (kg/lbs)</span>
                        <input 
                           type="text" 
                           placeholder={ex.weight} 
                           value={weightsUsed[ex.id] || ''} 
                           onChange={e => setWeightsUsed({...weightsUsed, [ex.id]: e.target.value})} 
                           className="w-full bg-transparent text-center font-black text-xl text-white focus:outline-none placeholder:text-white/20" 
                        />
                        {currentUser.exerciseWeights?.[ex.name] && (
                           <div className="absolute right-2 top-2 p-1 px-2 rounded bg-atheris-accent/10 border border-atheris-accent/20 text-[8px] mono text-atheris-accent">
                               Última vez: {currentUser.exerciseWeights[ex.name]}
                           </div>
                        )}
                      </div>
                   </div>
                  <div className="flex gap-3 justify-center flex-wrap px-2">
                    {Array.from({ length: ex.sets }).map((_, i) => {
                       const setsDone = completedSets[ex.id] || 0;
                       const isCompleted = i < setsDone;
                       const isActiveSet = i === setsDone && activeRestState === null;
                       
                       return (
                         <button 
                           key={`${ex.id}-set-${i}`} 
                           disabled={isCompleted || activeRestState !== null || i > setsDone} 
                           onClick={() => {
                              if (i === setsDone) {
                                  setCompletedSets(prev => ({ ...prev, [ex.id]: setsDone + 1 }));
                                  if (ex.restSeconds > 0 && setsDone + 1 < ex.sets) {
                                     setActiveRestState({ secs: ex.restSeconds, id: Date.now() });
                                  }
                              }
                           }}
                           className={classNames(
                              "w-12 h-12 rounded-full font-black text-lg flex items-center justify-center transition-all",
                              isCompleted ? "bg-[#00ff66] text-black scale-95" : 
                                 isActiveSet ? "border-2 border-[#00ff66] text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.4)]" 
                                 : "bg-white/5 opacity-50 text-white/30 cursor-not-allowed"
                           )}
                         >
                           {isCompleted ? <CheckCircle2 size={20} /> : i + 1}
                         </button>
                       );
                    })}
                  </div>
               </div>
             ))}
             <button disabled={!allExercisesCompleted} onClick={handleFinish} className={classNames("mt-8 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all mb-8 flex items-center justify-center gap-2", allExercisesCompleted ? "accent-bg text-black shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[0.98]" : "bg-white/5 text-white/30 cursor-not-allowed")}>
                 <CheckCircle2 size={24} /> {allExercisesCompleted ? 'Finalizar Protocolo' : 'Complete as Séries'}
             </button>
           </div>
         </>
       ) : (
         <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
             <div className="w-20 h-20 rounded-full accent-bg flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,255,102,0.4)]">
                 <CheckCircle2 size={40} className="text-black" />
             </div>
             <h2 className="text-3xl font-black text-atheris-text mb-2 uppercase tracking-tighter">Inoculação Concluída!</h2>
             <p className="text-atheris-muted text-center mb-10">Envie seu relatório de ataque para o Atherium.</p>
             <div className="w-full glass p-6 rounded-3xl mb-6">
                 <label className="block mono font-bold opacity-80 mb-4 text-center">Esforço Total (RPE)</label>
                 <div className="flex justify-between items-center mb-2 px-2">
                     <span className="text-xs text-[#00ff66]">Inofensivo</span>
                     <span className="text-2xl font-black">{rpe}</span>
                     <span className="text-xs text-red-500">Exaustivo</span>
                 </div>
                 <input type="range" min="1" max="10" step="1" value={rpe} onChange={(e) => setRpe(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none bg-atheris-text/10 outline-none" />
             </div>
             <div className="w-full mb-8">
                 <label className="block mono font-bold opacity-80 mb-2">Relato do Ataque (Opcional)</label>
                 <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-atheris-text focus:outline-none focus:border-atheris-accent h-32" />
             </div>
             <button onClick={handleFinish} disabled={saving} className="w-full py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest transition-all">
                {saving ? 'Registrando...' : 'Registrar Bote'}
             </button>
         </div>
       )}
       <AnimatePresence>
         {selectedExercise && <ExerciseInfoModal ex={selectedExercise} onClose={() => setSelectedExercise(null)} />}
       </AnimatePresence>
     </motion.div>
    </>
   );
});

export const CheckInModal = React.memo(({ student, onClose, onSaved }: { student: User, onClose: () => void, onSaved: () => void }) => {
  const [weight, setWeight] = useState(student.latestWeightKg?.toString() || '');
  const [targetWeight, setTargetWeight] = useState(student.targetWeightKg?.toString() || '');
  const [height, setHeight] = useState(student.heightCm?.toString() || '');
  const [birthday, setBirthday] = useState(student.birthday || '');
  const [mood, setMood] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Persistence logic: lock fields if already set
  const isTargetWeightLocked = !!student.targetWeightKg;
  const isHeightLocked = !!student.heightCm;
  const isBirthdayLocked = !!student.birthday;

  const moods = [
    { value: 1, icon: <Frown className="w-6 h-6" />, color: 'text-red-500', bg: 'bg-red-500/10' },
    { value: 2, icon: <Frown className="w-6 h-6 rotate-180" />, color: 'text-orange-400', bg: 'bg-orange-400/10' }, 
    { value: 3, icon: <Meh className="w-6 h-6" />, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { value: 4, icon: <Smile className="w-6 h-6" />, color: 'text-lime-400', bg: 'bg-lime-400/10' },
    { value: 5, icon: <SmilePlus className="w-6 h-6" />, color: 'text-atheris-accent', bg: 'bg-atheris-accent/10' },
  ];

  const handleSubmit = async () => {
    if (!weight) {
      alert("Por favor, insira seu peso atual para inocular a evolução.");
      return;
    }
    setSaving(true);
    try {
      const coachId = student.coachId || 'coach_daniel';
      
      await addDoc(collection(db, 'checkins'), {
        studentId: student.id,
        coachId: coachId,
        weightKg: Number(weight),
        targetWeightKg: targetWeight ? Number(targetWeight) : null,
        heightCm: height ? Number(height) : null,
        birthday: birthday || null,
        mood,
        notes,
        createdAt: serverTimestamp()
      });

      // Send automated report to coach
      const moodEmojis = ['😫', '☹️', '😐', '🙂', '🤩'];
      const reportContent = notes || "Sincronização Biológica Efetuada";
      
      await addDoc(collection(db, 'messages'), {
          senderId: student.id,
          senderName: student.name,
          receiverId: coachId,
          content: reportContent,
          type: 'report',
          metadata: { weightKg: Number(weight), mood, moodEmoji: moodEmojis[mood-1] },
          createdAt: serverTimestamp()
      });
      
      const userUpdates: any = {};
      userUpdates.latestWeightKg = Number(weight);
      userUpdates.lastActiveAt = serverTimestamp();
      if (targetWeight && !isTargetWeightLocked) userUpdates.targetWeightKg = Number(targetWeight);
      if (height && !isHeightLocked) userUpdates.heightCm = Number(height);
      if (birthday && !isBirthdayLocked) userUpdates.birthday = birthday;

      if (Object.keys(userUpdates).length > 0) {
        await updateDoc(doc(db, 'users', student.id), userUpdates);
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
    <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} className="fixed inset-0 z-[100] bg-atheris-bg flex flex-col">
       <header className="p-4 pt-12 flex items-center gap-3 border-b border-white/5">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={24} /></button>
          <div className="flex-1">
            <h2 className="font-bold text-lg uppercase tracking-tight">Inoculação Metabólica</h2>
            <p className="text-[10px] mono text-atheris-accent uppercase tracking-widest opacity-60">Sincronize evolução</p>
          </div>
       </header>

       <div className="p-4 flex-1 overflow-y-auto pb-10 scrollbar-hide">
         <section className="mb-4 text-center">
            <h3 className="mono text-[10px] uppercase opacity-40 mb-3 tracking-[0.2em]">Bioestatística Geral</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                <span className="block text-[10px] mono opacity-40 uppercase mb-1 text-center">Peso Atual</span>
                <input 
                  type="number" step="0.1" value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  placeholder="0.0" 
                  className="w-full bg-transparent text-xl font-black text-center text-atheris-accent focus:outline-none" 
                />
              </div>
              <div className={classNames("glass p-3 rounded-2xl border transition-all flex flex-col items-center", isTargetWeightLocked ? "border-atheris-accent/20 bg-atheris-accent/5" : "border-white/5")}>
                <div className="flex items-center justify-center gap-1 mb-1">
                   <span className="block text-[10px] mono opacity-40 uppercase text-center">Meta (kg)</span>
                   {isTargetWeightLocked && <Lock size={10} className="text-atheris-accent opacity-50" />}
                </div>
                <input 
                  type="number" step="0.1" value={targetWeight} 
                  disabled={isTargetWeightLocked}
                  onChange={(e) => setTargetWeight(e.target.value)} 
                  placeholder="0.0" 
                  className={classNames("w-full bg-transparent text-xl font-black text-center focus:outline-none", isTargetWeightLocked ? "text-atheris-accent/50" : "text-atheris-accent")} 
                />
              </div>
            </div>
         </section>

         <section className="grid grid-cols-2 gap-3 mb-4">
            <div className={classNames("glass p-3 rounded-2xl border transition-all flex flex-col items-center", isHeightLocked ? "border-atheris-accent/20 bg-atheris-accent/5" : "border-white/5")}>
               <div className="flex items-center justify-center gap-1 mb-1">
                 <Ruler size={14} className={isHeightLocked ? "text-atheris-accent/40" : "text-atheris-accent/40"} />
                 {isHeightLocked && <Lock size={10} className="text-atheris-accent opacity-50" />}
               </div>
               <span className="text-[10px] mono opacity-40 uppercase mb-1 text-center">Altura (cm)</span>
               <div className="w-full flex justify-center mt-1">
                 <input 
                    type="number" value={height} 
                    disabled={isHeightLocked}
                    onChange={(e) => setHeight(e.target.value)} 
                    placeholder="170" 
                    className={classNames("bg-transparent text-xl font-black text-center focus:outline-none w-20", isHeightLocked ? "text-atheris-accent/50" : "text-atheris-accent")} 
                  />
               </div>
            </div>
            <div className={classNames("glass p-3 rounded-2xl border transition-all flex flex-col items-center overflow-hidden", isBirthdayLocked ? "border-atheris-accent/20 bg-atheris-accent/5" : "border-white/5")}>
               <div className="flex items-center justify-center gap-1 mb-1">
                 <Calendar size={14} className={isBirthdayLocked ? "text-atheris-accent/40" : "text-atheris-accent/40"} />
                 {isBirthdayLocked && <Lock size={10} className="text-atheris-accent opacity-50" />}
               </div>
               <span className="text-[10px] mono opacity-40 uppercase mb-1 text-center truncate w-full">Aniversário</span>
               <div className="w-full flex justify-center mt-1">
                 <input 
                    type="date" value={birthday} 
                    disabled={isBirthdayLocked}
                    onChange={(e) => setBirthday(e.target.value)} 
                    className={classNames("bg-transparent sm:text-xl text-base font-black text-center focus:outline-none min-h-[2rem] w-full max-w-[150px]", isBirthdayLocked ? "text-atheris-accent/50" : "text-atheris-accent")} 
                  />
               </div>
            </div>
         </section>

         <section className="mb-4">
           <h3 className="mono text-[10px] uppercase opacity-40 mb-2 text-center tracking-[0.2em]">Frequência Cardíaca Mental (Humor)</h3>
           <div className="flex justify-between items-center px-1">
             {moods.map((m, index) => (
                <button
                  key={`${m.value}-${index}`}
                  onClick={() => setMood(m.value)}
                  className={classNames(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border",
                    mood === m.value ? `${m.bg} ${m.color} border-current scale-110 shadow-lg` : 'bg-white/5 text-white/20 border-transparent grayscale'
                  )}
                >
                  {m.icon}
                </button>
             ))}
           </div>
         </section>

         <section className="mb-4">
            <h3 className="mono text-[10px] uppercase opacity-40 mb-2 tracking-widest px-1">Relatório de Campo</h3>
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
             saving ? "opacity-50 cursor-wait" : ""
           )}
         >
            {saving ? 'Codificando Dados...' : 'Inocular Evolução'}
         </button>
       </div>
    </motion.div>
  );
});

const StudentWorkouts = memo(({ studentId }: { studentId: string }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'workouts'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setWorkouts(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Workout[]);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [studentId]);

  const handleDelete = async (workoutId: string) => {
    try {
      await deleteDoc(doc(db, 'workouts', workoutId));
    } catch (err) {
      console.error("Failed to delete workout:", err);
    }
  };

  if (loading) return <div className="text-[10px] mono opacity-40 uppercase tracking-widest p-2">Sincronizando Arsenal...</div>;
  if (workouts.length === 0) return <div className="text-[10px] italic opacity-40 p-2">Nenhum protocolo no arsenal.</div>;

  return (
    <>
      {workouts.map(w => (
        <div key={w.id} className="glass p-3 rounded-2xl flex items-center justify-between border border-white/5 group">
           <div>
             <h5 className="text-xs font-bold text-atheris-text">{w.title}</h5>
             <p className="text-[9px] mono opacity-40 uppercase">{w.exercises.length} Movimentos</p>
           </div>
           <div className="flex items-center gap-2">
             {w.completed ? (
               <span className="text-[8px] font-black uppercase text-atheris-accent px-2 py-0.5 rounded bg-atheris-accent/10 border border-atheris-accent/20">Finalizado</span>
             ) : (
               <span className="text-[8px] font-black uppercase text-blue-400 px-2 py-0.5 rounded bg-blue-400/10 border border-blue-400/20">Em Progresso</span>
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

export const BroadcastModal = React.memo(({ onClose, students, coach }: { onClose: () => void, students: User[], coach: User }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const handleBroadcast = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    let count = 0;

    try {
      for (const student of students) {
        await addDoc(collection(db, 'messages'), {
          senderId: coach.id,
          senderName: coach.name,
          receiverId: student.id,
          content: message,
          createdAt: serverTimestamp(),
          type: 'text'
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
      <div onClick={onClose} className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed inset-x-4 top-[20%] z-[120] glass p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-atheris-accent/20 text-atheris-accent rounded-2xl">
            <Megaphone size={24} />
          </div>
          <div>
            <h3 className="font-black text-xl uppercase tracking-tighter">Inoculação Global</h3>
            <p className="mono text-[10px] uppercase opacity-50 tracking-widest">Enviar para {students.length} Víboras</p>
          </div>
        </div>

        {sentCount > 0 ? (
          <div className="py-10 text-center">
            <div className="w-16 h-16 bg-atheris-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-atheris-accent" />
            </div>
            <h4 className="font-bold text-lg">Impacto Sucesso!</h4>
            <p className="text-sm opacity-60">Mensagem entregue a {sentCount} alunos.</p>
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
              <button onClick={onClose} className="flex-1 py-4 px-6 rounded-2xl bg-white/5 font-bold text-sm active:scale-95 transition-all">Cancelar</button>
              <button
                onClick={handleBroadcast}
                disabled={sending || !message.trim()}
                className="flex-[2] py-4 px-6 rounded-2xl bg-atheris-accent text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {sending ? 'Disparando...' : <><Send size={18} /> Inocular</>}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
});

export const StudentDetailModal = React.memo(({ student, onClose, onAssignWorkout }: { student: User, onClose: () => void, onAssignWorkout: () => void }) => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheckins = async () => {
      try {
        const q = query(collection(db, 'checkins'), where('studentId', '==', student.id), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setCheckIns(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as CheckIn[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckins();
  }, [student.id]);

  const chartData = useMemo(() => {
    return checkIns.slice().reverse().map(ci => ({
      date: ci.createdAt?.toDate ? ci.createdAt.toDate().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : '',
      weight: ci.weightKg
    }));
  }, [checkIns]);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-[100] bg-atheris-bg flex flex-col overflow-hidden">
       <header className="fixed top-0 left-0 w-full z-40 bg-atheris-bg/95 backdrop-blur-md px-4 pt-12 pb-4 flex items-center justify-between border-b border-white/5">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full bg-white/5"><ChevronLeft size={24} /></button>
          <div className="flex items-center gap-2">
             <TrendingUp size={16} className="text-atheris-accent" />
             <h2 className="font-bold text-sm mono uppercase tracking-widest">Evolução Metabólica</h2>
          </div>
          <button onClick={onAssignWorkout} className="p-2 text-atheris-toxic hover:bg-white/5 rounded-full"><Plus size={24} /></button>
       </header>

       <div className="flex-1 overflow-y-auto p-6 pt-24 scrollbar-hide">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-16 h-16 rounded-full bg-atheris-accent/10 flex items-center justify-center text-2xl font-bold text-atheris-accent border border-atheris-accent/20">{student.name[0]}</div>
             <div className="flex-1">
               <h3 className="text-2xl font-bold text-atheris-text leading-tight">{student.name}</h3>
               <div className="flex items-center gap-2">
                 <p className="mono font-bold text-atheris-accent uppercase text-[10px] tracking-widest">{getSnakeRank(student.points || 0).name}</p>
                 <span className="w-1 h-1 rounded-full bg-white/20"></span>
                 <p className="mono text-[10px] opacity-60 uppercase font-black">{student.points || 0} V-PTS</p>
               </div>
             </div>
          </div>

          <section className="mb-10 glass p-5 rounded-3xl border border-white/5">
             <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2 font-bold tracking-widest text-atheris-accent">Privilégios de Nível Atherium</h4>
             <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] mono opacity-40 uppercase">Meta de Peso</span>
                 <input 
                   type="number" step="0.1" defaultValue={student.targetWeightKg} 
                   onBlur={async (e) => {
                     const val = Number(e.target.value);
                     if (val !== student.targetWeightKg) {
                       await updateDoc(doc(db, 'users', student.id), { targetWeightKg: val });
                     }
                   }}
                   className="bg-white/5 border border-white/10 rounded-xl p-2 text-sm font-bold text-atheris-accent focus:border-atheris-accent outline-none" 
                 />
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] mono opacity-40 uppercase">Estatura</span>
                 <input 
                   type="number" defaultValue={student.heightCm} 
                   onBlur={async (e) => {
                     const val = Number(e.target.value);
                     if (val !== student.heightCm) {
                       await updateDoc(doc(db, 'users', student.id), { heightCm: val });
                     }
                   }}
                   className="bg-white/5 border border-white/10 rounded-xl p-2 text-sm font-bold text-atheris-accent focus:border-atheris-accent outline-none" 
                 />
               </div>
               <div className="flex flex-col gap-1 col-span-2">
                 <span className="text-[9px] mono opacity-40 uppercase">Aniversário</span>
                 <input 
                   type="date" defaultValue={student.birthday} 
                   onBlur={async (e) => {
                     const val = e.target.value;
                     if (val !== student.birthday) {
                       await updateDoc(doc(db, 'users', student.id), { birthday: val });
                     }
                   }}
                   className="bg-white/5 border border-white/10 rounded-xl p-2 text-sm font-bold text-atheris-accent focus:border-atheris-accent outline-none w-full" 
                 />
               </div>
             </div>
             <p className="text-[9px] opacity-30 mt-3 italic text-center">Campos bloqueados para o aluno. Somente você pode inocular alterações aqui.</p>
          </section>

          <section className="mb-8">
            <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2">Curva de Peso <span className="text-atheris-accent">(Inoculação de Dados)</span></h4>
            <div className="h-44 w-full glass rounded-3xl p-4 overflow-hidden shadow-inner">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(10, 15, 10, 0.95)', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="weight" stroke="#00ff66" strokeWidth={3} dot={{ fill: '#00ff66', r: 4 }} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </section>

         <section className="mb-10">
            <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2 font-bold tracking-widest"><Dumbbell size={12}/> Arsenal do Aluno</h4>
            <div className="flex flex-col gap-3">
               <StudentWorkouts studentId={student.id} />
            </div>
         </section>

         <section className="mb-10">
            <h4 className="mono opacity-60 uppercase text-[10px] mb-4 flex items-center gap-2 font-bold tracking-widest"><Zap size={12}/> Ações de Comando</h4>
            <button 
              onClick={onAssignWorkout}
              className="w-full py-4 rounded-2xl bg-atheris-accent text-black font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.2)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Plus size={18} strokeWidth={3} /> Atribuir Novo Protocolo
            </button>
         </section>

         <section className="mb-8">
            <h4 className="mono opacity-60 uppercase text-[10px] mb-4 font-bold tracking-widest">Histórico de Pesagem</h4>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
               {checkIns.length === 0 ? <p className="text-xs opacity-30 italic px-2">Nenhum check-in registrado.</p> : 
                checkIns.map(ci => (
                  <div key={ci.id} className="glass p-4 rounded-2xl min-w-[100px] border border-white/5 flex flex-col items-center">
                     <span className="text-lg font-black text-atheris-accent">{ci.weightKg}kg</span>
                     <span className="text-[8px] opacity-40 uppercase font-bold mt-1 tracking-tighter">
                       {ci.createdAt?.toDate ? ci.createdAt.toDate().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : ''}
                     </span>
                  </div>
                ))
               }
            </div>
         </section>
       </div>
    </motion.div>
    </>
  );
});

const inferDifficulty = (exName: string, exType: string) => {
  const n = exName.toLowerCase();
  
  if (n.includes('terra') || n.includes('pistol') || n.includes('muscle up') || n.includes('argolas') || n.includes('agachamento livre') || n.includes('arranque') || n.includes('clean') || n.includes('snatch') || n.includes('handstand')) return 'Naja Real';
  if (n.includes('halteres') || n.includes('cabo') || n.includes('polia') || n.includes('cross') || n.includes('barra') || n.includes('livre') || n.includes('banco') || n.includes('desenvolvimento')) return 'Cascavel';
  if (exType === 'Máquina' || n.includes('smith') || n.includes('guiado') || n.includes('máquina') || exType === 'Cardio' || n.includes('aparelho')) return 'Jararaca';
  
  return 'Cascavel';
};

const getDifficultyStyle = (diff: string) => {
  if (diff === 'Naja Real') return 'text-red-500 border-red-500/20 bg-red-500/5';
  if (diff === 'Cascavel') return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5';
  return 'text-[#00ff66] border-[#00ff66]/20 bg-[#00ff66]/5';
};

export const WorkoutCreatorModal = React.memo(({ student, coach, onClose, onCreated }: { student: User, coach: User, onClose: () => void, onCreated: () => void }) => {
  const [title, setTitle] = useState('');
  const [selectedExs, setSelectedExs] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingExIndex, setEditingExIndex] = useState<number | null>(null);

  const muscles = useMemo(() => Array.from(new Set(EXERCISE_LIBRARY.map(e => e.muscle))), []);
  const [selMuscle, setSelMuscle] = useState(muscles[0]);

  const filtered = useMemo(() => 
    EXERCISE_LIBRARY.filter(ex => ex.muscle === selMuscle && ex.name.toLowerCase().includes(search.toLowerCase())),
    [selMuscle, search]
  );

  const handleSave = async () => {
    if (!title || selectedExs.length === 0) {
      alert("Por favor, dê um título e adicione pelo menos um movimento.");
      return;
    }
    setSaving(true);
    try {
      const workoutRef = await addDoc(collection(db, 'workouts'), {
        title,
        studentId: student.id,
        authorId: coach.id,
        completed: false,
        exercises: selectedExs,
        createdAt: serverTimestamp()
      });

      // Send automated notification message
      await addDoc(collection(db, 'messages'), {
        senderId: coach.id,
        senderName: 'Mestre Atheris',
        receiverId: student.id,
        content: `Protocolo Iniciado: ${title}. Seu novo plano de ataque foi liberado.`,
        type: 'workout',
        metadata: { workoutId: workoutRef.id, workoutTitle: title },
        createdAt: serverTimestamp()
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
      <div onClick={onClose} className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[100] bg-atheris-bg flex flex-col overflow-hidden">
       <header className="p-4 pt-12 flex items-center justify-between border-b border-white/5 shadow-sm">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={24} /></button>
          <h2 className="font-bold uppercase tracking-tight">Criar Protocolo</h2>
          <button onClick={handleSave} disabled={saving || !title} className="p-2 text-atheris-accent"><Save size={24} /></button>
       </header>
       <div className="flex-1 overflow-y-auto p-4 scrollbar-hide pb-20">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do Protocolo" className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-xl font-bold mb-6 focus:border-atheris-accent outline-none" />
          <div className="mb-8">
             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
               {muscles.map((m, index) => (
                 <button key={`${m}-${index}`} onClick={() => setSelMuscle(m)} className={classNames("px-4 py-2 rounded-xl mono uppercase text-[10px] tracking-widest whitespace-nowrap transition-all border", selMuscle === m ? "bg-atheris-accent text-black border-transparent font-black" : "bg-white/5 text-atheris-muted border-white/5")}>
                   {m}
                 </button>
               ))}
             </div>
             <div className="relative mb-4">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar Movimento..." className="w-full bg-atheris-text/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm" />
             </div>
             <div className="flex flex-col gap-3">
               {filtered
                 .map(ex => ({ ...ex, inferredDiff: inferDifficulty(ex.name, ex.type) }))
                 .sort((a, b) => {
                   const order: Record<string, number> = { 'Jararaca': 1, 'Cascavel': 2, 'Naja Real': 3 };
                   return order[a.inferredDiff] - order[b.inferredDiff];
                 })
                 .map((ex, idx) => (
                 <button 
                  key={`${ex.name}-${idx}`} 
                  onClick={() => setSelectedExs(prev => [...prev, { 
                    id: Date.now().toString() + Math.random(),
                    name: ex.name,
                    sets: 3, 
                    reps: '12', 
                    weight: '0', 
                    restSeconds: 60,
                    instructions: ex.instructions || EXERCISE_LIBRARY.find(l => l.name === ex.name)?.instructions || 'Execute o movimento com cadência controlada, focando na contração do músculo alvo e mantendo a postura preservada.',
                    purpose: ex.purpose || EXERCISE_LIBRARY.find(l => l.name === ex.name)?.purpose || (ex.muscle ? `O foco desse exercício é trabalhar a área do ${ex.muscle} para ganho de força e definição.` : 'Focado no desenvolvimento e fortalecimento da musculatura alvo.'),
                    muscleGroup: ex.muscle || 'Desconhecido',
                    difficulty: ex.inferredDiff
                  } as Exercise])} 
                  className="glass p-4 rounded-3xl flex items-center justify-between group hover:bg-white/[0.03] transition-all border border-white/5 relative overflow-hidden"
                 >
                    <div className="flex flex-col items-start gap-2 text-left relative z-10 w-full pr-10">
                      <div className="flex w-full items-start justify-between">
                        <span className="font-bold text-sm tracking-tight">{ex.name}</span>
                        <span className={classNames("text-[9px] mono uppercase font-black px-2 py-0.5 rounded-lg border", getDifficultyStyle(ex.inferredDiff))}>
                          {ex.inferredDiff}
                        </span>
                      </div>
                      <span className="text-[10px] mono uppercase tracking-tighter text-atheris-muted flex items-center gap-1">ALVO: <span className="text-atheris-accent">{ex.muscle}</span> • {ex.type}</span>
                    </div>
                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-atheris-bg shadow-xl p-2 rounded-xl backdrop-blur-md border border-white/10">
                       <Plus size={16} className="text-atheris-accent" />
                    </div>
                 </button>
               ))}
             </div>
          </div>
          <div className="mb-6">
            <h4 className="mono uppercase text-[10px] opacity-60 mb-4 px-2">Estrutura do Ataque</h4>
            {selectedExs.map((ex, idx) => (
              <div key={`${ex.id}-${idx}`} className="glass p-4 rounded-3xl mb-3">
                 <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-xs uppercase text-atheris-accent tracking-tighter">{ex.name}</span>
                    <button onClick={() => setSelectedExs(prev => prev.filter((_, i) => i !== idx))}><Trash2 size={16} className="text-red-500/50" /></button>
                 </div>
                 <div className="grid grid-cols-3 gap-2 mb-4">
                    <input type="number" value={ex.sets} onChange={(e) => setSelectedExs(prev => prev.map((item, i) => i === idx ? { ...item, sets: Number(e.target.value) } : item))} className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold" placeholder="SETS" />
                    <input value={ex.reps} onChange={(e) => setSelectedExs(prev => prev.map((item, i) => i === idx ? { ...item, reps: e.target.value } : item))} className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold" placeholder="REPS" />
                    <input value={ex.weight} onChange={(e) => setSelectedExs(prev => prev.map((item, i) => i === idx ? { ...item, weight: e.target.value } : item))} className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold" placeholder="LOAD" />
                 </div>
                 <div className="space-y-3">
                    <div className="bg-[#00ff66]/10 border border-[#00ff66]/20 p-3 rounded-xl mb-3 flex items-start gap-2">
                       <Zap size={14} className="text-[#00ff66] mt-0.5" />
                       <div className="flex flex-col">
                          <span className="text-[10px] mono uppercase text-[#00ff66] font-bold tracking-tighter">MÚSCULO ALVO: {ex.muscleGroup || ex.muscle}</span>
                          <span className="text-[9px] text-[#00ff66]/70 mt-1 leading-tight">Foque na contração deste grupo muscular durante toda a execução.</span>
                       </div>
                    </div>
                    {(() => {
                      const lp1 = 'Focado no desenvolvimento e fortalecimento da musculatura alvo.';
                      const lp2 = `Trabalhar o músculo ${ex.muscleGroup || ex.muscle || ''} para ganho de força e definição.`;
                      const lp3 = `O foco desse exercício é trabalhar a área do ${ex.muscleGroup || ex.muscle || ''} para ganho de força e definição.`;
                      const li1 = 'Execute o movimento com cadência controlada, focando na contração do músculo alvo e mantendo a postura preservada.';
                      
                      const stringifiedUndefinedMatch = `O foco desse exercício é trabalhar a área do undefined para ganho de força e definição.`;
                      
                      const genPurpose = !ex.purpose || 
                                         ex.purpose === lp1 || 
                                         ex.purpose === lp2 || 
                                         ex.purpose === lp3 || 
                                         ex.purpose === stringifiedUndefinedMatch ||
                                         ex.purpose.startsWith('O foco desse ');
                      const genInstruction = !ex.instructions || ex.instructions === li1;
                      
                      const isGenerating = ex.purpose === 'Gerando lógica bio-mecânica com IA...';

                      if (genPurpose && genInstruction && !isGenerating) {
                        return (
                           <button 
                             className="mt-2 w-full flex items-center justify-center gap-2 text-atheris-accent border border-atheris-accent/20 bg-atheris-accent/5 px-4 py-3 rounded-xl uppercase mono text-[10px] font-black tracking-widest hover:bg-atheris-accent hover:text-black transition-all active:scale-[0.98]"
                             onClick={async () => {
                               try {
                                 const simulatedPurpose = `Gerando lógica bio-mecânica com IA...`;
                                 const simulatedInstructions = `Analisando vetores de força e estabilidade core...`;
                                 setSelectedExs(prev => prev.map((item, i) => i === idx ? { 
                                   ...item, 
                                   purpose: simulatedPurpose, 
                                   instructions: simulatedInstructions 
                                 } : item));
                                 
                                 const response = await ai.models.generateContent({
                                   model: "gemini-2.5-flash",
                                   contents: `Você é o "Mestre Atheris", um treinador formidável e direto. O exercício/desafio a ser configurado é: "${ex.name}". 
                                   O músculo alvo é: "${ex.muscleGroup || ex.muscle || 'Desconhecido'}".
                                   
                                   Gere o Propósito (Bio-Lógica) em até 2 linhas e Instruções de Ataque. Retire elogios bobos e seja extremamente técnico e direto. Retorne em formato JSON.`,
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
                                 
                                 const textObj = JSON.parse(response.text || "{}");
                                 
                                 setSelectedExs(prev => prev.map((item, i) => i === idx ? { 
                                   ...item, 
                                   purpose: textObj.purpose || 'Propósito não foi possível de ser gerado.', 
                                   instructions: textObj.instructions || 'Instruções não foram possíveis de serem geradas.' 
                                 } : item));
                               } catch (e) {
                                 console.error("AI Generation failed", e);
                                 setSelectedExs(prev => prev.map((item, i) => i === idx ? { 
                                   ...item, 
                                   purpose: '', 
                                   instructions: 'Falha ao conectar com o serviço de IA.' 
                                 } : item));
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
                            <span className="text-[8px] mono opacity-40 uppercase mb-1 px-1">Propósito (Bio-Lógica)</span>
                            <textarea 
                              value={ex.purpose} 
                              onChange={(e) => setSelectedExs(prev => prev.map((item, i) => i === idx ? { ...item, purpose: e.target.value } : item))} 
                              className={classNames("bg-white/5 border border-white/5 rounded-xl p-3 text-[10px] outline-none h-16 resize-none scrollbar-hide text-atheris-text/80", isGenerating && "animate-pulse border-atheris-accent/50 text-atheris-accent")}
                              readOnly={isGenerating}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] mono opacity-40 uppercase mb-1 px-1">Instruções de Ataque</span>
                            <textarea 
                              value={ex.instructions} 
                              onChange={(e) => setSelectedExs(prev => prev.map((item, i) => i === idx ? { ...item, instructions: e.target.value } : item))} 
                              className={classNames("bg-white/5 border border-white/5 rounded-xl p-3 text-[10px] outline-none h-20 resize-none scrollbar-hide text-atheris-text/80", isGenerating && "animate-pulse border-atheris-accent/50 text-atheris-accent")}
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
});
