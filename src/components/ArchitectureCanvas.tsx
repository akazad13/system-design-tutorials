import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArchitectureNode, 
  ArchitectureEdge, 
  RequestFlowStep, 
  NodeType 
} from '../types/system-design';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Server, 
  Database, 
  Layers, 
  HardDrive, 
  Radio, 
  Cpu, 
  Search, 
  Smartphone, 
  Cloud, 
  ShieldCheck, 
  Zap, 
  Info,
  Clock,
  X,
  Sparkles
} from 'lucide-react';

interface ArchitectureCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  flowSteps?: RequestFlowStep[];
  title?: string;
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
  nodes,
  edges,
  flowSteps = [],
  title = 'System Architecture Diagram'
}) => {
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto-play flow steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && flowSteps.length > 0) {
      interval = setInterval(() => {
        setActiveStepIndex((prev) => (prev + 1) % flowSteps.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, flowSteps.length]);

  const currentStep = flowSteps[activeStepIndex];
  const activeNodeIds = currentStep?.activeNodes || [];

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'client':
        return <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'gateway':
        return <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'load_balancer':
        return <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'service':
        return <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'database':
        return <Database className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'cache':
        return <Zap className="w-4 h-4 text-amber-500 dark:text-amber-300" />;
      case 'queue':
        return <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'storage':
        return <HardDrive className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'search':
        return <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'worker':
        return <Cpu className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'cdn':
        return <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getNodeBorderColor = (isActive: boolean, isSelected: boolean) => {
    if (isSelected) {
      return 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20 bg-white dark:bg-[#161B28]';
    }
    if (isActive) {
      return 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/40 shadow-md shadow-indigo-500/15 bg-white dark:bg-[#161B28]';
    }
    return 'border-neutral-200/90 dark:border-neutral-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white/95 dark:bg-[#141824]/95 shadow-2xs';
  };

  // Find node by ID
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <div className="flex flex-col bg-white dark:bg-[#111420] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden font-sans transition-colors duration-200">
      {/* Diagram Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-3 bg-neutral-50/80 dark:bg-[#131722]/80 border-b border-neutral-200/80 dark:border-neutral-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Interactive Blueprint
          </span>
          <span className="text-[11px] px-2 py-0.5 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-md font-mono">
            {nodes.length} Components
          </span>
        </div>

        {/* Request Flow Simulation Controls */}
        {flowSteps.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeStepIndex === 0}
                className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-25 transition-colors rounded-lg"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPlaying 
                    ? 'bg-indigo-600 text-white shadow-2xs' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-neutral-700'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Simulate'}</span>
              </button>

              <button
                onClick={() => setActiveStepIndex((prev) => Math.min(flowSteps.length - 1, prev + 1))}
                disabled={activeStepIndex === flowSteps.length - 1}
                className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-25 transition-colors rounded-lg"
                title="Next step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStepIndex(0);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors ml-0.5 border-l border-neutral-200 dark:border-neutral-700 rounded-r-lg"
                title="Reset simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
              {activeStepIndex + 1}/{flowSteps.length}
            </span>
          </div>
        )}
      </div>

        {/* Main Canvas Diagram Area */}
      <div className="relative w-full h-[430px] sm:h-[490px] bg-dot-grid-light dark:bg-dot-grid-dark overflow-hidden select-none transition-colors duration-200">
        {/* SVG Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker
              id="arrowhead-light"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#64748b" opacity="0.6" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const source = getNode(edge.from);
            const target = getNode(edge.to);
            if (!source || !target) return null;

            const isEdgeActive = activeNodeIds.includes(edge.from) && activeNodeIds.includes(edge.to);

            return (
              <g key={edge.id}>
                {/* Edge line */}
                <line
                  x1={`${source.x}%`}
                  y1={`${source.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke={isEdgeActive ? '#6366f1' : 'currentColor'}
                  strokeWidth={isEdgeActive ? 2.5 : 1.4}
                  strokeDasharray={edge.isAsync ? '5,5' : undefined}
                  markerEnd={isEdgeActive ? 'url(#arrowhead-active)' : 'url(#arrowhead-light)'}
                  className={`transition-all duration-300 ${isEdgeActive ? 'text-indigo-500' : 'text-neutral-300 dark:text-neutral-700'}`}
                />

                {/* Animated pulse packet if active */}
                {isEdgeActive && (
                  <circle r="4" fill="#6366f1">
                    <animateMotion
                      path={`M ${source.x * 10},${source.y * 4.9} L ${target.x * 10},${target.y * 4.9}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Edge Protocol Label */}
                {edge.protocol && (
                  <text
                    x={`${(source.x + target.x) / 2}%`}
                    y={`${(source.y + target.y) / 2 - 2}%`}
                    fontSize="10"
                    textAnchor="middle"
                    className="font-mono font-medium fill-neutral-600 dark:fill-neutral-400"
                  >
                    {edge.protocol}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isActive = activeNodeIds.includes(node.id);
          const isSelected = selectedNode?.id === node.id;

          return (
            <motion.div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: isActive ? 1.05 : 1, 
                opacity: 1 
              }}
              whileHover={{ scale: 1.05 }}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className={`absolute z-10 cursor-pointer p-2.5 sm:p-3 rounded-xl border transition-all duration-200 ${getNodeBorderColor(
                isActive,
                isSelected
              )}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                  {getNodeIcon(node.type)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                    {node.label}
                  </span>
                  <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400">
                    {node.type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Active Step Glowing Ping Dot */}
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                </span>
              )}
            </motion.div>
          );
        })}

        {/* Helper hint */}
        {!selectedNode && (
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs border border-neutral-200/80 dark:border-neutral-800 px-3 py-1.5 rounded-lg text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 pointer-events-none shadow-xs font-mono">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Click any node to inspect technical parameters & stack</span>
          </div>
        )}
      </div>

      {/* Active Flow Step Narrative Card */}
      {currentStep && (
        <div className="p-4 sm:p-5 bg-neutral-50/90 dark:bg-[#131722]/90 border-t border-neutral-200/80 dark:border-neutral-800 transition-colors">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-600 text-white uppercase tracking-wider">
                  Step {currentStep.step}
                </span>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-sans">
                  {currentStep.title}
                </h4>
              </div>

              {currentStep.latencyEstimate && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/60">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {currentStep.latencyEstimate}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
              {currentStep.description}
            </p>

            {currentStep.highlightDetails && (
              <div className="mt-2 text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Mechanism: {currentStep.highlightDetails}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Node Inspector Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 bg-white dark:bg-[#151926] border-t border-neutral-200/80 dark:border-neutral-800 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                    {selectedNode.label}
                  </h4>
                  <span className="text-[11px] font-mono uppercase text-indigo-600 dark:text-indigo-400">
                    Component Type: {selectedNode.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedNode.description && (
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
                {selectedNode.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs">
              {selectedNode.techStack && selectedNode.techStack.length > 0 && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/70 dark:border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">
                    Recommended Technologies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.techStack.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.scaleMetric && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/70 dark:border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-semibold text-neutral-500 dark:text-neutral-400 block">
                    Scale Metric
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-sans block text-xs">
                    {selectedNode.scaleMetric}
                  </span>
                </div>
              )}

              {selectedNode.bottlenecks && selectedNode.bottlenecks.length > 0 && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/70 dark:border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-semibold text-rose-600 dark:text-rose-400 block">
                    Key Bottlenecks
                  </span>
                  <ul className="space-y-1 text-neutral-700 dark:text-neutral-300 font-sans text-xs">
                    {selectedNode.bottlenecks.map((b, bIdx) => (
                      <li key={bIdx} className="leading-snug">• {b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
