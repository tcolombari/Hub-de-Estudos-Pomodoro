import React from "react";
import { StudySubject } from "../types";
import { Trash2, BookOpen, BrainCircuit } from "./Icons";

interface SubjectCardProps {
  subject: StudySubject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  isSelected,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      onClick={() => onSelect(subject.id)}
      className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? "bg-surface border-primary shadow-lg shadow-primary/20"
          : "bg-surface/50 border-slate-700 hover:border-slate-500 hover:bg-surface"
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-10 rounded-full"
            style={{ backgroundColor: subject.color }}
          ></div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-lg text-slate-100 truncate pr-2">{subject.name}</h3>
            <p className="text-xs text-slate-400">
              {subject.totalSessions} sessions completed
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(subject.id);
          }}
          className="text-slate-500 hover:text-red-400 transition-colors p-2 z-10"
          aria-label="Delete Subject"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
         {subject.roadmap.length > 0 ? (
            <>
               <BrainCircuit size={14} className="text-purple-400" />
               <span>{subject.roadmap.length} topics</span>
            </>
         ) : (
             <>
                <BookOpen size={14} />
                <span>No roadmap</span>
             </>
         )}
      </div>
      
      {isSelected && (
          <div className="absolute top-3 right-3 pointer-events-none">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
          </div>
      )}
    </div>
  );
};