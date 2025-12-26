// Advanced Types for Production-Grade Automation Platform

// ============= API INTEGRATIONS =============

export interface APICredential {
  id: string;
  integrationId: string;
  name: string;
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'bearer_token';
  encrypted: boolean;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    password?: string;
    customHeaders?: Record<string, string>;
  };
  expiresAt?: number;
  createdAt: number;
  lastUsed?: number;
}

export interface APIIntegration {
  id: string;
  name: string;
  category: 'Communication' | 'CRM' | 'Database' | 'Productivity' | 'E-commerce' | 'Marketing' | 'Analytics' | 'Payment' | 'AI';
  icon: string;
  description: string;
  connected: boolean;
  credentialId?: string;
  baseUrl: string;
  rateLimits?: {
    requestsPerSecond?: number;
    requestsPerMinute?: number;
    requestsPerHour?: number;
  };
  actions: APIAction[];
  triggers: APITrigger[];
  authType: 'oauth2' | 'api_key' | 'basic_auth' | 'bearer_token';
  documentation?: string;
}

export interface APIAction {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  parameters: APIParameter[];
  requestBody?: APIParameter[];
  responseSchema?: Record<string, any>;
  requiresAuth: boolean;
  rateLimit?: number;
}

export interface APITrigger {
  id: string;
  name: string;
  description: string;
  type: 'webhook' | 'polling' | 'schedule';
  pollInterval?: number; // For polling triggers (in ms)
  webhookPath?: string;
  schema?: Record<string, any>;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  required: boolean;
  description: string;
  default?: any;
  enum?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    format?: string;
  };
}

// ============= WORKFLOW EXECUTION =============

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  trigger: ExecutionTrigger;
  steps: ExecutionStepDetail[];
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: ExecutionError;
  retryCount: number;
  maxRetries: number;
  parentExecutionId?: string; // For sub-workflows
  cost?: number; // AI token cost
  metadata: Record<string, any>;
}

export interface ExecutionTrigger {
  type: 'manual' | 'webhook' | 'schedule' | 'api' | 'event';
  source?: string;
  triggeredBy?: string;
  payload?: Record<string, any>;
  timestamp: number;
}

export interface ExecutionStepDetail {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: ExecutionError;
  retries: number;
  logs: ExecutionLog[];
  metrics?: {
    tokensUsed?: number;
    apiCalls?: number;
    dataProcessed?: number;
  };
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
  suggestedFix?: string;
  stackTrace?: string;
}

export interface ExecutionLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

// ============= SELF-HEALING & RETRY =============

export interface RetryPolicy {
  maxRetries: number;
  backoffType: 'exponential' | 'linear' | 'constant';
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  retryableErrors: string[]; // Error codes that should trigger retry
  timeout: number; // ms
}

export interface SelfHealingAction {
  triggeredBy: ExecutionError;
  action: 'retry' | 'skip' | 'fallback' | 'human_intervention';
  timestamp: number;
  success: boolean;
  details: string;
  aiAnalysis?: string;
}

// ============= WORKFLOW FEATURES =============

export interface ConditionalBranch {
  id: string;
  conditions: BranchCondition[];
  operator: 'AND' | 'OR';
  truePath: string; // Node ID
  falsePath?: string; // Node ID
}

export interface BranchCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists' | 'regex';
  value: any;
  type: 'string' | 'number' | 'boolean';
}

export interface DataTransformation {
  id: string;
  name: string;
  type: 'map' | 'filter' | 'reduce' | 'custom';
  input: string; // JSONPath or variable name
  output: string;
  transformation: string | TransformFunction;
  errorHandling: 'skip' | 'fail' | 'default';
  defaultValue?: any;
}

export type TransformFunction = (input: any) => any;

export interface LoopNode {
  id: string;
  iterableSource: string; // Variable path
  itemVariable: string;
  maxIterations?: number;
  parallelExecution: boolean;
  breakCondition?: BranchCondition[];
}

// ============= SCHEDULING & TRIGGERS =============

