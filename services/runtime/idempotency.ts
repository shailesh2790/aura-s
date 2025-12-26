/**
 * Idempotency Service - Deduplication and Replay Protection
 *
 * Provides production-grade idempotency with:
 * - Deterministic key generation (hash of tool + params)
 * - 24-hour TTL for idempotency keys
 * - Automatic deduplication of identical requests
 * - Support for "at-least-once" semantics
 *
 * Use Cases:
 * - Prevent duplicate Jira tickets on retry
 * - Cache expensive LLM calls
 * - Ensure exactly-once delivery of notifications
 */

import { IdempotencyKey, ToolCall } from '../../types/advanced';
import { v4 as uuidv4 } from 'uuid';

// ============= IDEMPOTENCY SERVICE =============

class IdempotencyService {
  private keys: Map<string, IdempotencyKey>; // Map<key, IdempotencyKey>
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.keys = new Map();

    // Start cleanup interval (every 5 minutes)
    setInterval(() => this.cleanupExpiredKeys(), 5 * 60 * 1000);
  }

  /**
   * Generate idempotency key for a tool call
   */
  generateKey(run_id: string, step_id: string, tool: string, params: Record<string, any>): string {
    // Create deterministic hash of params
    const paramsHash = this.hashParams(params);

    // Combine components
    const key = `${run_id}:${step_id}:${tool}:${paramsHash}`;

    return key;
  }

  /**
   * Check if operation is duplicate (returns cached response if exists)
   */
  async checkDuplicate(key: string): Promise<{ isDuplicate: boolean; response?: any }> {
    const idempotencyKey = this.keys.get(key);

    if (!idempotencyKey) {
      return { isDuplicate: false };
    }

    // Check if expired
    if (Date.now() > idempotencyKey.expires_at) {
      this.keys.delete(key);
      return { isDuplicate: false };
    }

    // Return cached response
    return {
      isDuplicate: true,
      response: idempotencyKey.response
    };
  }

  /**
   * Store idempotency key with response
   */
  async store(
    key: string,
    run_id: string,
    step_id: string,
    tool: string,
    params: Record<string, any>,
    response: any,
    ttl?: number
  ): Promise<void> {
    const paramsHash = this.hashParams(params);
    const expiresAt = Date.now() + (ttl || this.DEFAULT_TTL);

    const idempotencyKey: IdempotencyKey = {
      key,
      run_id,
      step_id,
      tool,
      params_hash: paramsHash,
      created_at: Date.now(),
      response,
      expires_at: expiresAt
    };

    this.keys.set(key, idempotencyKey);
  }

  /**
   * Execute operation with idempotency protection
   */
  async execute<T>(
    run_id: string,
    step_id: string,
    tool: string,
    params: Record<string, any>,
    operation: () => Promise<T>,
    ttl?: number
  ): Promise<{ result: T; cached: boolean }> {
    // Generate key
    const key = this.generateKey(run_id, step_id, tool, params);

    // Check for duplicate
    const { isDuplicate, response } = await this.checkDuplicate(key);

    if (isDuplicate) {
      console.log(`[Idempotency] Cache hit for ${tool} (${key})`);
      return { result: response as T, cached: true };
    }

    // Execute operation
    console.log(`[Idempotency] Cache miss for ${tool}, executing...`);
    const result = await operation();

    // Store result
    await this.store(key, run_id, step_id, tool, params, result, ttl);

    return { result, cached: false };
  }

  /**
   * Hash params to create deterministic key (browser-compatible)
   */
  private hashParams(params: Record<string, any>): string {
    // Sort keys to ensure deterministic hash
    const sortedParams = this.sortObject(params);

    // Create JSON string
    const jsonString = JSON.stringify(sortedParams);

    // Simple hash function (FNV-1a variant for browser compatibility)
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < jsonString.length; i++) {
      hash ^= jsonString.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    // Convert to hex string
    const hashHex = (hash >>> 0).toString(16).padStart(8, '0');

    // Add length to avoid collisions
    const lengthHex = jsonString.length.toString(16).padStart(4, '0');

    // Return combined hash (12 chars total)
    return hashHex + lengthHex;
  }

  /**
   * Recursively sort object keys for deterministic hashing
   */
  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    const sorted: Record<string, any> = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.sortObject(obj[key]);
    });

    return sorted;
  }

  /**
   * Cleanup expired keys
   */
  private cleanupExpiredKeys(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, idempotencyKey] of this.keys.entries()) {
      if (now > idempotencyKey.expires_at) {
        this.keys.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[Idempotency] Cleaned up ${cleanedCount} expired keys`);
    }
  }

  /**
   * Invalidate specific key
   */
  async invalidate(key: string): Promise<boolean> {
    return this.keys.delete(key);
  }

  /**
   * Invalidate all keys for a run
   */
  async invalidateRun(run_id: string): Promise<number> {
    let invalidatedCount = 0;

    for (const [key, idempotencyKey] of this.keys.entries()) {
      if (idempotencyKey.run_id === run_id) {
        this.keys.delete(key);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_keys: number;
    by_tool: Record<string, number>;
    cache_size_bytes: number;
  } {
    const stats = {
      total_keys: this.keys.size,
      by_tool: {} as Record<string, number>,
      cache_size_bytes: 0
    };

    for (const idempotencyKey of this.keys.values()) {
      // Count by tool
      if (!stats.by_tool[idempotencyKey.tool]) {
        stats.by_tool[idempotencyKey.tool] = 0;
      }
      stats.by_tool[idempotencyKey.tool]++;

      // Calculate size
      stats.cache_size_bytes += JSON.stringify(idempotencyKey.response).length;
    }

    return stats;
  }

  /**
   * Clear all keys (for testing)
   */
  clear(): void {
    this.keys.clear();
  }
}

// ============= SINGLETON INSTANCE =============

export const idempotencyService = new IdempotencyService();

// ============= HELPER FUNCTIONS =============

/**
 * Execute tool call with idempotency protection
 */
export async function executeIdempotent<T>(
  run_id: string,
  step_id: string,
  tool: string,
  params: Record<string, any>,
  operation: () => Promise<T>,
  ttl?: number
): Promise<{ result: T; cached: boolean }> {
  return idempotencyService.execute(run_id, step_id, tool, params, operation, ttl);
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(
  run_id: string,
  step_id: string,
  tool: string,
  params: Record<string, any>
): string {
  return idempotencyService.generateKey(run_id, step_id, tool, params);
}

/**
 * Check if tool call is duplicate
 */
export async function checkDuplicate(key: string): Promise<{ isDuplicate: boolean; response?: any }> {
  return idempotencyService.checkDuplicate(key);
}

/**
 * Invalidate cached result
 */
export async function invalidateCache(key: string): Promise<boolean> {
  return idempotencyService.invalidate(key);
}

/**
 * Export for testing
 */
export { IdempotencyService };
