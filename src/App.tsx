import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Users, Dumbbell, Trophy, Plus, Info, CheckCircle2, ChevronLeft, LogOut, Image as ImageIcon, Play, RotateCcw, Zap, Trash2, Save, Search, Filter, Scale, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { User, Workout, Exercise, Role, CheckIn } from './types';
import { mockUsers, mockWorkouts, gymJokes, predatorQuotes } from './mockData';
import { EXERCISE_LIBRARY, LibraryExercise } from './exerciseLibrary';

import { signInWithGoogle, logout, db, auth, handleFirestoreError, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';

// --- STYLING HELPERS ---
const classNames = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// --- BACKGROUND ---
const BackgroundBlobs = () => (
  <>
    <div className="aura-green"></div>
    <div className="aura-toxic"></div>
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
        <h1 className="text-5xl font-black mb-2 text-center tracking-tighter text-atheris-text">ATHERIS</h1>
        <p className="text-atheris-accent font-mono text-sm text-center mb-8 tracking-widest uppercase">
           {mode === 'login' ? 'Treinamento Venenoso' : mode === 'register' ? 'Inocular Conta' : 'Antídoto Necessário'}
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
                className="w-full bg-atheris-text/5 border border-white/10 rounded-xl px-4 py-3 text-atheris-text focus:outline-none focus:border-atheris-accent transition-colors"
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
              className="w-full bg-atheris-text/5 border border-white/10 rounded-xl px-4 py-3 text-atheris-text focus:outline-none focus:border-atheris-accent transition-colors"
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
                className="w-full bg-atheris-text/5 border border-white/10 rounded-xl px-4 py-3 text-atheris-text focus:outline-none focus:border-atheris-accent transition-colors"
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
    <header className="sticky top-0 z-40 glass px-6 pt-12 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-3 relative">
        <button onClick={() => fileInputRef.current?.click()} className="relative group focus:outline-none">
          <div className="w-10 h-10 rounded-full accent-bg border-2 border-white/20 flex items-center justify-center text-black font-bold overflow-hidden shadow-lg">
            {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
        </button>

        <div className="flex flex-col">
          <span className="font-extrabold text-xl text-atheris-text leading-none tracking-tighter">ATHERIS</span>
          <span className="mono accent-text uppercase">{user.role === 'coach' ? 'TREINADOR ALFA' : 'VÍBORA PRO'}</span>
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
    role === 'coach' ? { id: 'alunos', icon: Users, label: 'Víboras' } : { id: 'treinos', icon: Dumbbell, label: 'Protocolos' },
    { id: 'rank', icon: Trophy, label: 'Ranking' }
  ];

  return (
    <nav className="absolute bottom-0 left-0 w-full glass h-24 pb-8 flex items-center justify-around px-8 border-t border-white/5 z-50">
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

const CheckInModal = ({ student, onClose, onSaved }: { student: User, onClose: () => void, onSaved: () => void }) => {
  const [weight, setWeight] = useState<string>('70');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!weight) return alert("Por favor, informe seu peso.");
    setSaving(true);
    try {
      await addDoc(collection(db, 'check_ins'), {
        studentId: student.id,
        coachId: student.coachId || 'coach_daniel',
        weightKg: Number(weight),
        notes,
        createdAt: serverTimestamp()
      });
      onSaved();
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar check-in.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass w-full max-w-sm rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        <div className="p-2 flex justify-center sm:hidden">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        
        <div className="p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-atheris-text flex items-center gap-3">
                 <Scale size={24} className="text-pastel-accent" /> Check-in 
              </h3>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={20} className="rotate-[-90deg]" /></button>
           </div>

           <div className="mb-6">
              <label className="block mono text-[10px] uppercase opacity-50 mb-3 tracking-widest font-bold">Qual o seu peso hoje? (kg)</label>
              <div className="flex items-center gap-4">
                 <input 
                   type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 text-4xl font-black text-center text-pastel-accent focus:outline-none focus:border-pastel-accent"
                 />
              </div>
           </div>

           <div className="mb-8">
              <label className="block mono text-[10px] uppercase opacity-50 mb-3 tracking-widest font-bold">Observações / Como se sente?</label>
              <textarea 
                value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Fome, sono, cansaço..."
                className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-atheris-text focus:outline-none focus:border-atheris-accent h-32 resize-none"
              />
           </div>

           <button 
             onClick={handleSubmit} disabled={saving}
             className="w-full py-5 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,255,102,0.2)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
           >
              {saving ? 'Enviando...' : <><Save size={18}/> Enviar Atualização</>}
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const getSnakeRank = (points: number) => {
  if (points >= 8000) return { name: "Atheris", color: "text-atheris-toxic", bg: "bg-atheris-toxic/20" };
  if (points >= 5000) return { name: "King Cobra", color: "text-red-500", bg: "bg-red-500/20" };
  if (points >= 3000) return { name: "Taipan", color: "text-orange-500", bg: "bg-orange-500/20" };
  if (points >= 1500) return { name: "Mamba", color: "text-gray-400", bg: "bg-gray-400/20" };
  if (points >= 500) return { name: "Coral", color: "text-red-400", bg: "bg-red-400/20" };
  return { name: "Jararaca", color: "text-atheris-accent", bg: "bg-atheris-accent/20" };
};

const HomeView: React.FC<{ user: User, completedWorkouts: number, weeklyCompleted: number, weeklyGoal: number, onCheckIn: () => void }> = ({ user, completedWorkouts, weeklyCompleted, weeklyGoal, onCheckIn }) => {
  const rank = getSnakeRank(user.points || 0);
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Víbora {user.name.split(' ')[0]}</h2>
          <span className={classNames("px-2 py-0.5 rounded text-[10px] uppercase font-black border border-white/10", rank.color, rank.bg)}>
            {rank.name}
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
             <div className="absolute top-0 right-0 p-2 opacity-5"><Zap size={20} className="text-atheris-accent"/></div>
             <span className="block mono opacity-60 uppercase mb-2 text-[10px]">Botes</span>
             <span className="block text-5xl font-light text-atheris-text">{completedWorkouts}</span>
          </div>
          <div className="flex-1 glass rounded-2xl p-5 flex flex-col justify-between shadow-lg">
             <span className="block mono opacity-60 uppercase mb-2 text-[10px]">Nível de Toxicidade</span>
             <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-2xl font-medium text-atheris-text">{weeklyCompleted}<span className="text-sm opacity-60">/{weeklyGoal}</span></span>
                </div>
                <div className="w-full bg-atheris-text/5 rounded-full h-2 overflow-hidden border border-white/10">
                  <div className="toxic-bg h-full rounded-full shadow-[0_0_10px_rgba(223,255,0,0.5)] transition-all duration-1000" style={{ width: `${Math.min((weeklyCompleted/weeklyGoal)*100, 100)}%`}}></div>
                </div>
             </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-6 border-l-2 border-atheris-accent/50 relative overflow-hidden italic text-sm opacity-60 group">
           <div className="absolute inset-0 viper-pattern opacity-10"></div>
           "{predatorQuotes[new Date().getDate() % predatorQuotes.length]}"
        </div>

        <section className="mb-6">
           <h4 className="mono opacity-40 uppercase text-[10px] mb-4 tracking-widest flex items-center gap-2 px-1">
              <Zap size={10} className="text-atheris-accent"/> Bote Rápido
           </h4>
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onExecute({
                  id: 'quick_1', title: 'Explosão Alpha', studentId: user.id, completed: false, 
                  exercises: EXERCISE_LIBRARY.slice(0, 3).map((e,i) => ({...e, id: 'q'+i, sets: 3, reps: '15', weight: 'BW', restSeconds: 30, difficulty: 'Moderado', purpose: 'HIIT', instructions: ''}))
                })}
                className="glass p-4 rounded-2xl border border-white/5 text-left hover:border-atheris-accent/30 transition-colors group"
              >
                 <span className="block font-bold text-sm mb-1 group-hover:text-atheris-accent transition-colors">Explosão Letal</span>
                 <span className="block mono opacity-40 text-[9px] uppercase">15 min • HIIT</span>
              </button>
              <button 
                onClick={() => onExecute({
                  id: 'quick_2', title: 'Reflexos Viper', studentId: user.id, completed: false, 
                  exercises: EXERCISE_LIBRARY.filter(e => e.muscle === 'Mobilidade').slice(0, 3).map((e,i) => ({...e, id: 'qm'+i, sets: 2, reps: '10', weight: 'BW', restSeconds: 0, difficulty: 'Leve', purpose: 'Flow', instructions: ''}))
                })}
                className="glass p-4 rounded-2xl border border-white/5 text-left hover:border-atheris-accent/30 transition-colors group"
              >
                 <span className="block font-bold text-sm mb-1 group-hover:text-atheris-accent transition-colors">Reflexos Alpha</span>
                 <span className="block mono opacity-40 text-[9px] uppercase">10 min • Flow</span>
              </button>
           </div>
        </section>
      </>
    ) : (
      <div className="glass rounded-2xl p-6 mb-6 shadow-lg border-l-4 border-atheris-accent">
        <h3 className="font-bold text-xl mb-2 text-atheris-text uppercase tracking-tighter">Visão do Ninho</h3>
        <p className="opacity-60 text-sm mb-4">Suas víboras estão aguardando inoculação. Gerencie seu ninho e atribua novos protocolos letais.</p>
        <div className="flex items-center gap-2">
            <span className="mono uppercase accent-text text-[10px] font-black">1 Víbora Aguardando Protocolo</span>
        </div>
      </div>
    )}
  </motion.div>
  );
};

