import React, { useState, useEffect } from 'react';
import { X, Volume2, Sliders, Check, Play, UserCheck } from 'lucide-react';
import { VoiceSettings, getAvailableFemaleVoices, playFemaleSpeech } from '../utils/speech';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onSaveSettings: (settings: VoiceSettings) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(settings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const v = getAvailableFemaleVoices();
        setVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleTestSpeech = () => {
    setIsTesting(true);
    playFemaleSpeech(
      "Hello! I am your AI English practice partner. Let's work together to make your spoken English fluent and confident!",
      localSettings,
      () => setIsTesting(true),
      () => setIsTesting(false)
    );
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Female Voice & Audio Settings</h2>
              <p className="text-xs text-slate-400">Configure speech rate, pitch & natural female voice</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Select Female Voice Engine
          </label>
          <select
            value={localSettings.selectedVoiceURI}
            onChange={(e) => setLocalSettings({ ...localSettings, selectedVoiceURI: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Default Female Natural Voice (Recommended)</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">
            Detected {voices.length} high-fidelity English voices on your device.
          </p>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Voice Pitch</span>
            <span className="font-mono text-indigo-400 font-bold">{localSettings.pitch.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.05"
            value={localSettings.pitch}
            onChange={(e) => setLocalSettings({ ...localSettings, pitch: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Deeper</span>
            <span>Natural Female (1.05x)</span>
            <span>Higher</span>
          </div>
        </div>

        {/* Speed / Rate Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Speaking Speed</span>
            <span className="font-mono text-emerald-400 font-bold">{localSettings.rate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.25"
            step="0.05"
            value={localSettings.rate}
            onChange={(e) => setLocalSettings({ ...localSettings, rate: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Slow & Clear (Learner)</span>
            <span>Normal (1.0x)</span>
            <span>Fast (Native)</span>
          </div>
        </div>

        {/* Auto-Speak Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-200">Auto-Speak Responses</div>
            <div className="text-[11px] text-slate-400">
              Immediately speak every reply in female voice
            </div>
          </div>
          <button
            onClick={() => setLocalSettings({ ...localSettings, autoSpeak: !localSettings.autoSpeak })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              localSettings.autoSpeak ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                localSettings.autoSpeak ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Test Speech Sample Button */}
        <button
          onClick={handleTestSpeech}
          disabled={isTesting}
          className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all"
        >
          <Play className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
          <span>{isTesting ? 'Playing Sample Voice...' : 'Test Female Voice Sample'}</span>
        </button>

        {/* Footer actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
