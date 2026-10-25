import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Compass,
  Trash2,
  Plus,
  AlertTriangle,
  Move,
  Link2,
  Unlink,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface ArchitectureCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  flowSteps?: RequestFlowStep[];
  title?: string;
}

type ComponentTier = 'all' | 'clients_gateways' | 'services' | 'storage' | 'async_cache';

// Anti-overlap / Collision Avoidance algorithm
function deconflictNodes(inputNodes: ArchitectureNode[]): ArchitectureNode[] {
  const nodes = inputNodes.map((n) => ({ ...n }));
  const minXDist = 18; // minimum % distance horizontally
  const minYDist = 16; // minimum % distance vertically

  for (let iter = 0; iter < 18; iter++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX < minXDist && absY < minYDist) {
          moved = true;
          const pushX = (minXDist - absX) / 2 + 0.8;
          const pushY = (minYDist - absY) / 2 + 0.8;

          if (absX < absY) {
            // Push vertically
            if (dy >= 0) {
              nodes[j].y = Math.min(92, nodes[j].y + pushY);
              nodes[i].y = Math.max(8, nodes[i].y - pushY);
            } else {
              nodes[j].y = Math.max(8, nodes[j].y - pushY);
              nodes[i].y = Math.min(92, nodes[j].y + pushY);
            }
          } else {
            // Push horizontally
            if (dx >= 0) {
              nodes[j].x = Math.min(93, nodes[j].x + pushX);
              nodes[i].x = Math.max(7, nodes[i].x - pushX);
            } else {
              nodes[j].x = Math.max(7, nodes[j].x - pushX);
              nodes[i].x = Math.min(93, nodes[j].x + pushX);
            }
          }
        }
      }
    }
    if (!moved) break;
  }
  return nodes;
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  flowSteps = [],
  title = 'System Architecture Diagram'
}) => {
  // Editable canvas nodes and edges state
  const [canvasNodes, setCanvasNodes] = useState<ArchitectureNode[]>(() => deconflictNodes(initialNodes));
  const [canvasEdges, setCanvasEdges] = useState<ArchitectureEdge[]>(initialEdges);
  const [deletedNodesHistory, setDeletedNodesHistory] = useState<ArchitectureNode[]>([]);
  
  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startNodeX: number;
    startNodeY: number;
    nodeId: string;
  } | null>(null);

  // Inspector & Mode States
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
  const [isAddNodeOpen, setIsAddNodeOpen] = useState<boolean>(false);
  const [showImpactDrawer, setShowImpactDrawer] = useState<boolean>(true);

  // Add Component Form State
  const [newNodeLabel, setNewNodeLabel] = useState<string>('');
  const [newNodeType, setNewNodeType] = useState<NodeType>('cache');
  const [newNodeTech, setNewNodeTech] = useState<string>('Redis 7');

  // Connection Linking Form State (inside Inspector)
  const [linkTargetId, setLinkTargetId] = useState<string>('');
  const [linkProtocol, setLinkProtocol] = useState<string>('HTTPS');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Re-sync when parent case study changes
  useEffect(() => {
    setCanvasNodes(deconflictNodes(initialNodes));
    setCanvasEdges(initialEdges);
    setDeletedNodesHistory([]);
    setSelectedNode(null);
    setIsolatedNodeId(null);
  }, [initialNodes, initialEdges]);

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

  // Handle ESC key to exit fullscreen or close inspector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddNodeOpen) setIsAddNodeOpen(false);
        else if (selectedNode) setSelectedNode(null);
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, selectedNode, isAddNodeOpen]);

  const currentStep = flowSteps[activeStepIndex];
  const activeNodeIds = currentStep?.activeNodes || [];

  // Helper map for node lookups
  const nodeMap = useMemo(() => {
    const map = new Map<string, ArchitectureNode>();
    for (const n of canvasNodes) {
      map.set(n.id, n);
    }
    return map;
  }, [canvasNodes]);

  const getNode = (id: string) => nodeMap.get(id);

  // Auto-decongest / space out button action
  const handleAutoSpread = () => {
    setCanvasNodes((prev) => deconflictNodes(prev));
  };

  // Reset blueprint back to default baseline
  const handleResetBlueprint = () => {
    setCanvasNodes(deconflictNodes(initialNodes));
    setCanvasEdges(initialEdges);
    setDeletedNodesHistory([]);
    setSelectedNode(null);
    setIsolatedNodeId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

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
    for (const edge of canvasEdges) {
      if (edge.from === isolatedNodeId) neighbors.add(edge.to);
      if (edge.to === isolatedNodeId) neighbors.add(edge.from);
    }
    return neighbors;
  }, [isolatedNodeId, canvasEdges]);

  // Inbound and outbound connections for selected node inspector
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNode) return { inbound: [], outbound: [] };
    const inbound = canvasEdges
      .filter((e) => e.to === selectedNode.id)
      .map((e) => ({ edge: e, fromNode: getNode(e.from) }))
      .filter((item): item is { edge: ArchitectureEdge; fromNode: ArchitectureNode } => !!item.fromNode);

    const outbound = canvasEdges
      .filter((e) => e.from === selectedNode.id)
      .map((e) => ({ edge: e, toNode: getNode(e.to) }))
      .filter((item): item is { edge: ArchitectureEdge; toNode: ArchitectureNode } => !!item.toNode);

    return { inbound, outbound };
  }, [selectedNode, canvasEdges, nodeMap]);

  // Delete node and record for impact analysis
  const handleDeleteNode = (nodeId: string) => {
    const targetNode = getNode(nodeId);
    if (!targetNode) return;

    setCanvasNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setCanvasEdges((prev) => prev.filter((e) => e.from !== nodeId && e.to !== nodeId));
    setDeletedNodesHistory((prev) => [...prev, targetNode]);

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    if (isolatedNodeId === nodeId) {
      setIsolatedNodeId(null);
    }
  };

  // Undo delete / restore node
  const handleRestoreNode = (nodeId: string) => {
    const nodeToRestore = deletedNodesHistory.find((n) => n.id === nodeId);
    if (!nodeToRestore) return;

    setCanvasNodes((prev) => [...prev, nodeToRestore]);
    setDeletedNodesHistory((prev) => prev.filter((n) => n.id !== nodeId));

    // Restore related edges from initialEdges that connect to this node and other existing nodes
    const existingNodeIds = new Set([...canvasNodes.map((n) => n.id), nodeId]);
    const edgesToRestore = initialEdges.filter(
      (e) => (e.from === nodeId || e.to === nodeId) && existingNodeIds.has(e.from) && existingNodeIds.has(e.to)
    );

    setCanvasEdges((prev) => {
      const currentEdgeIds = new Set(prev.map((e) => e.id));
      const newEdges = edgesToRestore.filter((e) => !currentEdgeIds.has(e.id));
      return [...prev, ...newEdges];
    });
  };

  // Add new component to canvas
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;

    const id = `custom_${Date.now()}`;
    const newNode: ArchitectureNode = {
      id,
      label: newNodeLabel.trim(),
      type: newNodeType,
      x: 50 + (Math.random() * 16 - 8),
      y: 50 + (Math.random() * 16 - 8),
      description: `Custom ${newNodeType.replace('_', ' ')} component added to architectural topology.`,
      techStack: newNodeTech ? [newNodeTech] : undefined,
      scaleMetric: 'Configured for high availability'
    };

    setCanvasNodes((prev) => deconflictNodes([...prev, newNode]));
    setSelectedNode(newNode);
    setIsAddNodeOpen(false);
    setNewNodeLabel('');
  };

  // Add new edge connection between nodes
  const handleAddEdge = (fromId: string, toId: string, protocol: string) => {
    if (!fromId || !toId || fromId === toId) return;

    const newEdge: ArchitectureEdge = {
      id: `edge_${Date.now()}`,
      from: fromId,
      to: toId,
      label: `${protocol} Link`,
      protocol: protocol as any,
      isAsync: protocol === 'Async Queue'
    };

    setCanvasEdges((prev) => [...prev, newEdge]);
    setLinkTargetId('');
  };

  // Delete an edge connection
  const handleDeleteEdge = (edgeId: string) => {
    setCanvasEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  // Architectural Impact Analysis when components are removed or added
  const architecturalImpacts = useMemo(() => {
    if (deletedNodesHistory.length === 0) return [];

    const impacts: { title: string; severity: 'critical' | 'high' | 'medium'; description: string }[] = [];

    for (const node of deletedNodesHistory) {
      switch (node.type) {
        case 'cache':
          impacts.push({
            title: `Cache Layer Removed: ${node.label}`,
            severity: 'high',
            description: 'Hot reads bypass in-memory caching and hit the primary database directly. DB read IOPS spikes by ~10x-50x; p99 latency increases from 1-2ms to 20-50ms (Thundering Herd danger).'
          });
          break;
        case 'load_balancer':
        case 'gateway':
          impacts.push({
            title: `Ingress/Gateway Removed: ${node.label}`,
            severity: 'critical',
            description: 'Single Point of Failure (SPOF). Client traffic cannot be distributed across application instances; SSL termination and DDoS rate-limiting safeguards are lost.'
          });
          break;
        case 'queue':
          impacts.push({
            title: `Message Queue Removed: ${node.label}`,
            severity: 'high',
            description: 'Asynchronous event buffering severed. Upstream services must make synchronous blocking calls to downstream consumers, risking cascading thread pool exhaustion.'
          });
          break;
        case 'database':
        case 'storage':
          impacts.push({
            title: `Durable Store Removed: ${node.label}`,
            severity: 'critical',
            description: 'Total write persistence failure. Stateful entities and user records cannot be committed to disk; queries will fail with connection refusal.'
          });
          break;
        case 'cdn':
        case 'dns':
          impacts.push({
            title: `Edge CDN/DNS Removed: ${node.label}`,
            severity: 'medium',
            description: 'Edge caching disabled. All static assets and redirect requests hit origin servers directly, multiplying bandwidth costs and round-trip latency by 5x-10x.'
          });
          break;
        case 'worker':
          impacts.push({
            title: `Worker Removed: ${node.label}`,
            severity: 'medium',
            description: 'Background stream processing, analytics aggregation, or batch jobs halt and back up in queues.'
          });
          break;
        case 'service':
          impacts.push({
            title: `Service Cluster Removed: ${node.label}`,
            severity: 'high',
            description: 'Business logic execution severed. Upstream callers receive HTTP 502/503 errors and downstream data stores will become idle.'
          });
          break;
        default:
          impacts.push({
            title: `Component Removed: ${node.label}`,
            severity: 'medium',
            description: 'Component removed from the architecture pipeline, severing connected request flows.'
          });
      }
    }

    return impacts;
  }, [deletedNodesHistory]);

  // Dragging logic for nodes
  const handleNodeMouseDown = (e: React.MouseEvent, node: ArchitectureNode) => {
    // If clicking a button on the node, don't drag
    if ((e.target as HTMLElement).closest('button')) return;

    e.stopPropagation();
    setDraggingNodeId(node.id);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
      nodeId: node.id
    };
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaXPixels = e.clientX - dragRef.current.startX;
      const deltaYPixels = e.clientY - dragRef.current.startY;

      // Adjust delta by zoom level
      const deltaXPercent = (deltaXPixels / (rect.width * zoom)) * 100;
      const deltaYPercent = (deltaYPixels / (rect.height * zoom)) * 100;

      const newX = Math.min(94, Math.max(6, Number((dragRef.current.startNodeX + deltaXPercent).toFixed(1))));
      const newY = Math.min(93, Math.max(7, Number((dragRef.current.startNodeY + deltaYPercent).toFixed(1))));

      setCanvasNodes((prev) =>
        prev.map((n) => (n.id === dragRef.current?.nodeId ? { ...n, x: newX, y: newY } : n))
      );
    };

    const handleWindowMouseUp = () => {
      setDraggingNodeId(null);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [zoom]);

  // Pan controls
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (draggingNodeId) return;
    if ((e.target as HTMLElement).closest('.interactive-node, button, .interactive-panel, input, select')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || draggingNodeId) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleCanvasMouseUp = () => {
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
      `\n## Active Components (${canvasNodes.length})`,
      ...canvasNodes.map(n => `- **${n.label}** (${n.type.replace('_', ' ')}): ${n.description}${n.techStack ? ` [Stack: ${n.techStack.join(', ')}]` : ''}`),
      `\n## Active Communication Paths (${canvasEdges.length})`,
      ...canvasEdges.map(e => {
        const from = getNode(e.from)?.label || e.from;
        const to = getNode(e.to)?.label || e.to;
        return `- ${from} -> ${to} [${e.protocol || 'Direct'}]${e.label ? `: ${e.label}` : ''}`;
      }),
      deletedNodesHistory.length > 0 ? `\n## Removed Components (${deletedNodesHistory.length})` : '',
      ...deletedNodesHistory.map(n => `- ⚠️ ${n.label} (Removed)`),
      flowSteps.length > 0 ? `\n## Request Flow Steps (${flowSteps.length})` : '',
      ...flowSteps.map(s => `### Step ${s.step}: ${s.title}\n${s.description}\nLatency: ${s.latencyEstimate || 'N/A'} | Mechanism: ${s.highlightDetails || 'N/A'}\n`)
    ];

    navigator.clipboard.writeText(lines.filter(Boolean).join('\n'));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  };

  const getNodeTheme = (type: NodeType) => {
    switch (type) {
      case 'client':
        return {
          icon: <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />,
          accent: 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300',
          badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
        };
      case 'dns':
      case 'cdn':
        return {
          icon: <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />,
          accent: 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
        };
      case 'gateway':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />,
          accent: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
        };
      case 'load_balancer':
        return {
          icon: <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />,
          accent: 'border-sky-500/40 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300',
          badge: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
        };
      case 'service':
        return {
          icon: <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />,
          accent: 'border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300',
          badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
        };
      case 'database':
        return {
          icon: <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />,
          accent: 'border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300',
          badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
        };
      case 'cache':
        return {
          icon: <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />,
          accent: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
        };
      case 'queue':
        return {
          icon: <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />,
          accent: 'border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300',
          badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
        };
      case 'storage':
        return {
          icon: <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400" />,
          accent: 'border-teal-500/40 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300',
          badge: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60'
        };
      case 'search':
        return {
          icon: <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400" />,
          accent: 'border-cyan-500/40 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300',
          badge: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60'
        };
      case 'worker':
        return {
          icon: <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />,
          accent: 'border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60'
        };
      default:
        return {
          icon: <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />,
          accent: 'border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300',
          badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
        };
    }
  };

  // Bezier curve calculations for natural flowing architecture connections
  const computeBezierPath = (source: ArchitectureNode, target: ArchitectureNode) => {
    const x1 = (source.x / 100) * 1200;
    const y1 = (source.y / 100) * 700;
    const x2 = (target.x / 100) * 1200;
    const y2 = (target.y / 100) * 700;

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
                  {canvasNodes.length} Nodes • {canvasEdges.length} Links
                </span>
                {deletedNodesHistory.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-md font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Modified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions (Add Component, Auto-Arrange, Zoom, Reset, Fullscreen) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Add Component Button */}
            <button
              onClick={() => setIsAddNodeOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Add a new component to simulate architecture"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Node</span>
            </button>

            {/* Auto-Decongest / Space Out Button */}
            <button
              onClick={handleAutoSpread}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#161B26] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Automatically space out components to eliminate overlap"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">De-congest</span>
            </button>

            {/* Reset Blueprint */}
            {(deletedNodesHistory.length > 0 || canvasNodes.length !== initialNodes.length) && (
              <button
                onClick={handleResetBlueprint}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Reset back to baseline architecture blueprint"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

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
              <span className="hidden lg:inline">{isCopied ? 'Copied' : 'Export'}</span>
            </button>

            {/* Fullscreen Expand */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#161B26] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
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

          <div className="flex items-center gap-2">
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

            {/* Movable hint badge */}
            <span className="text-[10px] font-mono text-neutral-400 hidden sm:flex items-center gap-1">
              <Move className="w-3 h-3 text-indigo-400" /> Movable Components
            </span>
          </div>
        </div>
      </div>

      {/* Main Diagram Canvas Viewport */}
      <div 
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className={`relative w-full bg-dot-grid-light dark:bg-dot-grid-dark select-none transition-colors duration-200 overflow-hidden ${
          isFullscreen ? 'flex-1 min-h-[500px]' : 'h-[500px] sm:h-[580px]'
        } ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
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
            viewBox="0 0 1200 700" 
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
          >
            <defs>
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

              <linearGradient id="activeFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>

              <filter id="edgeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {canvasEdges.map((edge) => {
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
                        x="-32"
                        y="-10"
                        width="64"
                        height="20"
                        rx="5"
                        fill={isEdgeActive ? '#4f46e5' : '#1e293b'}
                        className="transition-colors duration-200"
                        opacity={isEdgeActive ? 0.95 : 0.85}
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
          {canvasNodes.map((node) => {
            const isActive = activeNodeIds.includes(node.id);
            const isSelected = selectedNode?.id === node.id;
            const inTier = isNodeInTier(node, selectedTier);

            const isIsolated = isolatedNeighborIds !== null;
            const inIsolation = isIsolated ? isolatedNeighborIds.has(node.id) : true;

            const isDimmed = !inTier || (isIsolated && !inIsolation);
            const theme = getNodeTheme(node.type);
            const isDragging = draggingNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`interactive-node absolute z-10 p-2 sm:p-2.5 rounded-xl border backdrop-blur-xs transition-shadow duration-150 group select-none ${
                  isDragging ? 'cursor-grabbing shadow-2xl scale-105 z-30 ring-2 ring-indigo-400' : 'cursor-grab hover:shadow-md'
                } ${
                  isSelected
                    ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/25 bg-white dark:bg-[#161B28]'
                    : isActive
                    ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/40 shadow-md shadow-indigo-500/20 bg-white dark:bg-[#151926]'
                    : `border-neutral-200/90 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white/95 dark:bg-[#121622]/95 shadow-2xs`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border flex-shrink-0 ${theme.accent}`}>
                    {theme.icon}
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white whitespace-nowrap truncate max-w-[130px] sm:max-w-[160px]">
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

                  {/* Quick Delete Node Button on Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-all cursor-pointer"
                    title="Delete component to simulate outage impact"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Active Flow Pulsing Radar Dot */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-80" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Architectural Impact Simulation Alert Banner */}
        {architecturalImpacts.length > 0 && showImpactDrawer && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xl z-20 bg-rose-50/95 dark:bg-[#1C1014]/95 backdrop-blur-md border border-rose-300 dark:border-rose-900/60 p-3.5 rounded-2xl shadow-xl space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold uppercase font-mono text-[11px]">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Architectural Outage Impact ({deletedNodesHistory.length} Removed)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetBlueprint}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Restore Baseline
                </button>
                <button
                  onClick={() => setShowImpactDrawer(false)}
                  className="p-1 text-rose-500 hover:text-rose-800 dark:hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {architecturalImpacts.map((imp, idx) => (
                <div key={idx} className="bg-white/80 dark:bg-neutral-900/60 p-2 rounded-xl border border-rose-200/60 dark:border-rose-900/40 text-neutral-800 dark:text-neutral-200 text-[11px] leading-snug">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{imp.title}</span>
                    <button
                      onClick={() => handleRestoreNode(deletedNodesHistory[idx]?.id)}
                      className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Undo
                    </button>
                  </div>
                  <p className="mt-0.5 text-neutral-600 dark:text-neutral-300">{imp.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Docked Slide-Over Inspector Drawer */}
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
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Delete component to test impact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                {/* Drag Hint */}
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <Move className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>Click & drag on canvas to freely reposition this component.</span>
                </div>

                {/* Description */}
                {selectedNode.description && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                    {selectedNode.description}
                  </div>
                )}

                {/* Subsystem Topology: Inbound & Outbound Connections */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                      Topology Connections
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {selectedNodeConnections.inbound.length + selectedNodeConnections.outbound.length} Active
                    </span>
                  </div>

                  {/* Inbound */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-emerald-500 rotate-180" /> Inbound Traffic:
                    </span>
                    {selectedNodeConnections.inbound.length > 0 ? (
                      <div className="space-y-1">
                        {selectedNodeConnections.inbound.map(({ edge, fromNode }) => (
                          <div
                            key={edge.id}
                            className="w-full p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between"
                          >
                            <button
                              onClick={() => setSelectedNode(fromNode)}
                              className="font-medium text-neutral-900 dark:text-white truncate hover:underline text-left cursor-pointer"
                            >
                              {fromNode.label}
                            </button>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                {edge.protocol || 'RPC'}
                              </span>
                              <button
                                onClick={() => handleDeleteEdge(edge.id)}
                                className="text-neutral-400 hover:text-rose-500 p-0.5"
                                title="Sever connection"
                              >
                                <Unlink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 italic pl-1 block">Root ingress</span>
                    )}
                  </div>

                  {/* Outbound */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-indigo-500" /> Outbound Calls:
                    </span>
                    {selectedNodeConnections.outbound.length > 0 ? (
                      <div className="space-y-1">
                        {selectedNodeConnections.outbound.map(({ edge, toNode }) => (
                          <div
                            key={edge.id}
                            className="w-full p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between"
                          >
                            <button
                              onClick={() => setSelectedNode(toNode)}
                              className="font-medium text-neutral-900 dark:text-white truncate hover:underline text-left cursor-pointer"
                            >
                              {toNode.label}
                            </button>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                {edge.protocol || 'RPC'}
                              </span>
                              <button
                                onClick={() => handleDeleteEdge(edge.id)}
                                className="text-neutral-400 hover:text-rose-500 p-0.5"
                                title="Sever connection"
                              >
                                <Unlink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 italic pl-1 block">Terminal node</span>
                    )}
                  </div>

                  {/* Connect To Component Tool */}
                  <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800 space-y-1.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-indigo-500" /> Connect to another node:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={linkTargetId}
                        onChange={(e) => setLinkTargetId(e.target.value)}
                        className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-1 text-xs text-neutral-800 dark:text-neutral-200"
                      >
                        <option value="">Select target node...</option>
                        {canvasNodes
                          .filter((n) => n.id !== selectedNode.id)
                          .map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.label}
                            </option>
                          ))}
                      </select>

                      <select
                        value={linkProtocol}
                        onChange={(e) => setLinkProtocol(e.target.value)}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-1 text-xs text-neutral-800 dark:text-neutral-200 font-mono"
                      >
                        <option value="HTTPS">HTTPS</option>
                        <option value="gRPC">gRPC</option>
                        <option value="TCP">TCP</option>
                        <option value="Async Queue">Async Queue</option>
                        <option value="SQL">SQL</option>
                        <option value="NoSQL">NoSQL</option>
                      </select>

                      <button
                        onClick={() => handleAddEdge(selectedNode.id, linkTargetId, linkProtocol)}
                        disabled={!linkTargetId}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        Connect
                      </button>
                    </div>
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

        {/* Add Component Modal Popover */}
        <AnimatePresence>
          {isAddNodeOpen && (
            <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-[#151926] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Add Architectural Component
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsAddNodeOpen(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddNode} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-mono text-neutral-500 uppercase text-[10px]">Component Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Read Replica DB, Secondary Redis, Kafka Stream"
                      value={newNodeLabel}
                      onChange={(e) => setNewNodeLabel(e.target.value)}
                      className="w-full p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-mono text-neutral-500 uppercase text-[10px]">Component Type</label>
                      <select
                        value={newNodeType}
                        onChange={(e) => setNewNodeType(e.target.value as NodeType)}
                        className="w-full p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                      >
                        <option value="cache">Cache</option>
                        <option value="database">Database</option>
                        <option value="service">Application Service</option>
                        <option value="queue">Message Queue</option>
                        <option value="load_balancer">Load Balancer</option>
                        <option value="cdn">CDN / Edge</option>
                        <option value="storage">Object Storage</option>
                        <option value="worker">Worker</option>
                        <option value="search">Search Index</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-neutral-500 uppercase text-[10px]">Primary Tech</label>
                      <input
                        type="text"
                        placeholder="e.g. Redis, Kafka, Postgres"
                        value={newNodeTech}
                        onChange={(e) => setNewNodeTech(e.target.value)}
                        className="w-full p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddNodeOpen(false)}
                      className="px-3 py-1.5 text-neutral-600 dark:text-neutral-400 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      Add Component
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Canvas Bottom Instructions Hint */}
        {!selectedNode && (
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs border border-neutral-200/80 dark:border-neutral-800 px-3 py-1.5 rounded-lg text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 pointer-events-none shadow-xs font-mono">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Drag nodes to reposition • Click to inspect • Hover to delete • Click &quot;De-congest&quot; to auto-space</span>
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
