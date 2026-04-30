import React, { useState, useEffect, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Trophy, Info, Zap } from 'lucide-react';
import { User, Workout, Role } from './types';
import { auth, db, logout, isFirebaseConfigured } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { classNames } from './lib/utils';
import { BackgroundBlobs, Header, TabBar } from './components/AtherisCore';
import { HomeView, TreinosView, AlunosView, RankView, AdminChatView, ProfileView } from './components/AtherisViews';
import { ExecuteWorkoutModal, CheckInModal, StudentDetailModal, WorkoutCreatorModal } from './components/AtherisModals';

// --- AUTHENTICATION COMPONENTS ---
const Login = memo(({ onLogin }: { onLogin: (u: User) => void }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [coaches, setCoaches] = useState<{id: string, name: string}[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState('');

  // Fetch available coaches on register
  useEffect(() => {
    if (mode === 'register') {
      const loadCoaches = async () => {
        try {
          const q = query(collection(db, 'users'), where('role', '==', 'coach'));
          const snap = await getDocs(q);
          const c = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || 'Treinador' }));
          setCoaches(c);
          if (c.length > 0) {
             const saved = localStorage.getItem('pendingCoachId');
             if (saved && c.some(coach => coach.id === saved)) {
                setSelectedCoachId(saved);
             } else {
                setSelectedCoachId(c[0].id);
                localStorage.setItem('pendingCoachId', c[0].id);
             }
          }
        } catch(err) {
           console.error("Erro ao carregar treinadores", err);
        }
      };
      loadCoaches();
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Por favor insira seu email.");
    if (mode !== 'recover' && !password) return setError("Por favor insira sua senha.");
    if (mode === 'register' && !name) return setError("Por favor insira seu nome.");

    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        // Make sure it saves to firestore
        // bypass coach check for the specific emails
        const bypassCoachEmails = ['blackwoodstock1985@gmail.com', 'lucasgab204lgr@gmail.com', 'rafaelsr1990@gmail.com'];
        const isBypassCoach = bypassCoachEmails.includes(cred.user.email?.toLowerCase() || '');
        
        await setDoc(doc(db, 'users', cred.user.uid), {
          name,
          email,
          role: isBypassCoach ? 'coach' : 'student',
          points: 0,
          tier: isBypassCoach ? 'Atheris Suprema' : 'Jararaca',
          createdAt: serverTimestamp(),
          coachId: isBypassCoach ? '' : selectedCoachId
        });
      } else if (mode === 'recover') {
        await sendPasswordResetEmail(auth, email);
        setError('Um e-mail de recuperação foi enviado.');
      }
    } catch (err: any) {
      console.error(err);
      const code = err.code || '';
      let msg = 'Falha na autenticação.';
      
      if (code === 'auth/invalid-credential') {
        msg = 'Credenciais ou configuração inválida. Se for aluno, verifique e-mail/senha. Se for mestre, verifique se o domínio Vercel está autorizado no console do Firebase.';
      } else if (code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        msg = 'E-mail ou senha incorretos. Verifique seus dados.';
      } else if (code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está em uso.';
      } else if (code === 'auth/invalid-email') {
        msg = 'E-mail inválido.';
      } else if (code === 'auth/weak-password') {
        msg = 'Senha muito fraca (mínimo 6 caracteres).';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Muitas tentativas. Tente novamente mais tarde.';
      } else if (code === 'auth/operation-not-allowed') {
        msg = 'Este método de login não está ativado no Firebase Console.';
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { signInWithGoogle } = await import('./firebase');
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao acessar com Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-sm mx-auto">
       <h1 className="text-5xl font-black text-atheris-text tracking-tighter mb-4 text-center">ATHERIS</h1>
       <p className="text-atheris-accent mono mb-8">Por favor, acesse o habitat.</p>

       <form onSubmit={handleSubmit} className="w-full mb-6">
          {error && <p className="text-red-400 text-sm mb-4 text-center font-bold bg-red-400/10 p-3 rounded-2xl border border-red-400/20">{error}</p>}
          
          {mode === 'register' && (
            <>
              <input 
                type="text" 
                placeholder="Seu Nome (Codinome)" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-sm mb-3 focus:border-atheris-accent outline-none"
              />
              {coaches.length > 0 && (
                <div className="w-full mb-3 flex flex-col gap-1">
                   <label className="mono text-[10px] uppercase opacity-50 px-2 tracking-widest text-left">Escolha seu Treinador</label>
                   <select 
                     value={selectedCoachId}
                     onChange={e => {
                        setSelectedCoachId(e.target.value);
                        localStorage.setItem('pendingCoachId', e.target.value);
                     }}
                     className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-atheris-accent outline-none text-white appearance-none"
                   >
                      {coaches.map(c => (
                        <option key={c.id} value={c.id} className="bg-black text-white">{c.name}</option>
                      ))}
                   </select>
                </div>
              )}
            </>
          )}

          <input 
            type="email" 
            placeholder="E-mail" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-sm mb-3 focus:border-atheris-accent outline-none"
          />

          {mode !== 'recover' && (
            <input 
              type="password" 
              placeholder="Senha" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-atheris-text/5 border border-white/10 rounded-2xl p-4 text-sm mb-4 focus:border-atheris-accent outline-none"
            />
          )}

          <button 
           type="submit"
           disabled={loading}
           className="w-full bg-atheris-accent text-black font-black uppercase tracking-widest text-sm py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,102,0.2)] disabled:opacity-50"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Iniciar Acesso' : mode === 'register' ? 'Criar Protocolo' : 'Recuperar Acesso'}
          </button>
       </form>

       <div className="flex items-center gap-4 w-full mb-6 opacity-30">
          <div className="h-px bg-white flex-1"></div>
          <span className="mono text-[10px] uppercase">OU</span>
          <div className="h-px bg-white flex-1"></div>
       </div>

       <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50"
       >
         <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
           <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
         </svg>
         Portal Google
       </button>

       <div className="mt-8 flex flex-col gap-2 w-full text-center">
         {mode === 'login' ? (
           <>
             <button onClick={() => setMode('register')} className="text-sm opacity-60 hover:opacity-100 hover:text-atheris-accent">Não tem um perfil? <span className="font-bold underline">Registre-se</span></button>
             <button onClick={() => setMode('recover')} className="text-xs opacity-40 hover:opacity-100 mt-2">Esqueceu o login?</button>
           </>
         ) : (
           <button onClick={() => setMode('login')} className="text-sm opacity-60 hover:opacity-100 hover:text-atheris-accent">Voltar para o Login</button>
         )}
       </div>
    </div>
  );
});

