import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { RotateCcw, ChevronLeft, CheckCircle2, Info, Dumbbell, Save, Scale, Search, Filter, Plus, Trash2, Image as ImageIcon, TrendingUp, Zap } from 'lucide-react';
import { User, Workout, Exercise, CheckIn } from '../types';
import { EXERCISE_LIBRARY, LibraryExercise } from '../exerciseLibrary';
import { gymJokes, mockWorkouts } from '../mockData';
import { classNames } from '../lib/utils';
import { db, serverTimestamp, addDoc, collection, updateDoc, doc, getDoc, query, where, getDocs, orderBy } from '../firebase';

// Helper for Timer
export const TimerBar = React.memo(({ activeRestState, onSkip }: { activeRestState: { secs: number, id: number } | null, onSkip: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [joke, setJoke] = useState('');

  useEffect(() => {
     if (activeRestState) {
       setTimeLeft(activeRestState.secs);
       setJoke(gymJokes[Math.floor(Math.random() * gymJokes.length)]);
     }
  }, [activeRestState]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

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
       <div className="flex gap-2 mt-3">
         <button onClick={onSkip} className="flex-1 py-3 bg-atheris-text/5 border border-white/10 hover:bg-atheris-text/10 rounded-xl text-[10px] uppercase tracking-widest transition-colors font-black text-atheris-text">Pular</button>
       </div>
    </motion.div>
  )
});

export const ExerciseInfoModal = React.memo(({ ex, onClose }: { ex: Exercise, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-x-0 bottom-0 z-50 glass border-b-0 rounded-t-3xl flex flex-col max-h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] pb-safe"
    >
        <div className="p-2 flex justify-center">
           <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="p-6 flex-1 overflow-y-auto pb-10">
           <div className="flex justify-between items-start mb-4">
             <h3 className="text-2xl font-bold text-atheris-text mb-2 leading-tight">{ex.name}</h3>
             <button onClick={onClose} className="p-2 -mr-2 bg-white/5 rounded-full"><ChevronLeft size={20} className="rotate-[-90deg]" /></button>
           </div>
           
           <div className="flex gap-2 mb-6 flex-wrap">
              <span className="px-3 py-1 rounded bg-atheris-text/10 text-atheris-text mono uppercase border border-white/5">{ex.muscleGroup}</span>
              <span className={classNames("px-3 py-1 rounded mono uppercase border border-white/5", 
                 ex.difficulty === 'Iniciante' ? 'bg-[#00ff66]/20 text-[#00ff66]' : 
                 ex.difficulty === 'Avançado' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
              )}>{ex.difficulty}</span>
           </div>

           <div className="mb-6 bg-atheris-text/5 p-4 rounded-2xl border border-white/5">
             <h4 className="mono opacity-60 uppercase mb-2 flex items-center gap-2"><CheckCircle2 size={12}/> Propósito</h4>
             <p className="text-sm leading-relaxed text-atheris-text/90">{ex.purpose}</p>
           </div>

           <div className="mb-8 bg-atheris-text/5 p-4 rounded-2xl border border-white/5">
             <h4 className="mono opacity-60 uppercase mb-2 flex items-center gap-2"><Info size={12}/> Instruções</h4>
             <p className="text-sm leading-relaxed text-atheris-text/90 whitespace-pre-line">{ex.instructions}</p>
           </div>

           {ex.demoUrl && (
              <button onClick={() => window.open(ex.demoUrl, '_blank')} className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:border-[#00ff66] hover:text-[#00ff66] transition-colors">
                 Ver Demonstração
              </button>
           )}
        </div>
     </motion.div>
  )
});

export const ExecuteWorkoutModal = React.memo(({ workout, currentUser, onClose }: { workout: Workout, currentUser: User, onClose: () => void }) => {
  const [activeRestState, setActiveRestState] = useState<{secs: number, id: number} | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [rpe, setRpe] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const handleFinish = async () => {
    if (!finishing) { setFinishing(true); return; }
    setSaving(true);
    try {
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        await addDoc(collection(db, 'sessions'), {
            studentId: currentUser.id,
            coachId: currentUser.coachId,
            workoutId: workout.id,
            durationSeconds,
            rpe,
            notes,
            createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'workouts', workout.id), { completed: true });
        await updateDoc(doc(db, 'users', currentUser.id), { points: currentUser.points + 100 });
        onClose();
    } catch (err) {
        console.error(err);
        alert("Erro ao salvar bote.");
    } finally {
        setSaving(false);
    }
  };

  return (
    <motion.div 
       initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
       className="fixed inset-0 z-[90] bg-atheris-bg sm:max-w-md sm:mx-auto flex flex-col overflow-hidden"
    >
       <header className="sticky top-0 z-40 bg-atheris-bg/90 backdrop-blur-2xl border-b border-atheris-border px-4 pt-12 pb-4 flex items-center gap-3 shadow-sm">
         <button onClick={onClose} disabled={saving} className="p-2 -ml-2 rounded-full bg-atheris-text/5 hover:bg-atheris-text/10 transition-colors">
           <ChevronLeft size={24} />
         </button>
         <h2 className="font-bold text-lg truncate flex-1 text-atheris-text">{workout.title}</h2>
       </header>

       {!finishing ? (
         <>
           <TimerBar activeRestState={activeRestState} onSkip={() => setActiveRestState(null)} />
           <div className="flex-1 overflow-y-auto p-4 pb-32 scrollbar-hide">
             {workout.exercises.map(ex => (
               <div key={ex.id} className="glass p-4 rounded-2xl mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-base flex-1 pr-4">{ex.name}</h3>
                    <button onClick={() => setSelectedExercise(ex)} className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                      <Info size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="bg-atheris-text/5 rounded-lg p-2 text-center">
                        <span className="mono opacity-50 block mb-1 font-bold">SÉRIES</span>
                        <span className="font-bold text-atheris-text">{ex.sets}</span>
                      </div>
                      <div className="bg-atheris-text/5 rounded-lg p-2 text-center">
                        <span className="mono opacity-50 block mb-1 font-bold">REPS</span>
                        <span className="font-bold text-atheris-text">{ex.reps}</span>
                      </div>
                      <div className="bg-atheris-text/5 rounded-lg p-2 text-center">
                        <span className="mono opacity-50 block mb-1 font-bold">CARGA</span>
                        <span className="font-bold accent-text">{ex.weight}</span>
                      </div>
                   </div>
                  <button onClick={() => setActiveRestState({ secs: ex.restSeconds, id: Date.now() })} className="w-full py-3 rounded-xl border border-[#00ff66]/30 text-[#00ff66] font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#00ff66] hover:text-black transition-colors">
                     Reiniciar Descanso ({ex.restSeconds}s)
                  </button>
               </div>
             ))}
             <button onClick={handleFinish} className="mt-8 w-full py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[0.98] transition-transform mb-8">
                <CheckCircle2 size={24} className="inline-block mr-2" /> Finalizar Protocolo
             </button>
           </div>
         </>
       ) : (
         <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
             <div className="w-20 h-20 rounded-full accent-bg flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,255,102,0.4)]">
                 <CheckCircle2 size={40} className="text-black" />
             </div>
             <h2 className="text-3xl font-black text-atheris-text mb-2 uppercase tracking-tighter">Inoculação Concluída!</h2>
             <p className="text-atheris-muted text-center mb-10">Envie seu relatório de ataque para o Alfa.</p>
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
  );
});

export const CheckInModal = React.memo(({ student, onClose, onSaved }: { student: User, onClose: () => void, onSaved: () => void }) => {
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!weight) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'checkins'), {
        studentId: student.id,
        coachId: student.coachId || '',
        weightKg: Number(weight),
        notes,
        createdAt: serverTimestamp()
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} className="fixed inset-0 z-[100] bg-atheris-bg sm:max-w-md sm:mx-auto flex flex-col">
       <header className="p-4 pt-12 flex items-center gap-3 border-b border-white/5">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={24} /></button>
          <h2 className="font-bold text-lg">Troca de Pele</h2>
       </header>
       <div className="p-6 flex-1 overflow-y-auto pb-10 scrollbar-hide">
         <div className="flex justify-center mb-8">
           <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center border-2 border-dashed border-atheris-accent/30"><Scale size={32} className="text-atheris-accent" /></div>
         </div>
         <div className="mb-8">
           <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-5 text-4xl font-black text-center text-atheris-accent focus:outline-none" />
         </div>
         <div className="mb-8">
           <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Como se sente hoje?" className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-atheris-text h-32" />
         </div>
         <button onClick={handleSubmit} disabled={saving || !weight} className="w-full py-4 rounded-2xl accent-bg text-black font-black uppercase tracking-widest disabled:opacity-50">
            {saving ? 'Enviando...' : 'Enviar Check-in'}
         </button>
       </div>
    </motion.div>
  );
});

