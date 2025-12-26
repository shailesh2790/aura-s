// AURA OS - Core Type System
// Based on Technical Architecture Document v0.1

// ============= CORE DOMAIN MODELS =============

export type FlowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'FAILED';
export type FlowRunStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'PAUSED' | 'CANCELLED';
export type NodeRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
export type NodeType = 'TRIGGER' | 'ACTION' | 'CONDITION' | 'AI_TASK' | 'LOOP' | 'PARALLEL' | 'AGENT';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';

// ============= AGENT SYSTEM =============

export type AgentRole =
  | 'conductor'      // High-level coordinator
  | 'planner'        // Workflow graph generation
  | 'executor'       // Tool/API execution
  | 'debugger'       // Error analysis & fixes
  | 'optimizer'      // Performance improvements
  | 'auditor'        // Security & compliance
  | 'self_healer'    // Incident remediation
  | 'thought_manager'; // Long-term learning

export interface Goal {
  id: string;
  description: string;
  constraints?: string[];
  successCriteria?: string[];
  context?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentState {
  flowRunId: string;
  currentNodeId?: string;
  goal: Goal;
  history: AgentAction[];
  context: Record<string, any>;
  incidents: Incident[];
  timestamp: number;
}

export interface AgentAction {
  agentRole: AgentRole;
  action: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  timestamp: number;
  durationMs?: number;
  tokensUsed?: number;
  success: boolean;
  error?: string;
}

export interface DecisionContext {
  flowId: string;
  decisionType: string;
  availableOptions: string[];
  historicalData?: Record<string, any>;
  constraints?: Record<string, any>;
}

// ============= WORKFLOW MODELS =============

export interface Flow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: FlowStatus;
  version: number;
  goal?: Goal;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: FlowTrigger[];
  variables: FlowVariable[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  flowId: string;
  type: NodeType;
  label: string;
  integrationId?: string;
  config: NodeConfig;
  position?: { x: number; y: number };
  retryPolicy?: RetryPolicy;
  timeout?: number;
  createdAt: number;
  updatedAt: number;
}

export interface NodeConfig {
  // For ACTION nodes
  action?: string;
  parameters?: Record<string, any>;

  // For CONDITION nodes
  condition?: ConditionExpression;

  // For AI_TASK nodes
  prompt?: string;
  model?: string;
  temperature?: number;

  // For LOOP nodes
  iterableSource?: string;
  maxIterations?: number;

  // Mappings
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;

  // Other
  [key: string]: any;
}

export interface ConditionExpression {
  operator: 'AND' | 'OR' | 'NOT';
  conditions?: ConditionRule[];
  expression?: string; // JSONPath or custom DSL
}

export interface ConditionRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'regex';
  value: any;
}

export interface WorkflowEdge {
  id: string;
  flowId: string;
  fromNodeId: string;
  toNodeId: string;
  condition?: ConditionExpression;
  label?: string;
  createdAt: number;
}

export interface FlowTrigger {
  id: string;
  flowId: string;
  type: 'webhook' | 'schedule' | 'event' | 'manual';
  config: TriggerConfig;
  enabled: boolean;
  createdAt: number;
}

export interface TriggerConfig {
  // For webhook triggers
  webhookPath?: string;
  webhookSecret?: string;

  // For schedule triggers
  cronExpression?: string;
  timezone?: string;

  // For event triggers
  eventSource?: string;
  eventType?: string;
  filters?: Record<string, any>;
}

export interface FlowVariable {
  id: string;
  flowId: string;
  key: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'secret';
  defaultValue?: any;
  encrypted: boolean;
}

// ============= EXECUTION MODELS =============

export interface FlowRun {
  id: string;
  flowId: string;
  tenantId: string;
  status: FlowRunStatus;
  triggeredBy: TriggerInfo;
  startedAt: number;
  finishedAt?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  errorSummary?: string;
  agentState?: AgentState;
  checkpoints: Checkpoint[];
  metrics: FlowRunMetrics;
}

export interface TriggerInfo {
  type: 'webhook' | 'schedule' | 'event' | 'manual' | 'replay';
  source?: string;
  triggeredBy?: string;
  payload?: Record<string, any>;
  timestamp: number;
}

