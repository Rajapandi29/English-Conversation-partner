'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  AlertCircle, 
  Send, 
  Globe, 
  Award, 
  CheckCircle2, 
  BookOpen, 
  RefreshCw,
  HelpCircle,
  Briefcase,
  Coffee,
  MessageSquare
} from 'lucide-react';

interface CorrectionItem {
  original: string;
  corrected: string;
  errorType: string;
  explanation: string;
  tamilExplanation?: string;
}

interface GrammarAnalysis {
  overallScore: number;
  hasErrors: boolean;
  summary: string;
  corrections: CorrectionItem[];
  betterFraming: {
    casual: string;
    professional: string;
    nativeIdiomOrPhrase?: string;
  };
  vocabularyBoosters: {
    word: string;
    meaning: string;
    example: string;
  }[];
  pronunciationTips?: string[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  grammarAnalysis?: GrammarAnalysis;
}

export default function TalkCraftPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello there! I'm Emma, your English conversational partner. Tap the microphone and speak freely about anything. Whenever you make a grammatical slip or sentence framing error, I will gently explain the correction!"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<GrammarAnalysis | null>(null);
  const [showTamil, setShowTamil] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState('emma');
  const [selectedScenario, setSelectedScenario] = useState('casual');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.onerror = (err: any) => {
          console.error('Speech recognition error:', err);
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInputText('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speakFemaleVoice = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.name.includes('Google UK English Female') ||
        v.name.includes('Samantha') ||
        v.name.includes('Victoria') ||
        v.name.includes('Zira') ||
        v.name.toLowerCase().includes('female')
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend = inputText) => {
    if (!textToSend.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
          persona: selectedPersona,
          user_level: 'intermediate',
          scenario: selectedScenario
        })
      });

      if (!res.ok) throw new Error('API server returned error');
      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply,
        grammarAnalysis: data.grammar_analysis
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.grammar_analysis) {
        setActiveAnalysis(data.grammar_analysis);
      }
      speakFemaleVoice(data.reply);
    } catch (err) {
      console.error('Chat error:', err);
      // Client-side fallback if backend is offline
      const fallbackReply = "That's a good thought! Remember to practice using complete sentences and past tense when describing past events.";
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallbackReply
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakFemaleVoice(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            TC
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight">TalkCraft AI</h1>
            <p className="text-xs text-slate-400">English Speaking & Grammar Coach • Next.js + FastAPI + Postgres</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTamil(!showTamil)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showTamil 
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{showTamil ? 'தமிழ் விளக்கம் (Tamil: ON)' : 'Tamil: OFF'}</span>
          </button>

          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="casual">Scenario: Casual Chat</option>
            <option value="interview">Scenario: Job Interview</option>
            <option value="travel">Scenario: Travel & Hotel</option>
            <option value="ielts">Scenario: IELTS Speaking</option>
          </select>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat stream */}
        <div className="flex-1 flex flex-col h-full bg-slate-950">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>

                  {m.sender === 'ai' && (
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>AI Tutor (Female Voice)</span>
                      </span>
                      <button
                        onClick={() => speakFemaleVoice(m.text)}
                        className="hover:text-white p-1 rounded transition-colors"
                        title="Replay Voice"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {m.sender === 'user' && m.grammarAnalysis && (
                    <button
                      onClick={() => setActiveAnalysis(m.grammarAnalysis!)}
                      className="mt-2 text-[11px] bg-indigo-700/60 hover:bg-indigo-700 px-2 py-1 rounded text-indigo-100 flex items-center space-x-1 transition-colors"
                    >
                      <Award className="w-3 h-3 text-amber-300" />
                      <span>Score: {m.grammarAnalysis.overallScore}% • View Grammar Analysis</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-400 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Emma is listening and evaluating your grammar...</span>
                </div>
              </div>
            )}

            {/* Real-time Animated Audio Visualizer HUD */}
            {(isRecording || isPlayingAudio) && (
              <div className="sticky bottom-0 z-10 p-3.5 rounded-2xl bg-slate-900/95 border border-indigo-500/30 shadow-xl backdrop-blur-md flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isRecording ? 'bg-rose-400' : 'bg-emerald-400'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      isRecording ? 'bg-rose-500' : 'bg-emerald-500'
                    }`} />
                  </span>
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                      isRecording ? 'text-rose-300' : 'text-emerald-300'
                    }`}>
                      {isRecording ? 'Microphone Active • Listening' : 'AI Speaking • Female Voice'}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {isRecording ? (inputText || 'Speak your sentence in English...') : 'Speaking conversational response'}
                    </span>
                  </div>
                </div>

                {/* Animated Frequency Spectrum Bars */}
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  {[30, 60, 90, 45, 80, 50, 95, 35, 75, 40, 85, 65, 90, 55, 30].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 animate-pulse ${
                        isRecording
                          ? 'bg-gradient-to-t from-rose-600 to-amber-300'
                          : 'bg-gradient-to-t from-emerald-600 to-cyan-300'
                      }`}
                      style={{
                        height: `${Math.max(6, h * 0.22)}px`,
                        animationDelay: `${i * 80}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice & Input Controls */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/40">
            <div className="max-w-4xl mx-auto flex items-center space-x-3">
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3.5 rounded-full transition-all shadow-lg flex items-center justify-center ${
                  isRecording 
                    ? 'bg-rose-500 text-white ring-4 ring-rose-500/30 scale-105' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                title={isRecording ? "Stop speaking" : "Hold or click to speak in English"}
              >
                {isRecording ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRecording ? "Listening to your voice..." : "Speak using the mic or type your sentence in English..."}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500"
                />
              </div>

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors shadow-md shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Grammar & Sentence Framing Feedback Panel */}
        <div className="w-96 border-l border-slate-800 bg-slate-900/50 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold">Grammar & Framing Feedback</h2>
            </div>
            {activeAnalysis && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                activeAnalysis.overallScore >= 80 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {activeAnalysis.overallScore}% Score
              </span>
            )}
          </div>

          {!activeAnalysis ? (
            <div className="text-center py-16 px-4">
              <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No Speech Analyzed Yet</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Click the microphone icon and speak your thoughts in English. Instant grammar, sentence framing corrections, and Tamil explanations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 text-xs leading-relaxed text-slate-300">
                {activeAnalysis.summary}
              </div>

              {/* Grammar Corrections */}
              {activeAnalysis.corrections.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Errors Corrected ({activeAnalysis.corrections.length})
                  </h3>
                  {activeAnalysis.corrections.map((corr, idx) => (
                    <div key={idx} className="bg-slate-900 rounded-xl p-3.5 border border-rose-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/40">
                          {corr.errorType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="text-rose-400 line-through">
                          ❌ {corr.original}
                        </div>
                        <div className="text-emerald-400 font-medium">
                          ✅ {corr.corrected}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800">
                        {corr.explanation}
                      </p>

                      {showTamil && corr.tamilExplanation && (
                        <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5 text-xs text-amber-200/90 leading-relaxed font-sans">
                          <span className="font-semibold text-amber-400 block mb-0.5">தமிழ் விளக்கம்:</span>
                          {corr.tamilExplanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 flex items-center space-x-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Flawless grammar! No grammatical errors detected in this sentence.</span>
                </div>
              )}

              {/* Better Framing */}
              {activeAnalysis.betterFraming && (
                <div className="space-y-2.5 pt-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    How Native Speakers Say It
                  </h3>
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-medium text-indigo-400 block mb-0.5">Casual / Conversational:</span>
                      <p className="text-slate-200">"{activeAnalysis.betterFraming.casual}"</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-medium text-emerald-400 block mb-0.5">Professional / Workplace:</span>
                      <p className="text-slate-200">"{activeAnalysis.betterFraming.professional}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vocabulary Boosters */}
              {activeAnalysis.vocabularyBoosters?.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Vocabulary Booster
                  </h3>
                  <div className="space-y-2">
                    {activeAnalysis.vocabularyBoosters.map((voc, i) => (
                      <div key={i} className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs">
                        <div className="font-bold text-indigo-300">{voc.word}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{voc.meaning}</div>
                        <div className="text-slate-300 italic text-[11px] mt-1">"{voc.example}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
