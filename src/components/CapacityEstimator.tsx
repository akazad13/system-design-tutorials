import React from 'react';
import { CapacityEstimation } from '../types/system-design';
import { Calculator, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface CapacityEstimatorProps {
  estimation: CapacityEstimation;
}

export const CapacityEstimator: React.FC<CapacityEstimatorProps> = ({ estimation }) => {
  return (
    <div className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6 font-sans transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Back-of-the-Envelope Capacity Calculations
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Throughput, Storage, Memory, and Network Bandwidth Sizing
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          {estimation.metrics.length} Target Metrics
        </span>
      </div>

      {/* Assumptions */}
      {estimation.assumptions && estimation.assumptions.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Baseline Traffic & Sizing Assumptions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {estimation.assumptions.map((assumption, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 bg-neutral-50/80 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed font-sans">{assumption}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculated Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {estimation.metrics.map((metric, idx) => (
          <div
            key={idx}
            className="p-4 bg-neutral-50/50 dark:bg-neutral-900/40 rounded-xl border border-neutral-200/80 dark:border-neutral-800/90 flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-all shadow-2xs group"
          >
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                {metric.label}
              </span>
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {metric.value}
              </span>
            </div>

            <div className="pt-2.5 border-t border-neutral-200/70 dark:border-neutral-800 space-y-1.5">
              {metric.formula && (
                <div className="inline-block px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] border border-indigo-200/60 dark:border-indigo-800/50">
                  📐 {metric.formula}
                </div>
              )}
              {metric.description && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug font-sans">
                  {metric.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Conclusion */}
      {estimation.conclusion && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">Architectural Synthesis: </span>
            {estimation.conclusion}
          </div>
        </div>
      )}
    </div>
  );
};
