import React, { useState } from 'react';
import { CapacityEstimation } from '../types/system-design';
import { 
  Calculator, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Copy, 
  Check, 
  Sliders, 
  Activity, 
  HardDrive, 
  Zap, 
  Wifi,
  RotateCcw
} from 'lucide-react';

interface CapacityEstimatorProps {
  estimation: CapacityEstimation;
}

export const CapacityEstimator: React.FC<CapacityEstimatorProps> = ({ estimation }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [isCopiedAll, setIsCopiedAll] = useState<boolean>(false);

  const handleCopyFormula = (formula: string, idx: number) => {
    navigator.clipboard.writeText(formula);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = () => {
    const text = [
      '# Back-of-the-Envelope Capacity Estimations',
      `\n## Assumptions:`,
      ...estimation.assumptions.map(a => `- ${a}`),
      `\n## Sizing Metrics (Scale: ${scaleFactor}x):`,
      ...estimation.metrics.map(m => `- ${m.label}: ${getScaledValue(m.value, scaleFactor)} (${m.formula ? `Formula: ${m.formula}` : ''})`),
      `\n## Architecture Synthesis:`,
      estimation.conclusion
    ].join('\n');

    navigator.clipboard.writeText(text);
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 2200);
  };

  // Helper to dynamically scale values based on scaleFactor
  const getScaledValue = (val: string, factor: number): string => {
    if (factor === 1) return val;

    // Matches numbers with potential units e.g. "116 / sec", "15 TB", "38 GB", "3,850 reads/sec"
    const match = val.match(/^([\d,.]+)\s*(.*)$/);
    if (!match) return val;

    const rawNum = parseFloat(match[1].replace(/,/g, ''));
    if (isNaN(rawNum)) return val;

    const scaledNum = rawNum * factor;
    const formattedNum = scaledNum >= 1000 
      ? Number(scaledNum.toFixed(1)).toLocaleString() 
      : Number(scaledNum.toFixed(1));

    return `${formattedNum} ${match[2]}`.trim();
  };

  const getMetricIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('qps') || l.includes('throughput') || l.includes('request')) {
      return <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
    if (l.includes('storage') || l.includes('disk') || l.includes('capacity')) {
      return <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    if (l.includes('cache') || l.includes('ram') || l.includes('memory')) {
      return <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (l.includes('bandwidth') || l.includes('network') || l.includes('transfer')) {
      return <Wifi className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
    return <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
  };

  return (
    <div className="bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 flex-shrink-0">
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
              Back-of-the-Envelope Capacity Estimations
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Throughput, Storage Retention, RAM Cache, and Bandwidth Formulas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy calculations to clipboard"
          >
            {isCopiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopiedAll ? 'Copied' : 'Copy Math'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Scale Simulator Toolbar */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50/80 dark:bg-[#141824]/80 border border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <div>
            <span className="text-xs font-bold text-neutral-900 dark:text-white block">
              Scale Multiplier Simulator
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Simulate metrics under hypergrowth or enterprise load
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { factor: 0.5, label: '0.5x MVP' },
            { factor: 1, label: '1x Baseline' },
            { factor: 2, label: '2x Growth' },
            { factor: 5, label: '5x Enterprise' },
            { factor: 10, label: '10x Global' },
          ].map((item) => (
            <button
              key={item.factor}
              onClick={() => setScaleFactor(item.factor)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                scaleFactor === item.factor
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {item.label}
            </button>
          ))}

          {scaleFactor !== 1 && (
            <button
              onClick={() => setScaleFactor(1)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors ml-1 cursor-pointer"
              title="Reset to 1x Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Assumptions */}
      {estimation.assumptions && estimation.assumptions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono">
              Production Baseline Assumptions
            </h4>
            <span className="text-[11px] font-mono text-neutral-400">
              {estimation.assumptions.length} Hypotheses
            </span>
          </div>
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
        {estimation.metrics.map((metric, idx) => {
          const scaledValue = getScaledValue(metric.value, scaleFactor);
          const isScaled = scaleFactor !== 1;

          return (
            <div
              key={idx}
              className={`p-4 bg-neutral-50/50 dark:bg-neutral-900/40 rounded-xl border flex flex-col justify-between space-y-3 transition-all shadow-2xs group ${
                isScaled 
                  ? 'border-indigo-300 dark:border-indigo-700/80 ring-1 ring-indigo-500/20' 
                  : 'border-neutral-200/80 dark:border-neutral-800/90 hover:border-indigo-300 dark:hover:border-indigo-700/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {metric.label}
                  </span>
                  <div className="p-1 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60">
                    {getMetricIcon(metric.label)}
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {scaledValue}
                  </span>
                  {isScaled && (
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      ({scaleFactor}x)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-neutral-200/70 dark:border-neutral-800 space-y-2">
                {metric.formula && (
                  <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50">
                    <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-300 truncate" title={metric.formula}>
                      📐 {metric.formula}
                    </span>
                    <button
                      onClick={() => handleCopyFormula(metric.formula || '', idx)}
                      className="p-1 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-200 rounded transition-colors flex-shrink-0 cursor-pointer"
                      title="Copy formula"
                    >
                      {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                {metric.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug font-sans">
                    {metric.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conclusion / Architectural Synthesis */}
      {estimation.conclusion && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">Architectural Capacity Synthesis: </span>
            {estimation.conclusion}
          </div>
        </div>
      )}
    </div>
  );
};
