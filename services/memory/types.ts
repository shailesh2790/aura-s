/**
 * Memory System Types
 *
 * Based on "Memory in the Age of AI Agents" (arXiv:2512.13564)
 * Three-dimensional framework: Forms, Functions, Dynamics
 */

// ============================================================================
// FORMS: Storage Medium
// ============================================================================

/**
 * Token-Level Memory: Explicit, discrete storage
 * Stored in database as structured records
 */
export interface FactualMemory {
  id: string;
  userId: string;
  type: 'fact' | 'rule' | 'entity' | 'relation' | 'preference';
  content: string;
  source: string; // Where this memory came from
  confidence: number; // 0-1 confidence score
  timestamp: Date;
  tags: string[];
  embedding?: number[]; // For semantic search
  metadata?: Record<string, any>;
}

/**
 * Experiential Memory: Skills and insights from interactions
 * Learning from success and failure
 */
export interface ExperientialMemory {
  id: string;
  userId: string;
  type: 'success' | 'failure' | 'pattern' | 'lesson' | 'optimization';
  context: string; // What was the situation
  action: string; // What action was taken
  outcome: string; // What happened
  reflection: string; // What was learned
  learnedSkills: string[]; // New capabilities gained
  timestamp: Date;
  importance: number; // 0-1 for selective retention
  relatedMemories: string[]; // IDs of related memories
  metadata?: Record<string, any>;
}

/**
 * Working Memory: Active context during task execution
 * Short-lived, in-memory state
 */
export interface WorkingMemory {
  userId: string;
  sessionId: string;
  currentGoal: string;
  activeContext: Map<string, any>;
  recentEvents: Array<{
    type: string;
    data: any;
    timestamp: Date;
  }>;
  attention: string[]; // What to focus on
  planningState: {
    hypothesis: string[];
    nextActions: string[];
    uncertainties: string[];
    blockers: string[];
  };
  timestamp: Date;
}

// ============================================================================
// FUNCTIONS: Purpose-based categorization
// ============================================================================

export type MemoryFunction = 'factual' | 'experiential' | 'working';

export interface Memory {
  id: string;
  function: MemoryFunction;
  data: FactualMemory | ExperientialMemory | WorkingMemory;
}

// ============================================================================
// DYNAMICS: Lifecycle operations
// ============================================================================

/**
 * Formation: How memories are extracted and encoded
 */
export interface MemoryFormationConfig {
  autoExtract: boolean; // Automatically extract from events
  extractionInterval: number; // ms between extractions
  minImportance: number; // Minimum importance to store
  llmEnabled: boolean; // Use LLM for synthesis
}

/**
 * Evolution: How memories consolidate and decay
 */
export interface MemoryEvolutionConfig {
  consolidationEnabled: boolean;
  consolidationInterval: number; // ms between consolidation runs
  importanceThreshold: number; // Below this, memories are pruned
  maxAge: number; // Max age in ms before pruning
  patternExtractionEnabled: boolean;
}

/**
 * Retrieval: How memories are accessed
 */
export interface MemoryRetrievalConfig {
  semanticSearchEnabled: boolean;
  temporalDecayEnabled: boolean;
  temporalHalfLife: number; // ms for temporal decay
  maxResults: number;
  minRelevanceScore: number;
}

// ============================================================================
// PROACTIVE BEHAVIOR
// ============================================================================

/**
 * Proactive Action: Autonomous action suggested/executed by agent
 */
export interface ProactiveAction {
  id: string;
  type: 'suggestion' | 'reminder' | 'optimization' | 'learning' | 'automation';
  title: string;
  description: string;
  rationale: string; // Why this action is suggested
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact: number; // 0-1 expected value
  requiredApproval: boolean;
  status: 'suggested' | 'approved' | 'executing' | 'completed' | 'rejected';
  createdAt: Date;
  scheduledFor?: Date;
  completedAt?: Date;
  outcome?: string;
  metadata?: Record<string, any>;
}

/**
 * Reflection: Periodic self-analysis of performance
 */
export interface Reflection {
  id: string;
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRuns: number;
    successRate: number;
    topPatterns: string[];
    improvements: string[];
    challenges: string[];
  };
  insights: string[];
  actionsProposed: ProactiveAction[];
  timestamp: Date;
}

/**
 * Capability: A skill or ability the agent has learned
 */
export interface Capability {
  id: string;
  name: string;
  description: string;
  type: 'tool' | 'pattern' | 'workflow' | 'knowledge';
  learnedAt: Date;
  proficiency: number; // 0-1 skill level
  usageCount: number;
  successRate: number;
  relatedMemories: string[]; // Experiential memories
  metadata?: Record<string, any>;
}

// ============================================================================
// QUERIES AND FILTERS
// ============================================================================

export interface MemoryQuery {
  userId: string;
  function?: MemoryFunction;
  type?: string;
  tags?: string[];
  minConfidence?: number;
  minImportance?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  semanticQuery?: string; // For vector search
  limit?: number;
  offset?: number;
}

export interface MemorySearchResult {
  memory: Memory;
  relevanceScore: number;
  retrievalReason: string;
}

// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

export interface MemoryStats {
  totalMemories: number;
  byFunction: Record<MemoryFunction, number>;
  byType: Record<string, number>;
  avgConfidence: number;
  avgImportance: number;
  oldestMemory: Date;
  newestMemory: Date;
  consolidatedCount: number;
  prunedCount: number;
}

export interface AgentPerformanceMetrics {
  period: {
    start: Date;
    end: Date;
  };
  totalRuns: number;
  successRate: number;
  avgRunTime: number;
  memoriesFormed: number;
  memoriesConsolidated: number;
  capabilitiesLearned: number;
  proactiveActionsExecuted: number;
  proactiveSuccessRate: number;
}
