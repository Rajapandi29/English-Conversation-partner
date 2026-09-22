import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  Filter, 
  Mic, 
  Sparkles,
  HelpCircle 
} from 'lucide-react';
import { CorrectionItem } from '../types';

interface MistakesBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  mistakes: any[];
  onClearMistakes: () => void;
  onPracticeSentence: (text: string) => void;
  showTamil: boolean;
}

export const MistakesBankModal: React.FC<MistakesBankModalProps> = ({
  isOpen,
  onClose,
  mistakes,
  onClearMistakes,
  onPracticeSentence,
  showTamil
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredMistakes = filterType === 'all'
    ? mistakes
    : mistakes.filter(m => m.errorType === filterType);

  const errorTypes = ['all', ...Array.from(new Set(mistakes.map(m => m.errorType)))];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Grammar & Sentence Framing Vault
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-rose-400 border border-slate-700">
                  {mistakes.length} Saved
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Review past errors and practice the corrected native forms to master English fluency.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {errorTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize transition-all ${
                  filterType === type
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {mistakes.length > 0 && (
            <button
              onClick={onClearMistakes}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline ml-2 shrink-0"
            >
              <Trash2 className="w-3 h-3" /> Clear All
            </button>
          )}
        </div>

        {/* List of mistakes */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredMistakes.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-200">No Mistakes Found!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filterType === 'all'
                  ? 'Your spoken sentences are looking great. Keep chatting to track and practice any future errors.'
                  : 'No mistakes found in this category.'}
              </p>
            </div>
          ) : (
            filteredMistakes.map((m, idx) => (
              <div
                key={m.id || idx}
                className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    {m.errorType?.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => {
                      onPracticeSentence(m.corrected);
                      onClose();
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Practice Saying This</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/30">
                    <span className="text-[10px] font-bold text-rose-400 block mb-0.5">Your Mistake:</span>
                    <span className="text-slate-300 line-through decoration-rose-500 font-mono">
                      {m.original}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
                    <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">Correct Grammar:</span>
                    <span className="text-emerald-300 font-bold font-mono">
                      {m.corrected}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {m.explanation}
                </p>

                {showTamil && m.tamilExplanation && (
                  <div className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed font-sans">
                    <span className="font-bold text-amber-400 block text-[11px] mb-0.5">
                      💡 தமிழ் விளக்கம்:
                    </span>
                    {m.tamilExplanation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Tip: Tap "Practice Saying This" to load the corrected phrase into your voice input!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
