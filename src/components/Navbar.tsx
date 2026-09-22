import React from 'react';
import { 
  Sparkles, 
  Volume2, 
  BookOpen, 
  FolderDown, 
  Globe, 
  Trash2, 
  Award,
  ChevronDown
} from 'lucide-react';
import { PERSONAS } from '../data/personas';
import { PersonaId } from '../types';

interface NavbarProps {
  currentPersonaId: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
  showTamil: boolean;
  onToggleTamil: () => void;
  onOpenVoiceSettings: () => void;
  onOpenMistakes: () => void;
  onOpenExport: () => void;
  onClearChat: () => void;
  mistakesCount: number;
  overallScoreAvg: number;
  hasGeminiKey?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPersonaId,
  onSelectPersona,
  showTamil,
  onToggleTamil,
  onOpenVoiceSettings,
  onOpenMistakes,
  onOpenExport,
  onClearChat,
  mistakesCount,
  overallScoreAvg,
  hasGeminiKey = true
}) => {
  const currentPersona = PERSONAS.find(p => p.id === currentPersonaId) || PERSONAS[0];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
      {/* Brand & Persona Selector */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                TalkCraft
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Spoken English & Grammar Coach
            </p>
          </div>
        </div>

        {/* AI Engine Status Indicator */}
        <div className="hidden lg:flex items-center">
          {hasGeminiKey ? (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium"
              title="Google Gemini AI is active and powering real-time conversation and grammar evaluation."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gemini AI Online</span>
            </div>
          ) : (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium"
              title="Running in Smart Local Dynamic Mode. To enable live Google Gemini AI, add GEMINI_API_KEY in your .env file."
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Smart Dynamic Engine</span>
            </div>
          )}
        </div>

        {/* Persona Dropdown Pill */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/60 transition-all text-left">
            <img 
              src={currentPersona.avatar} 
              alt={currentPersona.name} 
              className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40"
            />
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-200 leading-none">
                {currentPersona.name}
              </div>
              <div className="text-[10px] text-indigo-400 leading-none mt-0.5">
                {currentPersona.accent.split('(')[0]}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:rotate-180" />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 hidden group-hover:block transition-all z-50">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Choose Female Conversation Partner
            </div>
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left ${
                  p.id === currentPersonaId 
                    ? 'bg-indigo-600/15 border border-indigo-500/30 text-white' 
                    : 'hover:bg-slate-800/70 text-slate-300'
                }`}
              >
                <img 
                  src={p.avatar} 
                  alt={p.name} 
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-indigo-400">Female Voice</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{p.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Tamil Explanation Toggle Button */}
        <button
          onClick={onToggleTamil}
          title="Toggle Tamil grammar explanations (தமிழ் விளக்கம்)"
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
            showTamil 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">தமிழ் விளக்கம்</span>
          <span className="text-[10px] px-1 py-0.2 rounded font-semibold uppercase ${showTamil ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-700 text-slate-400'}">
            {showTamil ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Mistakes Vault Button */}
        <button
          onClick={onOpenMistakes}
          title="Review saved mistakes & flashcards"
          className="relative px-2.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Mistakes Vault</span>
          {mistakesCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {mistakesCount}
            </span>
          )}
        </button>

        {/* Voice Audio Settings */}
        <button
          onClick={onOpenVoiceSettings}
          title="Voice pitch, speed & speech engine settings"
          className="p-2 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all"
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Full Working Code Download & ZIP Export Button */}
        <button
          onClick={onOpenExport}
          title="Download complete working code ZIP (npm run dev)"
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
        >
          <FolderDown className="w-3.5 h-3.5 text-emerald-100" />
          <span className="hidden md:inline">Download App Code (.ZIP)</span>
          <span className="md:hidden">Get Code</span>
        </button>

        {/* Clear Chat */}
        <button
          onClick={onClearChat}
          title="Clear current conversation"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
