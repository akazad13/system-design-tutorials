import React from 'react';
import { CapacityEstimation } from '../types/system-design';
import { Calculator, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface CapacityEstimatorProps {
  estimation: CapacityEstimation;
}

export const CapacityEstimator: React.FC<CapacityEstimatorProps> = ({ estimation }) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#1A1A1A]/10 p-6 shadow-sm space-y-6 font-sans">
      <div className="flex items-center gap-2.5 border-b border-[#1A1A1A]/10 pb-3">
        <div className="p-1.5 bg-[#F9F7F2] text-[#1A1A1A] border border-[#1A1A1A]/10">
          <Calculator className="w-4 h-4 text-[#1A1A1A]" />
        </div>
        <h3 className="text-base font-bold font-serif text-[#1A1A1A]">
          Back-of-the-Envelope Capacity Estimations
        </h3>
      </div>

      {/* Assumptions */}
      {estimation.assumptions && estimation.assumptions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/50 font-sans">
            Baseline Assumptions & Throughput Parameters
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-[#1A1A1A]/80">
            {estimation.assumptions.map((assumption, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-[#F9F7F2] p-3 border border-[#1A1A1A]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed font-sans">{assumption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Calculated Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {estimation.metrics.map((metric, idx) => (
          <div
            key={idx}
            className="p-4 bg-[#FFFFFF] border border-[#1A1A1A]/15 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#1A1A1A]/40 transition-colors"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/50 block mb-1">
                {metric.label}
              </span>
              <span className="text-lg font-bold font-mono text-[#1A1A1A] block">
                {metric.value}
              </span>
            </div>

            <div className="pt-2.5 border-t border-[#1A1A1A]/10 space-y-1">
              {metric.formula && (
                <span className="text-[10px] font-mono text-[#92400E] block">
                  📐 {metric.formula}
                </span>
              )}
              {metric.description && (
                <span className="text-[11px] text-[#1A1A1A]/70 block leading-tight font-sans">
                  {metric.description}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Conclusion */}
      {estimation.conclusion && (
        <div className="flex items-start gap-2.5 p-4 bg-[#F4F9F4] border border-[#166534]/20 text-xs text-[#166534]">
          <TrendingUp className="w-4 h-4 text-[#166534] flex-shrink-0 mt-0.5" />
          <div className="font-sans leading-relaxed">
            <span className="font-bold text-[#166534]">Architectural Synthesis: </span>
            {estimation.conclusion}
          </div>
        </div>
      )}
    </div>
  );
};
