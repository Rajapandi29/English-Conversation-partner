import { useState, useEffect, useCallback, useRef } from 'react';

export const useTextToSpeech = (onEndCallback: () => void) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const femaleVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Female') || voice.name.includes('Eva') || voice.name.includes('Zira') || voice.name.includes('Google US English'))
      ) || voices.find(voice => voice.lang.startsWith('en')) || null;
      
      femaleVoiceRef.current = femaleVoice;
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!text || typeof window.speechSynthesis === 'undefined') {
      onEndCallback();
      return;
    }
    
    window.speechSynthesis.cancel(); // Cancel any previous speech

    const utterance = new SpeechSynthesisUtterance(text);
    if (femaleVoiceRef.current) {
      utterance.voice = femaleVoiceRef.current;
    }
    utterance.pitch = 1;
    utterance.rate = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEndCallback();
    };
    utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e.error);
        setIsSpeaking(false);
        onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  }, [onEndCallback]);

  return { isSpeaking, speak };
};