export interface NodeRun {
  id: string;
  flowRunId: string;
  nodeId: string;
  status: NodeRunStatus;
  startedAt: number;
  finishedAt?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: ExecutionError;
  metrics: NodeRunMetrics;
  retryCount: number;
  logs: ExecutionLog[];
}

export interface ExecutionError {
  code: string;
  message: string;
  category?: ErrorCategory;
  recoverable: boolean;
  retryable: boolean;
  stackTrace?: string;
  context?: Record<string, any>;
}

export type ErrorCategory =
  | 'AUTH_EXPIRED'
  | 'RATE_LIMIT'
  | 'SCHEMA_MISMATCH'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_CONFIG'
  | 'DATA_VALIDATION'
  | 'INTEGRATION_ERROR'
  | 'UNKNOWN';

export interface ExecutionLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  agentRole?: AgentRole;
  data?: any;
}

export interface Checkpoint {
  id: string;
  flowRunId: string;
  nodeId: string;
  agentState: AgentState;
  timestamp: number;
  label?: string;
}

export interface FlowRunMetrics {
  totalDurationMs: number;
  nodesExecuted: number;
  nodesSucceeded: number;
  nodesFailed: number;
  nodesSkipped: number;
  tokensUsed: number;
  apiCallsTotal: number;
  costUsd?: number;
  bytesSent: number;
  bytesReceived: number;
}

export interface NodeRunMetrics {
  durationMs: number;
  tokensUsed?: number;
  apiCalls: number;
  costUsd?: number;
  bytesSent: number;
  bytesReceived: number;
  queueTimeMs?: number;
  executionTimeMs?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffType: 'exponential' | 'linear' | 'constant';
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrorCodes: string[];
}

// ============= INCIDENT & SELF-HEALING =============

export interface Incident {
  id: string;
  tenantId: string;
  flowId?: string;
  flowRunId?: string;
  nodeId?: string;
  severity: IncidentSeverity;
  category: ErrorCategory;
  status: IncidentStatus;
  title: string;
  description: string;
  rootCause?: RootCause;
  remediation?: Remediation;
  createdAt: number;
  acknowledgedAt?: number;
  resolvedAt?: number;
  metadata?: Record<string, any>;
}

export interface RootCause {
  category: ErrorCategory;
  confidence: number; // 0-1
  evidence: string[];
  relatedIncidents?: string[];
  analysis?: string; // LLM-generated explanation
}

export interface Remediation {
  type: 'auto' | 'manual' | 'escalate';
  action: RemediationAction;
  appliedAt?: number;
  appliedBy?: string;
  success?: boolean;
  result?: string;
}

export type RemediationAction =
  | { type: 'retry_with_backoff'; delayMs: number }
  | { type: 'refresh_credentials'; integrationId: string }
  | { type: 'update_config'; nodeId: string; newConfig: Record<string, any> }
  | { type: 'rollback_flow'; toVersion: number }
  | { type: 'pause_flow' }
  | { type: 'notify_user'; message: string; channel: string }
  | { type: 'escalate_to_human'; assignee?: string };

// ============= OPTIMIZATION =============

export interface OptimizationDecision {
  id: string;
  contextId: string;
  decisionType: string;
  chosenOption: string;
  alternatives: string[];
  confidence: number;
  timestamp: number;
  reward?: number;
  feedback?: string;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  type: 'planner' | 'executor' | 'provider' | 'retry' | 'cost';
  description: string;
  config: Record<string, any>;
  performance: StrategyPerformance;
}

export interface StrategyPerformance {
  totalRuns: number;
  successRate: number;
  averageLatencyMs: number;
  averageCostUsd: number;
  userSatisfaction?: number; // 0-1
  lastUpdated: number;
}

// ============= THOUGHT MANAGEMENT =============