const TreinosView: React.FC<{ currentUser: User, onExecute: (w: Workout) => void }> = ({ currentUser, onExecute }) => {
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
       <h2 className="text-2xl font-bold mb-6 uppercase tracking-tighter">Seus Protocolos</h2>
       <div className="flex flex-col gap-4">
         {loading ? <p className="text-center opacity-50 py-10">Buscando protocolos...</p> : 
          workouts.length === 0 ? (
            <div className="text-center py-10 opacity-50 bg-white/5 rounded-2xl">
              <Dumbbell className="mx-auto block mb-2 opacity-50" size={32}/>
              <p>Nenhum protocolo pendente.</p>
            </div>
          ) : (
            workouts.map(w => (
              <button 
                onClick={() => onExecute(w)} 
                key={w.id} 
                className="glass p-5 rounded-2xl flex items-center justify-between hover:border-atheris-accent/50 transition-colors text-left group shadow-lg"
              >
                <div>
                  <h3 className="font-bold text-lg text-atheris-text group-hover:text-atheris-accent transition-colors">{w.title}</h3>
                  <p className="mono opacity-60 uppercase mt-1">{w.exercises.length} Movimentos</p>
                </div>
                <Play className="text-atheris-accent opacity-50 group-hover:opacity-100 transition-opacity" />
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
  const medals = ['text-atheris-toxic', 'text-gray-300', 'text-amber-600'];

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
      <h2 className="text-2xl font-bold mb-6 uppercase tracking-tighter">Hierarquia de Predadores</h2>
      <div className="flex flex-col gap-3">
         {loading ? <p className="opacity-50 text-center py-10">Lendo escamas...</p> : 
            ranked.map((u, i) => {
              const rank = getSnakeRank(u.points || 0);
              return (
              <div key={u.id} className="glass p-4 rounded-2xl flex items-center gap-4 shadow-lg border-l-4 border-l-atheris-accent/20">
                <div className={classNames("w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono", i < 3 ? 'bg-white/10' : 'bg-transparent text-atheris-muted')}>
                  {i < 3 ? <Trophy size={16} className={medals[i]} /> : i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-atheris-text text-lg">{u.name}</h3>
                    <span className={classNames("text-[8px] px-1.5 py-0.5 rounded border border-white/5 uppercase font-black", rank.color, rank.bg)}>
                      {rank.name}
                    </span>
                  </div>
                  <span className="mono opacity-60 uppercase text-[9px] tracking-widest">{u.tier || 'Explorador'}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl text-atheris-text">{u.points || 0}</span>
                  <span className="mono accent-text ml-1 uppercase">V-PTS</span>
                </div>
              </div>
              );
            })
         }
      </div>
    </motion.div>
  )
};

const AlunosView: React.FC<{ currentUser: User, onSelectStudent: (s: User) => void }> = ({ currentUser, onSelectStudent }) => {
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-tighter">O Ninho</h2>
        <div className="glass px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
           <span className="text-[10px] mono uppercase font-black">{students.length} Víboras</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="glass p-4 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"><Users size={40} className="text-atheris-accent"/></div>
            <p className="mono opacity-50 uppercase text-[10px] mb-1">Status Alpha</p>
            <p className="text-2xl font-black text-atheris-text">ATIVO</p>
         </div>
         <div className="glass p-4 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"><Zap size={40} className="text-atheris-accent"/></div>
            <p className="mono opacity-50 uppercase text-[10px] mb-1">Inoculações</p>
            <p className="text-2xl font-black text-atheris-text">12 <span className="text-xs opacity-40 uppercase">Hoje</span></p>
         </div>
      </div>

      <div className="flex flex-col gap-4">
         {loading ? (
            <div className="text-center py-20 opacity-50">
               <RotateCcw className="animate-spin mx-auto mb-4" />
               <p className="mono uppercase text-xs">Rastreando Predadores...</p>
            </div>
         ) : students.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-50">
               <p className="italic">Nenhuma víbora no ninho ainda.</p>
            </div>
         ) : (
            students.map(s => (
               <button 
                  key={s.id} 
                  onClick={() => onSelectStudent(s)}
                  className="glass p-5 rounded-3xl flex items-center gap-4 hover:border-atheris-accent/50 transition-all text-left shadow-lg group relative overflow-hidden"
               >
                  <div className="absolute inset-0 viper-pattern opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  {s.avatar ? (
                    <img src={s.avatar} alt={s.name} className="w-12 h-12 rounded-full border-2 border-white/10 group-hover:border-atheris-accent/50 transition-colors" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-atheris-accent/10 flex items-center justify-center text-lg font-bold text-atheris-accent group-hover:bg-atheris-accent/20 transition-colors">
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-atheris-text group-hover:text-atheris-accent transition-colors">{s.name}</h3>
                    <p className="mono opacity-50 text-[10px] uppercase tracking-widest">{s.tier || 'Explorador'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg text-atheris-text">{s.points || 0}</p>
                    <p className="mono accent-text text-[8px] uppercase">V-PTS</p>
                  </div>
               </button>
            ))
         )}
      </div>
    </motion.div>
  );
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
         <button onClick={onSkip} className="flex-1 py-3 bg-atheris-text/5 border border-white/10 hover:bg-atheris-text/10 rounded-xl text-[10px] uppercase tracking-widest transition-colors font-black text-atheris-text">Pular</button>
       </div>
    </motion.div>
  )
};

const ExerciseInfoModal = ({ ex, onClose }: { ex: Exercise, onClose: () => void }) => {
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
       className="fixed inset-0 z-50 bg-atheris-bg sm:max-w-md sm:mx-auto flex flex-col overflow-hidden"
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
               <div className="text-center py-10 text-atheris-muted flex flex-col items-center gap-3">
                 <Dumbbell size={48} opacity={0.2} />
                 <p>Nenhum exercício adicionado a este treino.</p>
               </div>
             )}

             <button onClick={handleFinish} className="mt-8 w-full py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[0.98] transition-transform mb-8">
                <CheckCircle2 size={24} className="inline-block mr-2" /> Finalizar Protocolo
             </button>
           </div>
         </>
       ) : (
         <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center fade-in">
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
                 <input 
                    type="range" min="1" max="10" step="1" 
                    value={rpe} onChange={(e) => setRpe(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none bg-atheris-text/10 outline-none thumb-accent"
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
                 <label className="block mono font-bold opacity-80 mb-2">Relato do Ataque (Opcional)</label>
                 <textarea 
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Alguma falha? O veneno agiu como esperado?"
                    className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-atheris-text focus:outline-none focus:border-atheris-accent transition-colors resize-none h-32"
                 />
             </div>

             <button onClick={handleFinish} disabled={saving} className="w-full py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? 'Registrando...' : 'Registrar Bote'}
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

const WorkoutCreatorModal = ({ student, coach, onClose, onCreated }: { student: User, coach: User, onClose: () => void, onCreated: () => void }) => {
  const [title, setTitle] = useState('Novo Protocolo');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [showPicker, setShowPicker] = useState(false);

  const muscles = Array.from(new Set(EXERCISE_LIBRARY.map(e => e.muscle)));
  
  // Set initial muscle if not set
  useEffect(() => {
    if (!selectedMuscle && muscles.length > 0) {
      setSelectedMuscle(muscles[0]);
    }
  }, [muscles, selectedMuscle]);

  const filteredLibrary = EXERCISE_LIBRARY.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = ex.muscle === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const addExerciseFromLibrary = (libEx: LibraryExercise) => {
    const newEx: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: libEx.name,
      sets: 3,
      reps: '12',
      weight: '0kg',
      restSeconds: 60,
      instructions: '',
      purpose: '',
      muscleGroup: libEx.muscle,
      difficulty: 'Iniciante'
    };
    setExercises([...exercises, newEx]);
    setShowPicker(false);
    setSearchQuery('');
  };

  const addExercise = () => {
    const newEx: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      sets: 3,
      reps: '12',
      weight: '0kg',
      restSeconds: 60,
      instructions: '',
      purpose: '',
      muscleGroup: 'Geral',
      difficulty: 'Iniciante'
    };
    setExercises([...exercises, newEx]);
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleCreate = async () => {
    if (!title.trim()) return alert("O protocolo precisa de um título.");
    if (exercises.length === 0) return alert("Adicione pelo menos um movimento.");
    if (exercises.some(ex => !ex.name.trim())) return alert("Preencha os nomes de todos os movimentos.");

    setSaving(true);
    try {
      await addDoc(collection(db, 'workouts'), {
        title,
        studentId: student.id,
        authorId: coach.id,
        assignedTo: student.id,
        completed: false,
        exercises,
        createdAt: serverTimestamp()
      });
      onCreated();
    } catch (e) {
      console.error(e);
      alert("Erro ao criar protocolo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass w-full max-w-lg h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        <div className="p-2 flex justify-center sm:hidden">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto pb-10 scrollbar-hide">
           <div className="flex justify-between items-center mb-6 pt-6">
              <h3 className="text-xl font-bold text-atheris-text flex items-center gap-2">
                 <Dumbbell size={20} className="text-atheris-accent" /> Inocular Protocolo
              </h3>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><ChevronLeft size={20} className="rotate-[-90deg]" /></button>
           </div>

           <div className="mb-6">
              <label className="block mono text-[10px] uppercase opacity-50 mb-2 tracking-widest font-bold">Título do Protocolo</label>
              <input 
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Protocolo Alfa"
                className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-xl font-bold text-atheris-text focus:outline-none focus:border-atheris-accent transition-all"
              />
              <p className="text-[10px] mono opacity-40 mt-2 uppercase">Inoculando para: <span className="text-atheris-accent">{student.name}</span></p>
           </div>

           <div className="flex justify-between items-center mb-4">
              <h4 className="mono opacity-60 uppercase text-xs font-bold tracking-widest">Movimentos ({exercises.length})</h4>
              <button 
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1 px-4 py-2 rounded-full accent-bg text-black text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                 <Search size={14}/> Abrir Arsenal
              </button>
           </div>

           <div className="flex flex-col gap-4 mb-8">
              {exercises.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/5 border-dashed flex flex-col items-center gap-3">
                   <Plus size={32} className="opacity-20" />
                   <p className="opacity-40 text-sm">Use o arsenal para adicionar movimentos.</p>
                </div>
              ) : exercises.map((ex, idx) => (
                <div key={ex.id} className="glass p-5 rounded-3xl border border-white/10 relative group">
                   <button 
                     onClick={() => removeExercise(ex.id)}
                     className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                   >
                     <Trash2 size={16}/>
                   </button>
                   
                   <div className="grid grid-cols-1 gap-4">
                      <div>
                        <div className="flex justify-between items-end mb-1">
                          <label className="block mono text-[9px] uppercase opacity-40">Movimento</label>
                          <span className="text-[9px] mono text-atheris-accent uppercase">{ex.muscleGroup}</span>
                        </div>
                        <input 
                          value={ex.name} onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                          placeholder="Nome do Exercício"
                          className="w-full bg-atheris-text/5 border border-white/10 rounded-xl p-3 text-sm font-bold text-atheris-text focus:outline-none focus:border-atheris-accent"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                         <div>
                            <label className="block mono text-[9px] uppercase opacity-40 mb-1">Séries</label>
                            <input 
                              type="number" value={ex.sets} onChange={(e) => updateExercise(ex.id, 'sets', Number(e.target.value))}
                              className="w-full bg-atheris-text/5 border border-white/10 rounded-xl p-3 text-sm font-bold text-atheris-text text-center"
                            />
                         </div>
                         <div>
                            <label className="block mono text-[9px] uppercase opacity-40 mb-1">Reps</label>
                            <input 
                              value={ex.reps} onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                              className="w-full bg-atheris-text/5 border border-white/10 rounded-xl p-3 text-sm font-bold text-atheris-text text-center"
                            />
                         </div>
                         <div>
                            <label className="block mono text-[9px] uppercase opacity-40 mb-1">Carga</label>
                            <input 
                              value={ex.weight} onChange={(e) => updateExercise(ex.id, 'weight', e.target.value)}
                              className="w-full bg-atheris-text/5 border border-white/10 rounded-xl p-3 text-sm font-bold text-atheris-text text-center"
                            />
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>

           <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-atheris-text/5 text-atheris-text font-bold text-sm uppercase tracking-widest border border-white/10">
                 Cancelar
              </button>
              <button 
                onClick={handleCreate} disabled={saving}
                className="flex-[2] py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,255,102,0.2)] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
              >
                 {saving ? 'Gravando...' : <><Save size={18}/> Salvar e Enviar</>}
              </button>
           </div>
        </div>

        {/* LIBRARY PICKER OVERLAY */}
        <AnimatePresence>
          {showPicker && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="absolute inset-0 z-[60] bg-atheris-bg flex flex-col pt-safe"
            >
              <div className="p-6 border-b border-white/10 pt-12">
                <div className="flex items-center gap-4 mb-6">
                   <button onClick={() => setShowPicker(false)} className="p-2 bg-atheris-text/5 rounded-full text-atheris-text"><ChevronLeft size={20}/></button>
                   <h3 className="text-xl font-bold text-atheris-text">Biblioteca de Movimentos</h3>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18}/>
                  <input 
                    autoFocus
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar movimento..."
                    className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-atheris-text focus:outline-none focus:border-atheris-accent"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {muscles.map(m => (
                    <button 
                      key={m} onClick={() => setSelectedMuscle(m)}
                      className={classNames("px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border", 
                        selectedMuscle === m ? 'accent-bg text-black border-transparent' : 'bg-atheris-text/5 border-white/10 text-atheris-text/60'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-hide">
                {filteredLibrary.length === 0 ? (
                  <p className="text-center py-20 opacity-40 italic">Nenhum exercício encontrado...</p>
                ) : filteredLibrary.map(libEx => (
                  <button 
                    key={libEx.name}
                    onClick={() => addExerciseFromLibrary(libEx)}
                    className="glass w-full p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 active:scale-[0.98] transition-all group"
                  >
                    <div className="text-left">
                       <p className="font-bold text-atheris-text group-hover:text-atheris-accent transition-colors">{libEx.name}</p>
                       <p className="mono text-[9px] uppercase opacity-40 mt-1">{libEx.muscle} • {libEx.type}</p>
                    </div>
                    <Plus size={18} className="text-pastel-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const StudentDetailModal = ({ student, onClose, onAssignWorkout }: { student: User, onClose: () => void, onAssignWorkout: () => void }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qLogs = query(collection(db, 'sessions'), where('studentId', '==', student.id));
        const qCheckIns = query(collection(db, 'check_ins'), where('studentId', '==', student.id));
        
        const [snapLogs, snapCheckIns] = await Promise.all([getDocs(qLogs), getDocs(qCheckIns)]);
        
        const l = snapLogs.docs.map(d => ({ id: d.id, ...d.data() }));
        // @ts-ignore
        l.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setLogs(l);

        const ci = snapCheckIns.docs.map(d => ({ id: d.id, ...d.data() } as CheckIn));
        // @ts-ignore
        ci.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setCheckIns(ci);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [student.id]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
      >
        <div className="p-2 flex justify-center sm:hidden">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto pb-10 scrollbar-hide">
             <div className="flex justify-between items-start mb-6 pt-6">
             <div className="flex items-center gap-4">
                {student.avatar ? (
                  <img src={student.avatar} alt={student.name} className="w-14 h-14 rounded-full border-2 border-atheris-accent/30" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-atheris-accent/10 flex items-center justify-center text-xl font-bold text-atheris-accent">{student.name[0]}</div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-atheris-text leading-tight">{student.name}</h3>
                  <p className="mono font-bold text-atheris-accent uppercase text-xs tracking-widest">{student.tier || 'Predador Scout'}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><ChevronLeft size={20} className="rotate-[-90deg]" /></button>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                 <span className="mono opacity-50 uppercase text-[10px] mb-1">Venom Level</span>
                 <span className="text-2xl font-black text-atheris-accent">{student.points || 0}</span>
              </div>
              <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                 <span className="mono opacity-50 uppercase text-[10px] mb-1">Último Peso</span>
                 <span className="text-2xl font-black text-atheris-text">{checkIns[0]?.weightKg || '--'} <span className="text-xs opacity-40">kg</span></span>
              </div>
           </div>

           <div className="flex flex-col gap-8 mb-8">
              <section>
                <h4 className="mono opacity-60 uppercase text-xs mb-4 flex items-center justify-between tracking-widest">
                   <div className="flex items-center gap-2"><TrendingUp size={14}/> Curva Metabólica</div>
                   <span className="text-[10px] opacity-40">Últimos {checkIns.length} botes</span>
                </h4>
                
                {checkIns.length > 1 ? (
                  <div className="h-44 w-full glass rounded-3xl p-4 border border-white/5 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...checkIns].reverse().map(ci => ({ 
                         weight: ci.weightKg, 
                         date: ci.createdAt?.toDate ? ci.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit' }) : ''
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace'}}
                        />
                        <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(10, 15, 10, 0.95)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            fontSize: '10px',
                            fontFamily: 'monospace'
                          }}
                          itemStyle={{ color: '#00ff66', fontWeight: 'bold' }}
                          labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#00ff66" 
                          strokeWidth={3} 
                          dot={{ fill: '#00ff66', r: 4 }}
                          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-44 w-full glass rounded-3xl flex items-center justify-center border border-dashed border-white/10">
                    <p className="text-xs opacity-40 italic">Inicie os check-ins para gerar a curva...</p>
                  </div>
                )}
              </section>

              <section>
                <h4 className="mono opacity-60 uppercase text-xs mb-4 flex items-center gap-2 tracking-widest">
                   <Scale size={14}/> Histórico de Pesagem
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                   {checkIns.length === 0 ? <p className="text-xs opacity-40 italic ml-1">Sem registros de peso...</p> : 
                    checkIns.map(ci => (
                      <div key={ci.id} className="glass min-w-[80px] p-3 rounded-xl flex flex-col items-center border border-white/5 shrink-0">
                         <span className="text-sm font-bold text-atheris-accent">{ci.weightKg}kg</span>
                         <span className="text-[8px] mono opacity-40 uppercase mt-1">
                           {ci.createdAt?.toDate ? ci.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Recente'}
                         </span>
                      </div>
                    ))
                   }
                </div>
              </section>

              <section>
                <h4 className="mono opacity-60 uppercase text-xs mb-4 flex items-center gap-2 tracking-widest">
                   <Dumbbell size={14}/> Histórico de Inoculações
                </h4>
                <div className="flex flex-col gap-3">
                   {loading ? (
                     <p className="text-center opacity-50 py-10">Analisando registros da víbora...</p>
                   ) : logs.length === 0 ? (
                     <div className="text-center py-10 bg-white/5 rounded-3xl opacity-50 border border-white/5">
                       <Play size={32} className="mx-auto mb-2 opacity-50" />
                       <p className="text-sm">A víbora ainda não completou nenhum ciclo letal.</p>
                     </div>
                   ) : logs.map(l => (
                     <div key={l.id} className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-atheris-text truncate max-w-[150px]">Protocolo Concluído</p>
                          <p className="mono opacity-50 text-[10px] uppercase mt-1">
                             RPE: <span className={classNames("font-black", l.rpe > 7 ? 'text-red-500' : 'text-[#00ff66]')}>{l.rpe}</span> • {Math.floor(l.durationSeconds / 60)} min
                          </p>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] mono opacity-40 uppercase">
                             {l.createdAt?.toDate ? l.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                           </span>
                        </div>
                     </div>
                   ))}
                </div>
              </section>
           </div>

           <button 
             onClick={onAssignWorkout}
             className="w-full py-4 rounded-2xl accent-bg text-black font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,255,102,0.2)] hover:scale-[0.98] transition-transform"
           >
              <Plus size={20} className="inline-block mr-2" /> Inocular Protocolo
           </button>
        </div>
      </motion.div>
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
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isCreatingWorkoutFor, setIsCreatingWorkoutFor] = useState<User | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sync Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            const isBypassCoach = authUser.email?.toLowerCase() === 'blackwoodstock1985@gmail.com';
            
            if (isBypassCoach && data.role !== 'coach') {
                const updatedUser = { ...data, role: 'coach' as Role, tier: 'Treinador Alfa', name: 'Daniel' };
                await updateDoc(doc(db, 'users', authUser.uid), { role: 'coach', tier: 'Treinador Alfa', name: 'Daniel' });
                setCurrentUser(updatedUser);
            } else {
                setCurrentUser(data);
            }
          } else {
             // Create standard user or coach if bypass email matches
             const isBypassCoach = authUser.email?.toLowerCase() === 'blackwoodstock1985@gmail.com';
             const newUser = {
                id: authUser.uid,
                name: isBypassCoach ? 'Daniel' : (authUser.displayName || 'Nova Víbora'),
                email: authUser.email || '',
                role: isBypassCoach ? 'coach' : 'student',
                points: 0,
                tier: isBypassCoach ? 'Treinador Alfa' : 'Explorador',
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

    addNotification('Inoculação Concluída!', `Presa abatida! Você acumulou +50 V-PTS.`, 'achievement');

    if (newWeekly === weeklyGoal) {
      earnedPoints += 100;
      addNotification('Predador Alpha!', `Nível de toxicidade máximo! +100 V-PTS de Bônus.`, 'achievement');
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
    <div className={classNames("h-[100dvh] w-full relative sm:max-w-md sm:mx-auto sm:border-x border-atheris-border flex flex-col text-atheris-text overflow-hidden selection:bg-atheris-accent/30 bg-atheris-bg sm:shadow-2xl transition-colors duration-500 user-select-none", !isDarkMode && "light-mode")}>
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
                 <h4 className="font-bold text-atheris-text text-sm">{n.title}</h4>
                 <p className="text-xs text-atheris-text/70 mt-1 leading-snug">{n.message}</p>
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
                addNotification('Novo Viper Detectado', 'Um novo atleta entrou no seu ninho.', 'info');
             } else {
                addNotification('Sinal de Ataque', 'O Coach atualizou seu protocolo de treinamento!', 'info');
             }
          }} />
          
          <main className="flex-1 overflow-y-auto relative z-10 scrollbar-hide pb-20 sm:pb-0">
            <AnimatePresence mode="popLayout">
              {activeTab === 'home' && <HomeView key="home" user={currentUser} completedWorkouts={completedWorkouts} weeklyCompleted={weeklyCompleted} weeklyGoal={weeklyGoal} onCheckIn={() => setIsCheckingIn(true)} />}
              {activeTab === 'treinos' && <TreinosView key="treinos" currentUser={currentUser} onExecute={setExecutingWorkout} />}
              {activeTab === 'alunos' && <AlunosView key="alunos" currentUser={currentUser} onSelectStudent={setSelectedStudent} />}
              {activeTab === 'rank' && <RankView key="rank" />}
            </AnimatePresence>
          </main>
          
          <TabBar role={currentUser.role} activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}

      {/* FULLSCREEN MODALS */}
      <AnimatePresence>
         {executingWorkout && currentUser && <ExecuteWorkoutModal workout={executingWorkout} currentUser={currentUser} onClose={handleFinishWorkout} />}
         {isCheckingIn && currentUser && <CheckInModal student={currentUser} onClose={() => setIsCheckingIn(false)} onSaved={() => { setIsCheckingIn(false); addNotification('Check-in Realizado', 'Seu peso foi atualizado com sucesso!', 'achievement'); }} />}
         {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onAssignWorkout={() => { setIsCreatingWorkoutFor(selectedStudent); setSelectedStudent(null); }} />}
         {isCreatingWorkoutFor && currentUser && <WorkoutCreatorModal student={isCreatingWorkoutFor} coach={currentUser} onClose={() => setIsCreatingWorkoutFor(null)} onCreated={() => { setIsCreatingWorkoutFor(null); addNotification('Treino Criado', 'O treino foi enviado para o aluno!', 'achievement'); }} />}
      </AnimatePresence>
    </div>
  );
}
