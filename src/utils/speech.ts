// Web Speech & Audio Utilities for Female Voice and Speech Recognition

export interface VoiceSettings {
  pitch: number;
  rate: number;
  autoSpeak: boolean;
  selectedVoiceURI: string;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  pitch: 1.05,
  rate: 0.96,
  autoSpeak: true,
  selectedVoiceURI: ''
};

// Find natural female English voices
export function getAvailableFemaleVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));

  // Prioritize known female voices
  const femaleKeywords = ['female', 'samantha', 'zira', 'victoria', 'karen', 'fiona', 'moira', 'serena', 'tessa', 'veena', 'susan', 'jenny', 'ava', 'allison', 'natural'];
  const femaleVoices = englishVoices.filter(v => {
    const nameLower = v.name.toLowerCase();
    return femaleKeywords.some(keyword => nameLower.includes(keyword));
  });

  return femaleVoices.length > 0 ? femaleVoices : englishVoices;
}

export function playFemaleSpeech(
  text: string,
  settings: VoiceSettings,
  onStart?: () => void,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  try {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;

    const voices = window.speechSynthesis.getVoices();
    let voiceToUse: SpeechSynthesisVoice | undefined;

    if (settings.selectedVoiceURI) {
      voiceToUse = voices.find(v => v.voiceURI === settings.selectedVoiceURI);
    }

    if (!voiceToUse) {
      const femaleVoices = getAvailableFemaleVoices();
      // Try to find British or US female voice
      voiceToUse = femaleVoices.find(v => v.name.includes('UK') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Victoria')) || femaleVoices[0] || voices.find(v => v.lang.startsWith('en'));
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.error('Speech synthesis failure:', err);
    if (onEnd) onEnd();
    return null;
  }
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Convert PCM Base64 to audio buffer and play via AudioContext (for Gemini TTS)
export async function playBase64Audio(
  base64Data: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<AudioBufferSourceNode | null> {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Try decoding or direct PCM
    const buffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    if (onStart) onStart();
    source.onended = () => {
      if (onEnd) onEnd();
      audioCtx.close();
    };

    source.start(0);
    return source;
  } catch (err) {
    console.warn('AudioContext playback error, fallback to browser speech:', err);
    if (onEnd) onEnd();
    return null;
  }
}
