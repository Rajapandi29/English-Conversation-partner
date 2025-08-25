
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type Message, type AppState } from './types';
import { getAIFeedback } from './services/geminiService';
import { useSpeechToText } from './hooks/useSpeechToText';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import ConversationView from './components/ConversationView';
import MicButton from './components/MicButton';
import StatusIndicator from './components/StatusIndicator';
import ApiKeyBanner from './components/ApiKeyBanner';
import TopicSelection from './components/TopicSelection';
import { BotIcon } from './components/icons/BotIcon';

// Note: The global WakeLockSentinel type declarations were removed as they
// conflict with modern TypeScript DOM library definitions.

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [appState, setAppState] = useState<AppState>('idle');
  const [apiKeyError, setApiKeyError] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const { speak, isSpeaking } = useTextToSpeech(() => setAppState('idle'));
  
  const handleTranscript = useCallback(async (transcript: string) => {
    if (transcript.trim() === '' || !selectedTopic) {
      setAppState('idle');
      return;
    }
    
    setAppState('processing');
    const userMessage: Message = { role: 'user', text: transcript };
    setMessages(prev => [...prev, userMessage]);

    try {
      const history = messages.slice(-4); // Keep context brief
      const aiResponse = await getAIFeedback(transcript, history, selectedTopic);
      
      const aiMessage: Message = {
        role: 'assistant',
        text: aiResponse.followUpQuestion,
        correction: aiResponse.correction,
        explanation: aiResponse.explanation,
      };
      setMessages(prev => [...prev, aiMessage]);
      speak(aiResponse.followUpQuestion);

    } catch (error) {
      console.error("Error getting AI feedback:", error);
      const errorMessage: Message = { role: 'assistant', text: "Sorry, I encountered an error. Let's try that again." };
      setMessages(prev => [...prev, errorMessage]);
      speak(errorMessage.text);
    } finally {
      setAppState('speaking');
    }
  }, [messages, speak, selectedTopic]);

  const handleSpeechError = useCallback((error: string) => {
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      const errorMessage: Message = { 
        role: 'assistant', 
        text: "Microphone access is blocked. Please enable it in your browser settings to continue." 
      };
      setMessages(prev => [...prev, errorMessage]);
      setAppState('error');
      return;
    }

    const isNoSpeech = error === 'no-speech';
    const errorMessageText = isNoSpeech
      ? "I'm sorry, I didn't catch that. Could you please try again?"
      : "There was a problem with the microphone. Let's try again.";
    
    const errorMessage: Message = { role: 'assistant', text: errorMessageText };
    setMessages(prev => [...prev, errorMessage]);

    if (isNoSpeech) {
      // For no-speech, we want a less intrusive message.
      // We'll show the text but not speak it, and return to idle.
      setAppState('idle');
    } else {
      // For other errors, it's more critical, so we speak it.
      speak(errorMessageText);
    }
  }, [speak]);

  const { isListening, startListening, stopListening } = useSpeechToText({ 
    onTranscript: handleTranscript,
    onError: handleSpeechError,
  });
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setAppState('listening');
      startListening();
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    const initialMessage: Message = {
      role: 'assistant',
      text: `Great, let's talk about ${topic.toLowerCase()}! What's on your mind?`,
    };
    setMessages([initialMessage]);
    setAppState('speaking');
    speak(initialMessage.text);
  };

  useEffect(() => {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY.trim() === '') {
      setApiKeyError(true);
    }
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Sync appState with listening/speaking states
    if (isListening) {
      setAppState('listening');
    } else if (isSpeaking) {
      setAppState('speaking');
    } else if (appState !== 'processing' && appState !== 'idle' && appState !== 'error') {
       if(!isListening && !isSpeaking) setAppState('idle');
    }
  }, [isListening, isSpeaking, appState]);

  if (apiKeyError) {
    return <ApiKeyBanner />;
  }

  if (!selectedTopic) {
    return <TopicSelection onTopicSelect={handleTopicSelect} />;
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <BotIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">English Partner</h1>
        </div>
        <StatusIndicator state={appState} />
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <ConversationView messages={messages} />
          <div ref={conversationEndRef} />
        </div>
      </main>

      <footer className="w-full p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center">
            <MicButton 
              isListening={isListening} 
              isProcessing={appState === 'processing' || isSpeaking}
              onClick={toggleListening} 
            />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Click the button to speak. Click again to stop.
          </p>
        </div>
      </footer>
    </div>
  );
}