const StudentWorkouts = memo(({ studentId }: { studentId: string }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, 'workouts'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setWorkouts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Workout[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [studentId]);

  if (loading) return <div className="text-[10px] mono opacity-40 uppercase tracking-widest p-2">Sincronizando Arsenal...</div>;
  if (workouts.length === 0) return <div className="text-[10px] italic opacity-40 p-2">Nenhum protocolo no arsenal.</div>;

  return (
    <>
      {workouts.map(w => (
        <div key={w.id} className="glass p-3 rounded-2xl flex items-center justify-between border border-white/5">
           <div>
             <h5 className="text-xs font-bold text-atheris-text">{w.title}</h5>
             <p className="text-[9px] mono opacity-40 uppercase">{w.exercises.length} Movimentos</p>
           </div>
           {w.completed ? (
             <span className="text-[8px] font-black uppercase text-atheris-accent px-2 py-0.5 rounded bg-atheris-accent/10 border border-atheris-accent/20">Finalizado</span>
           ) : (
             <span className="text-[8px] font-black uppercase text-blue-400 px-2 py-0.5 rounded bg-blue-400/10 border border-blue-400/20">Em Progresso</span>
           )}
        </div>
      ))}
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
        setCheckIns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CheckIn[]);
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
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-[100] bg-atheris-bg sm:max-w-md sm:mx-auto flex flex-col overflow-hidden">
       <header className="fixed top-0 left-0 w-full z-40 bg-atheris-bg/95 backdrop-blur-md px-4 pt-12 pb-4 flex items-center justify-between border-b border-white/5 sm:max-w-md sm:left-[50%] sm:translate-x-[-50%]">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full bg-white/5"><ChevronLeft size={24} /></button>
          <div className="flex items-center gap-2">
             <TrendingUp size={16} className="text-atheris-accent" />
             <h2 className="font-bold text-sm mono uppercase tracking-widest">Evolução Metabólica</h2>
          </div>
          <button onClick={onAssignWorkout} className="p-2 text-atheris-toxic hover:bg-white/5 rounded-full"><Plus size={24} /></button>
       </header>

       <div className="flex-1 overflow-y-auto p-6 pt-24 scrollbar-hide">
         <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-full bg-atheris-accent/10 flex items-center justify-center text-2xl font-bold text-atheris-accent border border-atheris-accent/20">{student.name[0]}</div>
            <div>
              <h3 className="text-2xl font-bold text-atheris-text leading-tight">{student.name}</h3>
              <p className="mono font-bold text-atheris-accent uppercase text-xs tracking-widest">{student.tier || 'Predador Scout'}</p>
            </div>
         </div>

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
  );
});