// --- ROOT COMPONENT ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [executingWorkout, setExecutingWorkout] = useState<Workout | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isCreatingWorkoutFor, setIsCreatingWorkoutFor] = useState<User | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState<{id: string, title: string, message: string, type: string}[]>([]);
  const [stats, setStats] = useState({ completed: 0, weekly: 0 });

  // Memoized action handlers to prevent re-renders
  const addNotification = useCallback((title: string, message: string, type = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const loadUserStats = useCallback(async (userId: string) => {
    try {
      const q = query(collection(db, 'workouts'), where('studentId', '==', userId), where('completed', '==', true));
      const snaps = await getDocs(q);
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let monthlyWorkouts = 0;
      const weeksActive = new Set<string>();

      // Get ISO week number calculation
      const getWeekKey = (d: Date) => {
        const target = new Date(d.valueOf());
        const dayNr = (d.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
        return `${target.getFullYear()}-W${weekNum}`;
      };
      
      snaps.forEach(doc => {
         const data = doc.data();
         if (data.authorId === userId) return; // Ignore Quick Hits (home workouts) in stats
         
         if (data.updatedAt) {
            const completedDate = data.updatedAt.toDate();
            // Checking if the workout happened in the current calendar month
            if (completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear) {
               monthlyWorkouts++;
               weeksActive.add(getWeekKey(completedDate));
            }
         }
      });
      
      setStats({ completed: monthlyWorkouts, weekly: weeksActive.size });
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setActiveTab('home');
    setStats({ completed: 0, weekly: 0 });
  }, []);

  const toggleDarkMode = useCallback((v: boolean) => setIsDarkMode(v), []);
  const closeCheckIn = useCallback(() => setIsCheckingIn(false), []);
  const closeStudentDetail = useCallback(() => setSelectedStudent(null), []);
  const closeWorkoutCreator = useCallback(() => setIsCreatingWorkoutFor(null), []);
  
  const startCheckIn = useCallback(() => setIsCheckingIn(true), []);
  const selectStudent = useCallback((s: User) => setSelectedStudent(s), []);
  const assignToStudent = useCallback((s: User) => setIsCreatingWorkoutFor(s), []);

  const startWorkoutCreation = useCallback(() => {
    setIsCreatingWorkoutFor(selectedStudent);
    setSelectedStudent(null);
  }, [selectedStudent]);

  const handleExecuteQuickHit = useCallback(async (title: string) => {
    if (!currentUser) return;
    
    // Switch view to treinos
    setActiveTab('treinos');
    addNotification('Protocolo Gerado', `O bote rápido ${title} foi criado na sua lista.`, 'info');

    let exercises = [];
    switch(title) {
      case 'Flow Predator':
        exercises = [{ id: 'e1', name: 'Mobilidade Articular', sets: 1, reps: '15 min', weight: 'Corporal', restSeconds: 0, muscleGroup: 'Corpo Todo', difficulty: 'Jararaca', purpose: 'Soltar as articulações e melhorar amplitude.', instructions: 'Mova ombros, quadril e calcanhares.' }]; break;
      case 'Inoculação HIT':
        exercises = [
          { id: 'e1', name: 'Burpees', sets: 4, reps: '30s', weight: 'Corporal', restSeconds: 30, muscleGroup: 'Corpo Todo', difficulty: 'Naja Real', purpose: 'Elevar FC ao máximo.', instructions: 'Salte, prancha, flexão e retorne.' },
          { id: 'e2', name: 'Mountain Climbers', sets: 4, reps: '30s', weight: 'Corporal', restSeconds: 30, muscleGroup: 'Core', difficulty: 'Cascavel', purpose: 'Cardio e core.', instructions: 'Acelere pernas na prancha.' }
        ]; break;
      case 'Víbora Atenta':
        exercises = [{ id: 'e1', name: 'Controle de Respiração', sets: 1, reps: '10 min', weight: 'Mental', restSeconds: 0, muscleGroup: 'Mindset', difficulty: 'Jararaca', purpose: 'Mindset e foco.', instructions: 'Medite na técnica 4-4-4.' }]; break;
      case 'Camuflagem':
        exercises = [{ id: 'e1', name: 'Prancha Isométrica', sets: 4, reps: '60s', weight: 'Corporal', restSeconds: 30, muscleGroup: 'Core', difficulty: 'Cascavel', purpose: 'Estabilização do tronco.', instructions: 'Segure a posição neutra firme.' }]; break;
      case 'Bote Rápido':
        exercises = [{ id: 'e1', name: 'Flexão Explosiva', sets: 3, reps: '15', weight: 'Corporal', restSeconds: 45, muscleGroup: 'Peitoral', difficulty: 'Cascavel', purpose: 'Ativação muscular.', instructions: 'Desça lento e empurre forte.' }]; break;
      case 'Troca de Pele':
        exercises = [{ id: 'e1', name: 'Alongamento Profundo', sets: 1, reps: '25 min', weight: 'Corporal', restSeconds: 0, muscleGroup: 'Corpo Todo', difficulty: 'Jararaca', purpose: 'Recuperação.', instructions: 'Mantenha poses por 60s.' }]; break;
      default:
        exercises = [{ id: 'e1', name: 'Bote Aleatório', sets: 3, reps: '10', weight: 'Corporal', restSeconds: 30, muscleGroup: 'Corpo', difficulty: 'Jararaca', purpose: 'Moção.', instructions: 'Mova-se.' }];
    }

    const newWorkoutData = {
       title: title,
       studentId: currentUser.id,
       authorId: currentUser.id,
       completed: false,
       exercises: exercises,
       createdAt: serverTimestamp()
    };

    try {
       await addDoc(collection(db, 'workouts'), newWorkoutData);
    } catch(err) {
       console.error("Erro ao gerar treino rápido", err);
    }
  }, [currentUser, addNotification]);

  const handleCancelWorkout = useCallback(() => {
    setExecutingWorkout(null);
    setActiveTab('home');
  }, []);

  const handleFinishWorkout = useCallback((workout: Workout) => {
    const isQuickHit = workout.authorId === workout.studentId;
    const isChallenge = workout.type === 'challenge';
    
    if (isChallenge) {
      addNotification('V-Points Adquiridos', `Desafio concluído: +${workout.points || 25} V-Points.`, 'achievement');
    } else if (isQuickHit) {
      addNotification('V-Points Adquiridos', 'Sua movimentação em casa gerou 5 V-Points.', 'info');
    } else {
      addNotification('Bote Registrado', 'Sua evolução foi inoculada com sucesso.', 'achievement');
    }
    
    setActiveTab('home');
    setExecutingWorkout(null);
    if (currentUser) {
      loadUserStats(currentUser.id);
      updateDoc(doc(db, 'users', currentUser.id), { lastActiveAt: serverTimestamp() }).catch(console.error);
    }
  }, [addNotification, loadUserStats, currentUser]);

  // Sync Auth State
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          const bypassCoachEmails = ['blackwoodstock1985@gmail.com', 'lucasgab204lgr@gmail.com', 'rafaelsr1990@gmail.com'];
          const isBypassCoach = bypassCoachEmails.includes(authUser.email?.toLowerCase() || '');
          
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            if (isBypassCoach && data.role !== 'coach') {
                const updated = { ...data, id: authUser.uid, role: 'coach' as Role, tier: 'Atheris Suprema', name: data.name || (authUser.email?.toLowerCase() === 'blackwoodstock1985@gmail.com' ? 'Daniel' : (authUser.email?.toLowerCase() === 'lucasgab204lgr@gmail.com' ? 'Lucas' : 'Rafael')) };
                await updateDoc(doc(db, 'users', authUser.uid), { role: 'coach', tier: 'Atheris Suprema', name: updated.name });
                setCurrentUser(updated);
            } else {
                setCurrentUser({ ...data, id: authUser.uid });
            }
          } else {
            const newUser = {
              id: authUser.uid,
              name: isBypassCoach ? (authUser.email?.toLowerCase() === 'blackwoodstock1985@gmail.com' ? 'Daniel' : (authUser.email?.toLowerCase() === 'lucasgab204lgr@gmail.com' ? 'Lucas' : 'Rafael')) : (authUser.displayName || 'Víbora Nova'),
              email: authUser.email || '',
              role: isBypassCoach ? 'coach' : 'student',
              points: 0,
              tier: isBypassCoach ? 'Atheris Suprema' : 'Jararaca',
              avatar: authUser.photoURL || '',
              createdAt: serverTimestamp(),
              coachId: isBypassCoach ? '' : (localStorage.getItem('pendingCoachId') || 'coach_daniel')
            };
            await setDoc(doc(db, 'users', authUser.uid), newUser);
            setCurrentUser(newUser as unknown as User);
          }
          
          loadUserStats(authUser.uid);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Auth state sync error:", err);
        // If profile loading fails, we might still be logged in but can't proceed
        // Optionally sign out or show an error
        // logout(); // This might be too aggressive if it's a transient network error
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, [loadUserStats]);

  // Early return must happen after all hooks
  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl">
          <h1 className="text-2xl font-black mb-4">Firebase não configurado</h1>
          <p className="text-white/60 mb-6">As credenciais do Firebase não foram encontradas. Isso acontece quando o projeto é implantado (deploy) no Vercel e as variáveis de ambiente não foram adicionadas ou estão incorretas.</p>
          <div className="bg-black/50 p-4 rounded-xl text-left mono text-xs text-white/50 break-all mb-4">
            Adicione estas variáveis no Vercel (aba Settings &gt; Environment Variables):<br/><br/>
            VITE_FIREBASE_API_KEY<br/>
            VITE_FIREBASE_AUTH_DOMAIN<br/>
            VITE_FIREBASE_PROJECT_ID<br/>
            VITE_FIREBASE_STORAGE_BUCKET<br/>
            VITE_FIREBASE_MESSAGING_SENDER_ID<br/>
            VITE_FIREBASE_APP_ID<br/>
            VITE_FIREBASE_DATABASE_ID<br/><br/>
            <span className="text-atheris-accent font-bold italic">Importante: Autorize o domínio "*.vercel.app" no Console do Firebase (Authentication &gt; Settings &gt; Authorized Domains).</span>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) return <div className="h-screen w-full bg-atheris-bg flex items-center justify-center mono text-xs uppercase tracking-widest opacity-40">Verificando Habitat...</div>;

  return (
    <div className="min-h-[100dvh] w-full bg-black/90 flex items-center justify-center sm:py-4">
      <div className={classNames("h-[100dvh] sm:h-[90vh] sm:max-h-[900px] w-full max-w-[430px] relative border-atheris-border flex flex-col text-atheris-text overflow-hidden bg-atheris-bg transition-colors duration-500 sm:rounded-[3rem] sm:border sm:border-white/10 sm:shadow-2xl", !isDarkMode && "light-mode")}>
      <BackgroundBlobs />
      
      {/* TOASTS */}
      <div className="fixed top-14 left-0 w-full px-4 z-[100] pointer-events-none flex flex-col gap-2 items-center">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div key={n.id} initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full glass p-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10">
              <div className={classNames("w-10 h-10 rounded-full flex items-center justify-center shrink-0", n.type === 'achievement' ? 'bg-atheris-accent text-black' : 'bg-white/10 text-atheris-accent')}>
                {n.type === 'achievement' ? <Trophy size={20} /> : <Info size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">{n.title}</h4>
                <p className="text-[10px] opacity-60 leading-tight mt-0.5">{n.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!currentUser ? <Login onLogin={setCurrentUser} /> : (
        <>
          <Header user={currentUser} onLogout={handleLogout} isDarkMode={isDarkMode} setIsDarkMode={toggleDarkMode} onSimulatePush={() => {
             addNotification('Atenção Atherium', 'Um novo sinal foi detectado no ninho.', 'info');
          }}
          onUpdateUser={async (data) => {
            const updated = { ...currentUser, ...data };
            setCurrentUser(updated);
            try {
               await updateDoc(doc(db, 'users', currentUser.id), data);
            } catch (err) {
               console.error('Failed to save to firebase', err);
            }
          }}
          />
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scrollbar-hide pb-20">
            <AnimatePresence mode="popLayout">
              {activeTab === 'home' && <HomeView key="home" user={currentUser} completedWorkouts={stats.completed} weeklyCompleted={stats.weekly} weeklyGoal={5} onCheckIn={startCheckIn} onExecuteQuickHit={handleExecuteQuickHit} onExecuteWorkout={setExecutingWorkout} />}
              {activeTab === 'treinos' && <TreinosView key="treinos" currentUser={currentUser} onExecute={setExecutingWorkout} />}
              {activeTab === 'alunos' && <AlunosView key="alunos" currentUser={currentUser} onSelectStudent={selectStudent} onAssignWorkout={assignToStudent} />}
              {activeTab === 'chat' && <AdminChatView key="chat" currentUser={currentUser} onExecuteWorkout={setExecutingWorkout} />}
              {activeTab === 'rank' && <RankView key="rank" currentUser={currentUser} onSelectStudent={selectStudent} />}
              {activeTab === 'perfil' && <ProfileView key="perfil" currentUser={currentUser} onLogout={handleLogout} onUpdateUser={async (data) => {
                if (!currentUser) return;
                const updated = { ...currentUser, ...data };
                setCurrentUser(updated);
                try {
                   await updateDoc(doc(db, 'users', currentUser.id), data);
                } catch (err) {
                   console.error('Failed to save to firebase', err);
                }
              }} />}
            </AnimatePresence>
          </main>
          
          <TabBar role={currentUser.role} activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <AnimatePresence>
            {executingWorkout && <ExecuteWorkoutModal workout={executingWorkout} currentUser={currentUser} onClose={handleCancelWorkout} onFinish={handleFinishWorkout} />}
            {isCheckingIn && <CheckInModal student={currentUser} onClose={closeCheckIn} onSaved={() => { closeCheckIn(); addNotification('Peso Registrado', 'Sua evolução foi armazenada.', 'achievement'); }} />}
            {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={closeStudentDetail} onAssignWorkout={startWorkoutCreation} />}
            {isCreatingWorkoutFor && <WorkoutCreatorModal student={isCreatingWorkoutFor} coach={currentUser} onClose={closeWorkoutCreator} onCreated={() => { closeWorkoutCreator(); addNotification('Protocolo Enviado', 'O aluno já recebeu as ordens.', 'achievement'); }} />}
          </AnimatePresence>
        </>
      )}
      </div>
    </div>
  );
}
