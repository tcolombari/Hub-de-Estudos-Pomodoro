import React, { useState, useEffect, useRef } from "react";
import { StudySubject, TimerMode, TimerSettings } from "./types";
import { generateStudyRoadmap, generateTopicContent, generateMoreTopics } from "./services/geminiService";
import { CircularTimer } from "./components/CircularTimer";
import { SubjectCard } from "./components/SubjectCard";
import { RainbowButton } from "./components/ui/RainbowButton";
import { MagicalLoader } from "./components/MagicalLoader";
import { GamificationBar } from "./components/GamificationBar";
import { ChatInterface } from "./components/ChatInterface";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  BrainCircuit,
  Menu,
  X,
  BookOpen,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  ChevronDown
} from "./components/Icons";

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
};

const SAMPLE_SUBJECTS: StudySubject[] = [
  {
    id: "1",
    name: "Inglês",
    color: "#10b981", // Emerald
    roadmap: ["Gramática Básica (Verbo To Be)", "Vocabulário Essencial (Dia a dia)", "Present Simple vs Continuous", "Listening: Compreensão Básica", "Leitura e Interpretação", "Conversação Inicial"],
    topicContent: {},
    totalSessions: 5,
    completedTopics: [],
    xp: 450,
    level: 2,
    chatHistory: []
  },
  {
    id: "2",
    name: "UX/UI Design",
    color: "#f43f5e", // Rose
    roadmap: ["Pesquisa com Usuários", "Wireframing e Baixa Fidelidade", "Prototipagem Interativa", "Hierarquia Visual e Tipografia", "Testes de Usabilidade", "Design System"],
    topicContent: {},
    totalSessions: 4,
    completedTopics: [],
    xp: 200,
    level: 1,
    chatHistory: []
  },
  {
    id: "3",
    name: "Impressão 3D",
    color: "#3b82f6", // Blue
    roadmap: ["Tipos de Impressoras (FDM vs SLA)", "Materiais e Filamentos", "Modelagem 3D para Impressão", "Fatiamento (Slicing)", "Calibração e Manutenção", "Pós-processamento"],
    topicContent: {},
    totalSessions: 0,
    completedTopics: [],
    xp: 0,
    level: 1,
    chatHistory: []
  }
];

type TabView = 'roadmap' | 'chat';

