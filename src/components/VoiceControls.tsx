import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  CornerDownLeft, 
  Sparkles, 
  Volume2, 
  X,
  Compass
} from 'lucide-react';
import { PracticeScenario } from '../types';
import { SCENARIOS } from '../data/personas';

interface VoiceControlsProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onScenarioSelect: (scenario: PracticeScenario) => void;
  selectedScenario: PracticeScenario | null;
  onListeningStateChange?: (isListening: boolean) => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onSendMessage,
  isLoading,
  onScenarioSelect,
  selectedScenario,
  onListeningStateChange
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setInputText(currentTranscript.trim());
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission denied. Please allow microphone access in browser.');
          }
          setIsRecording(false);
          onListeningStateChange?.(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
          onListeningStateChange?.(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.error('Recognition init failed:', err);
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can still type directly in the text box below!');
      return;
    }

    setSpeechError(null);

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      onListeningStateChange?.(false);
    } else {
      try {
        setInputText('');
        recognitionRef.current.start();
        setIsRecording(true);
        onListeningStateChange?.(true);
      } catch (e) {
        console.warn('Recognition start retry:', e);
        setIsRecording(false);
        onListeningStateChange?.(false);
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      onListeningStateChange?.(false);
    }
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 space-y-3 z-10">
      {/* Quick Scenario Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1 px-1">
          <Compass className="w-3.5 h-3.5 text-indigo-400" /> Topic:
        </span>
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => onScenarioSelect(sc)}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-all font-medium flex items-center gap-1.5 ${
              selectedScenario?.id === sc.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`}
          >
            <span>{sc.title}</span>
          </button>
        ))}
      </div>

      {/* Mic error notice */}
      {speechError && (
        <div className="text-xs p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Spoken voice real-time preview prompt */}
      {isRecording && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/30 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300 shadow-lg shadow-rose-950/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <div className="min-w-0">
              <span className="font-bold text-rose-200 block text-[11px] uppercase tracking-wider">
                Microphone Listening:
              </span>
              <span className="text-slate-100 italic truncate block">
                {inputText || 'Speak naturally in English... listening to your words'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Animated Audio Waveform Bars */}
            <div className="hidden sm:flex items-center gap-1 h-6 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-rose-500/20">
              {[20, 50, 80, 40, 90, 60, 100, 70, 35, 85, 45, 65].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-rose-600 via-rose-400 to-amber-300 animate-pulse"
                  style={{
                    height: `${Math.max(4, h * 0.2)}px`,
                    animationDelay: `${i * 90}ms`,
                    animationDuration: '0.8s'
                  }}
                />
              ))}
            </div>

            <button
              onClick={toggleRecording}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/30 transition-all flex items-center gap-1.5"
            >
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Input Bar */}
      <div className="flex items-center gap-2.5">
        {/* Big Voice Microphone Button */}
        <button
          onClick={toggleRecording}
          disabled={isLoading}
          title={isRecording ? 'Stop recording voice' : 'Click to speak in English'}
          className={`relative h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 shadow-lg ${
            isRecording
              ? 'bg-rose-600 text-white ring-4 ring-rose-500/30 animate-bounce'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30'
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isRecording && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-400 animate-ping" />
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening to speech...'
                : 'Speak with microphone or type your sentence in English...'
            }
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isLoading}
          className={`h-12 px-5 rounded-2xl font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all ${
            inputText.trim() && !isLoading
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Every sentence is automatically verified for grammar, phrasing & Tamil guide.
        </span>
        <span className="hidden sm:inline">Press Enter ↵ to send</span>
      </div>
    </div>
  );
};
