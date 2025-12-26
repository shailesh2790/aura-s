/**
 * Memory Service - 4-Layer Scoped Memory for AURA OS
 *
 * Provides production-grade memory management with:
 * - 4 scopes: User, Org, Project, Run
 * - Automatic TTL expiration
 * - Access tracking and analytics
 * - Fast retrieval with relevance scoring
 *
 * Memory Hierarchy:
 * - User: Personal preferences, PM style, templates used
 * - Org: Team conventions, shared context, policies
 * - Project: Feature context, stakeholders, tech stack
 * - Run: Execution state, intermediate results, session data
 */

import { Memory, MemoryScope, MemoryType, MemoryContext } from '../../types/advanced';
import { eventStore } from './eventStore';
import { v4 as uuidv4 } from 'uuid';

// ============= MEMORY RETRIEVAL OPTIONS =============

interface MemoryQuery {
  scope?: MemoryScope | MemoryScope[];
  scope_id?: string | string[];
  key?: string;
  type?: MemoryType | MemoryType[];
  created_after?: number;
  limit?: number;
}

interface RetrievalOptions {
  scopes: MemoryScope[];
  scope_ids: Record<MemoryScope, string>; // e.g., { user: 'user123', project: 'proj456' }
  query?: string; // Semantic search query
  limit?: number;
}

// ============= MEMORY SERVICE =============

class MemoryService {
  private memories: Map<string, Memory>; // Map<memory_id, Memory>
  private indexByScope: Map<string, Set<string>>; // Map<scope:scope_id, Set<memory_id>>
  private indexByKey: Map<string, Set<string>>; // Map<key, Set<memory_id>>

  constructor() {
    this.memories = new Map();
    this.indexByScope = new Map();
    this.indexByKey = new Map();

    // Start TTL cleanup interval (every 60 seconds)
    setInterval(() => this.cleanupExpiredMemories(), 60000);
  }

  /**
   * Store memory in a specific scope
   */
  async set(
    scope: MemoryScope,
    scope_id: string,
    key: string,
    value: any,
    type: MemoryType = 'custom',
    ttl?: number
  ): Promise<Memory> {
    const memory: Memory = {
      id: uuidv4(),
      scope,
      scope_id,
      key,
      value,
      type,
      created_at: Date.now(),
      last_accessed: Date.now(),
      access_count: 0,
      ttl,
      metadata: {}
    };

    // Store memory
    this.memories.set(memory.id, memory);

    // Index by scope
    const scopeKey = `${scope}:${scope_id}`;
    if (!this.indexByScope.has(scopeKey)) {
      this.indexByScope.set(scopeKey, new Set());
    }
    this.indexByScope.get(scopeKey)!.add(memory.id);

    // Index by key
    if (!this.indexByKey.has(key)) {
      this.indexByKey.set(key, new Set());
    }
    this.indexByKey.get(key)!.add(memory.id);

    // Emit event
    await eventStore.append({
      id: uuidv4(),
      run_id: scope === 'run' ? scope_id : 'system',
      type: 'memory.created',
      timestamp: Date.now(),
      memory_id: memory.id,
      scope,
      key
    } as any);

    return memory;
  }

  /**
   * Get memory by exact key from specific scope
   */
  async get(scope: MemoryScope, scope_id: string, key: string): Promise<Memory | null> {
    const scopeKey = `${scope}:${scope_id}`;
    const memoryIds = this.indexByScope.get(scopeKey);
    if (!memoryIds) return null;

    for (const memoryId of memoryIds) {
      const memory = this.memories.get(memoryId);
      if (memory && memory.key === key && !this.isExpired(memory)) {
        this.trackAccess(memory);
        return memory;
      }
    }

    return null;
  }

