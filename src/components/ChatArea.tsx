import React, { useRef, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronRight, 
  User, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  PartyPopper
} from 'lucide-react';
import { ChatMessage, Persona } from '../types';
import { GrammarCard } from './GrammarCard';
import { VoiceVisualizer } from './VoiceVisualizer';
import { triggerGrammar100Confetti } from '../utils/confetti';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentPersona: Persona;
  isLoading: boolean;
  showTamil: boolean;
  onPlayVoice: (text: string, msgId: string) => void;
  playingMessageId: string | null;
  onSelectGrammarAnalysis: (msg: ChatMessage) => void;
  selectedMessageId: string | null;
  isListening?: boolean;
  isAiSpeaking?: boolean;
  onStopSpeech?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentPersona,
  isLoading,
  showTamil,
  onPlayVoice,
  playingMessageId,
  onSelectGrammarAnalysis,
  selectedMessageId,
  isListening = false,
  isAiSpeaking = false,
  onStopSpeech
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Welcome Banner if empty */}
      {messages.length === 0 && (
        <div className="max-w-xl mx-auto my-8 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center space-y-4">
          <div className="relative inline-block">
            <img 
              src={currentPersona.avatar} 
              alt={currentPersona.name} 
              className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-indigo-500/30 shadow-xl"
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
              ✓
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Hello! I'm {currentPersona.name}
            </h2>
            <p className="text-xs font-semibold text-indigo-400 mt-0.5">
              Your Personal English Conversational Coach (Female Voice)
            </p>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
              Speak or type to me in English! I will talk back to you in real-time. If you make any mistake in grammar, verb tenses, prepositions, or sentence framing, I will correct you instantly with explanations in English and Tamil (தமிழ் விளக்கம்).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[11px] font-bold text-rose-400 block mb-0.5">1. Live Grammar Fixes</span>
              <p className="text-[10px] text-slate-400">Detects wrong tenses, articles, and word framing instantly.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[11px] font-bold text-emerald-400 block mb-0.5">2. Female Voice Speech</span>
              <p className="text-[10px] text-slate-400">Hear clear spoken answers in natural British & American accents.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[11px] font-bold text-amber-400 block mb-0.5">3. தமிழ் விளக்கம்</span>
              <p className="text-[10px] text-slate-400">Tamil explanations so you clearly understand the rule.</p>
            </div>
          </div>
        </div>
      )}

      {/* Message Stream */}
      {messages.map((message) => {
        const isUser = message.sender === 'user';
        const isPlaying = playingMessageId === message.id;

        return (
          <div
            key={message.id}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
          >
            <div className={`flex items-start gap-2.5 max-w-2xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {!isUser ? (
                <img
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0 mt-1"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1 text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 shadow-md relative text-sm leading-relaxed transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>

                {/* Sub-bar for AI messages */}
                {!isUser && (
                  <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-slate-800/70 text-xs">
                    {isPlaying ? (
                      <div className="flex items-center gap-2">
                        <VoiceVisualizer
                          variant="inline"
                          isListening={false}
                          isAiSpeaking={true}
                          personaName={currentPersona.name}
                        />
                        {onStopSpeech && (
                          <button
                            onClick={onStopSpeech}
                            className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                          >
                            <VolumeX className="w-3 h-3" />
                            <span>Stop</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => onPlayVoice(message.text, message.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 border border-transparent hover:border-slate-700"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">Listen in Female Voice</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Grammar Analysis Inline for User's message */}
            {isUser && message.grammarAnalysis && (
              <div className="w-full max-w-2xl mr-10">
                <div className="flex items-center justify-end gap-2 mb-1.5">
                  <button
                    onClick={() => {
                      onSelectGrammarAnalysis(message);
                      if (message.grammarAnalysis && message.grammarAnalysis.overallScore >= 100) {
                        triggerGrammar100Confetti();
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
                      selectedMessageId === message.id
                        ? 'bg-indigo-600 text-white border-indigo-500 font-semibold'
                        : message.grammarAnalysis.overallScore >= 100
                        ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300 hover:bg-emerald-900/80 shadow-sm shadow-emerald-500/20'
                        : message.grammarAnalysis.hasErrors
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    {message.grammarAnalysis.overallScore >= 100 ? (
                      <PartyPopper className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>
                      {message.grammarAnalysis.overallScore >= 100
                        ? '🎉 100% Perfect Grammar'
                        : message.grammarAnalysis.hasErrors
                        ? `${message.grammarAnalysis.corrections.length} Grammar Correction${message.grammarAnalysis.corrections.length > 1 ? 's' : ''}`
                        : 'Accurate & Natural'}
                    </span>
                    <span className="font-bold">({message.grammarAnalysis.overallScore}%)</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Expanded card view if selected */}
                {selectedMessageId === message.id && (
                  <div className="mt-2 animate-fadeIn">
                    <GrammarCard analysis={message.grammarAnalysis} showTamil={showTamil} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-start gap-2.5 max-w-lg">
          <img
            src={currentPersona.avatar}
            alt={currentPersona.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0 mt-1 animate-pulse"
          />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-indigo-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>{currentPersona.name} is listening, checking grammar & formulating response...</span>
          </div>
        </div>
      )}

      {/* Real-time Audio Visualizer HUD (Active when Listening to Mic or AI Speaking) */}
      {(isListening || isAiSpeaking) && (
        <div className="sticky bottom-0 pt-2 pb-1 z-10 animate-fadeIn">
          <VoiceVisualizer
            variant="chat-hud"
            isListening={isListening}
            isAiSpeaking={isAiSpeaking}
            personaName={currentPersona.name}
            personaAvatar={currentPersona.avatar}
            onStopSpeech={onStopSpeech}
          />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