export interface ScheduleTrigger {
  id: string;
  workflowId: string;
  enabled: boolean;
  schedule: CronSchedule | IntervalSchedule;
  timezone: string;
  lastRun?: number;
  nextRun: number;
  runCount: number;
}

export interface CronSchedule {
  type: 'cron';
  expression: string; // e.g., "0 9 * * 1-5" (9 AM weekdays)
  description?: string;
}

export interface IntervalSchedule {
  type: 'interval';
  value: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface WebhookTrigger {
  id: string;
  workflowId: string;
  path: string; // Unique webhook URL path
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  enabled: boolean;
  authentication: 'none' | 'api_key' | 'hmac' | 'oauth';
  secret?: string;
  responseMode: 'sync' | 'async';
  createdAt: number;
  lastTriggered?: number;
  triggerCount: number;
}

// ============= MONITORING & ANALYTICS =============

export interface WorkflowMetrics {
  workflowId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  p95Duration: number;
  p99Duration: number;
  totalCost: number;
  errorRate: number;
  throughput: number; // Executions per minute
  topErrors: ErrorFrequency[];
  slowestSteps: StepPerformance[];
}

export interface ErrorFrequency {
  errorCode: string;
  message: string;
  count: number;
  percentage: number;
  lastOccurrence: number;
}

export interface StepPerformance {
  nodeId: string;
  nodeName: string;
  averageDuration: number;
  p95Duration: number;
  executionCount: number;
}

export interface Alert {
  id: string;
  workflowId?: string;
  type: 'execution_failed' | 'high_error_rate' | 'slow_execution' | 'quota_exceeded' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  notificationSent: boolean;
}

// ============= ENVIRONMENT & CONFIGURATION =============

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  encrypted: boolean;
  description?: string;
  scope: 'global' | 'workflow_specific';
  workflowId?: string;
  createdAt: number;
  lastModified: number;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  definition: any; // Full workflow definition
  createdAt: number;
  createdBy: string;
  changeNotes?: string;
  published: boolean;
}

// ============= TESTING =============

export interface WorkflowTest {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  testCases: TestCase[];
  createdAt: number;
  lastRun?: number;
  passRate?: number;
}

export interface TestCase {
  id: string;
  name: string;
  input: Record<string, any>;
  expectedOutput: Record<string, any>;
  assertions: Assertion[];
  status?: 'passed' | 'failed' | 'skipped';
  actualOutput?: Record<string, any>;
  error?: string;
  duration?: number;
}

export interface Assertion {
  type: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'matches_regex' | 'custom';
  path: string; // JSONPath to field
  expected: any;
  actual?: any;
  passed?: boolean;
}

// ============= BUSINESS TEMPLATES =============

export interface BusinessTemplate {
  id: string;
  name: string;
  category: 'e-commerce' | 'saas' | 'customer-support' | 'marketing' | 'sales' | 'operations' | 'finance';
  description: string;
  longDescription: string;
  useCase: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // minutes
  requiredIntegrations: string[];
  optionalIntegrations: string[];
  workflow: any; // Pre-built workflow definition
  configuration: TemplateConfig[];
  roi?: string; // Estimated ROI description
  testimonials?: Testimonial[];
  icon: string;
  thumbnail?: string;
  tags: string[];
  popularity: number;
  createdAt: number;
}

export interface TemplateConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'integration' | 'credential';
  required: boolean;
  description: string;
  default?: any;
  options?: { label: string; value: any }[];
  validation?: any;
}

export interface Testimonial {
  company: string;
  role: string;
  quote: string;
  metrics?: string; // e.g., "Saved 20 hours/week"
}

// ============= REAL-WORLD INTEGRATIONS =============

