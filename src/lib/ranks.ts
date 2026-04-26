export const getSnakeRank = (points: number) => {
  if (points >= 12000) return { name: "Atheris Suprema", color: "text-amber-400", bg: "bg-amber-400/20", glow: "shadow-[0_0_30px_rgba(251,191,36,0.6)]", icon: 'Sparkles', border: 'border-amber-400/50' };
  if (points >= 9000) return { name: "Taipan-do-Interior", color: "text-red-500", bg: "bg-red-500/20", glow: "shadow-[0_0_25px_rgba(239,68,68,0.5)]", icon: 'Flame', border: 'border-red-500/50' };
  if (points >= 7000) return { name: "Mamba Negra", color: "text-purple-500", bg: "bg-purple-500/20", glow: "shadow-[0_0_20_rgba(168,85,247,0.4)]", icon: 'Skull', border: 'border-purple-500/40' };
  if (points >= 5000) return { name: "Naja Real", color: "text-cyan-400", bg: "bg-cyan-400/20", glow: "shadow-[0_0_15px_rgba(34,211,238,0.4)]", icon: 'Gem', border: 'border-cyan-400/40' };
  if (points >= 3500) return { name: "Bungarus (Krait)", color: "text-emerald-500", bg: "bg-emerald-500/20", glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]", icon: 'Zap', border: 'border-emerald-500/30' };
  if (points >= 2000) return { name: "Surucucu", color: "text-yellow-500", bg: "bg-yellow-500/20", glow: "shadow-[0_0_10px_rgba(234,179,8,0.2)]", icon: 'Crown', border: 'border-yellow-500/30' };
  if (points >= 1000) return { name: "Coral Verdadeira", color: "text-slate-300", bg: "bg-slate-300/20", glow: "", icon: 'Shield', border: 'border-slate-300/20' };
  if (points >= 500) return { name: "Cascavel", color: "text-amber-700", bg: "bg-amber-700/20", glow: "", icon: 'Medal', border: 'border-amber-700/20' };
  return { name: "Jararaca", color: "text-slate-500", bg: "bg-slate-500/10", glow: "", icon: 'Activity', border: 'border-white/5' };
};
