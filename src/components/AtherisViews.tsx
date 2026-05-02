import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Users, Dumbbell, Plus, CheckCircle2, ChevronLeft, Image as ImageIcon, Scale, TrendingUp, Search, Filter, Zap, Play, MessageSquare, Send, Frown, Meh, SmilePlus, Megaphone, Activity, AlertCircle, Shield, Droplet, Wind, Flame, Target, Sparkles, AlertTriangle, Home as HomeIcon, MapPin, Crown, Medal, Skull, Gem, LogOut } from 'lucide-react';
import { SnakeEye } from './SnakeEye';
import { User, Workout, Message, Challenge } from '../types';
import { EXERCISE_LIBRARY } from '../exerciseLibrary';
import { predatorQuotes, mockWorkouts, quickHits, dailyChallenges, mockUsers } from '../mockData';
import { classNames } from '../lib/utils';
import { getSnakeRank } from '../lib/ranks';
import { collection, query, where, getDocs, db, onSnapshot, orderBy, serverTimestamp, addDoc, getDoc, doc, or, handleFirestoreError } from '../firebase';
import { BroadcastModal } from './AtherisModals';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import * as aiService from '../services/aiService';

// ... (previous getSnakeRank and views continue)

export const AdminChatView = React.memo(({ currentUser, onExecuteWorkout }: { currentUser: User, onExecuteWorkout?: (w: Workout) => void }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(currentUser.role === 'student' ? currentUser.id : null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const isAdmin = currentUser.role === 'coach';

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'users'), where('role', '==', 'student'), where('coachId', '==', currentUser.id));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as User[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'users');
    });
    return () => unsub();
  }, [isAdmin]);

   useEffect(() => {
    if (!selectedStudentId) {
      setMessages([]);
      return;
    }

    const coachIds = ['coach_daniel', currentUser.coachId || ''];
    if (isAdmin) coachIds.push(currentUser.id);
    
    const q = isAdmin ? 
      query(
        collection(db, 'messages'),
        or(
          where('senderId', 'in', [selectedStudentId, ...coachIds]),
          where('receiverId', 'in', [selectedStudentId, ...coachIds])
        ),
        orderBy('createdAt', 'asc')
      ) :
      query(
        collection(db, 'messages'),
        or(
          where('senderId', '==', currentUser.id),
          where('receiverId', '==', currentUser.id)
        ),
        orderBy('createdAt', 'asc')
      );

    const unsub = onSnapshot(q, (snap) => {
      const total = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Message[];
      const filtered = total.filter(m => {
        if (isAdmin) {
          // Double verification to ensure we only show messages for the SELECTED student thread
          return (m.senderId === selectedStudentId && coachIds.includes(m.receiverId)) ||
                 (coachIds.includes(m.senderId) && m.receiverId === selectedStudentId);
        }
        return true;
      });
      setMessages(filtered);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'messages');
    });

    return () => unsub();
  }, [selectedStudentId, currentUser.id, isAdmin]);

  const handleSend = async () => {
    if (!reply.trim() || !selectedStudentId) return;
    
    const receiverId = isAdmin ? selectedStudentId : (currentUser.coachId || 'coach_daniel');

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: receiverId,
        content: reply,
        type: 'text',
        createdAt: serverTimestamp()
      });
      setReply('');
    } catch (err) {
      console.error(err);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-scroll to bottom when messages change or student is selected
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedStudentId]);

  const handleImageSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudentId) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const compressedDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // max width for chat photos
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
              reject(new Error('Canvas context not available'));
            }
          };
          img.onerror = () => reject(new Error('Image processing failed'));
          if (event.target?.result) {
            img.src = event.target.result as string;
          } else {
            reject(new Error('Failed to read image'));
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
      });

      const receiverId = isAdmin ? selectedStudentId : (currentUser.coachId || 'coach_daniel');

      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: receiverId,
        content: '📸 Imagem Mapeada',
        type: 'image',
        metadata: {
          imageUrl: compressedDataUrl
        },
        createdAt: serverTimestamp()
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const selectedStudent = isAdmin ? students.find(s => s.id === selectedStudentId) : currentUser;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col pt-20">
      {isAdmin && !selectedStudentId ? (
        <div className="p-6">
          <h2 className="text-3xl font-black mb-8 tracking-tighter uppercase">Comunicações Atheris</h2>
          <div className="flex flex-col gap-3">
             {students.map(s => (
               <button 
                 key={s.id} 
                 onClick={() => setSelectedStudentId(s.id)}
                 className="glass p-4 rounded-3xl flex items-center gap-4 hover:bg-white/5 transition-all text-left border border-white/5"
               >
                 <div className="w-12 h-12 rounded-2xl bg-atheris-accent/10 border border-atheris-accent/20 flex items-center justify-center font-black text-atheris-accent">
                    {s.avatar ? <img src={s.avatar} className="w-full h-full object-cover rounded-2xl" /> : s.name[0]}
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold">{s.name}</h4>
                   <p className="text-[10px] mono opacity-40 uppercase">Acompanhamento Biométrico</p>
                 </div>
                 <MessageSquare size={18} className="opacity-20" />
               </button>
             ))}
             {students.length === 0 && !loading && (
               <div className="text-center py-20 opacity-30">Nenhuma víbora no ninho para conversar.</div>
             )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
           <header className="p-4 border-b border-white/5 flex items-center justify-between gap-3">
            {isAdmin ? (
              <>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedStudentId(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-atheris-accent/10 border border-atheris-accent/20 flex items-center justify-center font-black text-atheris-accent overflow-hidden">
                      {selectedStudent?.avatar ? <img src={selectedStudent.avatar} className="w-full h-full object-cover" /> : selectedStudent?.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold leading-none">{selectedStudent?.name}</h3>
                      <p className="text-[8px] mono uppercase opacity-40 mt-1">Conexão Ativa</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-atheris-accent/20 border border-atheris-accent flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-bold text-atheris-accent leading-none">Mestre Atheris</h3>
                  <p className="text-[10px] mono uppercase opacity-40 mt-1 tracking-widest font-black">Canal de Comando</p>
                </div>
              </div>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide pb-10">
             {messages.map((m, index) => {
               const isMe = m.senderId === currentUser.id;
               const isSystem = m.type === 'report' || m.type === 'checkin';
               const mood = m.metadata?.mood || 0;
               const moodEmoji = m.metadata?.moodEmoji || (mood === 5 ? '🤩' : mood === 4 ? '🙂' : mood === 3 ? '😐' : mood === 2 ? '☹️' : mood === 1 ? '😫' : '');

               return (
                 <div key={`${m.id}-${index}`} className={classNames(
                   "max-w-[85%] p-4 rounded-3xl transition-all shadow-md group", 
                   isMe ? "self-end bg-atheris-accent text-black rounded-tr-none" : 
                   isSystem ? "self-start bg-white/[0.04] border border-atheris-accent/20 rounded-tl-none ring-1 ring-white/5" :
                   "self-start glass border border-white/5 rounded-tl-none shadow-black/20"
                 )}>
                    {m.type !== 'text' && (
                       <div className={classNames(
                         "text-[9px] mono uppercase font-black mb-3 flex items-center gap-2 tracking-widest", 
                         isMe ? "text-black/60" : "text-atheris-accent"
                       )}>
                         <div className="w-4 h-[1px] bg-current opacity-30" /> 
                         {m.type === 'report' ? 'Bio-Sincronização' : m.type === 'workout' ? 'Protocolo de Assalto' : 'Inoculação'} 
                       </div>
                    )}

                    {m.type === 'workout' ? (
                       <div className="flex flex-col gap-4">
                          <p className={classNames(
                            "text-base font-bold italic",
                            isMe ? "text-[#443d3d]" : "text-gray-100"
                          )}>"{m.content}"</p>
                          {onExecuteWorkout && (
                             <button 
                               onClick={async () => {
                                 const docSnap = await getDoc(doc(db, 'workouts', m.metadata.workoutId));
                                 if (docSnap.exists()) {
                                   onExecuteWorkout({ id: docSnap.id, ...docSnap.data() } as Workout);
                                 }
                               }}
                               className="w-full py-3 bg-atheris-accent text-black rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,255,95,0.3)] active:scale-95 transition-all"
                             >
                               <Play size={14} fill="currentColor" /> Iniciar Ataque
                             </button>
                          )}
                       </div>
                    ) : m.type === 'image' ? (
                       <div className="flex flex-col gap-3">
                         <img src={m.metadata?.imageUrl} alt="Anexo" className="w-full rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(m.metadata?.imageUrl, '_blank')} />
                       </div>
                    ) : (
                      <p className={classNames(
                        "leading-relaxed whitespace-pre-wrap", 
                        isMe ? "text-sm font-medium text-black" : "text-base font-bold text-gray-100"
                      )}>
                        {m.content}
                      </p>
                    )}

                    {m.metadata?.weightKg && (
                       <div className={classNames(
                         "mt-4 pt-4 border-t flex gap-8 items-start", 
                         isMe ? "border-black/10" : "border-white/10"
                       )}>
                          <div className="flex flex-col">
                            <span className="text-[8px] mono uppercase opacity-50 mb-1.5 flex items-center gap-1">
                              <Scale size={8} /> Tonelagem
                            </span>
                            <span className="text-sm font-black tracking-tight">{m.metadata.weightKg}<span className="text-[10px] opacity-40 ml-0.5">KG</span></span>
                          </div>
                          
                          <div className="flex flex-col flex-1">
                            <span className="text-[8px] mono uppercase opacity-50 mb-1.5 flex items-center gap-1">
                              {mood >= 4 ? <SmilePlus size={8} /> : mood >= 3 ? <Meh size={8} /> : <Frown size={8} />} Sinal de Humor
                            </span>
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => (
                                  <div key={i} className={classNames(
                                    "h-1 px-2 rounded-full transition-all duration-500",
                                    i <= mood ? 
                                      (mood >= 5 ? 'bg-atheris-toxic w-4' : mood >= 4 ? 'bg-atheris-accent w-3' : mood >= 3 ? 'bg-yellow-400 w-2' : 'bg-red-500 w-1.5') : 
                                      'bg-white/10 w-1'
                                  )} />
                                ))}
                              </div>
                              <span className="text-xs font-black flex items-center gap-2 mt-0.5 text-white">
                                <span className="text-xl leading-none drop-shadow-sm">{moodEmoji}</span>
                                <span className={classNames("text-[10px] mono font-black", isMe ? "text-black/50" : "text-atheris-accent")}>{mood}/5</span>
                              </span>
                            </div>
                          </div>
                       </div>
                    )}
                 </div>
               );
             })}
             {messages.length === 0 && (
               <div className="text-center py-10 opacity-20 text-xs mono uppercase italic">Silêncio no habitat...</div>
             )}
          </div>

          <div className="p-4 bg-atheris-bg/80 backdrop-blur-xl border-t border-white/5 pb-10 relative">
            <AnimatePresence>
              {showAttachMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full left-4 mb-2 z-50 bg-black/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl w-48 shadow-[0_0_30px_rgba(0,0,0,0.8)] origin-bottom-left"
                  >
                    <button
                       onClick={() => {
                         setShowAttachMenu(false);
                         fileInputRef.current?.click();
                       }}
                       className="w-full flex items-center justify-between p-3 hover:bg-white/5 active:scale-95 rounded-xl transition-all text-sm font-bold text-gray-200"
                    >
                       <span className="flex items-center gap-3">
                         <ImageIcon size={18} className="text-atheris-accent" />
                         Enviar Imagem
                       </span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="flex gap-2 relative z-50">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageSend} 
                className="hidden" 
              />
              <button 
                onClick={() => setShowAttachMenu(!showAttachMenu)} 
                disabled={isUploading}
                className="p-3 bg-white/5 text-atheris-text rounded-2xl hover:bg-white/10 active:scale-95 transition-all border border-white/10 flex-shrink-0 relative"
              >
                {isUploading ? <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-atheris-accent animate-spin" /> : <Plus size={20} className={classNames("transition-transform", showAttachMenu && "rotate-45")} />}
              </button>
              <input 
                value={reply} 
                onChange={(e) => setReply(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Sintetizar peçonha..." 
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-atheris-accent transition-colors"
              />
              <button onClick={handleSend} className="p-3 bg-atheris-accent text-black rounded-2xl shadow-lg active:scale-95 transition-all flex-shrink-0">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// Rank and Tier functions moved to /src/lib/ranks.ts

const InsigniaBadge = ({ rank, size = 24, showGlow = true }: { rank: any, size?: number, showGlow?: boolean }) => {
  const getIcon = () => {
    switch(rank.icon) {
      case 'Sparkles': return <Sparkles size={size} />;
      case 'Flame': return <Flame size={size} />;
      case 'Skull': return <Skull size={size} />;
      case 'Gem': return <Gem size={size} />;
      case 'Zap': return <Zap size={size} />;
      case 'Crown': return <Crown size={size} />;
      case 'Shield': return <Shield size={size} />;
      case 'Medal': return <Medal size={size} />;
      default: return <Activity size={size} />;
    }
  };

  return (
    <div className={classNames(
      "relative flex items-center justify-center p-2 rounded-xl border-2 rotate-45 transition-all duration-700 group",
      rank.border,
      rank.bg,
      rank.color,
      showGlow ? rank.glow : ""
    )}>
      <div className="-rotate-45 relative z-10 drop-shadow-md">
        {getIcon()}
      </div>

      {/* Ornament Sparks for high tiers */}
      {rank.name === 'Atheris Suprema' && (
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-6px] border border-dashed border-amber-400/20 rounded-full"
        />
      )}
    </div>
  );
};

export const HomeView = React.memo(({ user, completedWorkouts, weeklyCompleted, weeklyGoal, onCheckIn, onExecuteQuickHit, onExecuteWorkout }: {
  user: User,
  completedWorkouts: number,
  weeklyCompleted: number,
  weeklyGoal: number,
  onCheckIn: () => void,
  onExecuteQuickHit: (title: string) => void,
  onExecuteWorkout: (w: Workout) => void
}) => {
  const rank = getSnakeRank(user.points || 0);
  const [quote, setQuote] = useState(predatorQuotes[0]);
  const [assignedWorkouts, setAssignedWorkouts] = useState<Workout[]>([]);
  const [nestStats, setNestStats] = useState({ total: 0, active: 0, alert: 0, dormant: 0 });
  const [challengeClaimed, setChallengeClaimed] = useState(false);
  
  // Calculate daily quick hits based on current date
  const todayDate = new Date();
  const dayOfYear = Math.floor((todayDate.getTime() - new Date(todayDate.getFullYear(), 0, 0).getTime()) / 86400000);
  
  const dailyHits = [
    quickHits[dayOfYear % quickHits.length],
    quickHits[(dayOfYear + 2) % quickHits.length]
  ];
  const challenge = (dailyChallenges as Challenge[])[dayOfYear % dailyChallenges.length];

  const handleClaimChallenge = async () => {
    if (challengeClaimed) return;
    try {
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      await addDoc(collection(db, 'workouts'), {
        studentId: user.id,
        authorId: user.id, // Student self-creates the challenge workout
        title: `ASSALTO: ${challenge.title}`,
        type: 'challenge',
        exercises: [{ 
          name: challenge.task, 
          sets: 1, 
          reps: "COMPLETO", 
          weight: 0, 
          instruction: "Protocolo de campo. Execute e reporte.",
          muscles: ["Letalidade"]
        }],
        completed: false,
        createdAt: serverTimestamp(),
        expiresAt: endOfDay,
        points: challenge.points
      });
      setChallengeClaimed(true);
    } catch (err) {
      console.error("Erro ao aceitar missão:", err);
    }
  };

  useEffect(() => {
    if (user.role === 'coach') {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const unsub = onSnapshot(q, (snap) => {
        const students = snap.docs.map(d => d.data() as User);
        const now = new Date().getTime();
        let active = 0, alert = 0, dormant = 0;
        
        students.forEach(s => {
          if (!s.lastActiveAt) { dormant++; return; }
          const date = s.lastActiveAt.toDate ? s.lastActiveAt.toDate() : new Date(s.lastActiveAt);
          const diff = (now - date.getTime()) / (1000 * 60 * 60 * 24);
          if (diff < 2) active++;
          else if (diff < 5) alert++;
          else dormant++;
        });
        setNestStats({ total: students.length, active, alert, dormant });
      }, (err) => {
        handleFirestoreError(err, 'list' as any, 'users');
      });
      return () => unsub();
    } else {
      // Query for all workouts today (completed or not) to check for challenge claim state
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'workouts'), 
        where('studentId', '==', user.id), 
        where('createdAt', '>=', startOfDay),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        const now = new Date();
        const ws = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Workout[];
        
        // Assigned (active) workouts for the list
        const activeWorkouts = ws.filter(w => !w.completed);
        
        // Filter out expired uncompleted ones (if needed)
        const validWorkouts = activeWorkouts.filter(w => {
          if (!w.expiresAt) return true;
          const exp = w.expiresAt.toDate ? w.expiresAt.toDate() : new Date(w.expiresAt);
          return exp > now;
        });

        validWorkouts.sort((a, b) => {
          return (a.title || "").localeCompare(b.title || "");
        });

        setAssignedWorkouts(validWorkouts);

        // Check if today's challenge was already claimed (regardless of completion)
        const hasClaimedToday = ws.some(w => 
          w.type === 'challenge' && 
          w.createdAt && 
          new Date(w.createdAt.toDate ? w.createdAt.toDate() : w.createdAt).toDateString() === now.toDateString()
        );
        
        if (hasClaimedToday) {
           setChallengeClaimed(true);
        }
      }, (error) => {
        handleFirestoreError(error, 'list' as any, 'workouts');
      });
      return () => unsub();
    }
  }, [user.id, user.role]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(predatorQuotes[Math.floor(Math.random() * predatorQuotes.length)]);
    }, 30000); // 30 seconds rotation
    return () => clearInterval(interval);
  }, []);

  const getChallengeIcon = (iconName: string) => {
    switch(iconName) {
      case 'Zap': return <Zap size={20} />;
      case 'Shield': return <Shield size={20} />;
      case 'TrendingUp': return <TrendingUp size={20} />;
      case 'Droplet': return <Droplet size={20} />;
      case 'Wind': return <Wind size={20} />;
      case 'Flame': return <Flame size={20} />;
      case 'Target': return <Target size={20} />;
      case 'Sparkles': return <Sparkles size={20} />;
      default: return <Target size={20} />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 pt-32 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <span className="mono text-[10px] uppercase opacity-40 tracking-[0.3em] mb-1">Status do Predador</span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {user.role === 'coach' ? 'Daniel' : user.name.split(' ')[0]}
            </h2>
            <div className="flex items-center gap-2">
              <InsigniaBadge rank={user.role === 'coach' ? { icon: 'Sparkles', color: 'text-atheris-toxic', border: 'border-atheris-toxic', bg: 'bg-atheris-toxic/10', glow: 'shadow-[0_0_15px_rgba(223,255,0,0.3)]' } : rank} size={14} />
              <span className={classNames("text-[10px] mono font-black uppercase tracking-widest", user.role === 'coach' ? 'text-atheris-toxic' : rank.color)}>
                {user.role === 'coach' ? 'ATHERIS SUPREMA' : rank.name}
              </span>
            </div>
          </div>
        </div>
        {user.role === 'student' && (
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-1 text-atheris-accent">
                <Flame size={14} fill="currentColor" />
                <span className="font-mono font-bold text-sm">3 DÍAS</span>
             </div>
             <span className="text-[8px] mono uppercase opacity-30">Streak de Botes</span>
          </div>
        )}
      </div>

      {user.role === 'student' ? (
        <>
          {/* Daily Challenge Section */}
          {!challengeClaimed && (
            <section className="mb-8">
              <div className="glass p-5 rounded-[2rem] border border-atheris-accent/20 bg-atheris-accent/5 relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-atheris-accent/10 rounded-full blur-2xl group-hover:bg-atheris-accent/20 transition-all" />
                 
                 <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
                       <AlertTriangle size={10} />
                       <span className="mono text-[8px] font-black uppercase tracking-widest">Aviso Tático</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-40 mono text-[9px] uppercase font-bold">
                       {challenge.location === 'gym' ? <MapPin size={10} /> : <HomeIcon size={10} />}
                       {challenge.location === 'gym' ? 'Academia' : challenge.location === 'home' ? 'Em Casa' : 'Qualquer Local'}
                    </div>
                 </div>

                 <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-4">
                       <div className="w-12 h-12 rounded-full bg-atheris-accent text-black flex items-center justify-center shadow-[0_0_20px_rgba(34,255,102,0.4)]">
                          {getChallengeIcon(challenge.icon)}
                       </div>
                       <div>
                          <h4 className="font-black text-sm uppercase tracking-tight">{challenge.title}</h4>
                          <p className="text-xs opacity-60 mt-0.5 leading-tight">{challenge.task}</p>
                       </div>
                    </div>
                    <button 
                      onClick={handleClaimChallenge}
                      className="bg-white/10 hover:bg-atheris-accent hover:text-black p-2 rounded-xl transition-all"
                    >
                      <Plus size={20} />
                    </button>
                 </div>

                 <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5 mb-4">
                    <p className="text-[9px] leading-relaxed italic opacity-50">
                      O treinamento fora do ninho envolve riscos. Execute com precisão técnica ou aborte a missão se houver instabilidade física.
                    </p>
                 </div>

                 <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5 mono text-[10px] text-atheris-accent font-black">
                       <Sparkles size={12} />
                       +{challenge.points} V-PTS
                    </div>
                    <span className="text-[9px] mono uppercase opacity-40">Desafio {dayOfYear % dailyChallenges.length + 1} de {dailyChallenges.length}</span>
                 </div>
              </div>
            </section>
          )}

          {assignedWorkouts.length > 0 && (
            <section className="mb-8">
              <h3 className="mono text-[9px] uppercase opacity-50 mb-4 tracking-[0.2em] flex items-center gap-2 font-black">
                <div className="w-1.5 h-1.5 rounded-full bg-atheris-accent animate-pulse" /> Protocolos de Assalto
              </h3>
              <div className="flex flex-col gap-3">
                {assignedWorkouts.map(w => (
                  <button 
                    key={w.id} 
                    onClick={() => onExecuteWorkout(w)}
                    className="glass p-5 rounded-3xl flex items-center justify-between group border border-atheris-accent/10 hover:border-atheris-accent/30 transition-all text-left overflow-hidden relative"
                  >
                     <div className="absolute inset-0 bg-atheris-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="relative z-10">
                        <h4 className="font-black text-atheris-text italic uppercase tracking-tighter text-lg">{w.title}</h4>
                        <div className="flex items-center gap-3 mt-1 opacity-50 text-[10px] font-bold mono">
                          <span>{w.exercises?.length || 0} MOVIMENTOS</span>
                          <div className="w-1 h-1 rounded-full bg-current" />
                          <span>PREPARO AVALIADO</span>
                        </div>
                     </div>
                     <div className="relative z-10 p-3 bg-atheris-accent text-black rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                        <Play size={18} fill="currentColor" />
                     </div>
                  </button>
                ))}
              </div>
            </section>
          )}

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
               <div className="absolute top-0 right-0 p-2 opacity-10"><SnakeEye size={18} className="text-atheris-toxic"/></div>
               <span className="block mono opacity-60 uppercase mb-2 text-[10px]">Toxinas (Sem.)</span>
               <div className="flex items-end gap-2">
                 <span className="block text-5xl font-light text-atheris-text">{weeklyCompleted}</span>
                 <span className="block text-xs mb-2 opacity-40 font-mono">/ {weeklyGoal}</span>
               </div>
            </div>
          </div>

      {/* Mantra Section */}
      <div className="mb-10 relative">
        <div className="p-6 glass rounded-3xl border-l-4 border-atheris-accent relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={40} /></div>
           <p className="text-atheris-text/80 italic text-sm leading-relaxed relative z-10">"{quote}"</p>
           <p className="mono text-[10px] uppercase mt-4 text-atheris-accent tracking-widest font-bold">— MANTRA ATHERIS</p>
        </div>
      </div>

          {/* Quick Hits */}
          <section className="mb-6 pb-20">
             <h3 className="mono text-xs uppercase opacity-50 mb-4 tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-atheris-accent" /> Bote Rápido
             </h3>
             <div className="grid grid-cols-2 gap-4">
                {dailyHits.map((hit, index) => (
                  <button 
                    key={`${hit.id}-${index}`} 
                    onClick={() => onExecuteQuickHit(hit.title)}
                    className={`glass p-4 rounded-2xl text-left hover:bg-white/5 transition-colors border-l-2 ${hit.color}`}
                  >
                     <span className="block text-xs font-bold mb-1 truncate">{hit.title}</span>
                     <span className="block text-[10px] opacity-40 uppercase truncate">{hit.desc}</span>
                  </button>
                ))}
             </div>
          </section>
        </>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          {/* Coach Dashboard Summary */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="glass p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-atheris-accent/5" />
                <h3 className="mono text-[10px] uppercase opacity-40 mb-6 tracking-[0.2em] relative z-10 flex items-center gap-2">
                   <Activity size={14} className="text-atheris-accent" /> Estado do Ninho
                </h3>
                <div className="grid grid-cols-3 gap-3 relative z-10">
                   <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-2xl font-black text-atheris-accent leading-none">{nestStats.active}</span>
                      <span className="text-[8px] mono uppercase opacity-40 mt-1">Ativos</span>
                   </div>
                   <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-2xl font-black text-yellow-500 leading-none">{nestStats.alert}</span>
                      <span className="text-[8px] mono uppercase opacity-40 mt-1">Alerta</span>
                   </div>
                   <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-2xl font-black text-red-500 leading-none">{nestStats.dormant}</span>
                      <span className="text-[8px] mono uppercase opacity-40 mt-1">Críticos</span>
                   </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-[10px] mono relative z-10">
                   <span className="opacity-40">Total de Víboras: {nestStats.total}</span>
                   <span className="text-atheris-accent font-black">Habitat Estável</span>
                </div>
             </div>
          </section>

          <section className="glass p-6 rounded-[2.5rem] bg-white/5 border border-white/5 flex flex-col items-center justify-center py-10 opacity-60 text-center">
            <Users size={48} className="mb-4 text-atheris-muted" />
            <h4 className="font-bold text-lg mb-1">Ataque Direcionado</h4>
            <p className="text-sm italic px-4">Sua presença mantém a hierarquia. Inocule protocolos táticos no Ninho para manter a evolução.</p>
          </section>
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
    const q = query(collection(db, 'workouts'), where('studentId', '==', currentUser.id), where('completed', '==', false));
    const unsubscribe = onSnapshot(q, (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as Workout[];
        // Sort explicitly by title ascending
        list.sort((a, b) => {
          return (a.title || "").localeCompare(b.title || "");
        });
        
        setWorkouts(list.length > 0 ? list : mockWorkouts.filter(w => w.studentId === currentUser.id && w.completed === false));
        setLoading(false);
    }, (error) => {
        console.error("Failed to sync workouts real-time:", error);
        setWorkouts(mockWorkouts.filter(w => w.studentId === currentUser.id && w.completed === false));
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 pt-32 pb-32">
      <h2 className="text-3xl font-black mb-8 tracking-tighter uppercase">Arsenal de Ataque</h2>

      <div className="flex flex-col gap-4">
        {loading ? (
          // Loading Skeletons for Workouts
          Array.from({ length: 3 }).map((_, i) => (
             <div key={`skel-workout-${i}`} className="glass p-5 rounded-3xl relative overflow-hidden animate-pulse border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-full">
                    <div className="h-5 w-48 bg-white/10 rounded mb-2" />
                    <div className="h-3 w-24 bg-white/5 rounded" />
                  </div>
                  <div className="w-11 h-11 bg-white/10 rounded-xl flex-shrink-0 ml-4" />
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={`track-${j}`} className="h-1 flex-1 bg-white/5 rounded-full" />
                  ))}
                </div>
             </div>
          ))
        ) : workouts.length > 0 ? (
          <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="flex flex-col gap-4">
            {workouts.map(workout => (
              <motion.div 
                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} 
                key={workout.id} 
                className="glass p-5 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-colors border border-white/5"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-atheris-accent/0 to-atheris-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                 <div className="flex justify-between items-start mb-4 relative z-10">
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

                 <div className="flex gap-1 relative z-10">
                    {workout.exercises.slice(0, 5).map((_, i) => (
                      <div key={i} className="h-1 flex-1 bg-atheris-accent/20 rounded-full overflow-hidden">
                         {workout.completed && <div className="h-full w-full bg-atheris-accent"></div>}
                      </div>
                    ))}
                 </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 opacity-30 border-2 border-dashed border-white/5 rounded-3xl p-6">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
               <Zap size={24} className="text-white/50" />
             </div>
             <p className="italic">Seu arsenal está vazio.</p>
             <p className="text-[10px] mono tracking-widest uppercase mt-2 opacity-50">Aguarde novas missões no sistema.</p>
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
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Em Caça' | 'Alerta' | 'Hibernando'>('Todos');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        let q;
        if (currentUser.tier === 'Atheris Suprema') {
          q = query(
            collection(db, 'users'), 
            where('role', '==', 'student')
          );
        } else {
          q = query(
            collection(db, 'users'), 
            where('role', '==', 'student'),
            where('coachId', '==', currentUser.id)
          );
        }
        const unsubscribe = onSnapshot(q, (snap) => {
          let fetchedStudents = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as User[];
          
          // Sort by points descending (Rank order)
          fetchedStudents.sort((a, b) => (b.points || 0) - (a.points || 0));
          setStudents(fetchedStudents);
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, 'list' as any, 'users');
          setLoading(false);
        });
        return unsubscribe;
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const getStatus = (lastActiveAt?: any) => {
    if (!lastActiveAt) return { label: 'Hibernando', color: 'text-red-500', bg: 'bg-red-500/10' };
    const date = lastActiveAt.toDate ? lastActiveAt.toDate() : new Date(lastActiveAt);
    const diff = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 2) return { label: 'Em Caça', color: 'text-atheris-accent', bg: 'bg-atheris-accent/10' };
    if (diff < 5) return { label: 'Alerta', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { label: 'Hibernando', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const filteredStudents = students.filter(student => {
    if (statusFilter === 'Todos') return true;
    return getStatus(student.lastActiveAt).label === statusFilter;
  });

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-6 pt-32 pb-32">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">O Ninho</h2>
          <p className="text-atheris-muted text-[10px] mono uppercase tracking-widest px-1">Gerenciamento de Víboras</p>
        </div>
        <button 
          onClick={() => setShowBroadcast(true)}
          className="p-3 bg-atheris-accent text-black rounded-2xl shadow-[0_0_20px_rgba(34,255,102,0.3)] active:scale-95 transition-all"
        >
          <Megaphone size={20} />
        </button>
      </div>

      {/* Admin Radar */}
      <section className="mb-8">
        <h3 className="mono text-[9px] uppercase opacity-50 mb-4 tracking-[0.2em] flex items-center gap-2 font-black border-b border-white/5 pb-2">
          <Activity size={12} className="text-atheris-accent" /> Radar de Atividade
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => setStatusFilter('Todos')}
            className={classNames(
              "glass p-4 rounded-3xl relative overflow-hidden transition-all cursor-pointer",
              statusFilter === 'Todos' ? "border-white bg-white/5 ring-1 ring-white/20 border" : "border-white/5 border hover:bg-white/5"
            )}
           >
             <div className="absolute top-0 right-0 p-3 opacity-10"><Users size={24} className="text-white" /></div>
             <span className="block mono text-[8px] uppercase opacity-40 mb-1">População</span>
             <span className="text-3xl font-light text-atheris-text">{students.length}</span>
          </div>

          <div 
            onClick={() => setStatusFilter('Em Caça')}
            className={classNames(
              "glass p-4 rounded-3xl relative overflow-hidden transition-all cursor-pointer",
              statusFilter === 'Em Caça' ? "border-atheris-accent bg-atheris-accent/5 ring-1 ring-atheris-accent/20 border" : "border-white/5 border hover:bg-white/5"
            )}
           >
             <div className="absolute top-0 right-0 p-3 opacity-10"><Activity size={24} className="text-atheris-accent" /></div>
             <span className="block mono text-[8px] uppercase opacity-40 mb-1">Em Caça</span>
             <span className="text-3xl font-light text-atheris-accent">
               {students.filter(s => getStatus(s.lastActiveAt).label === 'Em Caça').length}
             </span>
          </div>

          <div 
            onClick={() => setStatusFilter('Alerta')}
            className={classNames(
              "glass p-4 rounded-3xl relative overflow-hidden transition-all cursor-pointer",
              statusFilter === 'Alerta' ? "border-yellow-500 bg-yellow-500/5 ring-1 ring-yellow-500/20 border" : "border-white/5 border hover:bg-white/5"
            )}
          >
             <div className="absolute top-0 right-0 p-3 opacity-10"><AlertCircle size={24} className="text-yellow-500" /></div>
             <span className="block mono text-[8px] uppercase opacity-40 mb-1">Alerta</span>
             <span className="text-3xl font-light text-yellow-500">
               {students.filter(s => getStatus(s.lastActiveAt).label === 'Alerta').length}
             </span>
          </div>

          <div 
            onClick={() => setStatusFilter('Hibernando')}
            className={classNames(
              "glass p-4 rounded-3xl relative overflow-hidden transition-all cursor-pointer",
              statusFilter === 'Hibernando' ? "border-red-500 bg-red-500/5 ring-1 ring-red-500/20 border" : "border-white/5 border hover:bg-white/5"
            )}
          >
             <div className="absolute top-0 right-0 p-3 opacity-10"><AlertCircle size={24} className="text-red-500" /></div>
             <span className="block mono text-[8px] uppercase opacity-40 mb-1">Hibernando</span>
             <span className="text-3xl font-light text-red-500">
               {students.filter(s => getStatus(s.lastActiveAt).label === 'Hibernando').length}
             </span>
          </div>
        </div>
      </section>

      <div className="mb-4 flex items-center gap-2">
           <h4 className="mono text-[10px] text-white/50 tracking-widest uppercase">
               {statusFilter === 'Todos' ? 'Todas as Víboras' : `Víboras: ${statusFilter}`}
           </h4>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          // Loading Skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`skel-${i}`} className="glass p-4 rounded-3xl flex items-center justify-between border border-white/5 animate-pulse">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10" />
                  <div>
                    <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                    <div className="h-3 w-32 bg-white/5 rounded" />
                  </div>
               </div>
               <div className="w-9 h-9 bg-white/10 rounded-xl" />
            </div>
          ))
        ) : filteredStudents.length > 0 ? (
          <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="flex flex-col gap-4">
            {filteredStudents.map((student, idx) => {
              const status = getStatus(student.lastActiveAt);
              return (
                <motion.div 
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                  key={student.id} 
                  onClick={() => onSelectStudent(student)}
                  className="group glass p-4 rounded-3xl flex items-center justify-between hover:bg-white/5 transition-all text-left relative overflow-hidden cursor-pointer border border-white/5"
                >
                   <div className="absolute inset-0 viper-pattern opacity-0 group-hover:opacity-10 transition-opacity"></div>
                   <div className="flex items-center gap-4 relative z-10">
                      <div className="relative">
                        <div className="absolute -top-2 -left-2 z-20 w-6 h-6 bg-atheris-accent text-black rounded-lg flex items-center justify-center text-[10px] font-black shadow-xl border border-black/20">
                          {idx + 1}º
                        </div>
                        {student.avatar ? (
                          <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center text-atheris-accent font-black text-xl">
                            {student.name[0]}
                          </div>
                        )}
                        <div className={classNames("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-atheris-bg shadow-sm", status.label === 'Em Caça' ? 'bg-atheris-accent' : status.label === 'Alerta' ? 'bg-yellow-500' : 'bg-red-500')}></div>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
                          {student.name}
                          <span className={classNames("text-[8px] mono uppercase px-1.5 py-0.5 rounded-md font-black", status.bg, status.color)}>
                            {status.label}
                          </span>
                        </h4>
                        <p className="text-[10px] mono uppercase opacity-50 tracking-tighter">Tier: <span className="text-atheris-accent">{getSnakeRank(student.points || 0).name}</span> • {student.points} V-PTS</p>
                      </div>
                   </div>
                   <div className="relative z-10 flex flex-row items-center gap-2">
                      {status.label === 'Hibernando' && (
                         <button 
                           onClick={async (e) => { 
                             e.stopPropagation(); 
                             try {
                               await addDoc(collection(db, 'messages'), {
                                 senderId: currentUser.id,
                                 senderName: currentUser.name,
                                 receiverId: student.id,
                                 type: 'text',
                                 content: '⚠️ [PUSH NOTIFICATION]: Você está hibernando há muito tempo. É hora de caçar. Volte para o Ninho.',
                                 createdAt: serverTimestamp()
                               });
                               alert(`Notificação Push enviada para o celular de ${student.name}! (Simulado)`);
                             } catch (err) {
                               console.error(err);
                             }
                           }} 
                           className="p-2.5 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white text-red-500 transition-all border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                           title="Acordar Víbora (Push Notification)"
                         >
                           <Megaphone size={16} />
                         </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); onAssignWorkout(student); }} className="p-2.5 bg-white/5 rounded-xl hover:bg-atheris-accent hover:text-black transition-all text-white/50 border border-white/5">
                        <Zap size={16} />
                      </button>
                   </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-20 opacity-30 border-2 border-dashed border-white/5 rounded-3xl">
             <Plus size={48} className="mx-auto mb-4" />
             <p className="italic">
               {statusFilter === 'Todos' 
                 ? "Nenhuma víbora encontrada no seu ninho." 
                 : `Nenhuma víbora classificada como "${statusFilter}".`}
             </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} students={students} coach={currentUser} />}
      </AnimatePresence>
    </motion.div>
  );
});

export const RankView = React.memo(({ currentUser, onSelectStudent }: { currentUser: User, onSelectStudent?: (s: User) => void }) => {
  const [ranked, setRanked] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const firestoreList = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as User[];
      setRanked(firestoreList.sort((a, b) => (b.points || 0) - (a.points || 0)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getTrophy = (index: number, points: number) => {
    const rank = getSnakeRank(points);
    
    if (index === 0) return (
      <div className="relative">
        <Crown size={32} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-1 -right-1">
          <Sparkles size={14} className="text-white" />
        </motion.div>
      </div>
    );
    
    // Icon based on Rank Name (Thematic to User Reference)
    switch(rank.icon) {
      case 'Sparkles': return <Sparkles size={22} className="text-amber-400" />;
      case 'Flame': return <Flame size={22} className="text-red-500" />;
      case 'Skull': return <Skull size={22} className="text-purple-500" />;
      case 'Gem': return <Gem size={22} className="text-cyan-400" />;
      case 'Zap': return <Zap size={22} className="text-emerald-500" />;
      case 'Crown': return <Crown size={22} className="text-yellow-500" />;
      case 'Shield': return <Shield size={22} className="text-slate-300" />;
      case 'Medal': return <Medal size={22} className="text-amber-700" />;
      default: return <Activity size={20} className="text-slate-500 opacity-40" />;
    }
  };

  const top3 = ranked.slice(0, 3);
  const theRest = ranked.slice(3);

  if (loading) return <div className="flex-1 flex items-center justify-center p-20"><div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-atheris-accent animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 pt-32 pb-32 min-h-screen relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-atheris-accent/5 to-transparent pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-[80%] h-[300px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="flex flex-col items-center mb-16 text-center relative z-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-atheris-accent/10 blur-[100px] rounded-full" 
        />
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">Hierarquia Letal</h2>
        <div className="flex items-center gap-4">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-atheris-accent/40" />
          <p className="text-[10px] opacity-60 mono uppercase tracking-[0.4em] font-black text-atheris-accent">Dominando a Cadeia</p>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-atheris-accent/40" />
        </div>
      </div>

      {/* Podium Section with Light Rays */}
      <div className="relative mb-20 p-4 pt-10">
        {/* Light Beams Background */}
        <div className="absolute inset-0 pointer-events-none flex justify-center opacity-30">
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }} 
            transition={{ duration: 4, repeat: Infinity }}
            className="w-1 h-[400px] bg-gradient-to-b from-white via-white to-transparent blur-md rotate-[15deg] translate-x-20" 
          />
          <motion.div 
            animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }} 
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="w-1 h-[400px] bg-gradient-to-b from-white via-white to-transparent blur-md rotate-[-15deg] -translate-x-20" 
          />
        </div>

        <div className="grid grid-cols-3 gap-8 items-end relative z-10">
          {/* 2nd Place */}
          {top3[1] && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => onSelectStudent?.(top3[1])}>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={classNames("w-16 h-16 rounded-full bg-black border-2 overflow-hidden p-0.5 relative", getSnakeRank(top3[1].points).border)}>
                    <img src={top3[1].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].name}`} className="w-full h-full object-cover rounded-full" alt="" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 z-20 scale-[0.65]">
                     <InsigniaBadge rank={getSnakeRank(top3[1].points)} size={16} />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="font-black text-[11px] uppercase truncate w-24 tracking-tighter text-white/90">{top3[1].name.split(' ')[0]}</p>
                <div className="flex items-center justify-center gap-1 opacity-70">
                  <span className="text-sm font-mono font-black">{top3[1].points}</span>
                  <span className="text-[7px] font-bold mono">V-PTS</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 -mt-10 cursor-pointer hover:scale-105 transition-transform" onClick={() => onSelectStudent?.(top3[0])}>
              <div className="flex flex-col items-center relative">
                {/* Halo Background */}
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-40px] border border-amber-400/10 rounded-full"
                />
                <div className="relative z-10 scale-125 mb-4">
                  <div className={classNames("w-24 h-24 rounded-full bg-black border-4 overflow-hidden p-1 shadow-[0_0_50px_rgba(251,191,36,0.4)] relative", getSnakeRank(top3[0].points).border)}>
                    <img src={top3[0].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].name}`} className="w-full h-full object-cover rounded-full" alt="" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 z-20 scale-[0.8]">
                     <InsigniaBadge rank={getSnakeRank(top3[0].points)} size={20} />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="font-black text-lg uppercase tracking-tighter italic text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">{top3[0].name.split(' ')[0]}</p>
                <div className="flex flex-col items-center -mt-1">
                  <span className="text-3xl font-mono font-black text-amber-400 leading-none drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">{top3[0].points}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-px w-4 bg-amber-400/50" />
                    <span className="mono text-[8px] uppercase text-amber-500 font-black tracking-[0.2em]">{getSnakeRank(top3[0].points).name}</span>
                    <div className="h-px w-4 bg-amber-400/50" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => onSelectStudent?.(top3[2])}>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={classNames("w-14 h-14 rounded-full bg-black border-2 overflow-hidden p-0.5 relative", getSnakeRank(top3[2].points).border)}>
                    <img src={top3[2].avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].name}`} className="w-full h-full object-cover rounded-full" alt="" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 z-20 scale-[0.6]">
                     <InsigniaBadge rank={getSnakeRank(top3[2].points)} size={14} />
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="font-black text-[10px] uppercase truncate w-24 tracking-tighter text-white/90">{top3[2].name.split(' ')[0]}</p>
                <div className="flex items-center justify-center gap-1 opacity-70">
                  <span className="text-sm font-mono font-black">{top3[2].points}</span>
                  <span className="text-[7px] font-bold mono">V-PTS</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* List Section */}
      <div className="flex flex-col gap-6 mt-12 relative z-10 max-w-lg mx-auto">
        <div className="flex items-center justify-between px-6 mb-2">
          <h3 className="mono text-[10px] uppercase opacity-40 tracking-[0.3em] font-black">Hierarquia de Batalha</h3>
          <span className="mono text-[8px] opacity-30 uppercase font-bold">Temporada 01</span>
        </div>
        
        {theRest.map((user, index) => {
          const rank = getSnakeRank(user.points || 0);
          const trueIndex = index + 3;
          return (
            <motion.div 
              key={`${user.id}-${index}`}
              onClick={() => onSelectStudent?.(user)}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={classNames(
                "group pr-1 rounded-[2.2rem] flex items-center border relative overflow-hidden transition-all duration-500 hover:bg-white/[0.02] shadow-2xl cursor-pointer",
                rank.border,
                "bg-black/50 backdrop-blur-2xl"
              )}
            >
               {/* Left: Identity Block */}
               <div className="flex items-center gap-4 p-4 pl-6 flex-1 min-w-0">
                 <div className="w-6 text-center opacity-40">
                   <span className="mono font-black text-[10px]">#{trueIndex + 1}</span>
                 </div>
                 
                 <div className="relative">
                   <div className={classNames(
                     "w-14 h-14 rounded-full bg-black border-2 flex items-center justify-center flex-shrink-0 overflow-hidden relative",
                     rank.border
                   )}>
                     <img src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`} alt="avatar" className="w-full h-full object-cover rounded-full" />
                   </div>
                   <div className="absolute -bottom-2 -right-2 z-10 scale-[0.6]">
                      <InsigniaBadge rank={rank} size={16} showGlow={false} />
                   </div>
                 </div>

                 <div className="flex-1 min-w-0 ml-1">
                   <h4 className="font-black text-white text-lg truncate uppercase tracking-tighter italic leading-none group-hover:text-atheris-accent transition-colors">
                     {user.name}
                   </h4>
                   <div className="flex items-center gap-2 mt-2">
                     <span className={classNames("text-[9px] mono uppercase font-black tracking-[0.2em] opacity-40", rank.color)}>
                       {rank.name}
                     </span>
                   </div>
                 </div>
               </div>

               {/* Right: Score Block (Isolated) */}
               <div className="bg-white/[0.03] self-stretch px-6 flex flex-col items-center justify-center border-l border-white/5 min-w-[100px]">
                 <span className="font-mono text-2xl font-black text-white leading-none tracking-tighter italic drop-shadow-lg">{user.points}</span>
                 <span className="mono text-[11px] opacity-30 uppercase tracking-[0.1em] font-black mt-1">Lethality</span>
               </div>
            </motion.div>
          );
        })}

        {ranked.length === 0 && !loading && (
          <div className="text-center py-20 opacity-30 mono text-xs uppercase italic">Aumente sua letalidade para aparecer aqui.</div>
        )}
      </div>
    </motion.div>
  );
});

