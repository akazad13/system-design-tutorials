export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type SystemCategory = 
  | 'Social & Content'
  | 'Messaging & Real-time'
  | 'E-Commerce & Marketplaces'
  | 'Storage & Infrastructure'
  | 'Search & Big Data'
  | 'Financial & High Throughput';

export type NodeType = 'client' | 'dns' | 'cdn' | 'load_balancer' | 'gateway' | 'service' | 'cache' | 'database' | 'queue' | 'worker' | 'storage' | 'search';

export interface ArchitectureNode {
  id: string;
  label: string;
  type: NodeType;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  description: string;
  techStack?: string[];
  scaleMetric?: string;
  bottlenecks?: string[];
  iconName?: string;
}

export interface ArchitectureEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  protocol?: 'HTTPS' | 'gRPC' | 'WebSocket' | 'TCP' | 'Async Queue' | 'Internal RPC' | 'SQL' | 'NoSQL';
  isAsync?: boolean;
  bidirectional?: boolean;
  stepNumber?: number;
}

export interface RequestFlowStep {
  step: number;
  title: string;
  description: string;
  activeNodes: string[];
  activeEdgeId?: string;
  highlightDetails: string;
  latencyEstimate?: string;
}

export interface CapacityMetric {
  label: string;
  value: string;
  formula?: string;
  description: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
  headers?: string[];
}

export interface DatabaseSchema {
  tableName: string;
  type: 'SQL' | 'NoSQL Document' | 'NoSQL Key-Value' | 'Wide-Column' | 'Time-Series' | 'Graph' | 'Search' | 'Vector DB';
  fields: {
    name: string;
    type: string;
    isPrimary?: boolean;
    isIndex?: boolean;
    notes?: string;
  }[];
  shardingKey?: string;
  notes?: string;
}

export interface DeepDiveTopic {
  title: string;
  subtitle: string;
  content: string;
  keyTakeaways: string[];
  tradeoffs?: {
    optionA: string;
    optionB: string;
    prosA: string[];
    prosB: string[];
    decision: string;
  };
}

export interface InterviewCard {
  question: string;
  hint: string;
  goodAnswer: string;
  pitfalls: string;
}

export type InterviewQA = InterviewCard;

export type BottleneckAndMitigation = {
  bottleneck: string;
  impact: string;
  mitigation: string;
};

export type CapacityEstimation = {
  assumptions: string[];
  metrics: CapacityMetric[];
  conclusion: string;
};

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  category: SystemCategory;
  difficulty: DifficultyLevel;
  readTime: string;
  scaleSummary: {
    dau: string;
    qps: string;
    storage: string;
    bandwidth: string;
  };
  overview: string;
  keyChallenges: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  outOfScope: string[];
  capacityEstimations: CapacityEstimation;
  architecture: {
    summary: string;
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    flowSteps: RequestFlowStep[];
  };
  apiDesign: ApiEndpoint[];
  databaseDesign: DatabaseSchema[];
  deepDives: DeepDiveTopic[];
  bottlenecksAndMitigations: BottleneckAndMitigation[];
  interviewQA: InterviewQA[];
  similarSystems: string[];
  tags: string[];
}

export interface FundamentalTopic {
  id: string;
  title: string;
  category: 'Networking & Routing' | 'Compute & Proxies' | 'Caching & Memory' | 'Data Storage & Partitioning' | 'Asynchronous & Messaging' | 'Reliability & Scaling' | 'Search & Big Data';
  icon: string;
  summary: string;
  readTime: string;
  keyConcepts: {
    name: string;
    explanation: string;
    prosAndCons?: { pros: string[]; cons: string[] };
    codeSnippet?: string;
    visualExplanation?: string;
  }[];
  cheatSheet: string[];
  commonMistakes: string[];
  interviewTips: string[];
  diagram?: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    flowSteps: RequestFlowStep[];
  };
}
