import React from "react";
import { Sparkles, BrainCircuit } from "lucide-react";

interface MagicalLoaderProps {
  subjectName?: string;
}

export const MagicalLoader: React.FC<MagicalLoaderProps> = ({ subjectName }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-8 animate-fadeIn">
      <div className="relative">
        {/* Glowing Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
        
        {/* Floating Icons */}
        <div className="relative z-10 animate-float">
          <div className="relative">
             {/* Wand Icon (simulated with standard icons for now or custom svg) */}
             <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 transform rotate-12">
                <BrainCircuit className="text-white w-8 h-8" />
             </div>
             
             {/* Sparkles */}
             <Sparkles className="absolute -top-4 -right-4 text-yellow-300 w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
             <Sparkles className="absolute -bottom-2 -left-4 text-pink-400 w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-rainbow bg-[length:200%]">
          Conjurando Conhecimento...
        </h3>
        <p className="text-slate-500 max-w-xs mx-auto text-sm">
          {subjectName 
            ? `Invocando o especialista supremo em ${subjectName}` 
            : "Preparando poções de sabedoria"}
        </p>
      </div>
      
      {/* Loading Bar */}
      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-rainbow bg-[length:200%] w-full"></div>
      </div>
    </div>
  );
};