export const ProfileView = React.memo(({ currentUser, onLogout, onUpdateUser }: { currentUser: User, onLogout: () => void, onUpdateUser?: (data: Partial<User>) => void }) => {
  const [stats, setStats] = useState({ checkIns: 0, streak: 0 });
  const [weightHistory, setWeightHistory] = useState<{date: string, weight: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const qCheckIns = query(collection(db, 'checkins'), where('studentId', '==', currentUser.id), orderBy('createdAt', 'desc'));
        const qWorkouts = query(collection(db, 'workouts'), where('studentId', '==', currentUser.id), where('completed', '==', true));
        
        const [checkInSnap, workoutSnap] = await Promise.all([
          getDocs(qCheckIns),
          getDocs(qWorkouts)
        ]);

        const history = checkInSnap.docs.map(doc => {
          const data = doc.data();
          const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            weight: data.weightKg,
            timestamp: date.getTime()
          };
        }).sort((a, b) => a.timestamp - b.timestamp);

        setWeightHistory(history);
        setStats({
          checkIns: checkInSnap.size,
          streak: Math.min(workoutSnap.size, pointsToStreak(currentUser.points || 0)) 
        });
        setLoading(false);
      } catch (err) {
        console.error("Error loading profile stats", err);
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentUser.id, currentUser.points]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateUser) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const compressedDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
             const canvas = document.createElement('canvas');
             const MAX_SIZE = 400;
             let width = img.width;
             let height = img.height;
             if (width > height) {
               if (width > MAX_SIZE) {
                 height = Math.round((height * MAX_SIZE) / width);
                 width = MAX_SIZE;
               }
             } else {
               if (height > MAX_SIZE) {
                 width = Math.round((width * MAX_SIZE) / height);
                 height = MAX_SIZE;
               }
             }
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
               ctx.drawImage(img, 0, 0, width, height);
               resolve(canvas.toDataURL('image/jpeg', 0.8));
             } else {
               reject(new Error('Canvas failed'));
             }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

      await onUpdateUser({ avatar: compressedDataUrl });
    } catch (err) {
      console.error("Erro ao trocar foto:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (onUpdateUser) {
      onUpdateUser({ [field]: value });
    }
  };

  const pointsToStreak = (pts: number) => Math.min(30, Math.floor(pts / 100) + 1);

  const rank = getSnakeRank(currentUser.points || 0);
  const points = currentUser.points || 0;
  
  const tiers = [
    { name: 'Jararaca', min: 0 },
    { name: 'Cascavel', min: 500 },
    { name: 'Surucucu', min: 2000 },
    { name: 'Bungarus', min: 3500 },
    { name: 'Naja Real', min: 5000 },
    { name: 'Mamba Negra', min: 7000 },
    { name: 'Taipan', min: 9000 },
    { name: 'Suprema', min: 12000 }
  ];

  const actualIdx = [...tiers].reverse().findIndex(t => points >= t.min);
  const currentTierIdx = actualIdx === -1 ? 0 : tiers.length - 1 - actualIdx;
  const currentTier = tiers[currentTierIdx];
  const nextTier = tiers[currentTierIdx + 1] || tiers[currentTierIdx];
  
  const progress = nextTier.min === currentTier.min ? 100 : Math.min(100, Math.max(0, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100));
  const remaining = nextTier.min - points;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 pt-32 pb-32 min-h-full flex flex-col items-center">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
      
      {/* Centered Profile Header */}
      <div className="flex flex-col items-center mb-8 w-full">
        <button 
          onClick={handlePhotoClick}
          className="relative w-32 h-32 mb-6 group active:scale-95 transition-all"
          disabled={isUploading}
        >
          <div className="absolute inset-0 rounded-full border-4 border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all group-hover:scale-105 group-hover:border-atheris-accent/50" />
          <div className="absolute inset-[6px] rounded-full border border-white/20 bg-[#121413] flex items-center justify-center overflow-hidden">
             {currentUser.avatar ? (
                <img src={currentUser.avatar} className="w-full h-full object-cover" alt="profile" />
             ) : (
                <Shield size={42} className="opacity-10 text-white" />
             )}
             
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ImageIcon size={24} className="text-white" />
             </div>

             {isUploading && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                 <div className="w-6 h-6 border-2 border-white/20 border-t-atheris-accent rounded-full animate-spin" />
               </div>
             )}
          </div>
        </button>
        
        <h2 className="text-3xl font-black text-atheris-text uppercase tracking-tight text-center leading-none mb-1">
           {currentUser.name}
        </h2>
        <p className="text-xs mono opacity-40 lowercase mb-5 tracking-wide">{currentUser.email}</p>
        
        <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 shadow-xl backdrop-blur-md">
           <span className="mono text-[10px] font-black uppercase tracking-[0.25em] text-atheris-text opacity-70">
             {rank.name}
           </span>
        </div>
      </div>

      {/* Bio-Data Fields Section */}
      <div className="w-full glass p-6 rounded-[2.5rem] border border-white/5 mb-6">
         <h3 className="mono text-[10px] uppercase font-black tracking-[0.2em] opacity-40 mb-5 flex items-center gap-2">
           <Activity size={12} className="text-atheris-accent" /> Bio-Dados Atheris
         </h3>
         
         <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
               <label className="mono text-[8px] uppercase opacity-40 font-black tracking-widest pl-1">Aniversário (Fixo)</label>
               <input 
                 type="date" 
                 value={currentUser.birthday || ''} 
                 onChange={(e) => handleFieldChange('birthday', e.target.value)}
                 className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs mono text-atheris-text focus:border-atheris-accent outline-none transition-colors"
               />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <div className="flex flex-col gap-1.5">
                  <label className="mono text-[8px] uppercase opacity-40 font-black tracking-widest pl-1">Peso (kg)</label>
                  <input 
                    type="number" 
                    placeholder="0.0"
                    value={currentUser.latestWeightKg || ''} 
                    onChange={(e) => handleFieldChange('latestWeightKg', parseFloat(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs mono text-atheris-text focus:border-atheris-accent outline-none transition-colors w-full"
                  />
               </div>
               <div className="flex flex-col gap-1.5">
                  <label className="mono text-[8px] uppercase opacity-40 font-black tracking-widest pl-1">Meta (kg)</label>
                  <input 
                    type="number" 
                    placeholder="0.0"
                    value={currentUser.targetWeightKg || ''} 
                    onChange={(e) => handleFieldChange('targetWeightKg', parseFloat(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs mono text-atheris-text focus:border-atheris-accent outline-none transition-colors w-full"
                  />
               </div>
            </div>
         </div>
      </div>

      {/* Tier Progress Section */}
      <div className="w-full glass p-6 rounded-[2.5rem] border border-white/5 mb-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
         
         <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
               <div className="absolute inset-0 bg-atheris-accent/10" />
               <SnakeEye size={20} className="text-atheris-accent" />
            </div>
            <div>
               <h3 className="mono text-[10px] uppercase font-black tracking-widest opacity-40">Progressão de Rank</h3>
               <p className="mono font-black text-white text-base uppercase tracking-tighter mt-1">{currentTier.name}</p>
            </div>
         </div>
         
         <div className="flex justify-between items-end mb-3 px-1 mt-6">
            <span className="mono text-[9px] font-black uppercase tracking-widest text-white/50">
               Rumo a: <span className="text-atheris-accent">{nextTier.name}</span>
            </span>
            <span className="mono text-xs font-black text-atheris-accent">{Math.round(progress)}%</span>
         </div>
         
         <div className="w-full h-3 bg-[#121413] rounded-full mb-4 p-[2px] border border-white/5 relative overflow-hidden">
            <motion.div 
               initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
               className="h-full bg-atheris-accent rounded-full relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </motion.div>
         </div>
         
         <p className="mono text-[8px] font-black uppercase tracking-widest text-atheris-accent/60 text-center">
            {remaining > 0 ? `${remaining} V-Points para evoluir` : 'Protocolo Máximo Ativo'}
         </p>
      </div>

      {/* Weight Evolution Chart */}
      <div className="w-full glass p-6 rounded-[2.5rem] border border-white/5 mb-6 relative overflow-hidden">
         <h3 className="mono text-[10px] uppercase font-black tracking-[0.2em] opacity-40 mb-6 flex items-center justify-between">
            <span>Evolução de Peso</span>
            <span className="text-[8px] text-atheris-accent">{currentUser.latestWeightKg} KG ATUAL</span>
         </h3>
         
         <div className="h-48 w-full">
            {weightHistory.length > 1 ? (
              <div className="-ml-4 w-[calc(100%+1rem)] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightHistory}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff66" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00ff66" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#00ff66' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#00ff66" 
                      fillOpacity={1} 
                      fill="url(#weightGradient)" 
                      strokeWidth={3}
                      dot={{ fill: '#00ff66', strokeWidth: 2, r: 4, stroke: '#000' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center px-4">
                 <Scale size={28} className="mb-3 text-atheris-accent opacity-20" />
                 <p className="text-[10px] mono uppercase font-black tracking-widest opacity-40">Dados Insuficientes</p>
                 <p className="text-[9px] mt-2 italic font-mono opacity-30">Realize mais check-ins para gerar seu mapeamento biológico.</p>
              </div>
            )}
         </div>
      </div>

      {/* Grid Stats Row */}
      <div className="w-full grid grid-cols-3 gap-3 mb-8">
         <div className="glass p-5 rounded-[2.2rem] border border-white/5 flex flex-col items-center text-center group hover:bg-white/[0.03] transition-colors">
            <Zap size={24} className="text-atheris-accent mb-2 drop-shadow-[0_0_10px_rgba(0,255,102,0.4)] group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-mono font-black text-atheris-text leading-none">{points}</span>
            <span className="text-[9px] mono uppercase opacity-40 font-black tracking-tighter mt-1.5">V-Points</span>
         </div>
         
         <div className="glass p-5 rounded-[2.2rem] border border-white/5 flex flex-col items-center text-center group hover:bg-white/[0.03] transition-colors">
            <Target size={24} className="text-cyan-400 mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-mono font-black text-atheris-text leading-none">{stats.checkIns}</span>
            <span className="text-[9px] mono uppercase opacity-40 font-black tracking-tighter mt-1.5">Check-ins</span>
         </div>
         
         <div className="glass p-5 rounded-[2.2rem] border border-white/5 flex flex-col items-center text-center group hover:bg-white/[0.03] transition-colors">
            <Flame size={24} className="text-orange-500 mb-2 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)] group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-mono font-black text-atheris-text leading-none">{stats.streak}</span>
            <span className="text-[9px] mono uppercase opacity-40 font-black tracking-tighter mt-1.5">Streak</span>
         </div>
      </div>

      {/* Styled Logout Button */}
      <button 
         onClick={onLogout}
         className="w-full flex items-center justify-center gap-4 py-5 rounded-[2.5rem] border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 group shadow-lg shadow-red-500/5 active:scale-95"
      >
         <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
         <span className="mono text-[11px] font-black uppercase tracking-[0.3em]">Desconectar</span>
      </button>

    </motion.div>
  );
});
