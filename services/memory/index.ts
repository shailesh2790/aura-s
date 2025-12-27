/**
 * Memory System - Central Exports
 *
 * Proactive agents with long-term memory
 * Based on "Memory in the Age of AI Agents" (arXiv:2512.13564)
 */

// Types
export * from './types';

// Storage Services
export { factualMemoryStore, FactualMemoryStore } from './factualMemory';
export { experientialMemoryStore, ExperientialMemoryStore } from './experientialMemory';
export { workingMemoryManager, WorkingMemoryManager } from './workingMemory';

// Dynamics
export { memoryFormationEngine, MemoryFormationEngine } from './formation';

// Convenience functions for quick access
import { factualMemoryStore } from './factualMemory';
import { experientialMemoryStore } from './experientialMemory';
import { workingMemoryManager } from './workingMemory';
import { memoryFormationEngine } from './formation';

/**
 * Initialize memory system for a user session
 */
export async function initializeMemorySystem(userId: string, sessionId: string, goal: string) {
  // Initialize working memory
  await workingMemoryManager.initialize(userId, sessionId, goal);

  console.log(`Memory system initialized for user ${userId}, session ${sessionId}`);
}

/**
 * Record a run and extract memories
 */
export async function recordRun(runId: string, userId: string) {
  const memories = await memoryFormationEngine.extractFromRun(runId, userId);

  console.log(`Recorded run ${runId}:`, {
    factual: memories.factual.length,
    experiential: memories.experiential.length
  });

  return memories;
}

/**
 * Get memory stats for a user
 */
export async function getMemoryStats(userId: string) {
  const [factualStats, experientialStats] = await Promise.all([
    factualMemoryStore.getStats(userId),
    experientialMemoryStore.getStats(userId)
  ]);

  return {
    factual: factualStats,
    experiential: experientialStats,
    working: {
      activeSessions: workingMemoryManager.getActiveSessions().length
    }
  };
}

/**
 * Clear all working memory for cleanup
 */
export async function clearWorkingMemory(sessionId?: string) {
  if (sessionId) {
    await workingMemoryManager.clear(sessionId);
  } else {
    // Clear all expired
    await workingMemoryManager.clearExpired();
  }
}
