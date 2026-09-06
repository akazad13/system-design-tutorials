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

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16 font-sans">
      {/* Breadcrumb Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A1A1A]/10 pb-4">
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#1A1A1A]/50">
          <span className="font-bold text-[#1A1A1A]">01 / Fundamentals</span>
          <span>•</span>
          <span>{topic.category}</span>
          <span className="text-[#1A1A1A]/60 flex items-center gap-1.5 font-mono ml-2">
            <Clock className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
            {topic.readTime}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleComplete && (
            <button
              onClick={onToggleComplete}
              className={`px-3 py-1.5 text-xs font-sans border flex items-center gap-1.5 transition-colors ${
                isCompleted
                  ? 'bg-[#166534] text-[#FDFCFB] border-[#166534]'
                  : 'bg-[#FFFFFF] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider">{isCompleted ? 'Completed' : 'Mark Done'}</span>
            </button>
          )}

          {onToggleBookmark && (
            <button
              onClick={onToggleBookmark}
              className={`px-3 py-1.5 text-xs font-sans border flex items-center gap-1.5 transition-colors ${
                isBookmarked
                  ? 'bg-[#1A1A1A] text-[#FDFCFB] border-[#1A1A1A]'
                  : 'bg-[#FFFFFF] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider">{isBookmarked ? 'Saved' : 'Save Module'}</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="px-3 py-1.5 text-xs font-sans bg-[#FFFFFF] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 flex items-center gap-1.5 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="text-[11px] uppercase tracking-wider">{isCopied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Title & Editorial Summary */}
      <div id="overview" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-[#1A1A1A] text-[#FDFCFB] font-bold">
            Core Building Block
          </span>
          <span className="text-[9px] px-2 py-0.5 bg-[#F9F7F2] text-[#1A1A1A]/70 border border-[#1A1A1A]/15 font-mono uppercase tracking-wider">
            {topic.category}
          </span>
          {isCompleted && (
            <span className="text-[9px] px-2 py-0.5 bg-[#F4F9F4] text-[#166534] border border-[#166534]/30 font-mono uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#166534]" /> Completed
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light italic tracking-tight text-[#1A1A1A] leading-tight">
          {topic.title}
        </h1>

        <p className="text-base sm:text-lg font-serif text-[#1A1A1A]/80 leading-relaxed max-w-4xl">
          {topic.summary}
        </p>
      </div>

      {/* Interactive Architectural Blueprint Visualizer */}
      {topic.diagram && (
        <section id="architecture" className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/70 font-sans flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#3E5C76]" />
              Interactive Architectural Blueprint & Data Flow
            </h3>
            <span className="text-[9px] font-mono uppercase text-[#1A1A1A]/40">Interactive Inspection</span>
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
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/70 font-sans border-b border-[#1A1A1A]/10 pb-2 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#3E5C76]" />
          Mechanisms & Principles Under the Hood ({topic.keyConcepts.length} Core Concepts)
        </h3>

        <div className="space-y-6">
          {topic.keyConcepts.map((concept, idx) => (
            <div
              key={idx}
              className="p-6 bg-[#FFFFFF] border border-[#1A1A1A]/10 space-y-4 shadow-sm hover:border-[#1A1A1A]/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-[#1A1A1A] text-[#FDFCFB] flex items-center justify-center text-[10px] font-mono font-bold">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h4 className="text-base font-bold font-serif text-[#1A1A1A]">
                  {concept.name}
                </h4>
              </div>

              <div className="text-sm text-[#1A1A1A]/80 leading-relaxed font-sans pl-8 whitespace-pre-line">
                {concept.explanation}
              </div>

              {/* Pros & Cons Grid */}
              {concept.prosAndCons && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 pt-2">
                  <div className="p-3.5 bg-[#F4F9F4] border border-[#166534]/20 text-xs text-[#166534] space-y-1.5">
                    <span className="font-bold font-mono text-[10px] uppercase flex items-center gap-1.5 text-[#166534]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                      Key Advantages
                    </span>
                    <ul className="space-y-1 pl-1">
                      {concept.prosAndCons.pros.map((p, pIdx) => (
                        <li key={pIdx} className="leading-relaxed flex items-start gap-1.5">
                          <span>•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 bg-[#FEF2F2] border border-[#991B1B]/20 text-xs text-[#991B1B] space-y-1.5">
                    <span className="font-bold font-mono text-[10px] uppercase flex items-center gap-1.5 text-[#991B1B]">
                      <XCircle className="w-3.5 h-3.5 text-[#991B1B]" />
                      Trade-offs & Constraints
                    </span>
                    <ul className="space-y-1 pl-1">
                      {concept.prosAndCons.cons.map((c, cIdx) => (
                        <li key={cIdx} className="leading-relaxed flex items-start gap-1.5">
                          <span>•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Code Snippet Box */}
              {concept.codeSnippet && (
                <div className="pl-8 pt-2">
                  <div className="bg-[#1A1A1A] text-[#FDFCFB] border border-[#1A1A1A] overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-2.5 px-4 bg-[#262626] border-b border-[#333333]">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-[#FDFCFB]/60" />
                        <span className="text-[10px] font-mono text-[#FDFCFB]/80 uppercase">
                          Production Implementation Snippet
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(concept.codeSnippet || '', idx)}
                        className="text-[11px] font-mono text-[#FDFCFB]/70 hover:text-[#FDFCFB] flex items-center gap-1.5 transition-colors"
                      >
                        {copiedSnippetIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSnippetIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-[#E5E5E5] bg-[#1A1A1A] overflow-x-auto leading-relaxed">
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
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/70 font-sans border-b border-[#1A1A1A]/10 pb-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#1D3557]" />
            Quick-Reference Cheat Sheet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topic.cheatSheet.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#F9F7F2] border border-[#1A1A1A]/10 flex items-start gap-3 shadow-xs"
              >
                <div className="w-5 h-5 rounded-full bg-[#1D3557]/10 text-[#1D3557] flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-[#1A1A1A]/85 leading-relaxed font-sans">
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
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#991B1B] font-sans border-b border-[#991B1B]/20 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#991B1B]" />
            Common Architectural Traps & Candidate Pitfalls
          </h3>
          <div className="space-y-2.5">
            {topic.commonMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#FEF2F2] border border-[#991B1B]/20 flex items-start gap-3 text-xs text-[#991B1B] leading-relaxed"
              >
                <XCircle className="w-4 h-4 text-[#991B1B] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase font-mono text-[10px] block mb-0.5">
                    Critical Mistake {idx + 1}:
                  </span>
                  <span className="font-sans text-[#991B1B]">{mistake}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Staff / Principal Engineer Interview Tips */}
      {topic.interviewTips && topic.interviewTips.length > 0 && (
        <section id="interview-tips" className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#92400E] font-sans border-b border-[#92400E]/20 pb-2 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-[#92400E]" />
            Staff / Principal Engineer Interview Drills & Tips
          </h3>
          <div className="space-y-2.5">
            {topic.interviewTips.map((tip, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#FFFBEB] border border-[#92400E]/20 flex items-start gap-3 text-xs text-[#92400E] leading-relaxed"
              >
                <Sparkles className="w-4 h-4 text-[#92400E] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase font-mono text-[10px] block mb-0.5">
                    Staff Engineer Pro-Tip {idx + 1}:
                  </span>
                  <span className="font-sans text-[#92400E]">{tip}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