export const REAL_INTEGRATIONS: APIIntegration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payment',
    icon: '💳',
    description: 'Payment processing and subscription management',
    connected: false,
    baseUrl: 'https://api.stripe.com/v1',
    authType: 'bearer_token',
    actions: [],
    triggers: [],
    rateLimits: { requestsPerSecond: 25 }
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'Communication',
    icon: '📱',
    description: 'SMS, voice, and WhatsApp messaging',
    connected: false,
    baseUrl: 'https://api.twilio.com/2010-04-01',
    authType: 'basic_auth',
    actions: [],
    triggers: []
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'Communication',
    icon: '📧',
    description: 'Transactional and marketing emails',
    connected: false,
    baseUrl: 'https://api.sendgrid.com/v3',
    authType: 'bearer_token',
    actions: [],
    triggers: []
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'E-commerce',
    icon: '🛍️',
    description: 'E-commerce platform integration',
    connected: false,
    baseUrl: 'https://{{shop}}.myshopify.com/admin/api/2024-01',
    authType: 'oauth2',
    actions: [],
    triggers: []
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    icon: '🎯',
    description: 'CRM and marketing automation',
    connected: false,
    baseUrl: 'https://api.hubapi.com',
    authType: 'oauth2',
    actions: [],
    triggers: []
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    icon: '💬',
    description: 'Team communication and notifications',
    connected: false,
    baseUrl: 'https://slack.com/api',
    authType: 'bearer_token',
    actions: [],
    triggers: []
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    icon: '📝',
    description: 'Knowledge base and project management',
    connected: false,
    baseUrl: 'https://api.notion.com/v1',
    authType: 'bearer_token',
    actions: [],
    triggers: []
  },
  {
    id: 'airtable',
    name: 'Airtable',
    category: 'Database',
    icon: '📊',
    description: 'Cloud-based database and spreadsheet',
    connected: false,
    baseUrl: 'https://api.airtable.com/v0',
    authType: 'bearer_token',
    actions: [],
    triggers: []
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    category: 'Productivity',
    icon: '📈',
    description: 'Spreadsheet data management',
    connected: false,
    baseUrl: 'https://sheets.googleapis.com/v4',
    authType: 'oauth2',
    actions: [],
    triggers: []
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'AI',
    icon: '🤖',
    description: 'GPT models and AI capabilities',
    connected: false,
    baseUrl: 'https://api.openai.com/v1',
    authType: 'bearer_token',
    actions: [],
    triggers: []
  }
];

// ============= AURA OS RUNTIME SYSTEM (Production-Grade) =============

// ============= CORE INTENT & PLAN =============

export interface Intent {
  raw: string; // Original user input
  parsed: {
    type: 'prd' | 'competitive_analysis' | 'jira_epic' | 'sprint_report' | 'research' | 'custom';
    goal: string;
    entities: {
      feature?: string;
      competitors?: string[];
      jira_project?: string;
      sprint?: string;
      deadline?: string;
    };
    constraints?: {
      budget?: number; // Token budget
      max_duration?: number; // ms
      approval_required?: boolean;
    };
  };
  confidence: number; // 0-1
  timestamp: number;
}

export interface Plan {
  id: string;
  run_id: string;
  intent: Intent;
  dag: DAG;
  estimated_cost: number;
  estimated_duration: number; // ms
  requires_approval: boolean;
  created_at: number;
  approved_at?: number;
  approved_by?: string;
}

export interface DAG {
  nodes: PlanNode[];
  edges: PlanEdge[];
  entry_node_id: string;
  exit_node_ids: string[];
}

export interface PlanNode {
  id: string;
  type: 'tool_call' | 'llm_call' | 'verification' | 'approval_gate' | 'parallel_group';
  tool?: string; // e.g., 'jira.create_issue', 'web.scrape', 'llm.gpt4'
  params: Record<string, any>;
  depends_on: string[]; // Node IDs
  retry_policy: RetryConfig;
  timeout: number; // ms
  idempotency_key?: string;
}

export interface PlanEdge {
  from: string;
  to: string;
  condition?: EdgeCondition;
}

export interface EdgeCondition {
  type: 'success' | 'failure' | 'custom';
  expression?: string; // For custom conditions
}

// ============= RUN & EXECUTION =============

