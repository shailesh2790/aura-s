/**
 * Working Memory Service
 *
 * Active context during task execution
 * Short-lived, in-memory state (not persisted to database)
 */

import { WorkingMemory } from './types';
import { Event } from '../runtime/eventStore';

export class WorkingMemoryManager {
  private memories: Map<string, WorkingMemory> = new Map();

  /**
   * Initialize working memory for a new session
   */
  async initialize(userId: string, sessionId: string, goal: string): Promise<WorkingMemory> {
    const workingMemory: WorkingMemory = {
      userId,
      sessionId,
      currentGoal: goal,
      activeContext: new Map(),
      recentEvents: [],
      attention: [],
      planningState: {
        hypothesis: [],
        nextActions: [],
        uncertainties: [],
        blockers: []
      },
      timestamp: new Date()
    };

    this.memories.set(sessionId, workingMemory);
    return workingMemory;
  }

  /**
   * Get working memory for a session
   */
  get(sessionId: string): WorkingMemory | null {
    return this.memories.get(sessionId) || null;
  }

  /**
   * Update the current goal
   */
  async updateGoal(sessionId: string, goal: string): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory) {
      memory.currentGoal = goal;
      memory.timestamp = new Date();
    }
  }

  /**
   * Add context to working memory
   */
  async addContext(sessionId: string, key: string, value: any): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory) {
      memory.activeContext.set(key, value);
      memory.timestamp = new Date();
    }
  }

  /**
   * Get context value
   */
  getContext(sessionId: string, key: string): any | null {
    const memory = this.memories.get(sessionId);
    return memory?.activeContext.get(key) || null;
  }

  /**
   * Add an event to recent history
   */
  async addEvent(sessionId: string, event: Event): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory) {
      memory.recentEvents.push({
        type: event.type,
        data: event.data,
        timestamp: event.timestamp
      });

      // Keep only last 50 events to prevent memory bloat
      if (memory.recentEvents.length > 50) {
        memory.recentEvents = memory.recentEvents.slice(-50);
      }

      memory.timestamp = new Date();
    }
  }

  /**
   * Set attention focus
   */
  async setAttention(sessionId: string, items: string[]): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory) {
      memory.attention = items;
      memory.timestamp = new Date();
    }
  }

  /**
   * Add to attention focus
   */
  async addAttention(sessionId: string, item: string): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory && !memory.attention.includes(item)) {
      memory.attention.push(item);
      memory.timestamp = new Date();
    }
  }

  /**
   * Remove from attention focus
   */
  async removeAttention(sessionId: string, item: string): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory) {
      memory.attention = memory.attention.filter(a => a !== item);
      memory.timestamp = new Date();
    }
  }

  /**
   * Update planning state
   */
  async updatePlanning(
    sessionId: string,
    updates: Partial<WorkingMemory['planningState']>
  ): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory) {
      memory.planningState = {
        ...memory.planningState,
        ...updates
      };
      memory.timestamp = new Date();
    }
  }

  /**
   * Add a hypothesis to planning state
   */
  async addHypothesis(sessionId: string, hypothesis: string): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory && !memory.planningState.hypothesis.includes(hypothesis)) {
      memory.planningState.hypothesis.push(hypothesis);
      memory.timestamp = new Date();
    }
  }

  /**
   * Add a next action to planning state
   */
  async addNextAction(sessionId: string, action: string): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory && !memory.planningState.nextActions.includes(action)) {
      memory.planningState.nextActions.push(action);
      memory.timestamp = new Date();
    }
  }

  /**
   * Add an uncertainty to planning state
   */
  async addUncertainty(sessionId: string, uncertainty: string): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory && !memory.planningState.uncertainties.includes(uncertainty)) {
      memory.planningState.uncertainties.push(uncertainty);
      memory.timestamp = new Date();
    }
  }

  /**
   * Add a blocker to planning state
   */
  async addBlocker(sessionId: string, blocker: string): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory && !memory.planningState.blockers.includes(blocker)) {
      memory.planningState.blockers.push(blocker);
      memory.timestamp = new Date();
    }
  }

  /**
   * Clear planning state
   */
  async clearPlanning(sessionId: string): Promise<void> {
    const memory = this.memories.get(sessionId);
    if (memory) {
      memory.planningState = {
        hypothesis: [],
        nextActions: [],
        uncertainties: [],
        blockers: []
      };
      memory.timestamp = new Date();
    }
  }

  /**
   * Get summary of working memory for LLM context
   */
  getSummary(sessionId: string): string {
    const memory = this.memories.get(sessionId);
    if (!memory) {
      return 'No active working memory';
    }

    const contextEntries = Array.from(memory.activeContext.entries())
      .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
      .join('\n');

    const recentEventsStr = memory.recentEvents
      .slice(-5) // Last 5 events
      .map(e => `- ${e.type} at ${e.timestamp.toISOString()}`)
      .join('\n');

    return `
# Working Memory Summary

## Current Goal
${memory.currentGoal}

## Active Context
${contextEntries || '(none)'}

## Attention Focus
${memory.attention.join(', ') || '(none)'}

## Planning State
- Hypotheses: ${memory.planningState.hypothesis.join(', ') || '(none)'}
- Next Actions: ${memory.planningState.nextActions.join(', ') || '(none)'}
- Uncertainties: ${memory.planningState.uncertainties.join(', ') || '(none)'}
- Blockers: ${memory.planningState.blockers.join(', ') || '(none)'}

## Recent Events
${recentEventsStr || '(none)'}
`.trim();
  }

  /**
   * Clear working memory for a session
   */
  async clear(sessionId: string): Promise<void> {
    this.memories.delete(sessionId);
  }

  /**
   * Clear all expired working memories (older than 1 hour)
   */
  async clearExpired(): Promise<number> {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    let clearedCount = 0;

    for (const [sessionId, memory] of this.memories.entries()) {
      if (now - memory.timestamp.getTime() > maxAge) {
        this.memories.delete(sessionId);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} expired working memories`);
    }

    return clearedCount;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.memories.keys());
  }

  /**
   * Get total memory count
   */
  getCount(): number {
    return this.memories.size;
  }
}

// Singleton instance
export const workingMemoryManager = new WorkingMemoryManager();

// Auto-cleanup expired memories every 15 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    workingMemoryManager.clearExpired();
  }, 15 * 60 * 1000);
}
