import React, { useState, useEffect, useCallback, memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Trophy, Info, Zap } from 'lucide-react';
import { User, Workout, Role } from './types';
import { auth, db, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { classNames } from './lib/utils';
import { BackgroundBlobs, Header, TabBar } from './components/AtherisCore';
import { HomeView, TreinosView, AlunosView, RankView } from './components/AtherisViews';
import { ExecuteWorkoutModal, CheckInModal, StudentDetailModal, WorkoutCreatorModal } from './components/AtherisModals';

// --- AUTHENTICATION COMPONENTS ---
const Login = memo(({ onLogin }: { onLogin: (u: User) => void }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // ... logic simplifies here to match actual firebase interaction in App component
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-sm mx-auto">
       <h1 className="text-5xl font-black text-atheris-text tracking-tighter mb-4">ATHERIS</h1>
       <p className="text-atheris-accent mono mb-8">Por favor, acesse o habitat via login.</p>
       <button 
        onClick={() => import('./firebase').then(f => f.signInWithGoogle())}
        className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
       >
         <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
           <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
         </svg>
         Portal Google
       </button>
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

  // Memoized action handlers to prevent re-renders
  const addNotification = useCallback((title: string, message: string, type = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setActiveTab('home');
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

  const handleFinishWorkout = useCallback(() => {
    addNotification('Bote Registrado', 'Sua evolução foi inoculada com sucesso.', 'achievement');
    setExecutingWorkout(null);
  }, [addNotification]);

  // Sync Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        const isBypassCoach = authUser.email?.toLowerCase() === 'blackwoodstock1985@gmail.com';
        
        if (userDoc.exists()) {
          const data = userDoc.data() as User;
          if (isBypassCoach && data.role !== 'coach') {
              const updated = { ...data, role: 'coach' as Role, tier: 'Treinador Alfa', name: 'Daniel' };
              await updateDoc(doc(db, 'users', authUser.uid), { role: 'coach', tier: 'Treinador Alfa', name: 'Daniel' });
              setCurrentUser(updated);
          } else {
              setCurrentUser(data);
          }
        } else {
          const newUser = {
            id: authUser.uid,
            name: isBypassCoach ? 'Daniel' : (authUser.displayName || 'Víbora Nova'),
            email: authUser.email || '',
            role: isBypassCoach ? 'coach' : 'student',
            points: 0,
            tier: isBypassCoach ? 'Treinador Alfa' : 'Escoteiro',
            avatar: authUser.photoURL || '',
            createdAt: serverTimestamp(),
            coachId: isBypassCoach ? '' : 'coach_daniel'
          };
          await setDoc(doc(db, 'users', authUser.uid), newUser);
          setCurrentUser(newUser as unknown as User);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  if (authLoading) return <div className="h-screen w-full bg-atheris-bg flex items-center justify-center mono text-xs uppercase tracking-widest opacity-40">Verificando Habitat...</div>;

  return (
    <div className={classNames("h-[100dvh] w-full relative sm:max-w-md sm:mx-auto border-atheris-border flex flex-col text-atheris-text overflow-hidden bg-atheris-bg transition-colors duration-500", !isDarkMode && "light-mode")}>
      <BackgroundBlobs />
      
      {/* TOASTS */}
      <div className="fixed top-14 left-0 w-full px-4 z-[100] pointer-events-none flex flex-col gap-2 items-center sm:max-w-md sm:left-[50%] sm:translate-x-[-50%]">
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
             addNotification('Atenção Alfa', 'Um novo sinal foi detectado no ninho.', 'info');
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
          
          <main className="flex-1 overflow-y-auto relative z-10 scrollbar-hide pb-20">
            <AnimatePresence mode="popLayout">
              {activeTab === 'home' && <HomeView key="home" user={currentUser} completedWorkouts={12} weeklyCompleted={3} weeklyGoal={5} onCheckIn={startCheckIn} />}
              {activeTab === 'treinos' && <TreinosView key="treinos" currentUser={currentUser} onExecute={setExecutingWorkout} />}
              {activeTab === 'alunos' && <AlunosView key="alunos" currentUser={currentUser} onSelectStudent={selectStudent} onAssignWorkout={assignToStudent} />}
              {activeTab === 'rank' && <RankView key="rank" />}
            </AnimatePresence>
          </main>
          
          <TabBar role={currentUser.role} activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <AnimatePresence>
            {executingWorkout && <ExecuteWorkoutModal workout={executingWorkout} currentUser={currentUser} onClose={handleFinishWorkout} />}
            {isCheckingIn && <CheckInModal student={currentUser} onClose={closeCheckIn} onSaved={() => { closeCheckIn(); addNotification('Peso Registrado', 'Sua evolução foi armazenada.', 'achievement'); }} />}
            {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={closeStudentDetail} onAssignWorkout={startWorkoutCreation} />}
            {isCreatingWorkoutFor && <WorkoutCreatorModal student={isCreatingWorkoutFor} coach={currentUser} onClose={closeWorkoutCreator} onCreated={() => { closeWorkoutCreator(); addNotification('Protocolo Enviado', 'O aluno já recebeu as ordens.', 'achievement'); }} />}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