export interface Run {
  id: string;
  project_id: string;
  user_id: string;
  intent: Intent;
  plan: Plan;
  status: RunStatus;
  started_at: number;
  completed_at?: number;
  paused_at?: number;
  cost: number; // Cumulative token cost
  artifacts: Artifact[];
  events: Event[];
  current_snapshot?: Snapshot;
  error?: RunError;
  metadata: {
    source: 'dashboard' | 'api' | 'schedule' | 'webhook';
    parent_run_id?: string;
    tags?: string[];
  };
}

export type RunStatus =
  | 'pending'      // Created, waiting for approval
  | 'approved'     // Approved, ready to execute
  | 'running'      // Executing
  | 'verifying'    // Post-execution verification
  | 'paused'       // Paused (approval gate or error)
  | 'completed'    // Successfully completed
  | 'failed'       // Failed (exhausted retries)
  | 'cancelled';   // User cancelled

export interface Step {
  id: string;
  run_id: string;
  node_id: string; // References PlanNode.id
  status: StepStatus;
  started_at?: number;
  completed_at?: number;
  attempt: number;
  max_attempts: number;
  tool_calls: ToolCall[];
  output?: any;
  error?: StepError;
  cost: number;
  idempotency_key?: string;
}

export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'skipped';

export interface ToolCall {
  id: string;
  step_id: string;
  tool: string; // e.g., 'jira.create_issue'
  params: Record<string, any>;
  started_at: number;
  completed_at?: number;
  response?: any;
  error?: ToolError;
  cached: boolean; // Was result cached?
  cache_key?: string;
}

// ============= ARTIFACTS & EVIDENCE =============

export interface Artifact {
  id: string;
  run_id: string;
  type: ArtifactType;
  content: any; // JSON content (PRD, analysis, etc.)
  hash: string; // Content hash for deduplication
  verification: VerificationResult;
  provenance: Provenance;
  created_at: number;
  url?: string; // External URL if pushed to Notion/Jira
}

export type ArtifactType =
  | 'prd'
  | 'competitive_analysis'
  | 'jira_epic'
  | 'sprint_report'
  | 'research_doc'
  | 'custom';

export interface Provenance {
  evidence_ids: string[];
  tool_calls: ToolCall[];
  input_artifact_ids: string[]; // If derived from other artifacts
  memory_context: MemoryContext[];
}

export interface Evidence {
  id: string;
  run_id: string;
  type: 'web_scrape' | 'api_response' | 'llm_output' | 'user_input' | 'memory_retrieval';
  source: string; // URL, API endpoint, etc.
  content: any;
  retrieved_at: number;
  hash: string;
  metadata?: Record<string, any>;
}

// ============= VERIFICATION =============

export interface VerificationResult {
  status: 'passed' | 'failed' | 'warning';
  score: number; // 0-100
  checks: VerificationCheck[];
  verified_at: number;
  verifier_version: string;
}

export interface VerificationCheck {
  type: 'schema' | 'llm_quality' | 'policy' | 'custom';
  name: string;
  passed: boolean;
  score?: number;
  message?: string;
  details?: any;
}

// Schema Verification
export interface SchemaVerifier {
  artifact_type: ArtifactType;
  schema: any; // Zod schema
  required_fields: string[];
  optional_fields: string[];
}

// LLM Quality Verification
export interface LLMQualityCheck {
  criteria: QualityCriteria[];
  model: string; // e.g., 'gpt-4o-mini'
  threshold: number; // 0-100
}

export interface QualityCriteria {
  dimension: 'completeness' | 'clarity' | 'specificity' | 'feasibility' | 'pm_quality';
  weight: number; // 0-1
  prompt: string;
}

// Policy Verification
export interface Policy {
  id: string;
  name: string;
  type: 'approval_required' | 'cost_limit' | 'time_limit' | 'content_filter' | 'custom';
  rules: PolicyRule[];
  enabled: boolean;
  scope: 'global' | 'project' | 'user';
  scope_id?: string;
}

export interface PolicyRule {
  condition: string; // Expression: e.g., "artifact.type === 'prd' && run.cost > 1000"
  action: 'block' | 'warn' | 'require_approval' | 'notify';
  message: string;
}

