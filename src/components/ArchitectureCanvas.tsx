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
  Clock
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
  const [showInspector, setShowInspector] = useState<boolean>(true);

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
        return <Smartphone className="w-3.5 h-3.5 text-[#166534]" />;
      case 'gateway':
        return <ShieldCheck className="w-3.5 h-3.5 text-[#92400E]" />;
      case 'load_balancer':
        return <Layers className="w-3.5 h-3.5 text-[#1D3557]" />;
      case 'service':
        return <Server className="w-3.5 h-3.5 text-[#1A1A1A]" />;
      case 'database':
        return <Database className="w-3.5 h-3.5 text-[#991B1B]" />;
      case 'cache':
        return <Zap className="w-3.5 h-3.5 text-[#B45309]" />;
      case 'queue':
        return <Radio className="w-3.5 h-3.5 text-[#581C87]" />;
      case 'storage':
        return <HardDrive className="w-3.5 h-3.5 text-[#115E59]" />;
      case 'search':
        return <Search className="w-3.5 h-3.5 text-[#0369A1]" />;
      case 'worker':
        return <Cpu className="w-3.5 h-3.5 text-[#C2410C]" />;
      case 'cdn':
        return <Cloud className="w-3.5 h-3.5 text-[#1D4ED8]" />;
      default:
        return <Server className="w-3.5 h-3.5 text-[#1A1A1A]" />;
    }
  };

  const getNodeBorderColor = (type: NodeType, isActive: boolean, isSelected: boolean) => {
    if (isSelected) return 'border-[#1A1A1A] ring-2 ring-[#1A1A1A] shadow-md bg-[#FFFFFF]';
    if (isActive) return 'border-[#1A1A1A] ring-2 ring-[#3E5C76] shadow-sm bg-[#FFFFFF]';
    return 'border-[#1A1A1A]/20 hover:border-[#1A1A1A]/60 bg-[#FFFFFF]';
  };

  // Find node by ID
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <div className="flex flex-col bg-[#FFFFFF] border border-[#1A1A1A]/10 shadow-sm font-sans">
      {/* Diagram Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#F9F7F2] border-b border-[#1A1A1A]/10 gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60 font-sans">
            Blueprint Schematic
          </span>
          <span className="text-[9px] px-2 py-0.5 bg-[#FFFFFF] text-[#1A1A1A] border border-[#1A1A1A]/15 font-mono">
            {nodes.length} Components
          </span>
        </div>

        {/* Flow Player Controls */}
        {flowSteps.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#FFFFFF] border border-[#1A1A1A]/15 p-0.5">
              <button
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeStepIndex === 0}
                className="p-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] disabled:opacity-20 transition-colors"
                title="Previous Step"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                  isPlaying 
                    ? 'bg-[#1A1A1A] text-[#FDFCFB]' 
                    : 'bg-[#F9F7F2] text-[#1A1A1A] hover:bg-[#F0EEE6]'
                }`}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Simulate'}</span>
              </button>

              <button
                onClick={() => setActiveStepIndex((prev) => Math.min(flowSteps.length - 1, prev + 1))}
                disabled={activeStepIndex === flowSteps.length - 1}
                className="p-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] disabled:opacity-20 transition-colors"
                title="Next Step"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStepIndex(0);
                }}
                className="p-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors ml-0.5 border-l border-[#1A1A1A]/10 pl-1"
                title="Reset Flow"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <span className="text-[10px] font-mono text-[#1A1A1A]/70 bg-[#FFFFFF] px-2 py-1 border border-[#1A1A1A]/15">
              Step {activeStepIndex + 1} of {flowSteps.length}
            </span>
          </div>
        )}
      </div>

      {/* Main Visual Canvas */}
      <div className="relative w-full h-[420px] sm:h-[480px] bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:16px_16px] bg-[#FDFCFB] overflow-hidden select-none">
        {/* SVG Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#1A1A1A" opacity="0.6" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#1A1A1A" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const source = getNode(edge.from);
            const target = getNode(edge.to);
            if (!source || !target) return null;

            const isEdgeActive = activeNodeIds.includes(edge.from) && activeNodeIds.includes(edge.to);

            return (
              <g key={edge.id}>
                {/* Connection line */}
                <line
                  x1={`${source.x}%`}
                  y1={`${source.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke={isEdgeActive ? '#1A1A1A' : 'rgba(26, 26, 26, 0.25)'}
                  strokeWidth={isEdgeActive ? 2.5 : 1.2}
                  strokeDasharray={edge.isAsync ? '4,4' : undefined}
                  markerEnd={isEdgeActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                  className="transition-all duration-300"
                />

                {/* Animated pulse packet if active */}
                {isEdgeActive && (
                  <circle r="4" fill="#1A1A1A">
                    <animateMotion
                      path={`M ${source.x * 10},${source.y * 4.8} L ${target.x * 10},${target.y * 4.8}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Edge Protocol Tag */}
                {edge.protocol && (
                  <text
                    x={`${(source.x + target.x) / 2}%`}
                    y={`${(source.y + target.y) / 2 - 2}%`}
                    fill="#1A1A1A"
                    fontSize="9"
                    textAnchor="middle"
                    className="font-mono bg-[#FFFFFF] px-1 fill-[#1A1A1A]/70"
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
              className={`absolute z-10 cursor-pointer p-2.5 bg-[#FFFFFF] border transition-all duration-200 shadow-sm ${getNodeBorderColor(
                node.type,
                isActive,
                isSelected
              )}`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1 bg-[#F9F7F2] border border-[#1A1A1A]/10">
                  {getNodeIcon(node.type)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-serif text-[#1A1A1A] whitespace-nowrap">
                    {node.label}
                  </span>
                  <span className="text-[9px] uppercase font-mono text-[#1A1A1A]/50">
                    {node.type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Active Step Ping Dot */}
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A1A1A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1A1A1A]"></span>
                </span>
              )}
            </motion.div>
          );
        })}

        {/* Click-to-inspect helper hint */}
        {!selectedNode && (
          <div className="absolute bottom-3 left-3 bg-[#FFFFFF] border border-[#1A1A1A]/10 px-2.5 py-1 text-[10px] text-[#1A1A1A]/60 flex items-center gap-1.5 pointer-events-none shadow-xs font-mono">
            <Info className="w-3 h-3 text-[#1A1A1A]/40" />
            <span>Click any node to inspect technical parameters</span>
          </div>
        )}
      </div>

      {/* Active Flow Step Narrative Card */}
      {currentStep && (
        <div className="p-4 bg-[#F9F7F2] border-t border-[#1A1A1A]/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#1A1A1A] text-[#FDFCFB] uppercase">
                  Step {currentStep.step}
                </span>
                <h4 className="text-xs font-bold font-serif text-[#1A1A1A]">
                  {currentStep.title}
                </h4>
                {currentStep.latencyEstimate && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-[#92400E] bg-[#FFFBEB] px-2 py-0.5 border border-[#92400E]/20 ml-auto">
                    <Clock className="w-3 h-3" />
                    {currentStep.latencyEstimate}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#1A1A1A]/80 leading-relaxed font-sans">
                {currentStep.description}
              </p>
              {currentStep.highlightDetails && (
                <div className="mt-2 text-xs font-mono text-[#166534] bg-[#F4F9F4] px-2.5 py-1 border border-[#166534]/20">
                  ⚡ Mechanism: {currentStep.highlightDetails}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Node Inspector Modal / Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-[#FFFFFF] border-t border-[#1A1A1A]/10 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#F9F7F2] border border-[#1A1A1A]/10">
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <h4 className="text-sm font-bold font-serif text-[#1A1A1A]">
                    {selectedNode.label}
                  </h4>
                  <span className="text-[10px] font-mono uppercase text-[#1A1A1A]/50">
                    Component Type: {selectedNode.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[11px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] px-2.5 py-1 bg-[#F9F7F2] hover:bg-[#F0EEE6] border border-[#1A1A1A]/10 transition-colors uppercase font-mono"
              >
                Close
              </button>
            </div>

            {selectedNode.description && (
              <p className="text-xs text-[#1A1A1A]/80 leading-relaxed font-sans">
                {selectedNode.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2 border-t border-[#1A1A1A]/10">
              {selectedNode.techStack && selectedNode.techStack.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#1A1A1A]/50 font-mono uppercase">Tech Stack:</span>
                  {selectedNode.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] px-2 py-0.5 bg-[#F9F7F2] text-[#1A1A1A] border border-[#1A1A1A]/15 font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {selectedNode.scaleMetric && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[10px] text-[#1A1A1A]/50 font-mono uppercase">Scale Spec:</span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#FFFBEB] text-[#92400E] border border-[#92400E]/20 font-mono">
                    {selectedNode.scaleMetric}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
