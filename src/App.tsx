import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Volume2, 
  Flame, 
  Award, 
  TrendingUp, 
  Layers, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2,
  Mic,
  Smile
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ChatArea } from './components/ChatArea';
import { VoiceControls } from './components/VoiceControls';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { GrammarCard } from './components/GrammarCard';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { MistakesBankModal } from './components/MistakesBankModal';
import { ExportCodeModal } from './components/ExportCodeModal';
import { triggerGrammar100Confetti } from './utils/confetti';

import { PERSONAS } from './data/personas';
import { 
  ChatMessage, 
  PersonaId, 
  PracticeScenario, 
  GrammarAnalysis, 
  UserStats 
} from './types';
import { 
  VoiceSettings, 
  DEFAULT_VOICE_SETTINGS, 
  playFemaleSpeech, 
  stopSpeech, 
  playBase64Audio 
} from './utils/speech';

export default function App() {
  const [currentPersonaId, setCurrentPersonaId] = useState<PersonaId>('emma');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTamil, setShowTamil] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<PracticeScenario | null>(null);

  // Audio / Speech State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Active / Selected Grammar card
  const [activeAnalysis, setActiveAnalysis] = useState<GrammarAnalysis | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Modals
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isMistakesOpen, setIsMistakesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Saved Mistakes Bank & Stats
  const [mistakesList, setMistakesList] = useState<any[]>([]);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSentences: 0,
    averageAccuracy: 95,
    mistakesFixed: 0,
    speakingTimeSeconds: 0
  });

  const currentPersona = PERSONAS.find(p => p.id === currentPersonaId) || PERSONAS[0];

  // Fetch initial history, mistakes, and health status from server on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [mistakesRes, healthRes] = await Promise.all([
          fetch('/api/mistakes').catch(() => null),
          fetch('/api/health').catch(() => null)
        ]);

        if (mistakesRes && mistakesRes.ok) {
          const data = await mistakesRes.json();
          if (data.mistakes) setMistakesList(data.mistakes);
        }

        if (healthRes && healthRes.ok) {
          const healthData = await healthRes.json();
          if (typeof healthData.hasGeminiKey === 'boolean') {
            setHasGeminiKey(healthData.hasGeminiKey);
          }
        }
      } catch (err) {
        console.warn('Initial load warning:', err);
      }
    }
    loadInitialData();
  }, []);

  // Voice playback handler for female speech
  const handlePlayVoice = (text: string, msgId: string, base64Audio?: string) => {
    stopSpeech();
    setPlayingMessageId(msgId);
    setIsAiSpeaking(true);

    if (base64Audio) {
      playBase64Audio(
        base64Audio,
        () => setIsAiSpeaking(true),
        () => {
          setIsAiSpeaking(false);
          setPlayingMessageId(null);
        }
      );
    } else {
      playFemaleSpeech(
        text,
        voiceSettings,
        () => setIsAiSpeaking(true),
        () => {
          setIsAiSpeaking(false);
          setPlayingMessageId(null);
        }
      );
    }
  };

  const handleStopSpeech = () => {
    stopSpeech();
    setIsAiSpeaking(false);
    setPlayingMessageId(null);
  };

  // Main chat sending handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessageId = 'u_' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.map(m => ({ sender: m.sender, text: m.text })),
          persona: currentPersonaId,
          userLevel: 'intermediate',
          scenario: selectedScenario?.id || 'casual'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach AI Tutor server');
      }

      const data = await response.json();
      const analysis: GrammarAnalysis = data.grammarAnalysis;

      // Update user message with the grammar feedback
      setMessages(prev => prev.map(m => m.id === userMessageId ? { ...m, grammarAnalysis: analysis } : m));
      setActiveAnalysis(analysis);
      setSelectedMessageId(userMessageId);

      // Trigger celebratory confetti animation effect if user scores 100% in grammar accuracy
      if (analysis && analysis.overallScore >= 100) {
        triggerGrammar100Confetti();
      }

      // Create AI Response Message
      const aiMessageId = 'ai_' + Date.now();
      const newAiMsg: ChatMessage = {
        id: aiMessageId,
        sender: 'ai',
        text: data.reply,
        timestamp: Date.now(),
        personaId: currentPersonaId,
        audioBase64: data.audioBase64
      };

      setMessages(prev => [...prev, newAiMsg]);

      // Update stats & mistakes
      if (analysis.hasErrors && analysis.corrections.length > 0) {
        setMistakesList(prev => [...analysis.corrections, ...prev].slice(0, 100));
      }

      setUserStats(prev => {
        const newTotal = prev.totalSentences + 1;
        const newAvg = Math.round(((prev.averageAccuracy * prev.totalSentences) + analysis.overallScore) / newTotal);
        return {
          totalSentences: newTotal,
          averageAccuracy: newAvg,
          mistakesFixed: prev.mistakesFixed + (analysis.hasErrors ? 0 : 1),
          speakingTimeSeconds: prev.speakingTimeSeconds + 15
        };
      });

      // Auto-speak response in female voice if enabled
      if (voiceSettings.autoSpeak) {
        handlePlayVoice(data.reply, aiMessageId, data.audioBase64);
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback AI reply
      const fallbackAiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: "I heard you! That was a good sentence. Let's keep practicing together!",
        timestamp: Date.now(),
        personaId: currentPersonaId
      };
      setMessages(prev => [...prev, fallbackAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = (scenario: PracticeScenario) => {
    setSelectedScenario(scenario);
    // Send initial greeting or prompt
    const initialAiMsg: ChatMessage = {
      id: 'ai_' + Date.now(),
      sender: 'ai',
      text: `Let's practice: ${scenario.title}! ${scenario.prompt} How would you like to start?`,
      timestamp: Date.now(),
      personaId: currentPersonaId
    };
    setMessages(prev => [...prev, initialAiMsg]);
    if (voiceSettings.autoSpeak) {
      handlePlayVoice(initialAiMsg.text, initialAiMsg.id);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Start a fresh conversation? Current conversation history will be reset.')) {
      setMessages([]);
      setActiveAnalysis(null);
      setSelectedMessageId(null);
      stopSpeech();
      setIsAiSpeaking(false);
      try {
        await fetch('/api/history', { method: 'DELETE' });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleClearMistakes = async () => {
    setMistakesList([]);
    try {
      await fetch('/api/mistakes', { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentPersonaId={currentPersonaId}
        onSelectPersona={(id) => {
          setCurrentPersonaId(id);
          stopSpeech();
        }}
        showTamil={showTamil}
        onToggleTamil={() => setShowTamil(prev => !prev)}
        onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
        onOpenMistakes={() => setIsMistakesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onClearChat={handleClearChat}
        mistakesCount={mistakesList.length}
        overallScoreAvg={userStats.averageAccuracy}
        hasGeminiKey={hasGeminiKey}
      />

      {/* Voice Activity Wave Banner */}
      <VoiceVisualizer
        isListening={isListening}
        isAiSpeaking={isAiSpeaking}
        personaName={currentPersona.name}
        personaAvatar={currentPersona.avatar}
        onStopSpeech={handleStopSpeech}
      />

      {/* Main Workspace: Left Chat Stream + Right Live Grammar Studio */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversational Voice Studio */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800/80">
          <ChatArea
            messages={messages}
            currentPersona={currentPersona}
            isLoading={isLoading}
            showTamil={showTamil}
            onPlayVoice={handlePlayVoice}
            playingMessageId={playingMessageId}
            onSelectGrammarAnalysis={(msg) => {
              setSelectedMessageId(msg.id);
              if (msg.grammarAnalysis) {
                setActiveAnalysis(msg.grammarAnalysis);
                if (msg.grammarAnalysis.overallScore >= 100) {
                  triggerGrammar100Confetti();
                }
              }
            }}
            selectedMessageId={selectedMessageId}
            isListening={isListening}
            isAiSpeaking={isAiSpeaking}
            onStopSpeech={handleStopSpeech}
          />

          <VoiceControls
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onScenarioSelect={handleSelectScenario}
            selectedScenario={selectedScenario}
            onListeningStateChange={(listening) => setIsListening(listening)}
          />
        </div>

        {/* Right Column: Live Grammar & Sentence Framing Sidebar (Desktop) */}
        <div className="hidden lg:flex w-96 flex-col bg-slate-950/60 p-5 overflow-y-auto space-y-4 border-l border-slate-800/50">
          {/* Top Stat Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>Overall Spoken Accuracy</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {userStats.averageAccuracy}%
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Sentences Spoken</span>
              <span className="text-sm font-bold text-white">{userStats.totalSentences}</span>
            </div>
          </div>

          {/* Grammar Card or Prompt */}
          {activeAnalysis ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Live Analysis
                </span>
                <span className="text-[11px] text-indigo-400 cursor-pointer hover:underline" onClick={() => setIsMistakesOpen(true)}>
                  Vault ({mistakesList.length})
                </span>
              </div>
              <GrammarCard
                analysis={activeAnalysis}
                showTamil={showTamil}
                onPracticeSentence={(corrected) => handleSendMessage(corrected)}
              />
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Live Grammar Radar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As soon as you speak with the microphone or send a message, every grammatical mistake, sentence framing enhancement, and Tamil explanation will appear here in real-time.
              </p>
            </div>
          )}

          {/* Tamil Guide Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-sans space-y-1">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              💡 தமிழ் வழி ஆங்கிலப் பயிற்சி
            </span>
            <p className="text-[11px] text-slate-300">
              நீங்கள் பேசும் வாக்கியங்களில் உள்ள இலக்கணப் பிழைகள் மற்றும் சரியான வாக்கிய அமைப்பை உடனடியாகத் தமிழில் படித்துத் தெரிந்துகொள்ளலாம்.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        settings={voiceSettings}
        onSaveSettings={(s) => setVoiceSettings(s)}
      />

      <MistakesBankModal
        isOpen={isMistakesOpen}
        onClose={() => setIsMistakesOpen(false)}
        mistakes={mistakesList}
        onClearMistakes={handleClearMistakes}
        onPracticeSentence={(text) => handleSendMessage(text)}
        showTamil={showTamil}
      />

      <ExportCodeModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
