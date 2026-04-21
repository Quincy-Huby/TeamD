import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Role } from '../types';
import { Home, Users, Dumbbell, Trophy, Info, Zap, ChevronLeft, LogOut, Image as ImageIcon } from 'lucide-react';

export const BackgroundBlobs = React.memo(() => (
  <>
    <div className="aura-green"></div>
    <div className="aura-toxic"></div>
    <div className="viper-pattern"></div>
  </>
));

export const Header = React.memo(({ user, onLogout, isDarkMode, setIsDarkMode, onSimulatePush, onUpdateUser }: {
  user: User,
  onLogout: () => void,
  isDarkMode: boolean,
  setIsDarkMode: (v: boolean) => void,
  onSimulatePush: () => void,
  onUpdateUser?: (data: Partial<User>) => void
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateUser) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // Better quality, still small
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
          const compressedDataUrl = canvas.toDataURL('image/png'); // Preserves transparent PNGs!
          onUpdateUser({ avatar: compressedDataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so the user can select the same file again if they want
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-[80] sm:max-w-md sm:translate-x-[-50%] sm:left-[50%]">
       <div className="glass mx-4 mt-4 px-5 py-3 rounded-2xl flex items-center justify-between shadow-2xl border border-white/10">
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-atheris-accent flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]">
          <Trophy size={20} className="text-black" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-lg text-atheris-text leading-none tracking-tighter uppercase">Atheris</span>
          <span className="mono text-[9px] text-atheris-accent uppercase tracking-widest font-black">
            {user.role === 'coach' ? 'Nível Alpha' : 'Protocolo Viper'}
          </span>
        </div>
      </div>

         <div className="relative">
           <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-full bg-atheris-text/5 flex items-center justify-center text-atheris-text border border-white/5 hover:border-atheris-accent transition-colors overflow-hidden"
           >
             {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" /> : user.name[0]}
           </button>

           <input type="file" ref={fileInputRef} className="hidden" accept="image/*, .png, .jpg, .jpeg, .webp" onChange={handlePhotoChange} />

           <AnimatePresence>
             {menuOpen && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                 className="absolute right-0 top-14 w-56 glass rounded-2xl p-2 shadow-2xl z-50 border border-white/10"
               >
                 <div className="p-3 border-b border-white/5 mb-1">
                   <p className="font-bold text-sm text-atheris-text truncate">{user.name}</p>
                   <p className="text-[10px] mono opacity-50 uppercase mt-0.5">{user.role === 'coach' ? 'Alpha Coach' : 'Víbora'}</p>
                 </div>

                 <button onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-atheris-text flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors">
                   <ImageIcon size={16} className="opacity-50" /> Alterar Foto
                 </button>
                 
                 <button onClick={() => { setSettingsOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-atheris-text flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors">
                   <Info size={16} className="opacity-50" /> Portal Atheris
                 </button>
                 
                 <button onClick={() => { onSimulatePush(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-atheris-text flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors">
                   <Zap size={16} className="opacity-50" /> Testar Inoculação
                 </button>

                 <div className="h-px w-full bg-white/5 my-1"></div>

                 <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 flex items-center gap-3 hover:bg-red-500/10 rounded-xl transition-colors">
                   <LogOut size={16} className="opacity-50" /> Sair do Habitat
                 </button>
               </motion.div>
             )}
           </AnimatePresence>
         </div>
       </div>

       {/* Settings Drawer */}
       <AnimatePresence>
         {settingsOpen && (
           <motion.div 
             initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="fixed inset-0 z-[100] bg-atheris-bg sm:max-w-md sm:mx-auto flex flex-col shadow-2xl"
           >
             <header className="p-4 pt-12 flex items-center gap-3 border-b border-white/5">
                <button onClick={() => setSettingsOpen(false)} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={24} /></button>
                <h2 className="font-bold text-lg">Preferências</h2>
             </header>

             <div className="flex-1 overflow-y-auto p-6 pt-10 scrollbar-hide">
               <h2 className="text-xl font-bold mb-6 text-atheris-text">Configurações</h2>
               
               <div className="flex flex-col gap-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="font-medium text-atheris-text">Tema Visual</h3>
                     <p className="text-xs opacity-50">Alternar entre Dark/Light mode</p>
                   </div>
                   <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={(isDarkMode ? "bg-white/20" : "bg-atheris-accent") + " w-14 h-8 rounded-full p-1 transition-colors flex items-center"}
                   >
                     <motion.div 
                      layout
                      className="w-6 h-6 bg-white rounded-full shadow-lg"
                      animate={{ x: isDarkMode ? 0 : 24 }}
                     />
                   </button>
                 </div>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </header>
  );
});

export const TabBar = React.memo(({ role, activeTab, setActiveTab }: {
  role: Role,
  activeTab: string,
  setActiveTab: (tab: string) => void
}) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full glass border-t border-white/10 px-6 pb-8 pt-4 flex justify-between items-center z-50 sm:max-w-md sm:left-[50%] sm:translate-x-[-50%]">
      <button 
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
      >
        <Home size={activeTab === 'home' ? 24 : 20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span className="text-[10px] mono font-bold uppercase tracking-widest">Home</span>
      </button>

      <button 
        onClick={() => setActiveTab('treinos')}
        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'treinos' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
      >
        <Dumbbell size={activeTab === 'treinos' ? 24 : 20} strokeWidth={activeTab === 'treinos' ? 2.5 : 2} />
        <span className="text-[10px] mono font-bold uppercase tracking-widest">Treinos</span>
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
        <button 
          onClick={() => setActiveTab('rank')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'rank' ? 'text-atheris-accent scale-110' : 'text-atheris-muted'}`}
        >
          <Trophy size={activeTab === 'rank' ? 24 : 20} strokeWidth={activeTab === 'rank' ? 2.5 : 2} />
          <span className="text-[10px] mono font-bold uppercase tracking-widest">Rank</span>
        </button>
      )}
    </nav>
  );
});