  /**
   * Query memories with filters
   */
  async query(query: MemoryQuery): Promise<Memory[]> {
    let results: Memory[] = [];

    // Filter by scope
    if (query.scope) {
      const scopes = Array.isArray(query.scope) ? query.scope : [query.scope];
      const scopeIds = query.scope_id
        ? (Array.isArray(query.scope_id) ? query.scope_id : [query.scope_id])
        : undefined;

      for (const scope of scopes) {
        if (scopeIds) {
          for (const scopeId of scopeIds) {
            const scopeKey = `${scope}:${scopeId}`;
            const memoryIds = this.indexByScope.get(scopeKey) || new Set();
            for (const memoryId of memoryIds) {
              const memory = this.memories.get(memoryId);
              if (memory && !this.isExpired(memory)) {
                results.push(memory);
              }
            }
          }
        } else {
          // Get all memories for this scope (across all scope_ids)
          for (const [scopeKey, memoryIds] of this.indexByScope.entries()) {
            if (scopeKey.startsWith(`${scope}:`)) {
              for (const memoryId of memoryIds) {
                const memory = this.memories.get(memoryId);
                if (memory && !this.isExpired(memory)) {
                  results.push(memory);
                }
              }
            }
          }
        }
      }
    } else {
      // Get all memories
      results = Array.from(this.memories.values()).filter(m => !this.isExpired(m));
    }

    // Filter by key
    if (query.key) {
      results = results.filter(m => m.key === query.key);
    }

    // Filter by type
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      results = results.filter(m => types.includes(m.type));
    }

    // Filter by created_after
    if (query.created_after) {
      results = results.filter(m => m.created_at >= query.created_after!);
    }

    // Sort by last_accessed (most recent first)
    results.sort((a, b) => b.last_accessed - a.last_accessed);

    // Limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Retrieve memories across multiple scopes with relevance scoring
   * (Hierarchical retrieval: User > Org > Project > Run)
   */
  async retrieve(options: RetrievalOptions): Promise<MemoryContext[]> {
    const contexts: MemoryContext[] = [];

    for (const scope of options.scopes) {
      const scopeId = options.scope_ids[scope];
      if (!scopeId) continue;

      const scopeKey = `${scope}:${scopeId}`;
      const memoryIds = this.indexByScope.get(scopeKey) || new Set();

      for (const memoryId of memoryIds) {
        const memory = this.memories.get(memoryId);
        if (!memory || this.isExpired(memory)) continue;

        // Calculate relevance score (0-1)
        const relevance = this.calculateRelevance(memory, scope, options.query);

        if (relevance > 0.1) { // Threshold
          contexts.push({
            memory_id: memory.id,
            relevance_score: relevance,
            used_at: Date.now()
          });

          this.trackAccess(memory);
        }
      }
    }

    // Sort by relevance (descending)
    contexts.sort((a, b) => b.relevance_score - a.relevance_score);

    // Limit
    const limit = options.limit || 20;
    return contexts.slice(0, limit);
  }

  /**
   * Calculate relevance score for a memory
   */
  private calculateRelevance(memory: Memory, scope: MemoryScope, query?: string): number {
    let score = 0;

    // Scope weight (User > Org > Project > Run)
    const scopeWeights: Record<MemoryScope, number> = {
      user: 1.0,
      org: 0.9,
      project: 0.8,
      run: 0.7
    };
    score += scopeWeights[scope] || 0.5;

    // Recency (more recent = higher score)
    const ageMs = Date.now() - memory.last_accessed;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (ageDays / 30)); // Decay over 30 days
    score += recencyScore * 0.3;

    // Access frequency (more accessed = higher score)
    const frequencyScore = Math.min(1, memory.access_count / 10); // Cap at 10 accesses
    score += frequencyScore * 0.2;

    // Query match (simple keyword matching)
    if (query) {
      const keyMatch = memory.key.toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0;
      const valueMatch = JSON.stringify(memory.value).toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0;
      score += keyMatch + valueMatch;
    }