export interface ThoughtLog {
  id: string;
  flowRunId: string;
  agentRole: AgentRole;
  thought: string;
  reasoning?: string;
  decision?: string;
  outcome?: string;
  timestamp: number;
  context: Record<string, any>;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: PlaybookTrigger;
  steps: PlaybookStep[];
  successCriteria: string[];
  learnedFrom: string[]; // ThoughtLog IDs
  useCount: number;
  successRate: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlaybookTrigger {
  incidentCategory?: ErrorCategory;
  flowPattern?: string;
  conditions?: ConditionRule[];
}

export interface PlaybookStep {
  order: number;
  action: RemediationAction;
  expectedOutcome: string;
  successCondition?: ConditionRule;
}

// ============= INTEGRATION MODELS =============

export interface Integration {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  type: 'api' | 'db' | 'webhook' | 'ai_model' | 'custom';
  configSchema: Record<string, any>; // JSONSchema
  actions: IntegrationAction[];
  triggers: IntegrationTrigger[];
  rateLimits?: RateLimits;
  authType: 'oauth2' | 'api_key' | 'jwt' | 'basic_auth' | 'custom';
  documentation?: string;
  createdAt: number;
}

export interface IntegrationAction {
  id: string;
  name: string;
  description: string;
  method?: string;
  endpoint?: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  requiresAuth: boolean;
  idempotent: boolean;
}

export interface IntegrationTrigger {
  id: string;
  name: string;
  description: string;
  type: 'webhook' | 'polling';
  pollIntervalMs?: number;
  schema: Record<string, any>;
}

export interface RateLimits {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  concurrentRequests?: number;
}

export interface IntegrationCredential {
  id: string;
  tenantId: string;
  integrationId: string;
  name: string;
  authType: string;
  encryptedCredentials: string; // Encrypted JSON
  expiresAt?: number;
  scopes?: string[];
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
}

// ============= TIME MACHINE (DEBUG REPLAY) =============

export interface ReplaySession {
  id: string;
  originalFlowRunId: string;
  fromCheckpointId?: string;
  modifications: ReplayModification[];
  status: 'PREPARING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  newFlowRunId?: string;
  createdBy: string;
  createdAt: number;
}

export interface ReplayModification {
  type: 'config_change' | 'decision_override' | 'skip_node' | 'force_branch';
  nodeId: string;
  description: string;
  oldValue?: any;
  newValue?: any;
}

// ============= MARKETPLACE =============

export interface MarketplaceTemplate {
  id: string;
  type: 'flow' | 'agent' | 'integration';
  name: string;
  description: string;
  longDescription: string;
  author: string;
  category: string;
  tags: string[];
  rating: number;
  installCount: number;
  verified: boolean;
  price?: number; // 0 = free

  // For flow templates
  flowDefinition?: Partial<Flow>;

  // For agent templates
  agentConfig?: Record<string, any>;

  // For integration templates
  integrationConfig?: Partial<Integration>;

  screenshots?: string[];
  documentation?: string;
  changelog?: ChangelogEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface ChangelogEntry {
  version: string;
  date: number;
  changes: string[];
}

// ============= TENANT & AUTH =============

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  limits: TenantLimits;
  settings: TenantSettings;
  createdAt: number;
  status: 'active' | 'suspended' | 'trial';
}

export interface TenantLimits {
  maxFlows: number;
  maxExecutionsPerMonth: number;
  maxIntegrations: number;
  maxTeamMembers: number;
  maxStorageMb: number;
}

export interface TenantSettings {
  timezone: string;
  defaultRetryPolicy?: RetryPolicy;
  selfHealingEnabled: boolean;
  optimizationEnabled: boolean;
  auditLogRetentionDays: number;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  createdAt: number;
  lastActiveAt?: number;
}

// ============= ANALYTICS & METRICS =============

export interface FlowAnalytics {
  flowId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: number;
  endDate: number;

  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;

  totalCost: number;
  totalTokens: number;
  totalApiCalls: number;

  errorRate: number;
  topErrors: ErrorFrequency[];
  slowestNodes: NodePerformance[];

  incidentCount: number;
  selfHealingSuccessRate: number;
}

export interface ErrorFrequency {
  errorCode: string;
  category: ErrorCategory;
  count: number;
  percentage: number;
  lastOccurrence: number;
}

export interface NodePerformance {
  nodeId: string;
  nodeName: string;
  averageDurationMs: number;
  p95DurationMs: number;
  executionCount: number;
  errorRate: number;
}

// ============= HELPER TYPES =============

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: Record<string, any>;
}
