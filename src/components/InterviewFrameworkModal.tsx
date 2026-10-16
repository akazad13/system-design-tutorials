import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lightbulb, 
  Clock, 
  Target, 
  Layers, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  Compass, 
  Calculator,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface InterviewFrameworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterviewFrameworkModal: React.FC<InterviewFrameworkModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'numbers' | 'cheat_formulas' | 'calculator'>('steps');

  // Interactive Calculator State
  const [dauMillions, setDauMillions] = useState<number>(100);
  const [readsPerUser, setReadsPerUser] = useState<number>(10);
  const [writesPerUser, setWritesPerUser] = useState<number>(1);
  const [recordSizeBytes, setRecordSizeBytes] = useState<number>(500);

  // Math derivations
  const totalDailyReads = dauMillions * 1_000_000 * readsPerUser;
  const totalDailyWrites = dauMillions * 1_000_000 * writesPerUser;
  const avgReadQps = Math.round(totalDailyReads / 86400);
  const avgWriteQps = Math.round(totalDailyWrites / 86400);
  const peakReadQps = Math.round(avgReadQps * 3);
  const peakWriteQps = Math.round(avgWriteQps * 3);
  
  const dailyStorageBytes = totalDailyWrites * recordSizeBytes;
  const dailyStorageGB = (dailyStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const fiveYearStorageTB = ((dailyStorageBytes * 365 * 5) / (1024 * 1024 * 1024 * 1024)).toFixed(2);
  
  // 20% of daily read data cached in RAM (80/20 Pareto)
  const cacheRamGB = ((totalDailyReads * 0.20 * recordSizeBytes) / (1024 * 1024 * 1024)).toFixed(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 dark:bg-black/75 backdrop-blur-sm font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#111420] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 bg-neutral-50/80 dark:bg-[#131722]/80 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-serif text-neutral-900 dark:text-white">
                System Design Interview Master Blueprint
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                The 4-Step Strategy, Latency Numbers & Live Capacity Calculator Every Engineer Must Master
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex border-b border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#111420] px-4 sm:px-6 gap-4 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'steps'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>4-Step Framework (45 min)</span>
          </button>

          <button
            onClick={() => setActiveTab('numbers')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'numbers'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Latency Numbers Every Engineer Must Know</span>
          </button>

          <button
            onClick={() => setActiveTab('cheat_formulas')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cheat_formulas'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Capacity Math Cheatsheet</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'calculator'
                ? 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive Capacity Calculator</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed">
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-neutral-900 dark:bg-indigo-600 text-white font-mono font-bold text-[10px] rounded uppercase tracking-wider">
                      Step 1 (0 - 5 min)
                    </span>
                    <span className="text-neutral-400 font-mono text-xs">~5 mins</span>
                  </div>
                  <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                    Clarify Scope & Define Requirements
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-xs font-sans">
                    Never jump into drawing boxes immediately! Ask clarifying questions to narrow down the problem boundary.
                  </p>
                  <ul className="space-y-1.5 text-neutral-700 dark:text-neutral-300 pt-1 font-sans text-xs">
                    <li>• <strong className="text-neutral-900 dark:text-white">Functional:</strong> List 3-4 primary user stories (e.g. Upload video, watch video).</li>
                    <li>• <strong className="text-neutral-900 dark:text-white">Non-Functional:</strong> High Availability (99.99%), Low Latency (&lt;200ms), Strong vs Eventual Consistency.</li>
                    <li>• <strong className="text-neutral-900 dark:text-white">Out of Scope:</strong> Explicitly state features you will ignore.</li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-neutral-900 dark:bg-indigo-600 text-white font-mono font-bold text-[10px] rounded uppercase tracking-wider">
                      Step 2 (5 - 10 min)
                    </span>
                    <span className="text-neutral-400 font-mono text-xs">~5 mins</span>
                  </div>
                  <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                    Back-of-the-Envelope Capacity Estimations
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-xs font-sans">
                    Size the system scale to guide database, partitioning, and caching choices.
                  </p>
                  <ul className="space-y-1.5 text-neutral-700 dark:text-neutral-300 pt-1 font-sans text-xs">
                    <li>• <strong className="text-neutral-900 dark:text-white">Traffic (QPS):</strong> DAU * Actions / 86,400s (e.g. 500M * 2 / 86,400 ≈ 12,000 QPS).</li>
                    <li>• <strong className="text-neutral-900 dark:text-white">Storage:</strong> Daily Writes * Payload Size * 365 Days * 5 Years.</li>
                    <li>• <strong className="text-neutral-900 dark:text-white">Bandwidth:</strong> Ingress and Egress network throughput in MB/s or GB/s.</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-neutral-900 dark:bg-indigo-600 text-white font-mono font-bold text-[10px] rounded uppercase tracking-wider">
                      Step 3 (10 - 25 min)
                    </span>
                    <span className="text-neutral-400 font-mono text-xs">~15 mins</span>
                  </div>
                  <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                    High-Level Design & Core Data Flow
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-xs font-sans">
                    Lay out the fundamental components and trace the end-to-end user request path.
                  </p>
                  <ul className="space-y-1.5 text-neutral-700 dark:text-neutral-300 pt-1 font-sans text-xs">
                    <li>• <strong className="text-neutral-900 dark:text-white">API Contract:</strong> Define 2-3 core REST/gRPC endpoints.</li>
                    <li>• <strong className="text-neutral-900 dark:text-white">Database Schema:</strong> SQL vs NoSQL selection with partition keys.</li>
                    <li>• <strong className="text-neutral-900 dark:text-white">Architecture Diagram:</strong> Client → CDN → LB → Gateway → App Services → DB & Caches.</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-neutral-900 dark:bg-indigo-600 text-white font-mono font-bold text-[10px] rounded uppercase tracking-wider">
                      Step 4 (25 - 45 min)
                    </span>
                    <span className="text-neutral-400 font-mono text-xs">~20 mins</span>
                  </div>
                  <h3 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                    Deep Dive & Bottleneck Mitigations
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-xs font-sans">
                    Collaborate with the interviewer on hard engineering challenges and failure modes.
                  </p>
                  <ul className="space-y-1.5 text-neutral-700 dark:text-neutral-300 pt-1 font-sans text-xs">
                    <li>• <strong className="text-neutral-900 dark:text-white">Hot Spots:</strong> Celebrity fan-out (Justin Bieber problem), cache thundering herds.</li>
                    <li>• <strong className="text-neutral-900 dark:text-white">Fault Tolerance:</strong> Circuit breakers, master-slave failover, idempotent retries.</li>
                    <li>• <strong className="text-neutral-900 dark:text-white">Data Consistency:</strong> Distributed transactions (Saga / 2PC), vector clocks, CDC.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'numbers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-bold text-neutral-900 dark:text-white">Jeff Dean & Peter Norvig Benchmark Latencies: </span>
                These numbers determine whether an architecture needs RAM caching, SSD indexing, or CDN edge distribution.
              </div>
              <div className="overflow-x-auto border border-neutral-200/80 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#111420]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/80 dark:bg-[#131722]/80 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-mono uppercase text-[10px] tracking-wider">
                      <th className="p-3 pl-4">Operation</th>
                      <th className="p-3">Human Equivalent (1s = 1 GHz)</th>
                      <th className="p-3 pr-4">Actual Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800 font-mono text-neutral-800 dark:text-neutral-200">
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-emerald-600 dark:text-emerald-400 font-bold">L1 Cache Reference</td>
                      <td className="p-3 text-neutral-500">0.5 seconds</td>
                      <td className="p-3 pr-4 font-bold text-emerald-600 dark:text-emerald-400">0.5 ns</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-emerald-600 dark:text-emerald-400 font-bold">L2 Cache Reference</td>
                      <td className="p-3 text-neutral-500">7 seconds</td>
                      <td className="p-3 pr-4 font-bold text-emerald-600 dark:text-emerald-400">7 ns</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-sky-600 dark:text-sky-400 font-bold">Main Memory (RAM) Reference</td>
                      <td className="p-3 text-neutral-500">1.5 minutes</td>
                      <td className="p-3 pr-4 font-bold text-sky-600 dark:text-sky-400">100 ns</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-sky-600 dark:text-sky-400 font-bold">Read 1 MB sequentially from RAM</td>
                      <td className="p-3 text-neutral-500">4 days</td>
                      <td className="p-3 pr-4 font-bold text-sky-600 dark:text-sky-400">250 µs</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-emerald-600 dark:text-emerald-400 font-bold">NVMe SSD Random Read (Modern PCIe)</td>
                      <td className="p-3 text-neutral-500">5.5 hours</td>
                      <td className="p-3 pr-4 font-bold text-emerald-600 dark:text-emerald-400">10 - 30 µs</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-amber-600 dark:text-amber-400 font-bold">SATA SSD Random Read (Legacy)</td>
                      <td className="p-3 text-neutral-500">1.7 days</td>
                      <td className="p-3 pr-4 font-bold text-amber-600 dark:text-amber-400">100 - 150 µs</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-amber-600 dark:text-amber-400 font-bold">Read 1 MB sequentially from SSD</td>
                      <td className="p-3 text-neutral-500">11.6 days</td>
                      <td className="p-3 pr-4 font-bold text-amber-600 dark:text-amber-400">1,000 µs (1 ms)</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-rose-600 dark:text-rose-400 font-bold">Rotational Hard Disk Seek (HDD)</td>
                      <td className="p-3 text-neutral-500">3.8 months</td>
                      <td className="p-3 pr-4 font-bold text-rose-600 dark:text-rose-400">10,000 µs (10 ms)</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-sky-600 dark:text-sky-400 font-bold">Same Datacenter Roundtrip (LAN)</td>
                      <td className="p-3 text-neutral-500">6 days</td>
                      <td className="p-3 pr-4 font-bold text-sky-600 dark:text-sky-400">500 µs (0.5 ms)</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-rose-600 dark:text-rose-400 font-bold">Cross-Continent WAN Roundtrip (CA to NY)</td>
                      <td className="p-3 text-neutral-500">2.1 years</td>
                      <td className="p-3 pr-4 font-bold text-rose-600 dark:text-rose-400">65 ms</td>
                    </tr>
                    <tr className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                      <td className="p-3 pl-4 text-rose-600 dark:text-rose-400 font-bold">Transatlantic Roundtrip (CA to Europe)</td>
                      <td className="p-3 text-neutral-500">4.8 years</td>
                      <td className="p-3 pr-4 font-bold text-rose-600 dark:text-rose-400">150 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cheat_formulas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
                  <h4 className="text-sm font-bold font-serif text-neutral-900 dark:text-white">
                    Time & QPS Mental Math
                  </h4>
                  <div className="space-y-2 text-neutral-700 dark:text-neutral-300 font-mono text-xs">
                    <p>• 1 Day = 86,400 seconds ≈ <strong className="text-emerald-600 dark:text-emerald-400">100,000 seconds (10^5)</strong></p>
                    <p>• 1 Million requests/day ≈ <strong className="text-emerald-600 dark:text-emerald-400">12 QPS</strong></p>
                    <p>• 100 Million requests/day ≈ <strong className="text-emerald-600 dark:text-emerald-400">1,200 QPS</strong></p>
                    <p>• Peak QPS ≈ <strong className="text-amber-600 dark:text-amber-400">2x to 5x</strong> Average QPS</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
                  <h4 className="text-sm font-bold font-serif text-neutral-900 dark:text-white">
                    Storage Math & Scale Rules
                  </h4>
                  <div className="space-y-2 text-neutral-700 dark:text-neutral-300 font-mono text-xs">
                    <p>• 1 Byte = 8 bits | 1 KB = 10^3 B | 1 MB = 10^6 B</p>
                    <p>• 1 GB = 10^9 B | 1 TB = 10^12 B | 1 PB = 10^15 B</p>
                    <p>• 80-20 Rule: <strong className="text-emerald-600 dark:text-emerald-400">20% of data generates 80% of reads</strong> (Cache 20% in RAM!)</p>
                    <p>• 1 TB RAM costs ~$5,000/yr | 1 TB SSD costs ~$50/yr</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <span className="font-bold uppercase font-mono text-[11px] block mb-1 text-emerald-700 dark:text-emerald-300">
                  Interview Sizing Rule of Thumb:
                </span>
                "If QPS &lt; 1,000, a single standard SQL instance (Postgres/MySQL) handles the workload. If QPS &gt; 10,000 or Storage &gt; 10TB, introduce Redis caching, read replicas, or horizontal sharding."
              </div>
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800">
                <h4 className="text-sm font-bold font-serif text-neutral-900 dark:text-white mb-1">
                  Interactive System Sizing Calculator
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-sans">
                  Adjust scale parameters to instantly compute QPS, network throughput, disk storage, and RAM cache sizing.
                </p>
              </div>

              {/* Sliders / Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-neutral-200 dark:border-neutral-800 space-y-1.5 shadow-2xs">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-bold">
                    Daily Active Users (DAU)
                  </label>
                  <div className="flex items-center gap-1.5 font-mono">
                    <input
                      type="number"
                      min={1}
                      max={2000}
                      value={dauMillions}
                      onChange={(e) => setDauMillions(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-neutral-500 font-bold">Million</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-neutral-200 dark:border-neutral-800 space-y-1.5 shadow-2xs">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-bold">
                    Reads / User / Day
                  </label>
                  <div className="flex items-center gap-1.5 font-mono">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={readsPerUser}
                      onChange={(e) => setReadsPerUser(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-neutral-500 font-bold">Reads</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-neutral-200 dark:border-neutral-800 space-y-1.5 shadow-2xs">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-bold">
                    Writes / User / Day
                  </label>
                  <div className="flex items-center gap-1.5 font-mono">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={writesPerUser}
                      onChange={(e) => setWritesPerUser(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-neutral-500 font-bold">Writes</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-neutral-200 dark:border-neutral-800 space-y-1.5 shadow-2xs">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block font-bold">
                    Average Record Size
                  </label>
                  <div className="flex items-center gap-1.5 font-mono">
                    <input
                      type="number"
                      min={50}
                      max={1000000}
                      value={recordSizeBytes}
                      onChange={(e) => setRecordSizeBytes(Math.max(50, Number(e.target.value)))}
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-neutral-500 font-bold">Bytes</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block">Peak Read QPS (3x Peak)</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                    {peakReadQps.toLocaleString()} QPS
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 block">Avg: {avgReadQps.toLocaleString()} QPS</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block">Peak Write QPS (3x Peak)</span>
                  <span className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 block">
                    {peakWriteQps.toLocaleString()} QPS
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 block">Avg: {avgWriteQps.toLocaleString()} QPS</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block">Daily Ingest Storage</span>
                  <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 block">
                    {dailyStorageGB} GB / day
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 block">New data per 24 hours</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block">5-Year Storage Capacity</span>
                  <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 block">
                    {fiveYearStorageTB} TB
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 block">Requires sharding if &gt; 10 TB</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1 shadow-2xs">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 block">RAM Cache (20% Pareto)</span>
                  <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 block">
                    {cacheRamGB} GB RAM
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 block">In-memory Redis sizing</span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-emerald-500/40 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold block">Preset Scale</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">Reset to standard scale</span>
                  </div>
                  <button
                    onClick={() => {
                      setDauMillions(100);
                      setReadsPerUser(10);
                      setWritesPerUser(1);
                      setRecordSizeBytes(500);
                    }}
                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    title="Reset Defaults"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
