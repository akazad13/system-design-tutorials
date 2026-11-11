import React, { useState, useMemo } from 'react';
import { DeepDiveTopic, BottleneckAndMitigation, InterviewQA } from '../types/system-design';
import { DEEP_DIVE_LABELS as L } from '../data/reading-guide';
import { GlossaryText } from './ReadingKit';
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
  Scale,
} from 'lucide-react';

interface DeepDiveViewerProps {
  deepDives: DeepDiveTopic[];
  bottlenecks?: BottleneckAndMitigation[];
  interviewQA?: InterviewQA[];
}

const BlockHeader: React.FC<{ icon: React.ReactNode; tone: string; title: string; intro: string; right?: React.ReactNode }> = ({
  icon,
  tone,
  title,
  intro,
  right,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-3">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl border ${tone}`}>{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{intro}</p>
      </div>
    </div>
    {right}
  </div>
);

export const DeepDiveViewer: React.FC<DeepDiveViewerProps> = ({ deepDives, bottlenecks = [], interviewQA = [] }) => {
  const [expandedQA, setExpandedQA] = useState<number | null>(0);
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [masteredQA, setMasteredQA] = useState<number[]>([]);
  // Answers start hidden: trying to recall first is how the knowledge sticks.
  const [isDrillMode, setIsDrillMode] = useState<boolean>(true);
  const [expandedDeepDives, setExpandedDeepDives] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [searchFilter, setSearchFilter] = useState<string>('');

  const toggleHint = (idx: number) => setShowHint((prev) => ({ ...prev, [idx]: !prev[idx] }));
  const toggleRevealAnswer = (idx: number) => setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  const toggleMastered = (idx: number) =>
    setMasteredQA((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));

  const allDeepDivesExpanded = deepDives.every((_, idx) => expandedDeepDives[idx] ?? true);
  const toggleExpandAllDeepDives = () => {
    const next: Record<number, boolean> = {};
    deepDives.forEach((_, idx) => {
      next[idx] = !allDeepDivesExpanded;
    });
    setExpandedDeepDives(next);
  };

  const q = searchFilter.trim().toLowerCase();

  // Keep each item's original index so per-item state survives filtering
  const filteredDeepDives = useMemo(
    () =>
      deepDives
        .map((d, idx) => ({ d, idx }))
        .filter(({ d }) => !q || d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)),
    [deepDives, q]
  );

  const filteredBottlenecks = useMemo(
    () =>
      bottlenecks.filter(
        (b) =>
          !q ||
          b.bottleneck.toLowerCase().includes(q) ||
          b.mitigation.toLowerCase().includes(q) ||
          b.impact.toLowerCase().includes(q)
      ),
    [bottlenecks, q]
  );

  const filteredQA = useMemo(
    () =>
      interviewQA
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => !q || item.question.toLowerCase().includes(q) || item.goodAnswer.toLowerCase().includes(q)),
    [interviewQA, q]
  );

  return (
    <div className="space-y-12 font-sans">
      {/* Filter & toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-50/80 dark:bg-[#121622]/80 border border-neutral-200/80 dark:border-neutral-800 rounded-xl">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={L.searchPlaceholder}
            aria-label={L.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {interviewQA.length > 0 && (
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDrillMode}
                onChange={() => setIsDrillMode(!isDrillMode)}
                className="accent-indigo-600 w-3.5 h-3.5"
              />
              {L.hideAnswers}
            </label>
          )}
          {deepDives.length > 0 && (
            <button
              onClick={toggleExpandAllDeepDives}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {allDeepDivesExpanded ? L.collapseAll : L.expandAll}
            </button>
          )}
        </div>
      </div>

      {/* Deep dives */}
      {filteredDeepDives.length > 0 && (
        <div className="space-y-6">
          <BlockHeader
            icon={<BookOpen className="w-4 h-4" />}
            tone="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/50"
            title={L.deepDivesTitle}
            intro={L.deepDivesIntro}
          />

          <div className="space-y-5">
            {filteredDeepDives.map(({ d: topic, idx }) => {
              const isExpanded = expandedDeepDives[idx] ?? true;
              return (
                <article
                  key={idx}
                  className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedDeepDives((prev) => ({ ...prev, [idx]: !isExpanded }))}
                    aria-expanded={isExpanded}
                    className="w-full flex items-start justify-between gap-3 text-left cursor-pointer group"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2.5 text-lg sm:text-xl font-semibold font-serif text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <span className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        {topic.title}
                      </span>
                      {topic.subtitle && (
                        <span className="block text-sm text-neutral-500 dark:text-neutral-400 mt-1 pl-[2.375rem]">
                          {topic.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="p-1 mt-1 rounded-lg text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isExpanded && (
                    <>
                      <div className="text-[1.0625rem] text-neutral-700 dark:text-neutral-300 leading-7 whitespace-pre-line sm:pl-[2.375rem] max-w-[80ch]">
                        <GlossaryText text={topic.content} />
                      </div>

                      {topic.tradeoffs && (
                        <div className="sm:ml-[2.375rem] rounded-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-[#141824] text-sm font-semibold text-neutral-900 dark:text-white">
                            <Scale className="w-4 h-4 text-indigo-500" />
                            {L.tradeoffTitle}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200/80 dark:divide-neutral-800">
                            {[
                              { name: topic.tradeoffs.optionA, pros: topic.tradeoffs.prosA },
                              { name: topic.tradeoffs.optionB, pros: topic.tradeoffs.prosB },
                            ].map((opt) => (
                              <div key={opt.name} className="p-4 space-y-2">
                                <h5 className="text-sm font-semibold text-neutral-900 dark:text-white">{opt.name}</h5>
                                <ul className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                                  {opt.pros.map((p) => (
                                    <li key={p} className="flex items-start gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                      <span>
                                        <GlossaryText text={p} />
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                          <p className="px-4 py-3 border-t border-neutral-200/80 dark:border-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 bg-indigo-50/50 dark:bg-indigo-950/20">
                            <span className="font-semibold">{L.decision}: </span>
                            <GlossaryText text={topic.tradeoffs.decision} />
                          </p>
                        </div>
                      )}

                      {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
                        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 space-y-2.5 sm:ml-[2.375rem]">
                          <h5 className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            {L.takeaways}
                          </h5>
                          <ul className="space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
                            {topic.keyTakeaways.map((takeaway, tIdx) => (
                              <li key={tIdx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed">
                                  <GlossaryText text={takeaway} />
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottlenecks */}
      {filteredBottlenecks.length > 0 && (
        <div className="space-y-6">
          <BlockHeader
            icon={<AlertOctagon className="w-4 h-4" />}
            tone="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50"
            title={L.bottlenecksTitle}
            intro={L.bottlenecksIntro}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBottlenecks.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-1" />
                  <h4 className="text-base font-semibold text-neutral-900 dark:text-white leading-snug">
                    <GlossaryText text={item.bottleneck} />
                  </h4>
                </div>
                <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-800/60 text-sm text-rose-900 dark:text-rose-200 leading-relaxed">
                  <span className="block font-semibold text-rose-700 dark:text-rose-300 mb-0.5">{L.impact}</span>
                  <GlossaryText text={item.impact} />
                </div>
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <span className="block font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">{L.mitigation}</span>
                  <GlossaryText text={item.mitigation} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice questions */}
      {filteredQA.length > 0 && (
        <div className="space-y-6">
          <BlockHeader
            icon={<HelpCircle className="w-4 h-4" />}
            tone="bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/50"
            title={L.questionsTitle}
            intro={L.questionsIntro}
            right={
              masteredQA.length > 0 ? (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  {masteredQA.length} / {interviewQA.length} {L.masteredCount}
                </span>
              ) : undefined
            }
          />

          <div className="space-y-3.5">
            {filteredQA.map(({ item, idx }) => {
              const isExpanded = expandedQA === idx;
              const isRevealed = !isDrillMode || revealedAnswers[idx];
              const isMastered = masteredQA.includes(idx);

              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-[#111420] border rounded-2xl shadow-sm overflow-hidden transition-colors ${
                    isMastered ? 'border-emerald-300/80 dark:border-emerald-700/60' : 'border-neutral-200/80 dark:border-neutral-800'
                  }`}
                >
                  <button
                    onClick={() => setExpandedQA(isExpanded ? null : idx)}
                    aria-expanded={isExpanded}
                    className="w-full text-left p-4 sm:p-5 bg-neutral-50/70 dark:bg-[#131722]/70 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 flex items-start justify-between gap-4 transition-colors cursor-pointer"
                  >
                    <span className="text-[1.0625rem] font-semibold text-neutral-900 dark:text-white flex items-start gap-2.5 leading-snug">
                      <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400 pt-px">Q{idx + 1}</span>
                      <span>{item.question}</span>
                    </span>
                    <span className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                      {isMastered && (
                        <span className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-5 space-y-4 border-t border-neutral-200/80 dark:border-neutral-800 text-[1.0625rem] leading-7">
                      {item.hint && (
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-sm text-amber-900 dark:text-amber-200">
                          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          {showHint[idx] ? (
                            <span>
                              <GlossaryText text={item.hint} />
                            </span>
                          ) : (
                            <>
                              <span>{L.hintPrompt}</span>
                              <button
                                onClick={() => toggleHint(idx)}
                                className="font-semibold text-amber-700 dark:text-amber-300 underline underline-offset-2 cursor-pointer"
                              >
                                {L.hint}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {!isRevealed ? (
                        <div className="p-6 text-center bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 space-y-3">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">{L.tryFirst}</p>
                          <button
                            onClick={() => toggleRevealAnswer(idx)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>{L.reveal}</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141824] border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                {L.modelAnswer}
                              </span>
                              <button
                                onClick={() => toggleMastered(idx)}
                                aria-pressed={isMastered}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                                  isMastered
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                <span>{isMastered ? L.masteredDone : L.mastered}</span>
                              </button>
                            </div>
                            <p className="text-neutral-700 dark:text-neutral-300 max-w-[80ch]">
                              <GlossaryText text={item.goodAnswer} />
                            </p>
                          </div>

                          {item.pitfalls && (
                            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 text-rose-900 dark:text-rose-200">
                              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-1.5" />
                              <div>
                                <span className="font-semibold text-sm text-rose-700 dark:text-rose-300 block">{L.pitfall}</span>
                                <span className="text-[1.0625rem]">
                                  <GlossaryText text={item.pitfalls} />
                                </span>
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
