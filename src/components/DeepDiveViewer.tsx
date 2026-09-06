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
  Terminal
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
        <div className="flex items-center gap-2.5 border-b border-[#1A1A1A]/10 pb-3">
          <BookOpen className="w-4 h-4 text-[#1A1A1A]" />
          <h3 className="text-base font-bold font-serif text-[#1A1A1A]">
            Technical Deep Dives & Architectural Trade-offs
          </h3>
        </div>

        <div className="space-y-6">
          {deepDives.map((topic, idx) => (
            <div
              key={idx}
              className="bg-[#FFFFFF] border border-[#1A1A1A]/10 p-6 shadow-sm space-y-4"
            >
              <div>
                <h4 className="text-base font-bold font-serif text-[#1A1A1A] flex items-center gap-2.5">
                  <span className="w-5 h-5 bg-[#1A1A1A] text-[#FDFCFB] flex items-center justify-center text-[10px] font-mono font-bold">
                    0{idx + 1}
                  </span>
                  {topic.title}
                </h4>
                {topic.subtitle && (
                  <p className="text-xs text-[#1A1A1A]/60 mt-1 pl-7 font-serif italic">
                    {topic.subtitle}
                  </p>
                )}
              </div>

              {/* Text content with custom markdown rendering */}
              <div className="text-sm text-[#1A1A1A]/80 leading-relaxed space-y-3 font-sans whitespace-pre-line pl-7 border-l border-[#1A1A1A]/10">
                {topic.content}
              </div>

              {/* Key Takeaways */}
              {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
                <div className="p-4 bg-[#F9F7F2] border border-[#1A1A1A]/10 space-y-2 mt-4 ml-7">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em] font-sans">
                    <Lightbulb className="w-3.5 h-3.5 text-[#92400E]" />
                    Key Architectural Principles
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#1A1A1A]/80">
                    {topic.keyTakeaways.map((takeaway, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] flex-shrink-0 mt-0.5" />
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
          <div className="flex items-center gap-2.5 border-b border-[#1A1A1A]/10 pb-3">
            <AlertOctagon className="w-4 h-4 text-[#991B1B]" />
            <h3 className="text-base font-bold font-serif text-[#1A1A1A]">
              Failure Modes, Bottlenecks & Edge Cases
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bottlenecks.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#FFFFFF] border border-[#1A1A1A]/10 p-5 space-y-3 shadow-sm hover:border-[#1A1A1A]/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#991B1B] flex-shrink-0 mt-0.5" />
                  <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-[#1A1A1A] leading-snug">
                    {item.bottleneck}
                  </h4>
                </div>

                <div className="p-3 bg-[#FEF2F2] border border-[#991B1B]/20 text-xs text-[#991B1B] leading-relaxed">
                  <span className="font-bold">Failure Impact: </span>
                  {item.impact}
                </div>

                <div className="p-3 bg-[#F4F9F4] border border-[#166534]/20 text-xs text-[#166534] leading-relaxed">
                  <span className="font-bold">Mitigation Strategy: </span>
                  {item.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Interview Q&A */}
      {interviewQA.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 border-b border-[#1A1A1A]/10 pb-3">
            <HelpCircle className="w-4 h-4 text-[#1D3557]" />
            <h3 className="text-base font-bold font-serif text-[#1A1A1A]">
              System Design Interview Drill & Follow-up Questions
            </h3>
          </div>

          <div className="space-y-3">
            {interviewQA.map((item, idx) => {
              const isExpanded = expandedQA === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#FFFFFF] border border-[#1A1A1A]/10 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedQA(isExpanded ? null : idx)}
                    className="w-full text-left p-4 bg-[#F9F7F2] hover:bg-[#F0EEE6] flex items-center justify-between gap-4 transition-colors"
                  >
                    <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2.5 font-sans">
                      <span className="font-mono text-[#92400E]">Q0{idx + 1}:</span>
                      {item.question}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#1A1A1A]/60 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#1A1A1A]/60 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-5 space-y-4 border-t border-[#1A1A1A]/10 text-xs leading-relaxed">
                      {item.hint && (
                        <div className="flex items-center justify-between p-3 bg-[#FDFCFB] border border-[#1A1A1A]/10">
                          <span className="text-[#1A1A1A]/70 font-sans">
                            💡 Need a conceptual hint before reading the answer?
                          </span>
                          <button
                            onClick={() => toggleHint(idx)}
                            className="text-xs font-bold font-mono text-[#92400E] hover:underline"
                          >
                            {showHint[idx] ? item.hint : 'Reveal Hint'}
                          </button>
                        </div>
                      )}

                      <div className="p-4 bg-[#F9F7F2] border border-[#1A1A1A]/10 text-[#1A1A1A] space-y-1.5">
                        <span className="font-bold text-[#1A1A1A] block text-[10px] uppercase tracking-[0.15em] font-sans">
                          Architect Model Response:
                        </span>
                        <p className="text-[#1A1A1A]/80 leading-relaxed text-xs font-sans">
                          {item.goodAnswer}
                        </p>
                      </div>

                      {item.pitfalls && (
                        <div className="flex items-start gap-2.5 p-4 bg-[#FEF2F2] border border-[#991B1B]/20 text-[#991B1B]">
                          <XCircle className="w-4 h-4 text-[#991B1B] flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#991B1B] uppercase tracking-wider font-sans text-[10px] block mb-0.5">
                              Common Pitfall to Avoid:
                            </span>
                            <span className="text-xs font-sans">{item.pitfalls}</span>
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
