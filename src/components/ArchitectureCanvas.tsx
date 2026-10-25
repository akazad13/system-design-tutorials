import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  Filter,
  ArrowRight,
  Globe,
  Sliders,
  Compass
} from 'lucide-react';

interface ArchitectureCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  flowSteps?: RequestFlowStep[];
  title?: string;
}

type ComponentTier = 'all' | 'clients_gateways' | 'services' | 'storage' | 'async_cache';

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
  nodes,
  edges,
  flowSteps = [],
  title = 'System Architecture Diagram'
}) => {
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<ComponentTier>('all');
  const [isolatedNodeId, setIsolatedNodeId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-play flow steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && flowSteps.length > 0) {
      const delay = Math.round(3500 / playbackSpeed);
      interval = setInterval(() => {
        setActiveStepIndex((prev) => (prev + 1) % flowSteps.length);
      }, delay);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, flowSteps.length]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedNode) setSelectedNode(null);
        if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, selectedNode]);

  const currentStep = flowSteps[activeStepIndex];
  const activeNodeIds = currentStep?.activeNodes || [];

  // Helper map for node lookups
  const nodeMap = useMemo(() => {
    const map = new Map<string, ArchitectureNode>();
    for (const n of nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [nodes]);

  const getNode = (id: string) => nodeMap.get(id);

  // Filter nodes according to tier
  const isNodeInTier = (node: ArchitectureNode, tier: ComponentTier): boolean => {
    if (tier === 'all') return true;
    switch (tier) {
      case 'clients_gateways':
        return ['client', 'dns', 'cdn', 'load_balancer', 'gateway'].includes(node.type);
      case 'services':
        return ['service', 'worker'].includes(node.type);
      case 'storage':
        return ['database', 'storage', 'search'].includes(node.type);
      case 'async_cache':
        return ['cache', 'queue'].includes(node.type);
      default:
        return true;
    }
  };

  // Node connection neighbors for isolation mode
  const isolatedNeighborIds = useMemo(() => {
    if (!isolatedNodeId) return null;
    const neighbors = new Set<string>([isolatedNodeId]);
    for (const edge of edges) {
      if (edge.from === isolatedNodeId) neighbors.add(edge.to);
      if (edge.to === isolatedNodeId) neighbors.add(edge.from);
    }
    return neighbors;
  }, [isolatedNodeId, edges]);

  // Inbound and outbound connections for selected node inspector
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode) return { inbound: [], outbound: [] };
    const inbound = edges
      .filter((e) => e.to === selectedNode.id)
      .map((e) => ({ edge: e, fromNode: getNode(e.from) }))
      .filter((item): item is { edge: ArchitectureEdge; fromNode: ArchitectureNode } => !!item.fromNode);

    const outbound = edges
      .filter((e) => e.from === selectedNode.id)
      .map((e) => ({ edge: e, toNode: getNode(e.to) }))
      .filter((item): item is { edge: ArchitectureEdge; toNode: ArchitectureNode } => !!item.toNode);

    return { inbound, outbound };
  }, [selectedNode, edges, nodeMap]);

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on canvas backdrop, not on interactive node or button
    if ((e.target as HTMLElement).closest('.interactive-node, button, .interactive-panel')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsolatedNodeId(null);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(1.8, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.65, Number((prev - 0.15).toFixed(2))));

  // Copy architecture specs as markdown
  const handleCopySpecs = () => {
    const lines = [
      `# System Architecture: ${title}`,
      `\n## Components (${nodes.length})`,
      ...nodes.map(n => `- **${n.label}** (${n.type.replace('_', ' ')}): ${n.description}${n.techStack ? ` [Stack: ${n.techStack.join(', ')}]` : ''}`),
      `\n## Communication Paths (${edges.length})`,
      ...edges.map(e => {
        const from = getNode(e.from)?.label || e.from;
        const to = getNode(e.to)?.label || e.to;
        return `- ${from} -> ${to} [${e.protocol || 'Direct'}]${e.label ? `: ${e.label}` : ''}`;
      }),
      flowSteps.length > 0 ? `\n## Request Flow Steps (${flowSteps.length})` : '',
      ...flowSteps.map(s => `### Step ${s.step}: ${s.title}\n${s.description}\nLatency: ${s.latencyEstimate || 'N/A'} | Mechanism: ${s.highlightDetails || 'N/A'}\n`)
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  };

  const getNodeTheme = (type: NodeType) => {
    switch (type) {
      case 'client':
        return {
          icon: <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          accent: 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
          badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
        };
      case 'dns':
      case 'cdn':
        return {
          icon: <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          accent: 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
        };
      case 'gateway':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          accent: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
        };
      case 'load_balancer':
        return {
          icon: <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
          accent: 'border-sky-500/40 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300',
          badge: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
        };
      case 'service':
        return {
          icon: <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
          accent: 'border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300',
          badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
        };
      case 'database':
        return {
          icon: <Database className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          accent: 'border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
          badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
        };
      case 'cache':
        return {
          icon: <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
          accent: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
        };
      case 'queue':
        return {
          icon: <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          accent: 'border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
          badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
        };
      case 'storage':
        return {
          icon: <HardDrive className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
          accent: 'border-teal-500/40 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300',
          badge: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60'
        };
      case 'search':
        return {
          icon: <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
          accent: 'border-cyan-500/40 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300',
          badge: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60'
        };
      case 'worker':
        return {
          icon: <Cpu className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
          accent: 'border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60'
        };
      default:
        return {
          icon: <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
          accent: 'border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300',
          badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
        };
    }
  };

  // Bezier curve calculations for natural flowing architecture connections
  const computeBezierPath = (source: ArchitectureNode, target: ArchitectureNode) => {
    const x1 = (source.x / 100) * 1000;
    const y1 = (source.y / 100) * 600;
    const x2 = (target.x / 100) * 1000;
    const y2 = (target.y / 100) * 600;

    const dx = x2 - x1;
    const dy = y2 - y1;

    // Smooth horizontal/vertical S-curve
    const cx1 = x1 + dx * 0.45;
    const cy1 = y1;
    const cx2 = x1 + dx * 0.55;
    const cy2 = y2;

    const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

    // Midpoint along the cubic bezier curve at t = 0.5
    const midX = 0.125 * x1 + 0.375 * cx1 + 0.375 * cx2 + 0.125 * x2;
    const midY = 0.125 * y1 + 0.375 * cy1 + 0.375 * cy2 + 0.125 * y2;

    return { pathD, midX, midY, x1, y1, x2, y2 };
  };

  return (
    <div 
      className={`flex flex-col bg-white dark:bg-[#0E111A] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-sm transition-colors duration-200 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 rounded-none border-none p-3 sm:p-5 bg-neutral-950/95 dark:bg-[#07090E]/98 backdrop-blur-md overflow-hidden' 
          : 'overflow-hidden'
      }`}
    >
      {/* Canvas Header & Interactive Toolbars */}
      <div className="flex flex-col gap-2.5 p-3.5 sm:px-5 sm:py-3.5 bg-neutral-50/90 dark:bg-[#121622]/90 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Metadata */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 truncate">
                  {title}
                </span>
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-md font-mono font-medium">
                  {nodes.length} Nodes • {edges.length} Links
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Zoom, Fullscreen, Copy Specs) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white dark:bg-[#161B26] border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetView}
                className="px-2 py-0.5 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold cursor-pointer"
                title="Reset Zoom & Pan"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy Markdown Specs */}
            <button
              onClick={handleCopySpecs}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#161B26] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Copy Architecture Blueprint as Markdown"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isCopied ? 'Copied Specs' : 'Export Specs'}</span>
            </button>

            {/* Fullscreen Expand */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#161B26] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Tier Filter Pills & Isolation Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-800/80">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-500" /> Tier:
            </span>
            {[
              { id: 'all' as ComponentTier, label: 'All Tiers' },
              { id: 'clients_gateways' as ComponentTier, label: 'Ingress & Edge' },
              { id: 'services' as ComponentTier, label: 'Compute / App' },
              { id: 'storage' as ComponentTier, label: 'Data & Storage' },
              { id: 'async_cache' as ComponentTier, label: 'Cache & Streams' },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => {
                  setSelectedTier(tier.id);
                  setIsolatedNodeId(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedTier === tier.id && !isolatedNodeId
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-white dark:bg-[#161B26] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

          {/* If isolated node is active */}
          {isolatedNodeId && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-lg text-amber-800 dark:text-amber-300 font-mono">
              <span>Isolated: {getNode(isolatedNodeId)?.label}</span>
              <button
                onClick={() => setIsolatedNodeId(null)}
                className="hover:text-amber-950 dark:hover:text-white font-bold cursor-pointer"
                title="Clear isolation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Diagram Canvas Viewport */}
      <div 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative w-full bg-dot-grid-light dark:bg-dot-grid-dark select-none transition-colors duration-200 overflow-hidden ${
          isFullscreen ? 'flex-1 min-h-[500px]' : 'h-[460px] sm:h-[530px]'
        } ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Transformable Canvas Surface */}
        <div 
          className="absolute inset-0 origin-center transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '100%',
            height: '100%'
          }}
        >
          {/* SVG Connection Edges Layer */}
          <svg 
            viewBox="0 0 1000 600" 
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
          >
            <defs>
              {/* Standard Neutral Arrow Marker */}
              <marker
                id="arrow-neutral"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" opacity="0.75" />
              </marker>

              {/* Active Animated Glow Arrow Marker */}
              <marker
                id="arrow-active"
                markerWidth="9"
                markerHeight="7"
                refX="8"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 9 3.5, 0 7" fill="#6366f1" />
              </marker>

              {/* Async/Queue Line Marker */}
              <marker
                id="arrow-async"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#a855f7" />
              </marker>

              {/* Gradient for active flow paths */}
              <linearGradient id="activeFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>

              {/* Filter glow for active edge */}
              <filter id="edgeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {edges.map((edge) => {
              const source = getNode(edge.from);
              const target = getNode(edge.to);
              if (!source || !target) return null;

              const isEdgeActive = activeNodeIds.includes(edge.from) && activeNodeIds.includes(edge.to);
              const isSourceInTier = isNodeInTier(source, selectedTier);
              const isTargetInTier = isNodeInTier(target, selectedTier);
              const matchesTier = isSourceInTier || isTargetInTier;

              const isIsolated = isolatedNeighborIds !== null;
              const isEdgeInIsolation = isIsolated && isolatedNeighborIds.has(edge.from) && isolatedNeighborIds.has(edge.to);

              const edgeOpacity = isIsolated 
                ? (isEdgeInIsolation ? 1 : 0.15) 
                : (matchesTier ? 1 : 0.2);

              const { pathD, midX, midY } = computeBezierPath(source, target);

              return (
                <g key={edge.id} opacity={edgeOpacity} className="transition-opacity duration-300">
                  {/* Glow layer if active */}
                  {isEdgeActive && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="url(#activeFlowGradient)"
                      strokeWidth="5"
                      opacity="0.4"
                      filter="url(#edgeGlow)"
                    />
                  )}

                  {/* Primary Edge Path */}
                  <path
                    id={`edge-path-${edge.id}`}
                    d={pathD}
                    fill="none"
                    stroke={isEdgeActive ? '#6366f1' : edge.isAsync ? '#a855f7' : 'currentColor'}
                    strokeWidth={isEdgeActive ? 2.8 : 1.6}
                    strokeDasharray={edge.isAsync ? '6,5' : undefined}
                    markerEnd={isEdgeActive ? 'url(#arrow-active)' : edge.isAsync ? 'url(#arrow-async)' : 'url(#arrow-neutral)'}
                    className={`transition-all duration-300 ${
                      isEdgeActive 
                        ? 'text-indigo-500' 
                        : edge.isAsync 
                        ? 'text-purple-400 dark:text-purple-500' 
                        : 'text-neutral-300 dark:text-neutral-700'
                    }`}
                  />

                  {/* Animated Telemetry Pulse Packets on Active Request Flow */}
                  {isEdgeActive && (
                    <>
                      <circle r="4.5" fill="#6366f1" filter="drop-shadow(0 0 4px #818cf8)">
                        <animateMotion
                          dur={`${2.2 / playbackSpeed}s`}
                          repeatCount="indefinite"
                        >
                          <mpath href={`#edge-path-${edge.id}`} />
                        </animateMotion>
                      </circle>
                      <circle r="2.5" fill="#38bdf8">
                        <animateMotion
                          dur={`${2.2 / playbackSpeed}s`}
                          begin="0.6s"
                          repeatCount="indefinite"
                        >
                          <mpath href={`#edge-path-${edge.id}`} />
                        </animateMotion>
                      </circle>
                    </>
                  )}

                  {/* Protocol Pill at midpoint */}
                  {edge.protocol && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-30"
                        y="-10"
                        width="60"
                        height="20"
                        rx="5"
                        fill={isEdgeActive ? '#4f46e5' : '#1e293b'}
                        className="transition-colors duration-200"
                        opacity={isEdgeActive ? 0.95 : 0.8}
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="600"
                        fill="#ffffff"
                        className="font-mono tracking-tight pointer-events-none select-none"
                      >
                        {edge.protocol}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Component Nodes Layer */}
          {nodes.map((node) => {
            const isActive = activeNodeIds.includes(node.id);
            const isSelected = selectedNode?.id === node.id;
            const inTier = isNodeInTier(node, selectedTier);

            const isIsolated = isolatedNeighborIds !== null;
            const inIsolation = isIsolated ? isolatedNeighborIds.has(node.id) : true;

            const isDimmed = !inTier || (isIsolated && !inIsolation);
            const theme = getNodeTheme(node.type);

            return (
              <motion.div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ 
                  scale: isSelected ? 1.08 : isActive ? 1.04 : 1, 
                  opacity: isDimmed ? 0.25 : 1 
                }}
                whileHover={{ scale: isDimmed ? 0.9 : 1.06 }}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`interactive-node absolute z-10 cursor-pointer p-2 sm:p-2.5 rounded-xl border backdrop-blur-xs transition-shadow duration-200 ${
                  isSelected
                    ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/25 bg-white dark:bg-[#161B28]'
                    : isActive
                    ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/40 shadow-md shadow-indigo-500/20 bg-white dark:bg-[#151926]'
                    : `border-neutral-200/90 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white/95 dark:bg-[#121622]/95 shadow-2xs`
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border flex-shrink-0 ${theme.accent}`}>
                    {theme.icon}
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white whitespace-nowrap truncate max-w-[150px] sm:max-w-[190px]">
                      {node.label}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] uppercase font-mono font-semibold text-neutral-500 dark:text-neutral-400">
                        {node.type.replace('_', ' ')}
                      </span>
                      {node.techStack && node.techStack.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {node.techStack[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Flow Pulsing Radar Dot */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-80" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Docked Slide-Over Inspector Drawer (Inside Canvas Viewport) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="interactive-panel absolute top-0 right-0 bottom-0 w-full sm:w-[360px] bg-white/95 dark:bg-[#131722]/95 backdrop-blur-md border-l border-neutral-200/90 dark:border-neutral-800 shadow-xl z-30 flex flex-col overflow-y-auto"
            >
              {/* Inspector Header */}
              <div className="p-4 bg-neutral-50/80 dark:bg-[#10131d]/90 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border ${getNodeTheme(selectedNode.type).accent}`}>
                    {getNodeTheme(selectedNode.type).icon}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                      {selectedNode.label}
                    </h4>
                    <span className="text-[10px] font-mono uppercase text-indigo-600 dark:text-indigo-400 font-semibold">
                      {selectedNode.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (isolatedNodeId === selectedNode.id) {
                        setIsolatedNodeId(null);
                      } else {
                        setIsolatedNodeId(selectedNode.id);
                      }
                    }}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isolatedNodeId === selectedNode.id
                        ? 'bg-amber-500 text-white'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800'
                    }`}
                    title={isolatedNodeId === selectedNode.id ? 'Clear isolation' : 'Isolate this subsystem'}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Close Inspector (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inspector Body */}
              <div className="p-4 space-y-4 text-xs">
                {/* Description */}
                {selectedNode.description && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                    {selectedNode.description}
                  </div>
                )}

                {/* Subsystem Topology: Inbound & Outbound Connections */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 block">
                    Network Topology Links
                  </span>

                  {/* Inbound */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-emerald-500 rotate-180" /> Inbound Traffic:
                    </span>
                    {selectedNodeConnections.inbound.length > 0 ? (
                      <div className="space-y-1">
                        {selectedNodeConnections.inbound.map(({ edge, fromNode }) => (
                          <button
                            key={edge.id}
                            onClick={() => setSelectedNode(fromNode)}
                            className="w-full text-left p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="font-medium text-neutral-900 dark:text-white truncate">
                              {fromNode.label}
                            </span>
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              {edge.protocol || 'RPC'}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 italic pl-1 block">Root ingress (No upstream callers)</span>
                    )}
                  </div>

                  {/* Outbound */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-indigo-500" /> Outbound Dependencies:
                    </span>
                    {selectedNodeConnections.outbound.length > 0 ? (
                      <div className="space-y-1">
                        {selectedNodeConnections.outbound.map(({ edge, toNode }) => (
                          <button
                            key={edge.id}
                            onClick={() => setSelectedNode(toNode)}
                            className="w-full text-left p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="font-medium text-neutral-900 dark:text-white truncate">
                              {toNode.label}
                            </span>
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                              {edge.protocol || 'RPC'}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 italic pl-1 block">Terminal node (No downstream calls)</span>
                    )}
                  </div>
                </div>

                {/* Tech Stack */}
                {selectedNode.techStack && selectedNode.techStack.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 block">
                      Recommended Tech Stack
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.techStack.map((tech) => (
                        <span 
                          key={tech} 
                          className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[11px] border border-neutral-200 dark:border-neutral-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scale Metric */}
                {selectedNode.scaleMetric && (
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 dark:text-indigo-300 block">
                      Scale SLA & Throughput Metric
                    </span>
                    <p className="font-mono text-xs text-neutral-800 dark:text-neutral-200 font-medium">
                      {selectedNode.scaleMetric}
                    </p>
                  </div>
                )}

                {/* Key Bottlenecks */}
                {selectedNode.bottlenecks && selectedNode.bottlenecks.length > 0 && (
                  <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-800/60 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-700 dark:text-rose-300 block">
                      Critical Bottlenecks & Edge Cases
                    </span>
                    <ul className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
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

        {/* Canvas Bottom Instructions Hint */}
        {!selectedNode && (
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs border border-neutral-200/80 dark:border-neutral-800 px-3 py-1.5 rounded-lg text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 pointer-events-none shadow-xs font-mono">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Click any node to inspect specs • Drag to pan • Scroll to zoom</span>
          </div>
        )}
      </div>

      {/* Request Flow Simulation Bar & Step Timeline */}
      {flowSteps.length > 0 && (
        <div className="bg-neutral-50/95 dark:bg-[#111520]/95 border-t border-neutral-200/80 dark:border-neutral-800 p-3 sm:p-4 space-y-3">
          {/* Timeline Step Pills & Playback Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mr-1">
                Flow Simulation:
              </span>

              {/* Step selector pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {flowSteps.map((step, idx) => (
                  <button
                    key={step.step}
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveStepIndex(idx);
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                      activeStepIndex === idx
                        ? 'bg-indigo-600 text-white shadow-2xs scale-105'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700'
                    }`}
                    title={`Step ${step.step}: ${step.title}`}
                  >
                    {step.step}
                  </button>
                ))}
              </div>
            </div>

            {/* Play/Pause & Speed Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 shadow-2xs">
                <button
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeStepIndex === 0}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white disabled:opacity-25 transition-colors rounded-lg cursor-pointer"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlaying 
                      ? 'bg-indigo-600 text-white shadow-2xs' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-neutral-700'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play Flow'}</span>
                </button>

                <button
                  onClick={() => setActiveStepIndex((prev) => Math.min(flowSteps.length - 1, prev + 1))}
                  disabled={activeStepIndex === flowSteps.length - 1}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white disabled:opacity-25 transition-colors rounded-lg cursor-pointer"
                  title="Next Step"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStepIndex(0);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors ml-0.5 border-l border-neutral-200 dark:border-neutral-700 rounded-r-lg cursor-pointer"
                  title="Reset Flow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Playback Speed selector */}
              <button
                onClick={() => setPlaybackSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
                className="px-2 py-1 text-[11px] font-mono font-bold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                title="Toggle playback speed"
              >
                {playbackSpeed}x
              </button>
            </div>
          </div>

          {/* Current Step Narrative Card */}
          {currentStep && (
            <div className="p-3.5 bg-white dark:bg-[#151926] rounded-xl border border-neutral-200/80 dark:border-neutral-800 space-y-2 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-600 text-white uppercase tracking-wider">
                    Step {currentStep.step} / {flowSteps.length}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                    {currentStep.title}
                  </h4>
                </div>

                {currentStep.latencyEstimate && (
                  <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/60">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Latency: {currentStep.latencyEstimate}
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                {currentStep.description}
              </p>

              {currentStep.highlightDetails && (
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Key Architectural Mechanism: {currentStep.highlightDetails}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