export const WorkoutCreatorModal = React.memo(({ student, coach, onClose, onCreated }: { student: User, coach: User, onClose: () => void, onCreated: () => void }) => {
  const [title, setTitle] = useState('');
  const [selectedExs, setSelectedExs] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const muscles = useMemo(() => Array.from(new Set(EXERCISE_LIBRARY.map(e => e.muscle))), []);
  const [selMuscle, setSelMuscle] = useState(muscles[0]);

  const filtered = useMemo(() => 
    EXERCISE_LIBRARY.filter(ex => ex.muscle === selMuscle && ex.name.toLowerCase().includes(search.toLowerCase())),
    [selMuscle, search]
  );

  const handleSave = async () => {
    if (!title || selectedExs.length === 0) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'workouts'), {
        title,
        studentId: student.id,
        authorId: coach.id,
        completed: false,
        exercises: selectedExs,
        createdAt: serverTimestamp()
      });
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[100] bg-atheris-bg sm:max-w-md sm:mx-auto flex flex-col overflow-hidden">
       <header className="p-4 pt-12 flex items-center justify-between border-b border-white/5 shadow-sm">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={24} /></button>
          <h2 className="font-bold uppercase tracking-tight">Criar Protocolo</h2>
          <button onClick={handleSave} disabled={saving || !title} className="p-2 text-atheris-accent"><Save size={24} /></button>
       </header>
       <div className="flex-1 overflow-y-auto p-4 scrollbar-hide pb-20">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do Protocolo" className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-xl font-bold mb-6 focus:border-atheris-accent outline-none" />
          <div className="mb-8">
             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
               {muscles.map(m => (
                 <button key={m} onClick={() => setSelMuscle(m)} className={classNames("px-4 py-2 rounded-xl mono uppercase text-[10px] tracking-widest whitespace-nowrap transition-all border", selMuscle === m ? "bg-atheris-accent text-black border-transparent font-black" : "bg-white/5 text-atheris-muted border-white/5")}>
                   {m}
                 </button>
               ))}
             </div>
             <div className="relative mb-4">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar Movimento..." className="w-full bg-atheris-text/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm" />
             </div>
             <div className="flex flex-col gap-3">
               {filtered.map(ex => (
                 <button key={ex.name} onClick={() => setSelectedExs(prev => [...prev, { ...ex, id: Date.now().toString() + Math.random(), sets: 3, reps: '12', weight: '0', restSeconds: 60 } as unknown as Exercise])} className="glass p-4 rounded-3xl flex items-center justify-between group">
                    <span className="font-bold text-sm">{ex.name}</span>
                    <Plus size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-atheris-accent" />
                 </button>
               ))}
             </div>
          </div>
          <div className="mb-6">
            <h4 className="mono uppercase text-[10px] opacity-60 mb-4 px-2">Estrutura do Ataque</h4>
            {selectedExs.map((ex, idx) => (
              <div key={ex.id} className="glass p-4 rounded-3xl mb-3">
                 <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-xs uppercase text-atheris-accent tracking-tighter">{ex.name}</span>
                    <button onClick={() => setSelectedExs(prev => prev.filter((_, i) => i !== idx))}><Trash2 size={16} className="text-red-500/50" /></button>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={ex.sets} onChange={(e) => setSelectedExs(prev => prev.map((item, i) => i === idx ? { ...item, sets: Number(e.target.value) } : item))} className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold" placeholder="SETS" />
                    <input value={ex.reps} onChange={(e) => setSelectedExs(prev => prev.map((item, i) => i === idx ? { ...item, reps: e.target.value } : item))} className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold" placeholder="REPS" />
                    <input value={ex.weight} onChange={(e) => setSelectedExs(prev => prev.map((item, i) => i === idx ? { ...item, weight: e.target.value } : item))} className="bg-white/5 rounded-xl p-2 text-center text-xs font-bold" placeholder="LOAD" />
                 </div>
              </div>
            ))}
          </div>
       </div>
    </motion.div>
  );
});
