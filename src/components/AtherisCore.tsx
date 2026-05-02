import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Role } from '../types';
import { LayoutGrid, Users, Dumbbell, MessageSquare, User as UserIcon } from 'lucide-react';
import { SnakeEye } from './SnakeEye';

export const BackgroundBlobs = React.memo(() => (
  <>
    <div className="aura-green"></div>
    <div className="aura-toxic"></div>
    <div className="viper-pattern"></div>
  </>
));

export const Header = React.memo(({ user }: {
  user: User
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-[80] sm:max-w-md sm:translate-x-[-50%] sm:left-[50%]">
       <div className="glass mx-4 mt-4 px-5 py-3 rounded-2xl flex items-center justify-between shadow-2xl border border-white/10">
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-atheris-accent flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]">
          <SnakeEye size={20} className="text-black" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-lg text-atheris-text leading-none tracking-tighter uppercase">Atheris</span>
          <span className="mono text-[9px] text-atheris-accent uppercase tracking-widest font-black">
            {user.role === 'coach' ? 'Nível Atherium' : 'Protocolo Viper'}
          </span>
        </div>
      </div>

        <div className="flex items-center gap-3">
          {/* Ocultando botão de perfil do header conforme solicitado */}
        </div>
       </div>
    </header>
  );
});

export const TabBar = React.memo(({ role, activeTab, setActiveTab }: {
  role: Role,
  activeTab: string,
  setActiveTab: (tab: string) => void
}) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full glass border-t border-white/10 px-4 pb-8 pt-4 flex justify-around items-center z-50 sm:max-w-md sm:left-[50%] sm:translate-x-[-50%]">
      <button 
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
      >
        <LayoutGrid size={activeTab === 'home' ? 24 : 20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span className="text-[10px] mono font-bold uppercase tracking-widest">HQ</span>
      </button>

      {role === 'coach' ? (
        <button 
          onClick={() => setActiveTab('alunos')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'alunos' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
        >
          <Users size={activeTab === 'alunos' ? 24 : 20} strokeWidth={activeTab === 'alunos' ? 2.5 : 2} />
          <span className="text-[10px] mono font-bold uppercase tracking-widest">Ninho</span>
        </button>
      ) : (
        <>
          <button 
            onClick={() => setActiveTab('treinos')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'treinos' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
          >
            <Dumbbell size={activeTab === 'treinos' ? 24 : 20} strokeWidth={activeTab === 'treinos' ? 2.5 : 2} />
            <span className="text-[10px] mono font-bold uppercase tracking-widest">Treinos</span>
          </button>
          

          <button 
            onClick={() => setActiveTab('rank')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'rank' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
          >
            <SnakeEye size={activeTab === 'rank' ? 24 : 20} strokeWidth={activeTab === 'rank' ? 2.5 : 2} />
            <span className="text-[10px] mono font-bold uppercase tracking-widest">Rank</span>
          </button>

          <button 
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'perfil' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
          >
            <UserIcon size={activeTab === 'perfil' ? 24 : 20} strokeWidth={activeTab === 'perfil' ? 2.5 : 2} />
            <span className="text-[10px] mono font-bold uppercase tracking-widest">Perfil</span>
          </button>
        </>
      )}

      <button 
        onClick={() => setActiveTab('chat')}
        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
      >
        <MessageSquare size={activeTab === 'chat' ? 24 : 20} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
        <span className="text-[10px] mono font-bold uppercase tracking-widest">Chat</span>
      </button>
    </nav>
  );
});
