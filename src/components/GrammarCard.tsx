import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  BookMarked, 
  Volume2, 
  Layers, 
  Lightbulb, 
  Briefcase,
  Smile,
  PartyPopper
} from 'lucide-react';
import { GrammarAnalysis, CorrectionItem } from '../types';
import { triggerGrammar100Confetti } from '../utils/confetti';

interface GrammarCardProps {
  analysis: GrammarAnalysis;
  showTamil: boolean;
  onPracticeSentence?: (text: string) => void;
}

export const GrammarCard: React.FC<GrammarCardProps> = ({
  analysis,
  showTamil,
  onPracticeSentence
}) => {
  const [activeTab, setActiveTab] = useState<'corrections' | 'framing' | 'vocab'>('corrections');

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header with Score */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Grammar & Framing Analysis
            </h3>
            <p className="text-[11px] text-slate-400">{analysis.summary}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (analysis.overallScore === 100) triggerGrammar100Confetti();
          }}
          className={`px-2.5 py-1 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
            analysis.overallScore === 100
              ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/50 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer animate-pulse'
              : getScoreColor(analysis.overallScore)
          }`}
          title={analysis.overallScore === 100 ? 'Click to trigger 100% celebratory confetti!' : undefined}
        >
          {analysis.overallScore === 100 && <PartyPopper className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{analysis.overallScore}%</span>
          <span className="text-[10px] font-medium opacity-80">Fluency</span>
        </button>
      </div>

      {/* Celebratory 100% Accuracy Banner */}
      {analysis.overallScore === 100 && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/60 border border-emerald-500/40 shadow-lg shadow-emerald-950/30 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
              <PartyPopper className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-300">100% Perfect Grammar!</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Flawless
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Zero grammar mistakes! Flawless spoken English sentence.
              </p>
            </div>
          </div>

          <button
            onClick={() => triggerGrammar100Confetti()}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
            title="Celebrate with confetti"
          >
            <span>🎉</span>
            <span className="hidden sm:inline">Celebrate</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setActiveTab('corrections')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'corrections'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Fixes ({analysis.corrections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('framing')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'framing'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Native Framing</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'vocab'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5 text-indigo-400" />
          <span>Vocab ({analysis.vocabularyBoosters.length})</span>
        </button>
      </div>

      {/* Tab 1: Grammar Corrections */}
      {activeTab === 'corrections' && (
        <div className="space-y-3">
          {analysis.corrections.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-emerald-300">Flawless Sentence!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No grammar or syntax mistakes found in this phrase. Well said!
              </p>
              {analysis.overallScore === 100 && (
                <button
                  onClick={() => triggerGrammar100Confetti()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  <PartyPopper className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Celebratory Confetti Effect</span>
                </button>
              )}
            </div>
          ) : (
            analysis.corrections.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-all"
              >
                {/* Tag */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {item.errorType.replace(/_/g, ' ')}
                  </span>
                  {onPracticeSentence && (
                    <button
                      onClick={() => onPracticeSentence(item.corrected)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      Practice Saying This <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Original vs Corrected */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-start gap-2 text-rose-400/90">
                    <span className="text-[10px] font-bold uppercase text-slate-500 pt-0.5">Incorrect:</span>
                    <span className="line-through decoration-rose-500 font-mono bg-rose-500/10 px-1.5 py-0.5 rounded">
                      {item.original}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-400">
                    <span className="text-[10px] font-bold uppercase text-slate-500 pt-0.5">Correct:</span>
                    <span className="font-semibold font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {item.corrected}
                    </span>
                  </div>
                </div>

                {/* English Explanation */}
                <p className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-slate-800/60">
                  {item.explanation}
                </p>

                {/* Tamil Explanation (தமிழ் விளக்கம்) */}
                {showTamil && item.tamilExplanation && (
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-200/90 text-xs leading-relaxed font-sans mt-2">
                    <span className="font-bold text-amber-400 block text-[11px] mb-0.5">
                      💡 தமிழ் விளக்கம் (Tamil Guide):
                    </span>
                    {item.tamilExplanation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Native Speaker Framing */}
      {activeTab === 'framing' && (
        <div className="space-y-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
              <Smile className="w-4 h-4" />
              <span>Casual & Friendly (Everyday Chat):</span>
            </div>
            <p className="text-xs text-slate-200 bg-slate-900 p-2.5 rounded-lg border border-slate-800 italic">
              "{analysis.betterFraming.casual}"
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              <Briefcase className="w-4 h-4" />
              <span>Professional & Polished (Workplace/Interview):</span>
            </div>
            <p className="text-xs text-slate-200 bg-slate-900 p-2.5 rounded-lg border border-slate-800 italic">
              "{analysis.betterFraming.professional}"
            </p>
          </div>

          {analysis.betterFraming.nativeIdiomOrPhrase && (
            <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs">
              <span className="font-bold text-violet-300 block text-[11px] mb-1">
                ✨ Native Idiom / Collocation:
              </span>
              <p className="text-slate-300 italic">"{analysis.betterFraming.nativeIdiomOrPhrase}"</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Vocabulary Boosters */}
      {activeTab === 'vocab' && (
        <div className="space-y-2.5">
          {analysis.vocabularyBoosters.map((vb, idx) => (
            <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 font-mono">{vb.word}</span>
                <span className="text-[10px] text-slate-400">Word Booster</span>
              </div>
              <p className="text-[11px] text-slate-300">{vb.meaning}</p>
              <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                Example: "{vb.example}"
              </p>
            </div>
          ))}

          {analysis.pronunciationTips && analysis.pronunciationTips.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 block">
                🎙 Pronunciation Note:
              </span>
              <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                {analysis.pronunciationTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
