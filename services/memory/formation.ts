/**
 * Memory Formation Engine
 *
 * Extracts and encodes memories from events
 * Implements the "Formation" dynamic from the paper
 */

import { v4 as uuidv4 } from 'uuid';
import { Event, eventStore } from '../runtime/eventStore';
import { factualMemoryStore } from './factualMemory';
import { experientialMemoryStore } from './experientialMemory';
import { workingMemoryManager } from './workingMemory';
import { FactualMemory, ExperientialMemory } from './types';

export class MemoryFormationEngine {
  /**
   * Extract memories from a completed run
   */
  async extractFromRun(runId: string, userId: string): Promise<{
    factual: FactualMemory[];
    experiential: ExperientialMemory[];
  }> {
    // Get all events from the run
    const events = await eventStore.getRunEvents(runId);

    if (events.length === 0) {
      console.log(`No events found for run ${runId}`);
      return { factual: [], experiential: [] };
    }

    // Extract factual memories
    const factualMemories = await this.extractFactualMemories(events, userId, runId);

    // Synthesize experiential memories
    const experientialMemories = await this.synthesizeExperiences(events, userId, runId);

    console.log(`Extracted ${factualMemories.length} factual + ${experientialMemories.length} experiential memories from run ${runId}`);

    return {
      factual: factualMemories,
      experiential: experientialMemories
    };
  }

  /**
   * Extract factual memories from events
   * Simple rule-based extraction (can be enhanced with LLM later)
   */
  private async extractFactualMemories(
    events: Event[],
    userId: string,
    source: string
  ): Promise<FactualMemory[]> {
    const memories: FactualMemory[] = [];

    for (const event of events) {
      // Extract facts from specific event types
      if (event.type === 'step.completed' && event.data?.output) {
        // Store successful step outputs as facts
        const memory: Omit<FactualMemory, 'id' | 'timestamp'> = {
          userId,
          type: 'fact',
          content: `Step ${event.data.step_id}: ${event.data.output}`,
          source: `run:${source}`,
          confidence: 0.8,
          tags: ['step_output', event.data.step_id],
          metadata: {
            runId: source,
            stepId: event.data.step_id,
            eventType: event.type
          }
        };

        const stored = await factualMemoryStore.store(memory);
        memories.push(stored);
      }

      // Extract user preferences from user input events
      if (event.type === 'user.input' && event.data?.preference) {
        const memory: Omit<FactualMemory, 'id' | 'timestamp'> = {
          userId,
          type: 'preference',
          content: event.data.preference,
          source: 'user_input',
          confidence: 0.9,
          tags: ['user_preference'],
          metadata: {
            runId: source,
            eventType: event.type
          }
        };

        const stored = await factualMemoryStore.store(memory);
        memories.push(stored);
      }
    }

    return memories;
  }

  /**
   * Synthesize experiential memories from events
   * Analyzes patterns of success/failure
   */
  private async synthesizeExperiences(
    events: Event[],
    userId: string,
    source: string
  ): Promise<ExperientialMemory[]> {
    const memories: ExperientialMemory[] = [];

    // Check if run was successful
    const startEvent = events.find(e => e.type === 'run.started');
    const completeEvent = events.find(e => e.type === 'run.completed');
    const failEvent = events.find(e => e.type === 'run.failed');

    if (!startEvent) {
      return memories;
    }

    // Record run outcome as experience
    if (completeEvent) {
      // Success experience
      const memory: Omit<ExperientialMemory, 'id' | 'timestamp'> = {
        userId,
        type: 'success',
        context: `Run with intent: ${startEvent.data?.intent || 'unknown'}`,
        action: `Executed workflow with ${events.length} events`,
        outcome: completeEvent.data?.result || 'Completed successfully',
        reflection: this.generateReflection(events, true),
        learnedSkills: this.extractSkills(events),
        importance: this.calculateImportance(events, true),
        relatedMemories: [],
        metadata: {
          runId: source,
          eventCount: events.length,
          duration: completeEvent.timestamp.getTime() - startEvent.timestamp.getTime()
        }
      };

      const stored = await experientialMemoryStore.store(memory);
      memories.push(stored);
    } else if (failEvent) {
      // Failure experience
      const memory: Omit<ExperientialMemory, 'id' | 'timestamp'> = {
        userId,
        type: 'failure',
        context: `Run with intent: ${startEvent.data?.intent || 'unknown'}`,
        action: `Attempted workflow execution`,
        outcome: failEvent.data?.error || 'Failed with error',
        reflection: this.generateReflection(events, false),
        learnedSkills: [],
        importance: this.calculateImportance(events, false),
        relatedMemories: [],
        metadata: {
          runId: source,
          eventCount: events.length,
          error: failEvent.data?.error
        }
      };

      const stored = await experientialMemoryStore.store(memory);
      memories.push(stored);
    }

    return memories;
  }