    return Math.min(1, score / 2); // Normalize to 0-1
  }

  /**
   * Delete memory
   */
  async delete(memory_id: string): Promise<boolean> {
    const memory = this.memories.get(memory_id);
    if (!memory) return false;

    // Remove from indexes
    const scopeKey = `${memory.scope}:${memory.scope_id}`;
    this.indexByScope.get(scopeKey)?.delete(memory_id);
    this.indexByKey.get(memory.key)?.delete(memory_id);

    // Remove memory
    this.memories.delete(memory_id);

    return true;
  }

  /**
   * Delete all memories in a scope
   */
  async deleteScope(scope: MemoryScope, scope_id: string): Promise<number> {
    const scopeKey = `${scope}:${scope_id}`;
    const memoryIds = this.indexByScope.get(scopeKey);
    if (!memoryIds) return 0;

    let deletedCount = 0;
    for (const memoryId of memoryIds) {
      if (await this.delete(memoryId)) {
        deletedCount++;
      }
    }

    this.indexByScope.delete(scopeKey);
    return deletedCount;
  }

  /**
   * Check if memory is expired
   */
  private isExpired(memory: Memory): boolean {
    if (!memory.ttl) return false;
    return Date.now() > (memory.created_at + memory.ttl);
  }

  /**
   * Track memory access
   */
  private trackAccess(memory: Memory): void {
    memory.last_accessed = Date.now();
    memory.access_count++;

    // Emit event
    eventStore.append({
      id: uuidv4(),
      run_id: memory.scope === 'run' ? memory.scope_id : 'system',
      type: 'memory.accessed',
      timestamp: Date.now(),
      memory_id: memory.id,
      scope: memory.scope
    } as any);
  }

  /**
   * Cleanup expired memories
   */
  private cleanupExpiredMemories(): void {
    let cleanedCount = 0;
    for (const [memoryId, memory] of this.memories.entries()) {
      if (this.isExpired(memory)) {
        this.delete(memoryId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[MemoryService] Cleaned up ${cleanedCount} expired memories`);
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    total_memories: number;
    by_scope: Record<MemoryScope, number>;
    by_type: Record<MemoryType, number>;
    total_size_bytes: number;
  } {
    const stats = {
      total_memories: this.memories.size,
      by_scope: { user: 0, org: 0, project: 0, run: 0 },
      by_type: { preference: 0, context: 0, learning: 0, cache: 0, session: 0, custom: 0 },
      total_size_bytes: 0
    };

    for (const memory of this.memories.values()) {
      if (!this.isExpired(memory)) {
        stats.by_scope[memory.scope]++;
        stats.by_type[memory.type]++;
        stats.total_size_bytes += JSON.stringify(memory.value).length;
      }
    }

    return stats;
  }

  /**
   * Clear all memories (for testing)
   */
  clear(): void {
    this.memories.clear();
    this.indexByScope.clear();
    this.indexByKey.clear();
  }
}

// ============= SINGLETON INSTANCE =============

export const memoryService = new MemoryService();

// ============= HELPER FUNCTIONS =============

/**
 * Store user preference
 */
export async function setUserPreference(user_id: string, key: string, value: any): Promise<Memory> {
  return memoryService.set('user', user_id, key, value, 'preference');
}

/**
 * Get user preference
 */
export async function getUserPreference(user_id: string, key: string): Promise<any> {
  const memory = await memoryService.get('user', user_id, key);
  return memory?.value;
}

/**
 * Store project context
 */
export async function setProjectContext(project_id: string, key: string, value: any): Promise<Memory> {
  return memoryService.set('project', project_id, key, value, 'context');
}

/**
 * Get project context
 */
export async function getProjectContext(project_id: string, key: string): Promise<any> {
  const memory = await memoryService.get('project', project_id, key);
  return memory?.value;
}

/**
 * Store run session data
 */
export async function setRunSession(run_id: string, key: string, value: any, ttl?: number): Promise<Memory> {
  return memoryService.set('run', run_id, key, value, 'session', ttl);
}

/**
 * Get run session data
 */
export async function getRunSession(run_id: string, key: string): Promise<any> {
  const memory = await memoryService.get('run', run_id, key);
  return memory?.value;
}

/**
 * Cache result with TTL
 */
export async function cacheResult(
  scope: MemoryScope,
  scope_id: string,
  key: string,
  value: any,
  ttl: number = 3600000 // 1 hour default
): Promise<Memory> {
  return memoryService.set(scope, scope_id, key, value, 'cache', ttl);
}

/**
 * Get cached result
 */
export async function getCachedResult(scope: MemoryScope, scope_id: string, key: string): Promise<any> {
  const memory = await memoryService.get(scope, scope_id, key);
  return memory?.value;
}

/**
 * Export for testing
 */
export { MemoryService };
