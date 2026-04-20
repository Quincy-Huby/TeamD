import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Users, Dumbbell, Trophy, Plus, Info, CheckCircle2, ChevronLeft, LogOut, Image as ImageIcon, Play, RotateCcw, Zap } from 'lucide-react';
import { User, Workout, Exercise, Role } from './types';
import { mockUsers, mockWorkouts, gymJokes } from './mockData';

import { signInWithGoogle, logout, db, auth, handleFirestoreError, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';

// --- STYLING HELPERS ---
const classNames = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// --- BACKGROUND ---
const BackgroundBlobs = () => (
  <>
    <div className="aura-green"></div>
    <div className="aura-purple"></div>
    <div className="viper-pattern"></div>
  </>
);

// --- LOGIN COMPONENT ---
const Login = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      // App level onAuthStateChanged will handle the rest
    } catch (err: any) {
      console.error(err);
      setError('Falha ao autenticar com Google. ' + (err.message || ''));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres.');
        }
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        // The onAuthStateChanged listener handles creating the document. 
        // It will pick up the displayName we just set.
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'recover') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Este e-mail já está em uso.');
      else if (err.code === 'auth/invalid-credential') setError('Credenciais inválidas.');
      else setError(err.message || 'Ocorreu um erro.');
    } finally {
      if (mode !== 'login' && mode !== 'register') {
        setLoading(false); // Do not disable loading if transitioning directly to app state
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-sm mx-auto">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
        <h1 className="text-5xl font-black mb-2 text-center tracking-tighter text-white">TEAM D</h1>
        <p className="text-pastel-accent font-mono text-sm text-center mb-8 tracking-widest uppercase">
           {mode === 'login' ? 'Consultoria & Treino' : mode === 'register' ? 'Criar Conta' : 'Redefinir Senha'}
        </p>
        
        <form onSubmit={handleSubmit} className="glass p-6 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col gap-4">
           {error && (
             <div className="bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl text-xs font-medium text-center">
               {error}
             </div>
           )}
           {success && (
             <div className="bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/30 p-3 rounded-xl text-xs font-medium text-center">
               {success}
             </div>
           )}

          {mode === 'register' && (
             <div>
               <label className="mono opacity-60 uppercase mb-2 block">Nome Completo</label>
               <input 
                 type="text" 
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pastel-accent transition-colors"
                 required 
                 disabled={loading}
               />
             </div>
          )}

          <div>
            <label className="mono opacity-60 uppercase mb-2 block">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pastel-accent transition-colors"
              required 
              disabled={loading}
            />
          </div>

          {mode !== 'recover' && (
            <div>
              <label className="mono opacity-60 uppercase mb-2 block">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pastel-accent transition-colors"
                required
                disabled={loading}
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="mono opacity-60 uppercase mb-2 block">Confirmar Senha</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pastel-accent transition-colors"
                required 
                disabled={loading}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full accent-bg text-black font-bold py-3 px-4 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all uppercase tracking-wide disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : (mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Redefinir')}
          </button>

          <div className="flex flex-col gap-2 mt-2">
            {mode === 'login' ? (
              <>
                <button type="button" onClick={() => {setMode('register'); setError(''); setSuccess('');}} className="text-xs text-white/50 hover:text-white transition-colors mono uppercase">Não tem conta? Cadastre-se</button>
                <button type="button" onClick={() => {setMode('recover'); setError(''); setSuccess('');}} className="text-xs text-white/50 hover:text-white transition-colors mono uppercase">Esqueceu a senha?</button>
              </>
            ) : (
              <button type="button" onClick={() => {setMode('login'); setError(''); setSuccess('');}} className="text-xs text-white/50 hover:text-white transition-colors mono uppercase">Voltar ao Login</button>
            )}
          </div>

          <div className="flex items-center gap-4 my-2 opacity-50">
            <div className="h-px bg-white flex-1"></div>
            <span className="mono text-[10px] uppercase">Ou logar via</span>
            <div className="h-px bg-white flex-1"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all tracking-wide flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Entrar com Google
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- HEADER ---
const Header = ({ user, onLogout, onSimulatePush, isDarkMode, setIsDarkMode }: { user: User; onLogout: () => void; onSimulatePush: () => void; isDarkMode: boolean; setIsDarkMode: (v: boolean) => void }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
    <header className="sticky top-0 z-40 glass px-6 pt-10 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-3 relative">
        <button onClick={() => fileInputRef.current?.click()} className="relative group focus:outline-none">
          <div className="w-10 h-10 rounded-full accent-bg border-2 border-white/20 flex items-center justify-center text-black font-bold overflow-hidden shadow-lg">
            {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
        </button>

        <div className="flex flex-col">
          <span className="font-extrabold text-xl text-pastel-text leading-none tracking-tighter">TEAM D</span>
          <span className="mono accent-text uppercase">{user.role === 'coach' ? 'TREINADOR PRO' : 'ATLETA PRO'}</span>
        </div>
      </div>

      <div className="relative">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-pastel-text border border-white/5 hover:border-pastel-accent transition-colors"
        >
          <Plus size={20} />
        </button>
        
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-12 right-0 w-56 glass rounded-2xl shadow-xl overflow-hidden py-1 z-50 origin-top-right"
            >
              <button onClick={() => { setSettingsOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-pastel-text flex items-center gap-3 hover:bg-white/5 transition-colors">
                 Configurações
              </button>

              <button onClick={() => { onSimulatePush(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-pastel-text flex items-center gap-3 hover:bg-white/5 transition-colors">
                 <Zap size={16} className="text-[#00ff66]" /> Simular Push
              </button>

              <div className="h-px w-full bg-pastel-border my-1"></div>
              <button onClick={() => { onLogout(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-red-500 font-medium flex items-center gap-3 hover:bg-white/5 transition-colors">
                <LogOut size={16} /> Sair da conta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>

    <AnimatePresence>
      {settingsOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm px-4 flex items-center justify-center"
        >
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="w-full max-w-sm glass rounded-3xl p-6 shadow-2xl relative">
             <button onClick={() => setSettingsOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full"><ChevronLeft size={20} className="rotate-[-90deg]" /></button>
             <h2 className="text-xl font-bold mb-6 text-pastel-text">Configurações</h2>
             
             <div className="flex items-center justify-between mb-4">
               <div>
                 <h3 className="font-medium text-pastel-text">Tema Visual</h3>
                 <p className="text-xs opacity-60">Alternar entre claro e escuro</p>
               </div>
               <button 
                 onClick={() => setIsDarkMode(!isDarkMode)}
                 className={classNames("w-14 h-8 rounded-full p-1 transition-colors flex items-center", isDarkMode ? "bg-white/20" : "bg-pastel-accent")}
               >
                  <motion.div 
                    layout 
                    className="w-6 h-6 rounded-full bg-white shadow-md"
                    initial={false}
                    animate={{ x: isDarkMode ? 0 : 24 }}
                  />
               </button>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

// --- TAB BAR ---
const TabBar = ({ role, activeTab, setActiveTab }: { role: Role; activeTab: string; setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    role === 'coach' ? { id: 'alunos', icon: Users, label: 'Alunos' } : { id: 'treinos', icon: Dumbbell, label: 'Treinos' },
    { id: 'rank', icon: Trophy, label: 'Rank' }
  ];

  return (
    <nav className="absolute bottom-0 left-0 w-full glass h-20 flex items-center justify-around px-8 border-t border-white/5 z-50">
      <div className="w-full flex justify-between items-center sm:static sm:w-auto sm:max-w-md sm:mx-auto">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames("flex flex-col items-center gap-1 focus:outline-none", isActive ? "accent-text" : "opacity-40")}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 2} />
              <span className="text-[8px] mono uppercase tracking-tighter">{tab.label}</span>
              {isActive && (
                <motion.div layoutId="tab-indicator" className="w-1 h-1 rounded-full accent-bg" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// --- VIEWS ---
const HomeView: React.FC<{ user: User, completedWorkouts: number, weeklyCompleted: number, weeklyGoal: number }> = ({ user, completedWorkouts, weeklyCompleted, weeklyGoal }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6">
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-2xl font-bold">Bom dia, {user.name.split(' ')[0]}</h2>
      {user.tier && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-pastel-card border border-white/10 text-pastel-accent">{user.tier}</span>}
    </div>
    
    {user.role === 'student' ? (
      <>
        <div className="glass rounded-2xl p-6 mb-6 flex flex-col items-center shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 viper-pattern opacity-10"></div>
          <span className="mono opacity-60 uppercase mb-1 z-10">Pontuação Atual</span>
          <span className="font-mono text-5xl font-light text-pastel-text z-10">{user.points} <span className="text-xl accent-text font-bold">PTS</span></span>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 glass rounded-2xl p-5 shadow-lg">
             <span className="block mono opacity-60 uppercase mb-2">Treinos</span>
             <span className="block text-5xl font-light text-pastel-text">{completedWorkouts}</span>
          </div>
          <div className="flex-1 glass rounded-2xl p-5 flex flex-col justify-between shadow-lg">
             <span className="block mono opacity-60 uppercase mb-2">Meta Semanal</span>
             <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-2xl font-medium text-pastel-text">{weeklyCompleted}<span className="text-sm opacity-60">/{weeklyGoal}</span></span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="accent-bg h-full rounded-full shadow-[0_0_10px_rgba(0,255,102,0.5)] transition-all duration-1000" style={{ width: `${Math.min((weeklyCompleted/weeklyGoal)*100, 100)}%`}}></div>
                </div>
             </div>
          </div>
        </div>
      </>
    ) : (
      <div className="glass rounded-2xl p-6 mb-6 shadow-lg">
        <h3 className="font-bold text-xl mb-2 text-pastel-text">Resumo da Equipe</h3>
        <p className="opacity-60 text-sm mb-4">Você tem alunos ativos precisando de avaliações! Verifique a aba de acompanhamento para mandar novas prescrições e gerenciar suas evoluções.</p>
        <div className="flex items-center gap-2">
            <span className="mono uppercase accent-text">1 Aluno Aguardando Feedback</span>
        </div>
      </div>
    )}
  </motion.div>
);

const TreinosView = ({ currentUser, onExecute }: { currentUser: User, onExecute: (w: Workout) => void }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchW = async () => {
      try {
        const q = query(collection(db, 'workouts'), where('assignedTo', '==', currentUser.id), where('completed', '==', false));
        const snap = await getDocs(q);
        const wks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Workout));
        setWorkouts(wks);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchW();
  }, [currentUser.id]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6">
       <h2 className="text-2xl font-bold mb-6">Seus Treinos</h2>
       <div className="flex flex-col gap-4">
         {loading ? <p className="text-center opacity-50 py-10">Buscando treinos...</p> : 
          workouts.length === 0 ? (
            <div className="text-center py-10 opacity-50 bg-white/5 rounded-2xl">
              <Dumbbell className="mx-auto block mb-2 opacity-50" size={32}/>
              <p>Nenhum treino pendente.</p>
            </div>
          ) : (
            workouts.map(w => (
              <button onClick={() => onExecute(w)} key={w.id} className="glass p-5 rounded-2xl flex items-center justify-between hover:border-pastel-accent/50 transition-colors text-left group shadow-lg">
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-pastel-accent transition-colors">{w.title}</h3>
                  <p className="mono opacity-60 uppercase mt-1">{w.exercises.length} Exercícios</p>
                </div>
                <Play className="text-pastel-accent opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )
         }
       </div>
    </motion.div>
  );
};

const RankView: React.FC = () => {
  const [ranked, setRanked] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const medals = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snap = await getDocs(q);
        const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        users.sort((a,b) => (b.points || 0) - (a.points || 0));
        setRanked(users);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchRank();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6">
      <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
      <div className="flex flex-col gap-3">
         {loading ? <p className="opacity-50 text-center py-10">Carregando rank...</p> : 
            ranked.map((u, i) => (
            <div key={u.id} className="glass p-4 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className={classNames("w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono", i < 3 ? 'bg-white/10' : 'bg-transparent text-pastel-muted')}>
                {i < 3 ? <Trophy size={16} className={medals[i]} /> : i + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{u.name}</h3>
                {u.tier && <span className="mono opacity-60 uppercase">{u.tier}</span>}
              </div>
              <div className="text-right">
                <span className="font-mono text-xl text-white">{u.points || 0}</span>
                <span className="mono accent-text ml-1 uppercase">pts</span>
              </div>
            </div>
         ))}
      </div>
    </motion.div>
  )
};

const AlunosView = ({ currentUser }: { currentUser: User }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'student')
        );
        const querySnapshot = await getDocs(q);
        const st = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setStudents(st);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Alunos</h2>
        <button className="w-10 h-10 rounded-full bg-pastel-accent text-black flex items-center justify-center"><Plus size={20}/></button>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
             <p className="opacity-50 text-center py-10">Carregando alunos...</p>
        ) : students.length === 0 ? (
             <div className="text-center py-10 opacity-50 bg-white/5 rounded-2xl">
                 <p>Nenhum aluno encontrado.</p>
                 <p className="text-xs mt-2 text-pastel-accent">Novos alunos aparecerão aqui ao se cadastrarem.</p>
             </div>
        ) : (
          students.map(s => (
            <div key={s.id} className="glass p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors shadow-lg">
              <div>
                <h3 className="font-bold text-white text-lg">{s.name}</h3>
                <p className="mono opacity-60 uppercase mt-1">{s.points || 0} PTS • {s.tier || 'Iniciante'}</p>
              </div>
              <ChevronLeft size={20} className="transform rotate-180 text-pastel-muted" />
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
};

// --- WORKOUT EXECUTION MODALS ---
const TimerBar = ({ activeRestState, onSkip }: { activeRestState: { secs: number, id: number } | null, onSkip: () => void }) => {
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
       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
         <motion.div initial={{ width: '100%' }} animate={{ width: `${(timeLeft / activeRestState.secs) * 100}%` }} transition={{ duration: 1 }} className="h-full accent-bg"></motion.div>
       </div>
       <p className="text-[10px] font-medium italic opacity-80 mt-3 text-center">"{joke}"</p>
       <div className="flex gap-2 mt-3">
         <button onClick={onSkip} className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] uppercase tracking-widest transition-colors font-black text-white">Pular</button>
       </div>
    </motion.div>
  )
};

const ExerciseInfoModal = ({ ex, onClose }: { ex: Exercise, onClose: () => void }) => {
  return (
     <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-x-0 bottom-0 z-50 glass border-b-0 rounded-t-3xl flex flex-col max-h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
     >
        <div className="p-2 flex justify-center">
           <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="p-6 flex-1 overflow-y-auto pb-10">
           <div className="flex justify-between items-start mb-4">
             <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{ex.name}</h3>
             <button onClick={onClose} className="p-2 -mr-2 bg-white/5 rounded-full"><ChevronLeft size={20} className="rotate-[-90deg]" /></button>
           </div>
           
           <div className="flex gap-2 mb-6 flex-wrap">
              <span className="px-3 py-1 rounded bg-white/10 text-white mono uppercase border border-white/5">{ex.muscleGroup}</span>
              <span className={classNames("px-3 py-1 rounded mono uppercase border border-white/5", 
                 ex.difficulty === 'Iniciante' ? 'bg-[#00ff66]/20 text-[#00ff66]' : 
                 ex.difficulty === 'Avançado' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
              )}>{ex.difficulty}</span>
           </div>

           <div className="mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
             <h4 className="mono opacity-60 uppercase mb-2 flex items-center gap-2"><CheckCircle2 size={12}/> Propósito</h4>
             <p className="text-sm leading-relaxed text-white/90">{ex.purpose}</p>
           </div>

           <div className="mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
             <h4 className="mono opacity-60 uppercase mb-2 flex items-center gap-2"><Info size={12}/> Instruções</h4>
             <p className="text-sm leading-relaxed text-white/90 whitespace-pre-line">{ex.instructions}</p>
           </div>

           {ex.demoUrl && (
              <button onClick={() => window.open(ex.demoUrl, '_blank')} className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:border-[#00ff66] hover:text-[#00ff66] transition-colors">
                 Ver Demonstração
              </button>
           )}
        </div>
     </motion.div>
  )
};

const ExecuteWorkoutModal = ({ workout, currentUser, onClose }: { workout: Workout, currentUser: User, onClose: () => void }) => {
  const [activeRestState, setActiveRestState] = useState<{secs: number, id: number} | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // Execution tracking
  const [startTime] = useState<number>(Date.now());
  const [finishing, setFinishing] = useState(false);
  const [rpe, setRpe] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const startRest = (secs: number) => {
    setActiveRestState({ secs, id: Date.now() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = async () => {
    if (!finishing) {
        setFinishing(true);
        return;
    }
    
    // Save to Firebase
    setSaving(true);
    try {
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        const newPoints = currentUser.points + 100;
        
        // 1. Save Session
        await addDoc(collection(db, 'sessions'), {
            studentId: currentUser.id,
            coachId: currentUser.coachId,
            workoutId: workout.id,
            durationSeconds,
            rpe,
            notes,
            createdAt: serverTimestamp()
        });

        // 2. Mark Workout as Completed
        const ref = doc(db, 'workouts', workout.id);
        const docSnap = await getDoc(ref);
        if (docSnap.exists()) {
             await updateDoc(ref, { completed: true });
        }

        // 3. Update User Points
        await updateDoc(doc(db, 'users', currentUser.id), {
            points: newPoints
        });

        onClose();
    } catch (err) {
        console.error("Error saving session", err);
        alert("Ocorreu um erro ao salvar o treino.");
    } finally {
        setSaving(false);
    }
  };

  return (
    <motion.div 
       initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
       className="fixed inset-0 z-50 bg-pastel-bg sm:max-w-md sm:mx-auto flex flex-col overflow-hidden"
    >
       <header className="sticky top-0 z-40 bg-pastel-bg/90 backdrop-blur-2xl border-b border-pastel-border px-4 py-4 flex items-center gap-3 shadow-sm">
         <button onClick={onClose} disabled={saving} className="p-2 -ml-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
           <ChevronLeft size={24} />
         </button>
         <h2 className="font-bold text-lg truncate flex-1 text-white">{workout.title}</h2>
       </header>

       {!finishing ? (
         <>
           <TimerBar activeRestState={activeRestState} onSkip={() => setActiveRestState(null)} />

           <div className="flex-1 overflow-y-auto p-4 pb-32">
             {workout.exercises.map(ex => (
               <div key={ex.id} className="glass p-4 rounded-2xl mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-base flex-1 pr-4">{ex.name}</h3>
                    <button onClick={() => setSelectedExercise(ex)} className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                      <Info size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-5">
                     <div className="bg-white/5 rounded-lg p-2 text-center">
                       <span className="mono opacity-50 block mb-1">SÉRIES</span>
                       <span className="font-bold">{ex.sets}</span>
                     </div>
                     <div className="bg-white/5 rounded-lg p-2 text-center">
                       <span className="mono opacity-50 block mb-1">REPS</span>
                       <span className="font-bold">{ex.reps}</span>
                     </div>
                     <div className="bg-white/5 rounded-lg p-2 text-center">
                       <span className="mono opacity-50 block mb-1">CARGA</span>
                       <span className="font-bold accent-text">{ex.weight}</span>
                     </div>
                  </div>

                  <button 
                    onClick={() => startRest(ex.restSeconds)} 
                    className="w-full py-3 rounded-xl border border-[#00ff66]/30 text-[#00ff66] font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#00ff66] hover:text-black transition-colors"
                  >
                     Reiniciar Descanso ({ex.restSeconds}s)
                  </button>
               </div>
             ))}

             {workout.exercises.length === 0 && (
               <div className="text-center py-10 text-pastel-muted flex flex-col items-center gap-3">
                 <Dumbbell size={48} opacity={0.2} />
                 <p>Nenhum exercício adicionado a este treino.</p>
               </div>
             )}

             <button onClick={handleFinish} className="mt-8 w-full py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[0.98] transition-transform mb-8">
                <CheckCircle2 size={24} className="inline-block mr-2" /> Finalizar Treino
             </button>
           </div>
         </>
       ) : (
         <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center fade-in">
             <div className="w-20 h-20 rounded-full accent-bg flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,255,102,0.4)]">
                 <CheckCircle2 size={40} className="text-black" />
             </div>
             <h2 className="text-3xl font-black text-white mb-2">Treino Finalizado!</h2>
             <p className="text-pastel-muted text-center mb-10">Mande seu relatório para o treinador.</p>

             <div className="w-full glass p-6 rounded-3xl mb-6">
                 <label className="block mono font-bold opacity-80 mb-4 text-center">RPE (Esforço Percebido)</label>
                 <div className="flex justify-between items-center mb-2 px-2">
                     <span className="text-xs text-[#00ff66]">Muito Leve</span>
                     <span className="text-2xl font-black">{rpe}</span>
                     <span className="text-xs text-red-500">Exaustivo</span>
                 </div>
                 <input 
                    type="range" min="1" max="10" step="1" 
                    value={rpe} onChange={(e) => setRpe(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none bg-white/10 outline-none thumb-accent"
                 />
                 <style dangerouslySetInnerHTML={{__html: `
                    input[type=range]::-webkit-slider-thumb {
                        appearance: none;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: #00ff66;
                        cursor: pointer;
                    }
                 `}} />
             </div>

             <div className="w-full mb-8">
                 <label className="block mono font-bold opacity-80 mb-2">Notas / Feedback (Opcional)</label>
                 <textarea 
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sentiu alguma dor? O tempo estava curto?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#00ff66] transition-colors resize-none h-32"
                 />
             </div>

             <button onClick={handleFinish} disabled={saving} className="w-full py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? 'Enviando...' : 'Salvar no Diário'}
             </button>
         </div>
       )}

       {/* Info Modal */}
       <AnimatePresence>
         {selectedExercise && (
            <ExerciseInfoModal ex={selectedExercise} onClose={() => setSelectedExercise(null)} />
         )}
       </AnimatePresence>
    </motion.div>
  );
};

// --- NOTIFICATIONS & SCORING ---
type NotificationType = 'achievement' | 'alert' | 'info';
interface NotificationData { id: string; title: string; message: string; type: NotificationType; }

// --- MAIN APP ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [executingWorkout, setExecutingWorkout] = useState<Workout | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sync Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
             // Create standard user or coach if bypass email matches
             const isBypassCoach = authUser.email?.toLowerCase() === 'blackwoodstock1985@gmail.com';
             const newUser = {
                id: authUser.uid,
                name: isBypassCoach ? 'Daniel' : (authUser.displayName || 'Atleta Novo'),
                email: authUser.email || '',
                role: isBypassCoach ? 'coach' : 'student',
                points: 0,
                tier: isBypassCoach ? 'Coach Pro' : 'Iniciante',
                avatar: authUser.photoURL || '',
                createdAt: serverTimestamp(),
                coachId: isBypassCoach ? '' : 'coach_daniel' 
             };
             await setDoc(doc(db, 'users', authUser.uid), newUser);
             setCurrentUser(newUser as unknown as User);
          }
        } catch(e) {
          console.error("Auth sync error", e);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Scoring Setup
  const [completedWorkouts, setCompletedWorkouts] = useState(12);
  const [weeklyCompleted, setWeeklyCompleted] = useState(3);
  const weeklyGoal = 5;

  // Notification System
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (title: string, message: string, type: NotificationType = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleFinishWorkout = () => {
    if (!currentUser) return;

    let earnedPoints = 50;
    let newWeekly = weeklyCompleted + 1;
    let newTotal = completedWorkouts + 1;

    addNotification('Treino Concluído!', `Sensacional! Você ganhou +50 PTS.`, 'achievement');

    if (newWeekly === weeklyGoal) {
      earnedPoints += 100;
      addNotification('Meta Semanal Atingida!', `Quebrou tudo! +100 PTS de Bônus.`, 'achievement');
      newWeekly = 0; // reset for next goal block
    }

    setCompletedWorkouts(newTotal);
    setWeeklyCompleted(newWeekly);
    setCurrentUser(prev => prev ? { ...prev, points: prev.points + earnedPoints } : null);
    setExecutingWorkout(null);
  };

  // Prevent scroll bounce on iOS
  useEffect(() => {
    document.body.addEventListener('touchmove', function(e) {
      if (e.target === document.body) e.preventDefault();
    }, { passive: false });
  }, []);

  return (
    <div className={classNames("h-[100dvh] w-full relative sm:max-w-md sm:mx-auto sm:border-x border-pastel-border flex flex-col text-pastel-text overflow-hidden selection:bg-pastel-accent/30 bg-pastel-bg sm:shadow-2xl transition-colors duration-500", !isDarkMode && "light-mode")}>
      <BackgroundBlobs />
      
      {/* NOTIFICATION TOASTS */}
      <div className="fixed top-14 left-0 w-full px-4 z-[100] flex flex-col gap-2 pointer-events-none items-center sm:max-w-md sm:translate-x-[-50%] sm:left-[50%]">
         <AnimatePresence>
           {notifications.map(n => (
             <motion.div 
                key={n.id} 
                initial={{ opacity: 0, y: -50, scale: 0.9 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={classNames("w-full max-w-sm glass border p-4 rounded-2xl flex items-center gap-3 shadow-2xl", n.type === 'achievement' ? 'border-[#00ff66]/30' : 'border-white/10')}
             >
               <div className={classNames("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", n.type === 'achievement' ? 'accent-bg text-black border-transparent' : 'bg-white/10 border-white/5')}>
                 {n.type === 'achievement' ? <Trophy size={20} /> : <Info size={20} />}
               </div>
               <div>
                 <h4 className="font-bold text-white text-sm">{n.title}</h4>
                 <p className="text-xs text-white/70 mt-1 leading-snug">{n.message}</p>
               </div>
             </motion.div>
           ))}
         </AnimatePresence>
      </div>

      {!currentUser ? (
        <AnimatePresence>
           <Login onLogin={setCurrentUser} />
        </AnimatePresence>
      ) : (
        <>
          <Header user={currentUser} onLogout={() => { logout(); setActiveTab('home'); }} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onSimulatePush={() => {
             if (currentUser.role === 'coach') {
                addNotification('Novo Aluno Adicionado', 'Carlos entrou para o seu time de alunos.', 'info');
             } else {
                addNotification('Lembrete do Treino', 'Bora treinar? O Coach atualizou a sua série!', 'info');
             }
          }} />
          
          <main className="flex-1 overflow-y-auto relative z-10 scrollbar-hide pb-20 sm:pb-0">
            <AnimatePresence mode="popLayout">
              {activeTab === 'home' && <HomeView key="home" user={currentUser} completedWorkouts={completedWorkouts} weeklyCompleted={weeklyCompleted} weeklyGoal={weeklyGoal} />}
              {activeTab === 'treinos' && <TreinosView key="treinos" currentUser={currentUser} onExecute={setExecutingWorkout} />}
              {activeTab === 'alunos' && <AlunosView key="alunos" currentUser={currentUser} />}
              {activeTab === 'rank' && <RankView key="rank" />}
            </AnimatePresence>
          </main>
          
          <TabBar role={currentUser.role} activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}

      {/* FULLSCREEN MODALS */}
      <AnimatePresence>
         {executingWorkout && currentUser && <ExecuteWorkoutModal workout={executingWorkout} currentUser={currentUser} onClose={handleFinishWorkout} />}
      </AnimatePresence>
    </div>
  );
}
