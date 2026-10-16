import React, { useState } from 'react';
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
  Sparkles
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

  const toggleHint = (idx: number) => {
    setShowHint((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-10 font-sans">
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
          {deepDives.map((topic, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4 transition-colors duration-200"
            >
              <div>
                <h4 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
                    0{idx + 1}
                  </span>
                  {topic.title}
                </h4>
                {topic.subtitle && (
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 pl-8 font-serif italic">
                    {topic.subtitle}
                  </p>
                )}
              </div>

              {/* Text content */}
              <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-3 font-sans whitespace-pre-line pl-8 border-l-2 border-neutral-200 dark:border-neutral-800">
                {topic.content}
              </div>

              {/* Key Takeaways */}
              {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141824] border border-neutral-200/80 dark:border-neutral-800 space-y-2 mt-4 ml-8">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider font-sans">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Key Architectural Takeaways
                  </div>
                  <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    {topic.keyTakeaways.map((takeaway, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Failure Modes & Bottlenecks */}
      {bottlenecks.length > 0 && (
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
            {bottlenecks.map((item, idx) => (
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
      {interviewQA.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/50">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                System Design Interview Drill & Follow-up Questions
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Staff & Principal Level Follow-ups, Deep Dives, and Common Traps
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {interviewQA.map((item, idx) => {
              const isExpanded = expandedQA === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setExpandedQA(isExpanded ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 bg-neutral-50/70 dark:bg-[#131722]/70 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2.5 font-sans">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">Q0{idx + 1}:</span>
                      {item.question}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-5 space-y-4 border-t border-neutral-200/80 dark:border-neutral-800 text-xs sm:text-sm leading-relaxed">
                      {item.hint && (
                        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 gap-2">
                          <span className="text-amber-800 dark:text-amber-200 font-sans text-xs flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            Need a conceptual hint before reading the answer?
                          </span>
                          <button
                            onClick={() => toggleHint(idx)}
                            className="text-xs font-bold font-mono text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                          >
                            {showHint[idx] ? item.hint : 'Reveal Hint'}
                          </button>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141824] border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 space-y-1.5">
                        <span className="font-bold text-neutral-900 dark:text-white block text-xs uppercase tracking-wider font-sans flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          Staff Architect Model Response:
                        </span>
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