  /**
   * Generate reflection from events
   * Simple template-based for now (can be enhanced with LLM)
   */
  private generateReflection(events: Event[], success: boolean): string {
    const stepCount = events.filter(e => e.type === 'step.completed').length;

    if (success) {
      return `Successfully completed workflow with ${stepCount} steps. The sequential approach worked well. Consider similar patterns for future runs.`;
    } else {
      const errorEvent = events.find(e => e.type === 'run.failed');
      const errorMsg = errorEvent?.data?.error || 'Unknown error';
      return `Workflow failed after ${stepCount} steps. Error: ${errorMsg}. Need to improve error handling and validation.`;
    }
  }

  /**
   * Extract skills from successful runs
   */
  private extractSkills(events: Event[]): string[] {
    const skills: string[] = [];

    // Check what capabilities were used
    const steps = events.filter(e => e.type === 'step.completed');

    if (steps.length > 5) {
      skills.push('complex_workflow_execution');
    }

    if (events.some(e => e.type === 'validation.passed')) {
      skills.push('validation_implementation');
    }

    return skills;
  }

  /**
   * Calculate importance score for an experience
   * Based on run characteristics
   */
  private calculateImportance(events: Event[], success: boolean): number {
    let importance = success ? 0.6 : 0.7; // Failures slightly more important to learn from

    // Increase importance for longer runs
    if (events.length > 10) {
      importance += 0.1;
    }

    // Increase importance for novel patterns
    const uniqueEventTypes = new Set(events.map(e => e.type)).size;
    if (uniqueEventTypes > 5) {
      importance += 0.1;
    }

    return Math.min(importance, 1.0);
  }

  /**
   * Record a simple experience manually
   * Useful for recording user feedback or manual events
   */
  async recordExperience(
    userId: string,
    experience: {
      context: string;
      action: string;
      outcome: string;
      success: boolean;
      importance?: number;
    }
  ): Promise<ExperientialMemory> {
    const memory: Omit<ExperientialMemory, 'id' | 'timestamp'> = {
      userId,
      type: experience.success ? 'success' : 'failure',
      context: experience.context,
      action: experience.action,
      outcome: experience.outcome,
      reflection: experience.success
        ? `Action succeeded: ${experience.outcome}`
        : `Action failed: ${experience.outcome}. Need to investigate and improve.`,
      learnedSkills: [],
      importance: experience.importance || 0.5,
      relatedMemories: [],
      metadata: {
        manual: true,
        recordedAt: new Date().toISOString()
      }
    };

    return await experientialMemoryStore.store(memory);
  }

  /**
   * Record a factual memory manually
   */
  async recordFact(
    userId: string,
    fact: {
      content: string;
      type?: 'fact' | 'rule' | 'preference';
      confidence?: number;
      tags?: string[];
    }
  ): Promise<FactualMemory> {
    const memory: Omit<FactualMemory, 'id' | 'timestamp'> = {
      userId,
      type: fact.type || 'fact',
      content: fact.content,
      source: 'manual',
      confidence: fact.confidence || 0.8,
      tags: fact.tags || [],
      metadata: {
        manual: true,
        recordedAt: new Date().toISOString()
      }
    };

    return await factualMemoryStore.store(memory);
  }
}

// Singleton instance
export const memoryFormationEngine = new MemoryFormationEngine();
