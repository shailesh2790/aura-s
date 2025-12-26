
export type NodeType = 'agent' | 'tool' | 'router' | 'start' | 'end';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  data: {
    role?: string;
    goal?: string;
    description?: string;
    codeSnippet?: string;
    tools?: string[];
  };
  // Visual coordinates
  x?: number;
  y?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string; // For conditional edges (e.g., "continues", "ends")
  type?: 'default' | 'conditional';
}

export interface CodeFile {
  filename: string;
  language: string;
  content: string;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  summary: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  files: CodeFile[];
  optimizationScore?: number; // 0-100
  version?: number;
}

export interface ExecutionStep {
  nodeId: string;
  output: string;
  timestamp: number;
  status: 'running' | 'completed' | 'failed';
  stateSnapshot?: string; // JSON string of the LangGraph state
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'url';
  dateAdded: number;
}

export interface DashboardStat {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  icon: any;
  color: string;
}

export interface RecentFlow {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'failed';
  lastRun: number; // timestamp
  agents: number;
}

export interface Integration {
  id: string;
  name: string;
  category: 'Communication' | 'CRM' | 'Database' | 'Productivity';
  connected: boolean;
  icon: string;
  description: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  complexity: 'Simple' | 'Medium' | 'Complex';
  icon: any;
}
