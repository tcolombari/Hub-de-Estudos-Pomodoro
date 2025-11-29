import React from 'react';
import { Trophy, Star, Zap } from './Icons';

interface GamificationBarProps {
  xp: number;
  level: number;
  subjectName: string;
}

export const GamificationBar: React.FC<GamificationBarProps> = ({ xp, level, subjectName }) => {
  // Logic: Each level requires 100 * Level XP. 
  // e.g. Level 1 needs 100XP to reach Level 2.
  // This is simplified. 
  const xpForNextLevel = (level) * 300; 
  const currentLevelBaseXp = (level - 1) * 300;
  const progressPercent = Math.min(100, Math.max(0, ((xp - currentLevelBaseXp) / 300) * 100));

  const getLevelTitle = (lvl: number) => {
    if (lvl <= 2) return "Aprendiz";
    if (lvl <= 5) return "Estudioso";
    if (lvl <= 8) return "Mestre";
    if (lvl <= 12) return "Grão-Mestre";
    return "Arquimago";
  };

  return (
    <div className="bg-surface/40 backdrop-blur-md border-b border-slate-700 p-4 sticky top-0 z-20 animate-fadeIn">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
           <div className="relative">
             <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-lg shadow-yellow-500/20">
                <Trophy className="text-white w-6 h-6" />
             </div>
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 text-xs font-bold text-white">
               {level}
             </div>
           </div>
           <div>
             <h3 className="text-white font-bold text-sm">{subjectName}</h3>
             <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest">{getLevelTitle(level)}</p>
           </div>
        </div>

        <div className="flex-1 w-full md:max-w-md mx-4">
           <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
              <span className="flex items-center gap-1"><Zap size={12} className="text-purple-400" /> {xp} XP</span>
              <span>Próx. Nível</span>
           </div>
           <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
              <div 
                className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${progressPercent}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
           </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
           <Star size={12} className="text-yellow-500" />
           <span>Complete tópicos para ganhar XP</span>
        </div>

      </div>
    </div>
  );
};