// ============= MEMORY SYSTEM =============

export interface Memory {
  id: string;
  scope: MemoryScope;
  scope_id: string; // user_id, org_id, project_id, or run_id
  key: string;
  value: any;
  type: MemoryType;
  created_at: number;
  last_accessed: number;
  access_count: number;
  ttl?: number; // Time to live in ms
  metadata?: Record<string, any>;
}

export type MemoryScope = 'user' | 'org' | 'project' | 'run';

export type MemoryType =
  | 'preference'        // User preferences
  | 'context'          // Project context
  | 'learning'         // Learned patterns
  | 'cache'            // Cached results
  | 'session'          // Run-scoped data
  | 'custom';

export interface MemoryContext {
  memory_id: string;
  relevance_score: number; // 0-1
  used_at: number;
}

// ============= EVENTS (Append-Only Log) =============

export type Event =
  | RunStartedEvent
  | RunApprovedEvent
  | RunCompletedEvent
  | RunFailedEvent
  | RunPausedEvent
  | RunCancelledEvent
  | StepStartedEvent
  | StepCompletedEvent
  | StepFailedEvent
  | StepRetryingEvent
  | ToolCalledEvent
  | ToolCompletedEvent
  | ToolFailedEvent
  | VerificationStartedEvent
  | VerificationCompletedEvent
  | VerificationFailedEvent
  | ArtifactCreatedEvent
  | ArtifactVerifiedEvent
  | EvidenceCollectedEvent
  | ApprovalRequestedEvent
  | ApprovalGrantedEvent
  | ApprovalDeniedEvent
  | MemoryAccessedEvent
  | MemoryCreatedEvent
  | PolicyViolationEvent
  | CostLimitWarningEvent
  | ReplanTriggeredEvent
  | SnapshotCreatedEvent;

