import React, { useState, useMemo } from 'react';
import { DeepDiveTopic, BottleneckAndMitigation, InterviewQA } from '../types/system-design';
import { 
  BookOpen, 
  AlertOctagon, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  ShieldAlert,
  Sparkles,
  Search,
  Check,
  Eye,
  GraduationCap
} from 'lucide-react';

interface DeepDiveViewerProps {
  deepDives: DeepDiveTopic[];
  bottlenecks?: BottleneckAndMitigation[];
  interviewQA?: InterviewQA[];
}

export const DeepDiveViewer: React.FC<DeepDiveViewerProps> = ({
  deepDives,
  bottlenecks = [],
  interviewQA = []
}) => {
  const [expandedQA, setExpandedQA] = useState<number | null>(0);
  const [showHint, setShowHint] = useState<{ [key: number]: boolean }>({});
  const [revealedAnswers, setRevealedAnswers] = useState<{ [key: number]: boolean }>({});
  const [masteredQA, setMasteredQA] = useState<number[]>([]);
  const [isDrillMode, setIsDrillMode] = useState<boolean>(false);
  const [expandedDeepDives, setExpandedDeepDives] = useState<{ [key: number]: boolean }>({ 0: true, 1: true });
  const [searchFilter, setSearchFilter] = useState<string>('');

  const toggleHint = (idx: number) => {
    setShowHint((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleRevealAnswer = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleMastered = (idx: number) => {
    setMasteredQA((prev) => 
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleExpandAllDeepDives = () => {
    const allExpanded = deepDives.every((_, idx) => expandedDeepDives[idx]);
    const newState: { [key: number]: boolean } = {};
    deepDives.forEach((_, idx) => {
      newState[idx] = !allExpanded;
    });
    setExpandedDeepDives(newState);
  };

  const filteredDeepDives = useMemo(() => {
    if (!searchFilter) return deepDives;
    const q = searchFilter.toLowerCase();
    return deepDives.filter(
      (d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)
    );
  }, [deepDives, searchFilter]);

  const filteredBottlenecks = useMemo(() => {
    if (!searchFilter) return bottlenecks;
    const q = searchFilter.toLowerCase();
    return bottlenecks.filter(
      (b) => b.bottleneck.toLowerCase().includes(q) || b.mitigation.toLowerCase().includes(q) || b.impact.toLowerCase().includes(q)
    );
  }, [bottlenecks, searchFilter]);

  const filteredQA = useMemo(() => {
    if (!searchFilter) return interviewQA;
    const q = searchFilter.toLowerCase();
    return interviewQA.filter(
      (qa) => qa.question.toLowerCase().includes(q) || qa.goodAnswer.toLowerCase().includes(q)
    );
  }, [interviewQA, searchFilter]);

  return (
    <div className="space-y-10 font-sans">
      {/* Global Filter & Quick Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-50/80 dark:bg-[#121622]/80 border border-neutral-200/80 dark:border-neutral-800 rounded-xl">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search deep dives, failure modes, or Q&A..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {interviewQA.length > 0 && (
            <button
              onClick={() => setIsDrillMode(!isDrillMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDrillMode 
                  ? 'bg-indigo-600 text-white shadow-2xs' 
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{isDrillMode ? 'Drill Mode Active' : 'Self-Test Drill Mode'}</span>
            </button>
          )}

          <button
            onClick={toggleExpandAllDeepDives}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Toggle Collapse
          </button>
        </div>
      </div>

      {/* Deep Dives Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Technical Deep Dives & Architectural Trade-offs
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Core Mechanisms, Scalability Bottlenecks, and Edge-Case Hardening
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {filteredDeepDives.map((topic, idx) => {
            const isExpanded = expandedDeepDives[idx] ?? true;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 transition-colors duration-200"
              >
                <div 
                  onClick={() => setExpandedDeepDives((prev) => ({ ...prev, [idx]: !isExpanded }))}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
                        0{idx + 1}
                      </span>
                      <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {topic.title}
                      </span>
                    </h4>
                    {topic.subtitle && (
                      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 pl-8 font-serif italic">
                        {topic.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="p-1 rounded-lg text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <>
                    {/* Text content */}
                    <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-3 font-sans whitespace-pre-line pl-4 sm:pl-8 border-l-2 border-indigo-500/50 dark:border-indigo-400/50">
                      {topic.content}
                    </div>

                    {/* Key Takeaways */}
                    {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141824] border border-neutral-200/80 dark:border-neutral-800 space-y-2.5 mt-4 sm:ml-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-sans">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Key Architectural Takeaways
                        </div>
                        <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                          {topic.keyTakeaways.map((takeaway, tIdx) => (
                            <li key={tIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure Modes & Bottlenecks */}
      {filteredBottlenecks.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Failure Modes, Bottlenecks & Edge Cases
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                How Production Systems Break and Battle-Tested Mitigations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBottlenecks.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 space-y-3 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white leading-snug">
                    {item.bottleneck}
                  </h4>
                </div>

                <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                  <span className="font-bold text-rose-700 dark:text-rose-300">Failure Impact: </span>
                  {item.impact}
                </div>

                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">Mitigation Strategy: </span>
                  {item.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Interview Q&A Drill */}
      {filteredQA.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/50">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  System Design Interview Drill & Follow-up Questions
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Staff & Principal Level Follow-ups, Deep Dives, and Trap Avoidance
                </p>
              </div>
            </div>

            {masteredQA.length > 0 && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {masteredQA.length} / {interviewQA.length} Drills Mastered
              </span>
            )}
          </div>

          <div className="space-y-3.5">
            {filteredQA.map((item, idx) => {
              const isExpanded = expandedQA === idx;
              const isRevealed = !isDrillMode || revealedAnswers[idx];
              const isMastered = masteredQA.includes(idx);

              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-[#111420] border rounded-2xl shadow-sm overflow-hidden transition-colors ${
                    isMastered 
                      ? 'border-emerald-300/80 dark:border-emerald-700/60' 
                      : 'border-neutral-200/80 dark:border-neutral-800'
                  }`}
                >
                  <button
                    onClick={() => setExpandedQA(isExpanded ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 bg-neutral-50/70 dark:bg-[#131722]/70 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2.5 font-sans">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">Q0{idx + 1}:</span>
                      {item.question}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isMastered && (
                        <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 space-y-4 border-t border-neutral-200/80 dark:border-neutral-800 text-xs sm:text-sm leading-relaxed">
                      {item.hint && (
                        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 gap-2">
                          <span className="text-amber-800 dark:text-amber-200 font-sans text-xs flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            Need a hint before formulating your answer?
                          </span>
                          <button
                            onClick={() => toggleHint(idx)}
                            className="text-xs font-bold font-mono text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                          >
                            {showHint[idx] ? item.hint : 'Reveal Hint'}
                          </button>
                        </div>
                      )}

                      {/* Drill Mode Reveal Button */}
                      {!isRevealed ? (
                        <div className="p-6 text-center bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 space-y-3">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 block font-mono">
                            Formulate your staff-level answer out loud or in notes first!
                          </span>
                          <button
                            onClick={() => toggleRevealAnswer(idx)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Reveal Staff Architect Model Answer</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141824] border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-900 dark:text-white block text-xs uppercase tracking-wider font-sans flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                Staff Architect Model Response:
                              </span>
                              <button
                                onClick={() => toggleMastered(idx)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 border transition-colors cursor-pointer ${
                                  isMastered
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isMastered ? 'Mastered' : 'Mark Mastered'}</span>
                              </button>
                            </div>
                            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs sm:text-sm font-sans">
                              {item.goodAnswer}
                            </p>
                          </div>

                          {item.pitfalls && (
                            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 text-rose-900 dark:text-rose-200">
                              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider font-sans text-xs block mb-0.5">
                                  Common Pitfall to Avoid:
                                </span>
                                <span className="text-xs sm:text-sm font-sans">{item.pitfalls}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
