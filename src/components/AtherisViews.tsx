import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, Users, Dumbbell, Trophy, Plus, CheckCircle2, ChevronLeft, Image as ImageIcon, Scale, TrendingUp, Search, Filter, Zap, Play } from 'lucide-react';
import { User, Workout } from '../types';
import { EXERCISE_LIBRARY } from '../exerciseLibrary';
import { predatorQuotes, mockWorkouts } from '../mockData';
import { classNames } from '../lib/utils';
import { collection, query, where, getDocs, db } from '../firebase';

export const getSnakeRank = (points: number) => {
  if (points >= 8000) return { name: "Atheris", color: "text-atheris-toxic", bg: "bg-atheris-toxic/20" };
  if (points >= 5000) return { name: "King Cobra", color: "text-red-500", bg: "bg-red-500/20" };
  if (points >= 3000) return { name: "Taipan", color: "text-orange-500", bg: "bg-orange-500/20" };
  if (points >= 1500) return { name: "Mamba", color: "text-gray-400", bg: "bg-gray-400/20" };
  if (points >= 500) return { name: "Coral", color: "text-red-400", bg: "bg-red-400/20" };
  return { name: "Jararaca", color: "text-atheris-accent", bg: "bg-atheris-accent/20" };
};

export const HomeView = React.memo(({ user, completedWorkouts, weeklyCompleted, weeklyGoal, onCheckIn }: {
  user: User,
  completedWorkouts: number,
  weeklyCompleted: number,
  weeklyGoal: number,
  onCheckIn: () => void
}) => {
  const rank = getSnakeRank(user.points || 0);
  const [quote, setQuote] = useState(predatorQuotes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(predatorQuotes[Math.floor(Math.random() * predatorQuotes.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 pt-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            {user.role === 'coach' ? 'Treinador' : 'Víbora'} {user.name.split(' ')[0]}
          </h2>
          <span className={classNames("px-2 py-0.5 rounded text-[10px] uppercase font-black border border-white/10", user.role === 'coach' ? 'text-atheris-toxic bg-atheris-toxic/20' : rank.color, user.role === 'coach' ? '' : rank.bg)}>
            {user.role === 'coach' ? 'Treinador Alfa' : rank.name}
          </span>
        </div>
        {user.role === 'student' && (
          <button 
            onClick={onCheckIn}
            className="p-3 bg-atheris-text/5 border border-white/10 rounded-2xl text-atheris-accent hover:bg-atheris-text/10 transition-colors"
            title="Troca de Pele (Check-in)"
          >
            <Scale size={20} />
          </button>
        )}
      </div>
    
    {user.role === 'student' ? (
      <>
        <div className="glass rounded-2xl p-6 mb-6 flex flex-col items-center shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 viper-pattern opacity-20"></div>
          <span className="mono opacity-60 uppercase mb-1 z-10">Reservatório de Veneno (V-PTS)</span>
          <span className="font-mono text-5xl font-light text-atheris-text z-10">{user.points} <span className="text-xl accent-text font-bold">V-PTS</span></span>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 glass rounded-2xl p-5 shadow-lg relative group">
             <div className="absolute top-0 right-0 p-2 opacity-10"><Zap size={20} className="text-atheris-accent"/></div>
             <span className="block mono opacity-60 uppercase mb-2 text-[10px]">Botes</span>
             <span className="block text-5xl font-light text-atheris-text">{completedWorkouts}</span>
          </div>
          <div className="flex-1 glass rounded-2xl p-5 shadow-lg relative group">
             <div className="absolute top-0 right-0 p-2 opacity-10"><Trophy size={18} className="text-atheris-toxic"/></div>
             <span className="block mono opacity-60 uppercase mb-2 text-[10px]">Toxinas (Sem.)</span>
             <div className="flex items-end gap-2">
               <span className="block text-5xl font-light text-atheris-text">{weeklyCompleted}</span>
               <span className="block text-xs mb-2 opacity-40 font-mono">/ {weeklyGoal}</span>
             </div>
          </div>
        </div>

        {/* Predator Quote */}
        <div className="mb-8 p-6 glass rounded-3xl border-l-4 border-atheris-accent relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={40} /></div>
           <p className="text-atheris-text/80 italic text-sm leading-relaxed relative z-10">"{quote}"</p>
           <p className="mono text-[10px] uppercase mt-4 text-atheris-accent tracking-widest font-bold">— MANTRA ATHERIS</p>
        </div>

        {/* Quick Hits */}
        <section className="mb-6">
           <h3 className="mono text-xs uppercase opacity-50 mb-4 tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-atheris-accent" /> Bote Rápido
           </h3>
           <div className="grid grid-cols-2 gap-4">
              <button className="glass p-4 rounded-2xl text-left hover:bg-white/5 transition-colors border-l-2 border-l-blue-500">
                 <span className="block text-xs font-bold mb-1">Mobilidade Flow</span>
                 <span className="block text-[10px] opacity-40 uppercase">12 min • Reação</span>
              </button>
              <button className="glass p-4 rounded-2xl text-left hover:bg-white/5 transition-colors border-l-2 border-l-atheris-toxic">
                 <span className="block text-xs font-bold mb-1">Inoculação HIT</span>
                 <span className="block text-[10px] opacity-40 uppercase">20 min • Intenso</span>
              </button>
           </div>
        </section>
      </>
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-60">
        <Users size={64} className="mb-4" />
        <p className="text-center italic">Bem-vindo, Treinador Especialista.<br/>Suas víboras o aguardam no Ninho.</p>
      </div>
    )}
    </motion.div>
  );
});

export const TreinosView = React.memo(({ currentUser, onExecute }: {
  currentUser: User,
  onExecute: (w: Workout) => void
}) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const q = query(collection(db, 'workouts'), where('studentId', '==', currentUser.id));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Workout[];
        setWorkouts(list.length > 0 ? list : mockWorkouts.filter(w => w.studentId === currentUser.id));
      } catch (err) {
        setWorkouts(mockWorkouts.filter(w => w.studentId === currentUser.id));
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, [currentUser.id]);

  if (loading) return <div className="p-6 pt-20 text-center opacity-50 mono uppercase tracking-widest text-xs">Escaneando Protocolos...</div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 pt-24">
      <h2 className="text-3xl font-black mb-8 tracking-tighter uppercase">Arsenal de Ataque</h2>

      <div className="flex flex-col gap-4">
        {workouts.map(workout => (
          <div key={workout.id} className="glass p-5 rounded-3xl relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="text-lg font-bold text-atheris-text">{workout.title}</h3>
                 <p className="text-xs opacity-50 mono uppercase mt-1 tracking-widest">{workout.exercises.length} Movimentos</p>
               </div>
               {workout.completed ? (
                 <span className="bg-atheris-accent/20 text-atheris-accent px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-atheris-accent/30">Protocolado</span>
               ) : (
                 <button 
                  onClick={() => onExecute(workout)}
                  className="bg-atheris-accent text-black p-3 rounded-xl shadow-[0_0_20px_rgba(34,255,95,0.3)] hover:scale-105 transition-transform"
                 >
                   <Play size={20} fill="currentColor" />
                 </button>
               )}
             </div>

             <div className="flex gap-1">
                {workout.exercises.slice(0, 5).map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-atheris-accent/20 rounded-full overflow-hidden">
                     {workout.completed && <div className="h-full w-full bg-atheris-accent"></div>}
                  </div>
                ))}
             </div>
          </div>
        ))}

        {workouts.length === 0 && (
          <div className="text-center py-20 opacity-40 flex flex-col items-center">
            <Dumbbell size={48} className="mb-4" />
            <p className="italic">Nenhum protocolo ativo encontrado.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export const AlunosView = React.memo(({ currentUser, onSelectStudent, onAssignWorkout }: {
  currentUser: User,
  onSelectStudent: (s: User) => void,
  onAssignWorkout: (s: User) => void
}) => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'), where('coachId', '==', currentUser.id));
        const snap = await getDocs(q);
        setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [currentUser.id]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-6 pt-24">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">O Ninho</h2>
        <p className="text-atheris-muted text-sm mono uppercase tracking-widest px-1">Seu Habitat de Treinamento</p>
      </div>

      {/* Coach Stats Dashboard */}
      <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass p-5 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10"><Users size={24} className="text-atheris-accent" /></div>
              <span className="block mono text-[9px] uppercase opacity-50 mb-1">Víboras</span>
              <span className="text-4xl font-light text-atheris-text">{students.length}</span>
          </div>
          <div className="glass p-5 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10"><Zap size={24} className="text-atheris-toxic" /></div>
              <span className="block mono text-[9px] uppercase opacity-50 mb-1">Inóculos (Hoje)</span>
              <span className="text-4xl font-light text-atheris-text">0</span>
          </div>
      </div>

      <div className="flex flex-col gap-4">
        {students.map(student => (
          <button 
            key={student.id} 
            onClick={() => onSelectStudent(student)}
            className="group glass p-4 rounded-3xl flex items-center justify-between hover:bg-white/5 transition-all text-left relative overflow-hidden"
          >
             <div className="absolute inset-0 viper-pattern opacity-0 group-hover:opacity-10 transition-opacity"></div>
             <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-atheris-accent font-black">
                      {student.name[0]}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-atheris-accent border-2 border-atheris-bg shadow-sm"></div>
                </div>
                <div>
                   <h3 className="font-bold text-atheris-text">{student.name}</h3>
                   <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] mono uppercase text-atheris-muted">Peso Estável</span>
                   </div>
                </div>
             </div>
             <div className="flex flex-col items-end gap-1 relative z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); onAssignWorkout(student); }}
                  className="p-3 bg-atheris-accent/10 border border-atheris-accent/30 rounded-xl text-atheris-accent hover:bg-atheris-accent hover:text-black transition-all mb-1"
                  title="Atribuir Protocolo"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-1 opacity-20">
                   <span className="text-[10px] font-mono leading-none">{student.points}</span>
                   <ChevronLeft size={12} className="rotate-180" />
                </div>
             </div>
          </button>
        ))}

        {students.length === 0 && !loading && (
          <div className="text-center py-20 opacity-30 border-2 border-dashed border-white/5 rounded-3xl">
             <Plus size={48} className="mx-auto mb-4" />
             <p className="italic">Nenhuma víbora encontrada no seu ninho.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export const RankView = React.memo(() => {
  const [ranked, setRanked] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        setRanked(list.sort((a, b) => (b.points || 0) - (a.points || 0)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRank();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="p-6 pt-24">
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-16 h-16 rounded-3xl bg-atheris-toxic/20 flex items-center justify-center text-atheris-toxic mb-4 shadow-[0_0_30px_rgba(223,255,0,0.2)] border border-atheris-toxic/30">
          <Trophy size={32} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Hierarquia de Predadores</h2>
        <p className="text-sm opacity-50 mono uppercase mt-1 tracking-widest">Os mais letais da temporada</p>
      </div>

      <div className="flex flex-col gap-3">
        {ranked.map((user, index) => {
          const rank = getSnakeRank(user.points || 0);
          return (
            <div key={user.id} className={classNames("glass p-4 rounded-3xl flex items-center gap-4 border", index === 0 ? "border-atheris-toxic/40 bg-atheris-toxic/5" : "border-white/5")}>
               <div className="w-8 flex flex-col items-center">
                 {index === 0 ? <Trophy size={20} className="text-atheris-toxic" /> : <span className="mono font-black opacity-30 text-lg">#{index + 1}</span>}
               </div>

               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                 {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="font-bold text-atheris-muted">{user.name[0]}</span>}
               </div>

               <div className="flex-1">
                 <h4 className="font-bold text-atheris-text flex items-center gap-2">
                   {user.name}
                   {index < 3 && <div className="w-1.5 h-1.5 rounded-full bg-atheris-accent animate-pulse" />}
                 </h4>
                 <div className="flex items-center gap-2 mt-0.5">
                   <span className={classNames("text-[9px] mono uppercase font-black px-1.5 rounded-md border border-white/10", rank.color, rank.bg)}>
                     {rank.name}
                   </span>
                 </div>
               </div>

               <div className="text-right">
                 <span className="block font-mono text-lg font-light text-atheris-text">{user.points}</span>
                 <span className="block mono text-[8px] opacity-40 uppercase tracking-widest -mt-1 font-bold">V-PTS</span>
               </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});
