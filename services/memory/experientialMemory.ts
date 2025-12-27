/**
 * Experiential Memory Storage Service
 *
 * Learning from success and failure
 * Stores insights and skills accumulated through interaction
 */

import { supabase } from '../../lib/supabase';
import { ExperientialMemory, MemoryQuery } from './types';

export class ExperientialMemoryStore {
  /**
   * Store a new experiential memory
   */
  async store(memory: Omit<ExperientialMemory, 'id' | 'timestamp'>): Promise<ExperientialMemory> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping experiential memory storage');
      return { ...memory, id: 'mock-id', timestamp: new Date() } as ExperientialMemory;
    }

    const { data, error } = await supabase
      .from('experiential_memory')
      .insert([{
        user_id: memory.userId,
        type: memory.type,
        context: memory.context,
        action: memory.action,
        outcome: memory.outcome,
        reflection: memory.reflection,
        learned_skills: memory.learnedSkills,
        importance: memory.importance,
        related_memories: memory.relatedMemories || [],
        metadata: memory.metadata || {}
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing experiential memory:', error);
      throw new Error(`Failed to store experience: ${error.message}`);
    }

    return this.mapFromDb(data);
  }

  /**
   * Retrieve experiential memories by query
   */
  async retrieve(query: MemoryQuery): Promise<ExperientialMemory[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty experiences');
      return [];
    }

    let q = supabase
      .from('experiential_memory')
      .select('*')
      .eq('user_id', query.userId);

    // Apply filters
    if (query.type) {
      q = q.eq('type', query.type);
    }

    if (query.minImportance !== undefined) {
      q = q.gte('importance', query.minImportance);
    }

    if (query.timeRange) {
      q = q.gte('created_at', query.timeRange.start.toISOString())
        .lte('created_at', query.timeRange.end.toISOString());
    }

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    q = q.range(offset, offset + limit - 1);

    // Order by importance then timestamp
    q = q.order('importance', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await q;

    if (error) {
      console.error('Error retrieving experiences:', error);
      throw new Error(`Failed to retrieve experiences: ${error.message}`);
    }

    return (data || []).map(d => this.mapFromDb(d));
  }

  /**
   * Get successful experiences for learning
   */
  async getSuccesses(userId: string, limit: number = 20): Promise<ExperientialMemory[]> {
    return this.retrieve({
      userId,
      type: 'success',
      limit,
      minImportance: 0.5 // Only high-importance successes
    });
  }

  /**
   * Get failures to learn from mistakes
   */
  async getFailures(userId: string, limit: number = 20): Promise<ExperientialMemory[]> {
    return this.retrieve({
      userId,
      type: 'failure',
      limit,
      minImportance: 0.3 // Even medium-importance failures are worth learning from
    });
  }

  /**
   * Get patterns extracted from experiences
   */
  async getPatterns(userId: string, limit: number = 10): Promise<ExperientialMemory[]> {
    return this.retrieve({
      userId,
      type: 'pattern',
      limit
    });
  }

  /**
   * Update importance score of a memory
   * Used during consolidation to adjust which memories to retain
   */
  async updateImportance(id: string, importance: number): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping importance update');
      return;
    }

    const { error } = await supabase
      .from('experiential_memory')
      .update({ importance })
      .eq('id', id);

    if (error) {
      console.error('Error updating importance:', error);
      throw new Error(`Failed to update importance: ${error.message}`);
    }
  }

  /**
   * Prune low-importance old memories (selective forgetting)
   */
  async pruneOldMemories(userId: string, threshold: number = 0.3, maxAgeDays: number = 30): Promise<number> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping memory pruning');
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const { data, error } = await supabase
      .from('experiential_memory')
      .delete()
      .eq('user_id', userId)
      .lt('importance', threshold)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error pruning memories:', error);
      throw new Error(`Failed to prune memories: ${error.message}`);
    }

    const deletedCount = data?.length || 0;
    console.log(`Pruned ${deletedCount} low-importance old memories`);
    return deletedCount;
  }

  /**
   * Get all unique skills learned
   */
  async getLearnedSkills(userId: string): Promise<string[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty skills');
      return [];
    }

    const { data, error } = await supabase
      .from('experiential_memory')
      .select('learned_skills')
      .eq('user_id', userId);

    if (error || !data) {
      console.error('Error getting learned skills:', error);
      return [];
    }

    const allSkills = new Set<string>();
    for (const row of data) {
      if (row.learned_skills) {
        row.learned_skills.forEach((skill: string) => allSkills.add(skill));
      }
    }

    return Array.from(allSkills);
  }

  /**
   * Get experience statistics
   */
  async getStats(userId: string): Promise<{
    totalCount: number;
    byType: Record<string, number>;
    avgImportance: number;
    successRate: number;
    uniqueSkills: number;
  }> {
    if (!supabase) {
      return {
        totalCount: 0,
        byType: {},
        avgImportance: 0,
        successRate: 0,
        uniqueSkills: 0
      };
    }

    const { data, error } = await supabase
      .from('experiential_memory')
      .select('type, importance, learned_skills')
      .eq('user_id', userId);

    if (error || !data) {
      console.error('Error getting stats:', error);
      return {
        totalCount: 0,
        byType: {},
        avgImportance: 0,
        successRate: 0,
        uniqueSkills: 0
      };
    }

    const byType: Record<string, number> = {};
    let totalImportance = 0;
    const skills = new Set<string>();

    for (const row of data) {
      byType[row.type] = (byType[row.type] || 0) + 1;
      totalImportance += row.importance || 0;

      if (row.learned_skills) {
        row.learned_skills.forEach((skill: string) => skills.add(skill));
      }
    }

    const successCount = byType['success'] || 0;
    const failureCount = byType['failure'] || 0;
    const totalAttempts = successCount + failureCount;
    const successRate = totalAttempts > 0 ? successCount / totalAttempts : 0;

    return {
      totalCount: data.length,
      byType,
      avgImportance: data.length > 0 ? totalImportance / data.length : 0,
      successRate,
      uniqueSkills: skills.size
    };
  }

  /**
   * Map database row to ExperientialMemory type
   */
  private mapFromDb(row: any): ExperientialMemory {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      context: row.context,
      action: row.action,
      outcome: row.outcome,
      reflection: row.reflection,
      learnedSkills: row.learned_skills || [],
      timestamp: new Date(row.created_at),
      importance: row.importance,
      relatedMemories: row.related_memories || [],
      metadata: row.metadata || {}
    };
  }
}

// Singleton instance
export const experientialMemoryStore = new ExperientialMemoryStore();
