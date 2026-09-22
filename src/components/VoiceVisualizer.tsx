import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Mic, Activity, Radio, Sparkles } from 'lucide-react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isAiSpeaking: boolean;
  personaName: string;
  personaAvatar?: string;
  onStopSpeech?: () => void;
  variant?: 'banner' | 'chat-hud' | 'inline';
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isListening,
  isAiSpeaking,
  personaName,
  personaAvatar,
  onStopSpeech,
  variant = 'banner'
}) => {
  const [frequencies, setFrequencies] = useState<number[]>(() => 
    Array.from({ length: 24 }, () => Math.floor(Math.random() * 40 + 15))
  );
  const animationFrameRef = useRef<number | null>(null);

  // Dynamic live wave oscillation
  useEffect(() => {
    if (!isListening && !isAiSpeaking) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let step = 0;
    const updateFrequencies = () => {
      step += 0.12;
      const count = variant === 'inline' ? 12 : 24;
      
      const newFreqs = Array.from({ length: count }, (_, i) => {
        if (isListening) {
          // Dynamic microphone audio wave simulation
          const base = Math.sin(step * 1.5 + i * 0.4) * 35;
          const noise = Math.sin(step * 3 + i * 0.9) * 15;
          return Math.max(10, Math.min(95, Math.floor(45 + base + noise)));
        } else if (isAiSpeaking) {
          // Speech cadence frequency simulation with harmonic curves
          const base = Math.sin(step * 2.2 + i * 0.5) * 40;
          const harmonic = Math.cos(step * 1.2 + i * 0.3) * 20;
          return Math.max(8, Math.min(100, Math.floor(50 + base + harmonic)));
        }
        return 15;
      });

      setFrequencies(newFreqs);
      animationFrameRef.current = requestAnimationFrame(updateFrequencies);
    };

    animationFrameRef.current = requestAnimationFrame(updateFrequencies);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isListening, isAiSpeaking, variant]);

  if (!isListening && !isAiSpeaking) return null;

  // 1. Inline Variant (inside message bubbles)
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
        <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
        <div className="flex items-center gap-0.5 h-4">
          {frequencies.slice(0, 12).map((val, idx) => (
            <div
              key={idx}
              className="w-1 rounded-full bg-emerald-400 transition-all duration-75"
              style={{
                height: `${Math.max(4, (val * 0.16))}px`,
                opacity: 0.5 + (val / 200)
              }}
            />
          ))}
        </div>
        <span className="text-[10px] font-semibold text-emerald-300 ml-1">
          Playing
        </span>
      </div>
    );
  }

  // 2. Chat HUD Variant (Interactive Floating card in Chat Interface)
  if (variant === 'chat-hud') {
    return (
      <div className="w-full rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all animate-fadeIn transition-colors duration-300 bg-slate-900/95 border-indigo-500/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Details */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative shrink-0">
              {isListening ? (
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                  </span>
                </div>
              ) : (
                <div className="relative">
                  {personaAvatar ? (
                    <img 
                      src={personaAvatar} 
                      alt={personaName} 
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-400/50 shadow-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    </div>
                  )}
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isListening 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isListening ? 'Live Audio Input' : 'AI Speech Vocalizer'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Radio className={`w-3 h-3 ${isListening ? 'text-rose-400' : 'text-emerald-400'} animate-pulse`} />
                  <span>Real-Time</span>
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium mt-1">
                {isListening 
                  ? 'Listening to your microphone... Speak naturally in English' 
                  : `${personaName} is speaking with natural female voice`}
              </p>
            </div>
          </div>

          {/* Animated Wave Equalizer Bars */}
          <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 w-full sm:w-auto justify-center">
            {frequencies.map((val, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isListening
                    ? 'bg-gradient-to-t from-rose-600 via-rose-400 to-amber-300 shadow-sm shadow-rose-500/30'
                    : 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-cyan-300 shadow-sm shadow-emerald-500/30'
                }`}
                style={{
                  height: `${Math.max(6, (val * 0.32))}px`,
                  opacity: 0.6 + (val / 220)
                }}
              />
            ))}
          </div>

          {/* Action button if AI speaking */}
          {isAiSpeaking && onStopSpeech && (
            <button
              onClick={onStopSpeech}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 hover:text-white transition-all shrink-0"
              title="Stop voice playback"
            >
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              <span>Stop Voice</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Banner Variant (Top Bar)
  return (
    <div className={`w-full border-b px-6 py-2.5 flex items-center justify-between transition-all backdrop-blur-md ${
      isListening 
        ? 'bg-slate-900/90 border-rose-500/30 shadow-lg shadow-rose-950/20' 
        : 'bg-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
    }`}>
      <div className="flex items-center gap-3">
        {isListening ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-xs font-semibold text-rose-300">
              Microphone Active • Listening to your English speech...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300">
              {personaName} is speaking in female voice...
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Animated Wave Bars */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 h-8 px-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
          {frequencies.slice(0, 18).map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${
                isListening
                  ? 'bg-gradient-to-t from-rose-600 to-amber-400'
                  : 'bg-gradient-to-t from-emerald-600 to-teal-300'
              }`}
              style={{
                height: `${Math.max(6, (height * 0.26))}px`,
                opacity: 0.5 + (height / 200)
              }}
            />
          ))}
        </div>

        {isAiSpeaking && onStopSpeech && (
          <button
            onClick={onStopSpeech}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all ml-1"
            title="Stop voice"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