export interface BaseEvent {
  id: string;
  run_id: string;
  type: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface RunStartedEvent extends BaseEvent {
  type: 'run.started';
  plan: Plan;
}

export interface RunApprovedEvent extends BaseEvent {
  type: 'run.approved';
  approved_by: string;
}

export interface RunCompletedEvent extends BaseEvent {
  type: 'run.completed';
  duration: number;
  cost: number;
  artifact_ids: string[];
}

export interface RunFailedEvent extends BaseEvent {
  type: 'run.failed';
  error: RunError;
  final_status: string;
}

export interface RunPausedEvent extends BaseEvent {
  type: 'run.paused';
  reason: 'approval_gate' | 'error' | 'user_action';
  pausedAt: string; // Node ID
}

export interface RunCancelledEvent extends BaseEvent {
  type: 'run.cancelled';
  cancelled_by: string;
  reason?: string;
}

export interface StepStartedEvent extends BaseEvent {
  type: 'step.started';
  step_id: string;
  node_id: string;
  attempt: number;
}

export interface StepCompletedEvent extends BaseEvent {
  type: 'step.completed';
  step_id: string;
  duration: number;
  output: any;
}

export interface StepFailedEvent extends BaseEvent {
  type: 'step.failed';
  step_id: string;
  error: StepError;
  will_retry: boolean;
}

export interface StepRetryingEvent extends BaseEvent {
  type: 'step.retrying';
  step_id: string;
  attempt: number;
  max_attempts: number;
  next_retry_at: number;
}

export interface ToolCalledEvent extends BaseEvent {
  type: 'tool.called';
  tool_call_id: string;
  tool: string;
  params: Record<string, any>;
}

export interface ToolCompletedEvent extends BaseEvent {
  type: 'tool.completed';
  tool_call_id: string;
  duration: number;
  cached: boolean;
}

export interface ToolFailedEvent extends BaseEvent {
  type: 'tool.failed';
  tool_call_id: string;
  error: ToolError;
}

export interface VerificationStartedEvent extends BaseEvent {
  type: 'verification.started';
  artifact_id: string;
  verifier_type: string;
}

export interface VerificationCompletedEvent extends BaseEvent {
  type: 'verification.completed';
  artifact_id: string;
  result: VerificationResult;
}

export interface VerificationFailedEvent extends BaseEvent {
  type: 'verification.failed';
  artifact_id: string;
  checks_failed: string[];
}

export interface ArtifactCreatedEvent extends BaseEvent {
  type: 'artifact.created';
  artifact_id: string;
  artifact_type: ArtifactType;
  hash: string;
}

export interface ArtifactVerifiedEvent extends BaseEvent {
  type: 'artifact.verified';
  artifact_id: string;
  verification_score: number;
}

export interface EvidenceCollectedEvent extends BaseEvent {
  type: 'evidence.collected';
  evidence_id: string;
  source: string;
  type: string;
}

export interface ApprovalRequestedEvent extends BaseEvent {
  type: 'approval.requested';
  artifact_id?: string;
  reason: string;
}

export interface ApprovalGrantedEvent extends BaseEvent {
  type: 'approval.granted';
  approved_by: string;
}

export interface ApprovalDeniedEvent extends BaseEvent {
  type: 'approval.denied';
  denied_by: string;
  reason: string;
}

export interface MemoryAccessedEvent extends BaseEvent {
  type: 'memory.accessed';
  memory_id: string;
  scope: MemoryScope;
}

export interface MemoryCreatedEvent extends BaseEvent {
  type: 'memory.created';
  memory_id: string;
  scope: MemoryScope;
  key: string;
}

export interface PolicyViolationEvent extends BaseEvent {
  type: 'policy.violation';
  policy_id: string;
  rule: PolicyRule;
  action_taken: string;
}

export interface CostLimitWarningEvent extends BaseEvent {
  type: 'cost.limit_warning';
  current_cost: number;
  budget: number;
  percentage: number;
}

export interface ReplanTriggeredEvent extends BaseEvent {
  type: 'replan.triggered';
  reason: string;
  failed_node_id: string;
  new_plan_id?: string;
}

export interface SnapshotCreatedEvent extends BaseEvent {
  type: 'snapshot.created';
  snapshot_id: string;
}

// ============= ERRORS =============

export interface RunError {
  code: string;
  message: string;
  failed_at_node?: string;
  recoverable: boolean;
  timestamp: number;
  stack_trace?: string;
}

export interface StepError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
}

export interface ToolError {
  code: string;
  message: string;
  http_status?: number;
  api_error?: any;
  timestamp: number;
}

// ============= RETRY & IDEMPOTENCY =============

export interface RetryConfig {
  max_attempts: number;
  initial_delay: number; // ms
  max_delay: number; // ms
  backoff_multiplier: number; // 2.0 for exponential
  retryable_errors: string[]; // Error codes
}

export interface IdempotencyKey {
  key: string;
  run_id: string;
  step_id: string;
  tool: string;
  params_hash: string;
  created_at: number;
  response?: any;
  expires_at: number; // TTL: 24 hours
}

// ============= SNAPSHOTS (For Replay) =============

export interface Snapshot {
  id: string;
  run_id: string;
  created_at: number;
  state: {
    current_node_id: string;
    completed_steps: string[];
    pending_steps: string[];
    variables: Record<string, any>;
    memory_snapshot: Memory[];
    events_count: number;
  };
}

// ============= METRICS =============

export interface RunMetrics {
  run_id: string;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  total_duration: number;
  total_cost: number;
  verification_score?: number;
  retry_count: number;
  cache_hit_rate: number;
  events_emitted: number;
}

export interface SystemMetrics {
  period: 'hour' | 'day' | 'week';
  runs_started: number;
  runs_completed: number;
  runs_failed: number;
  run_start_success_rate: number; // Target: 99.5%
  avg_run_duration: number;
  p95_run_duration: number;
  total_cost: number;
  total_artifacts_created: number;
  verification_pass_rate: number;
  avg_verification_score: number;
  top_errors: ErrorFrequency[];
  cache_hit_rate: number;
}