export default function App() {
  // State
  const [subjects, setSubjects] = useState<StudySubject[]>(SAMPLE_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(SAMPLE_SUBJECTS[0].id);
  const [timerMode, setTimerMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [settings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  
  // UI State
  const [currentTab, setCurrentTab] = useState<TabView>('roadmap');
  
  // Study Content State
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isExpandingRoadmap, setIsExpandingRoadmap] = useState(false);
  
  // Input State
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Derived State
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const totalTime =
    timerMode === TimerMode.FOCUS
      ? settings.focusDuration * 60
      : timerMode === TimerMode.SHORT_BREAK
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60;
  
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Effects
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  // Scroll top when content changes
  useEffect(() => {
    if (activeTopic && !isLoadingContent) {
        contentContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTopic, isLoadingContent]);

  // Handlers
  const handleTimerComplete = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Play sound (optional, placeholder)
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play().catch(e => console.log("Audio play blocked", e));

    if (timerMode === TimerMode.FOCUS && activeSubject) {
      setSubjects(prev => prev.map(s => 
        s.id === activeSubject.id 
          ? { ...s, totalSessions: s.totalSessions + 1 } 
          : s
      ));
      // Auto switch to break?
      setTimerMode(TimerMode.SHORT_BREAK);
      setTimeLeft(settings.shortBreakDuration * 60);
    } else {
      // Break over, back to work
      setTimerMode(TimerMode.FOCUS);
      setTimeLeft(settings.focusDuration * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (timerMode === TimerMode.FOCUS) setTimeLeft(settings.focusDuration * 60);
    else if (timerMode === TimerMode.SHORT_BREAK) setTimeLeft(settings.shortBreakDuration * 60);
    else setTimeLeft(settings.longBreakDuration * 60);
  };

  const changeMode = (mode: TimerMode) => {
    setIsActive(false);
    setTimerMode(mode);
    if (mode === TimerMode.FOCUS) setTimeLeft(settings.focusDuration * 60);
    else if (mode === TimerMode.SHORT_BREAK) setTimeLeft(settings.shortBreakDuration * 60);
    else setTimeLeft(settings.longBreakDuration * 60);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    setIsGenerating(true);
    
    // AI Magic
    const roadmap = await generateStudyRoadmap(newSubjectName);

    const newSubject: StudySubject = {
      id: Date.now().toString(),
      name: newSubjectName,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      roadmap,
      topicContent: {},
      totalSessions: 0,
      completedTopics: [],
      xp: 0,
      level: 1,
      chatHistory: []
    };

    setSubjects([...subjects, newSubject]);
    setNewSubjectName("");
    setIsGenerating(false);
    setSelectedSubjectId(newSubject.id);
    setActiveTopic(null); // Reset view
  };

  const handleDeleteSubject = (id: string) => {
    const filtered = subjects.filter(s => s.id !== id);
    setSubjects(filtered);
    if (selectedSubjectId === id) {
      setSelectedSubjectId(filtered.length > 0 ? filtered[0].id : "");
      setActiveTopic(null);
    }
  };

  const handleTopicClick = async (topic: string) => {
      if (!activeSubject) return;
      setActiveTopic(topic);

      // Check if content already exists
      if (activeSubject.topicContent && activeSubject.topicContent[topic]) {
          return;
      }

      setIsLoadingContent(true);
      const content = await generateTopicContent(activeSubject.name, topic);
      
      setSubjects(prev => prev.map(s => {
          if (s.id === activeSubject.id) {
              return {
                  ...s,
                  topicContent: {
                      ...s.topicContent,
                      [topic]: content
                  }
              };
          }
          return s;
      }));
      setIsLoadingContent(false);
  };

  const handleCompleteTopic = () => {
      if (!activeSubject || !activeTopic) return;
      
      const isAlreadyCompleted = activeSubject.completedTopics?.includes(activeTopic);
      
      if (!isAlreadyCompleted) {
          setSubjects(prev => prev.map(s => {
              if (s.id === activeSubject.id) {
                  const newXp = s.xp + 100;
                  // Level up every 300 XP (simplified)
                  const newLevel = Math.floor(newXp / 300) + 1;
                  
                  return {
                      ...s,
                      completedTopics: [...(s.completedTopics || []), activeTopic],
                      xp: newXp,
                      level: newLevel
                  };
              }
              return s;
          }));
      }
      setActiveTopic(null);
  };
  
  const handleExtendRoadmap = async () => {
    if (!activeSubject) return;
    setIsExpandingRoadmap(true);
    const newTopics = await generateMoreTopics(activeSubject.name, activeSubject.roadmap);
    
    if (newTopics.length > 0) {
        setSubjects(prev => prev.map(s => {
            if (s.id === activeSubject.id) {
                return {
                    ...s,
                    roadmap: [...s.roadmap, ...newTopics]
                };
            }
            return s;
        }));
    }
    setIsExpandingRoadmap(false);
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Event delegation for dynamically generated speech buttons
    const target = (e.target as HTMLElement).closest('.speech-btn');
    if (target) {
        const textToSpeak = target.getAttribute('data-text');
        if (textToSpeak) {
            // Cancel any current speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'en-US'; // Default to US English
            utterance.rate = 0.9; // Slightly slower for better clarity
            utterance.pitch = 1;
            
            window.speechSynthesis.speak(utterance);
        }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getModeColor = () => {
    switch (timerMode) {
      case TimerMode.FOCUS: return activeSubject ? activeSubject.color : "#6366f1";
      case TimerMode.SHORT_BREAK: return "#10b981"; // Emerald
      case TimerMode.LONG_BREAK: return "#3b82f6"; // Blue
      default: return "#6366f1";
    }
  };

  return (
    <div className="h-screen bg-background text-slate-200 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Header (Just Title & Menu) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface/80 backdrop-blur-md border-b border-slate-700 z-50 sticky top-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          FocusFlow
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
           {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar / Subject List */}
      <aside className={`
        fixed inset-0 md:relative md:w-80 bg-background/95 md:bg-surface/30 border-r border-slate-800 z-40 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full
      `}>
        <div className="p-6 hidden md:block">
           <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <BrainCircuit className="text-primary" /> FocusFlow
           </h1>
           <p className="text-slate-500 text-xs mt-1">Estude melhor com Gemini</p>
        </div>

        <div className="px-4 pb-4">
          <form onSubmit={handleAddSubject} className="relative">
             <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Nova disciplina..."
                className="w-full bg-surface border border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-12"
                disabled={isGenerating}
             />
             <button 
               type="submit" 
               disabled={isGenerating || !newSubjectName.trim()}
               className="absolute right-2 top-1.5 p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center"
             >
                {isGenerating ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <Plus size={14} />
                )}
             </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
          {subjects.map(subject => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              isSelected={selectedSubjectId === subject.id}
              onSelect={(id) => {
                setSelectedSubjectId(id);
                setActiveTopic(null); // Return to roadmap view on subject change
                setCurrentTab('roadmap'); // Reset to roadmap
                setIsMobileMenuOpen(false);
              }}
              onDelete={handleDeleteSubject}
            />
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        {/* COMPACT TOP HEADER: Timer + Controls */}
        <header className="flex-shrink-0 bg-surface/30 backdrop-blur-xl border-b border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 z-20">
            {/* Left: Timer Modes */}
            <div className="flex bg-surface/80 rounded-lg p-1 border border-slate-700/50">
                <button 
                  onClick={() => changeMode(TimerMode.FOCUS)} 
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timerMode === TimerMode.FOCUS ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  Foco
                </button>
                <button 
                  onClick={() => changeMode(TimerMode.SHORT_BREAK)} 
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timerMode === TimerMode.SHORT_BREAK ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  Curto
                </button>
                <button 
                  onClick={() => changeMode(TimerMode.LONG_BREAK)} 
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timerMode === TimerMode.LONG_BREAK ? "bg-blue-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  Longo
                </button>
            </div>

            {/* Center/Right: Clock & Controls */}
            <div className="flex items-center gap-6">
                 {/* Compact Circular Timer */}
                 <div className="flex items-center">
                     <CircularTimer 
                        percentage={progress} 
                        timeString={formatTime(timeLeft)} 
                        modeColor={getModeColor()} 
                        size={80} 
                        strokeWidth={5} 
                     />
                 </div>

                 {/* Play/Reset Controls */}
                 <div className="flex items-center gap-3">
                     <button 
                       onClick={toggleTimer} 
                       className="group flex items-center justify-center w-12 h-12 rounded-full bg-white text-background hover:scale-105 hover:bg-slate-200 transition-all shadow-lg shadow-white/5"
                     >
                        {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                     </button>
                     
                     <button 
                       onClick={resetTimer} 
                       className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                       title="Reiniciar Timer"
                     >
                        <RotateCcw size={16} />
                     </button>
                 </div>
            </div>
        </header>

        {/* GAMIFICATION & TABS HEADER (Only visible if subject selected) */}
        {activeSubject && (
            <>
                <GamificationBar xp={activeSubject.xp || 0} level={activeSubject.level || 1} subjectName={activeSubject.name} />
                
                <div className="flex items-center gap-6 px-8 border-b border-slate-700/50 bg-surface/20">
                    <button 
                        onClick={() => { setCurrentTab('roadmap'); setActiveTopic(null); }}
                        className={`py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${currentTab === 'roadmap' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        <BrainCircuit size={16} /> Roteiro de Estudos
                    </button>
                    <button 
                        onClick={() => { setCurrentTab('chat'); setActiveTopic(null); }}
                        className={`py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${currentTab === 'chat' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        <MessageSquare size={16} /> Chat com Mentor
                    </button>
                </div>
            </>
        )}

        {/* Bottom Section: Study Content or Roadmap or Chat */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {!activeSubject ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                    <BookOpen size={48} className="mb-4" />
                    <p>Selecione ou crie uma disciplina para começar.</p>
                 </div>
            ) : (
                <div className="flex-1 flex flex-col h-full w-full">
                    
                    {/* CHAT TAB */}
                    {currentTab === 'chat' && (
                        <ChatInterface 
                            subjectName={activeSubject.name} 
                            history={activeSubject.chatHistory || []} 
                            onUpdateHistory={(newHistory) => {
                                setSubjects(prev => prev.map(s => s.id === activeSubject.id ? { ...s, chatHistory: newHistory } : s));
                            }}
                        />
                    )}

                    {/* ROADMAP TAB */}
                    {currentTab === 'roadmap' && !activeTopic && (
                        /* ROADMAP GRID VIEW */
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                          <div className="max-w-6xl mx-auto w-full pb-20 animate-fadeIn">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]" style={{backgroundColor: activeSubject.color, color: activeSubject.color}}></span>
                                        Roteiro de {activeSubject.name}
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-2 ml-1">Siga a trilha para evoluir seu nível</p>
                                </div>
                            </div>
                            
                            {activeSubject.roadmap.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {activeSubject.roadmap.map((topic, index) => {
                                            const isCompleted = activeSubject.completedTopics?.includes(topic);
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => handleTopicClick(topic)}
                                                    className={`group flex flex-col justify-between p-6 rounded-2xl border transition-all text-left relative overflow-hidden h-40
                                                        ${isCompleted 
                                                            ? "bg-slate-800/40 border-slate-700 opacity-70 hover:opacity-100" 
                                                            : "bg-surface border-slate-700 hover:border-primary hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                                                        }
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start w-full">
                                                        <div className={`
                                                            w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors
                                                            ${isCompleted 
                                                                ? "bg-green-500/20 text-green-400" 
                                                                : "bg-slate-800 text-slate-400 group-hover:bg-primary group-hover:text-white"
                                                            }
                                                        `}>
                                                            {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
                                                        </div>
                                                        <BookOpen size={18} className={`transition-colors ${isCompleted ? 'text-green-500' : 'text-slate-600 group-hover:text-primary'}`} />
                                                    </div>

                                                    <h3 className={`font-semibold text-lg line-clamp-2 ${isCompleted ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-100 group-hover:text-white'}`}>
                                                        {topic}
                                                    </h3>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* EXPAND ROADMAP BUTTON */}
                                    <div className="mt-10 flex flex-col items-center">
                                        <div className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8"></div>
                                        <button 
                                            onClick={handleExtendRoadmap}
                                            disabled={isExpandingRoadmap}
                                            className="group flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-primary/50 rounded-2xl transition-all disabled:opacity-50"
                                        >
                                            {isExpandingRoadmap ? (
                                                <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div>
                                            ) : (
                                                <div className="bg-primary/20 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <ChevronDown size={20} />
                                                </div>
                                            )}
                                            <div className="text-left">
                                                <span className="block text-white font-bold">Expandir Conhecimento</span>
                                                <span className="block text-xs text-slate-400">Gerar mais tópicos avançados</span>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-surface/10">
                                    <BookOpen size={40} className="mx-auto text-slate-600 mb-4" />
                                    <p className="text-slate-500 text-lg">Nenhum roteiro gerado ainda.</p>
                                </div>
                            )}
                          </div>
                        </div>
                    )}
                    
                    {/* STUDY CONTENT VIEW */}
                    {currentTab === 'roadmap' && activeTopic && (
                        <div className="flex-1 flex flex-col h-full animate-slideIn relative bg-surface/20">
                            
                            {/* Fixed Content Header */}
                            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-background/50 backdrop-blur-md z-10">
                                <button 
                                    onClick={() => setActiveTopic(null)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-sm font-medium border border-transparent hover:border-slate-600"
                                >
                                    <ArrowLeft size={16} /> Voltar ao Roteiro
                                </button>
                                <span className="text-xs font-mono text-slate-500 truncate max-w-[200px] hidden sm:block">{activeSubject.name}</span>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto" ref={contentContainerRef}>
                                <div 
                                    className="max-w-[90rem] mx-auto p-4 md:p-8"
                                    onClick={handleContentClick} // Handler for dynamically generated speech buttons
                                >
                                    
                                    {isLoadingContent ? (
                                        <MagicalLoader subjectName={activeSubject.name} />
                                    ) : (
                                        <div 
                                            // Render custom HTML directly, handled by Gemini's layout
                                            dangerouslySetInnerHTML={{ 
                                                __html: activeSubject.topicContent[activeTopic] || "<p>Erro ao carregar conteúdo.</p>" 
                                            }}
                                        />
                                    )}
                                    <div className="h-24" /> {/* Bottom spacer for footer */}
                                </div>
                            </div>

                            {/* Fixed Footer Action with Rainbow Button */}
                            <div className="flex-shrink-0 p-4 border-t border-slate-700 bg-background/80 backdrop-blur-md flex justify-center z-10">
                                <RainbowButton onClick={handleCompleteTopic}>
                                    <CheckCircle2 size={18} /> 
                                    <span>Concluir Leitura (+100 XP)</span>
                                </RainbowButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}