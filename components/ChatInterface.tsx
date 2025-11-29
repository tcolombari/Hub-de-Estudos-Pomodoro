import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare } from './Icons';
import { ChatMessage } from '../types';
import { sendMessageToMentor } from '../services/geminiService';

interface ChatInterfaceProps {
  subjectName: string;
  history: ChatMessage[];
  onUpdateHistory: (newHistory: ChatMessage[]) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ subjectName, history, onUpdateHistory }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    const newHistory = [...history, userMsg];
    onUpdateHistory(newHistory);
    setInput('');
    setIsLoading(true);

    const responseText = await sendMessageToMentor(subjectName, newHistory, input);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now(),
    };

    onUpdateHistory([...newHistory, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface/20 relative animate-fadeIn">
      {/* Welcome State */}
      {history.length === 0 && (
         <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none z-0 opacity-50">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-float">
                <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Mentor Mágico de {subjectName}</h3>
            <p className="text-slate-400 max-w-md">Estou aqui para tirar dúvidas, dar exemplos e testar seu conhecimento. Pergunte qualquer coisa!</p>
         </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10" ref={scrollRef}>
        {history.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-md backdrop-blur-sm border ${
                msg.role === 'user'
                  ? 'bg-primary/90 text-white rounded-br-none border-primary/50'
                  : 'bg-slate-800/90 text-slate-200 rounded-bl-none border-slate-700'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              <span className="text-[10px] opacity-50 block mt-2 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-slate-800/50 p-4 rounded-2xl rounded-bl-none border border-slate-700 flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-slate-800 z-20">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Pergunte algo ao mentor de ${subjectName}...`}
            className="flex-1 bg-surface border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};