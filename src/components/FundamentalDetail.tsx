import React, { useState } from 'react';
import { FundamentalTopic } from '../types/system-design';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { 
  BookOpen, 
  Layers, 
  Terminal, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Bookmark, 
  Share2, 
  Sparkles,
  FileText
} from 'lucide-react';

interface FundamentalDetailProps {
  topic: FundamentalTopic;
  isBookmarked?: boolean;
  isCompleted?: boolean;
  onToggleBookmark?: () => void;
  onToggleComplete?: () => void;
}

export const FundamentalDetail: React.FC<FundamentalDetailProps> = ({ 
  topic,
  isBookmarked = false,
  isCompleted = false,
  onToggleBookmark,
  onToggleComplete
}) => {
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetIndex(idx);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16 font-sans">
      {/* Breadcrumb Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <span className="font-bold text-neutral-900 dark:text-white">01 / Fundamentals</span>
          <span>•</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{topic.category}</span>
          <span className="flex items-center gap-1.5 font-mono ml-2">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            {topic.readTime}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleComplete && (
            <button
              onClick={onToggleComplete}
              className={`px-3 py-1.5 text-xs font-sans rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{isCompleted ? 'Completed' : 'Mark Done'}</span>
            </button>
          )}

          {onToggleBookmark && (
            <button
              onClick={onToggleBookmark}
              className={`px-3 py-1.5 text-xs font-sans rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
              <span className="text-xs font-semibold">{isBookmarked ? 'Saved' : 'Save Module'}</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="px-3 py-1.5 text-xs font-sans rounded-xl bg-white dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="text-xs font-semibold">{isCopied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Title & Editorial Summary */}
      <div id="overview" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-mono uppercase tracking-wider rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 font-bold">
            Core Building Block
          </span>
          <span className="text-xs px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-md font-mono uppercase tracking-wider">
            {topic.category}
          </span>
          {isCompleted && (
            <span className="text-xs px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-md font-mono uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Completed
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light text-neutral-900 dark:text-white tracking-tight leading-tight">
          {topic.title}
        </h1>

        <p className="text-base sm:text-lg font-serif text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-4xl">
          {topic.summary}
        </p>

        {/* Quick jump pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          <span className="text-[10px] font-mono uppercase text-neutral-400 mr-1">Section Jump:</span>
          {topic.diagram && (
            <button
              onClick={() => scrollTo('architecture')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-mono transition-colors cursor-pointer"
            >
              #Schematic
            </button>
          )}
          <button
            onClick={() => scrollTo('concepts')}
            className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-mono transition-colors cursor-pointer"
          >
            #Core Concepts
          </button>
          {topic.cheatSheet?.length > 0 && (
            <button
              onClick={() => scrollTo('cheatsheet')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-mono transition-colors cursor-pointer"
            >
              #Cheat Sheet
            </button>
          )}
          {topic.commonMistakes?.length > 0 && (
            <button
              onClick={() => scrollTo('pitfalls')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-mono transition-colors cursor-pointer"
            >
              #Pitfalls
            </button>
          )}
          {topic.interviewTips?.length > 0 && (
            <button
              onClick={() => scrollTo('interview-tips')}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-mono transition-colors cursor-pointer"
            >
              #Interview Tips
            </button>
          )}
        </div>
      </div>

      {/* Interactive Architectural Blueprint Visualizer */}
      {topic.diagram && (
        <section id="architecture" className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-sans flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Interactive Architectural Blueprint & Data Flow
            </h3>
            <span className="text-[11px] font-mono uppercase text-neutral-400">Interactive Inspection</span>
          </div>
          <ArchitectureCanvas
            nodes={topic.diagram.nodes}
            edges={topic.diagram.edges}
            flowSteps={topic.diagram.flowSteps}
            title={topic.title}
          />
        </section>
      )}

      {/* Core Mechanisms & Principles Under the Hood */}
      <section id="concepts" className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-sans border-b border-neutral-200/80 dark:border-neutral-800 pb-2 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          Mechanisms & Principles Under the Hood ({topic.keyConcepts.length} Core Concepts)
        </h3>

        <div className="space-y-6">
          {topic.keyConcepts.map((concept, idx) => (
            <div
              key={idx}
              className="p-6 bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-4 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h4 className="text-base sm:text-lg font-bold font-serif text-neutral-900 dark:text-white">
                  {concept.name}
                </h4>
              </div>

              <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans pl-10 whitespace-pre-line">
                {concept.explanation}
              </div>

              {/* Pros & Cons Grid */}
              {concept.prosAndCons && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10 pt-2">
                  <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                    <span className="font-bold font-mono text-[11px] uppercase flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Key Advantages
                    </span>
                    <ul className="space-y-1.5 pl-1">
                      {concept.prosAndCons.pros.map((p, pIdx) => (
                        <li key={pIdx} className="leading-relaxed flex items-start gap-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 space-y-2">
                    <span className="font-bold font-mono text-[11px] uppercase flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Trade-offs & Constraints
                    </span>
                    <ul className="space-y-1.5 pl-1">
                      {concept.prosAndCons.cons.map((c, cIdx) => (
                        <li key={cIdx} className="leading-relaxed flex items-start gap-1.5">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Code Snippet Box */}
              {concept.codeSnippet && (
                <div className="pl-10 pt-2">
                  <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-sm bg-neutral-950 dark:bg-[#0A0C12]">
                    <div className="flex items-center justify-between p-2.5 px-4 bg-neutral-900 dark:bg-neutral-900/80 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-[11px] font-mono text-neutral-300 uppercase">
                          Production Implementation Snippet
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(concept.codeSnippet || '', idx)}
                        className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedSnippetIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSnippetIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-neutral-200 bg-neutral-950 dark:bg-[#0A0C12] overflow-x-auto leading-relaxed">
                      {concept.codeSnippet}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Quick-Reference Cheatsheet */}
      {topic.cheatSheet && topic.cheatSheet.length > 0 && (
        <section id="cheatsheet" className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-sans border-b border-neutral-200/80 dark:border-neutral-800 pb-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            Quick-Reference Cheat Sheet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topic.cheatSheet.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 flex items-start gap-3 shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Common Pitfalls & Mistakes */}
      {topic.commonMistakes && topic.commonMistakes.length > 0 && (
        <section id="pitfalls" className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-sans border-b border-rose-200 dark:border-rose-900/40 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Common Architectural Traps & Candidate Pitfalls
          </h3>
          <div className="space-y-2.5">
            {topic.commonMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 flex items-start gap-3 text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed"
              >
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase font-mono text-[11px] block mb-0.5 text-rose-700 dark:text-rose-300">
                    Critical Mistake {idx + 1}:
                  </span>
                  <span className="font-sans">{mistake}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Staff / Principal Engineer Interview Tips */}
      {topic.interviewTips && topic.interviewTips.length > 0 && (
        <section id="interview-tips" className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-sans border-b border-amber-200 dark:border-amber-900/40 pb-2 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Staff / Principal Engineer Interview Drills & Tips
          </h3>
          <div className="space-y-2.5">
            {topic.interviewTips.map((tip, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed"
              >
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase font-mono text-[11px] block mb-0.5 text-amber-700 dark:text-amber-300">
                    Staff Engineer Pro-Tip {idx + 1}:
                  </span>
                  <span className="font-sans">{tip}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
