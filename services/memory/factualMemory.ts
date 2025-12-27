/**
 * Factual Memory Storage Service
 *
 * Token-level memory: Explicit facts, rules, preferences
 * Stored in Supabase with semantic search capabilities
 */

import { supabase } from '../../lib/supabase';
import { FactualMemory, MemoryQuery, MemorySearchResult } from './types';

export class FactualMemoryStore {
  /**
   * Store a new factual memory
   */
  async store(memory: Omit<FactualMemory, 'id' | 'timestamp'>): Promise<FactualMemory> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping memory storage');
      return { ...memory, id: 'mock-id', timestamp: new Date() } as FactualMemory;
    }

    const { data, error } = await supabase
      .from('factual_memory')
      .insert([{
        user_id: memory.userId,
        type: memory.type,
        content: memory.content,
        source: memory.source,
        confidence: memory.confidence,
        tags: memory.tags,
        embedding: memory.embedding,
        metadata: memory.metadata || {}
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing factual memory:', error);
      throw new Error(`Failed to store memory: ${error.message}`);
    }

    return this.mapFromDb(data);
  }

  /**
   * Retrieve memories by query
   */
  async retrieve(query: MemoryQuery): Promise<FactualMemory[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty memories');
      return [];
    }

    let q = supabase
      .from('factual_memory')
      .select('*')
      .eq('user_id', query.userId);

    // Apply filters
    if (query.type) {
      q = q.eq('type', query.type);
    }

    if (query.tags && query.tags.length > 0) {
      q = q.contains('tags', query.tags);
    }

    if (query.minConfidence !== undefined) {
      q = q.gte('confidence', query.minConfidence);
    }

    if (query.timeRange) {
      q = q.gte('created_at', query.timeRange.start.toISOString())
        .lte('created_at', query.timeRange.end.toISOString());
    }

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    q = q.range(offset, offset + limit - 1);

    // Order by timestamp (newest first)
    q = q.order('created_at', { ascending: false });

    const { data, error } = await q;

    if (error) {
      console.error('Error retrieving memories:', error);
      throw new Error(`Failed to retrieve memories: ${error.message}`);
    }

    return (data || []).map(d => this.mapFromDb(d));
  }

  /**
   * Semantic search using vector embeddings
   * Requires pgvector extension and embeddings to be generated
   */
  async semanticSearch(
    userId: string,
    queryEmbedding: number[],
    limit: number = 10
  ): Promise<MemorySearchResult[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty results');
      return [];
    }

    // Use RPC function for vector similarity search
    const { data, error } = await supabase
      .rpc('search_factual_memories', {
        query_user_id: userId,
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
      });

    if (error) {
      console.error('Error in semantic search:', error);
      // Fall back to regular retrieval if vector search fails
      const memories = await this.retrieve({ userId, limit });
      return memories.map(m => ({
        memory: {
          id: m.id,
          function: 'factual' as const,
          data: m
        },
        relevanceScore: 0.5,
        retrievalReason: 'fallback_retrieval'
      }));
    }

    return (data || []).map((d: any) => ({
      memory: {
        id: d.id,
        function: 'factual' as const,
        data: this.mapFromDb(d)
      },
      relevanceScore: d.similarity,
      retrievalReason: 'semantic_match'
    }));
  }

  /**
   * Update an existing memory
   */
  async update(id: string, updates: Partial<FactualMemory>): Promise<FactualMemory> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping memory update');
      return { id, ...updates } as FactualMemory;
    }

    const { data, error } = await supabase
      .from('factual_memory')
      .update({
        content: updates.content,
        confidence: updates.confidence,
        tags: updates.tags,
        metadata: updates.metadata
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating memory:', error);
      throw new Error(`Failed to update memory: ${error.message}`);
    }

    return this.mapFromDb(data);
  }

  /**
   * Delete a memory
   */
  async delete(id: string): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping memory deletion');
      return;
    }

    const { error } = await supabase
      .from('factual_memory')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting memory:', error);
      throw new Error(`Failed to delete memory: ${error.message}`);
    }
  }

  /**
   * Get memory statistics
   */
  async getStats(userId: string): Promise<{
    totalCount: number;
    byType: Record<string, number>;
    avgConfidence: number;
    topTags: Array<{ tag: string; count: number }>;
  }> {
    if (!supabase) {
      return {
        totalCount: 0,
        byType: {},
        avgConfidence: 0,
        topTags: []
      };
    }

    const { data, error } = await supabase
      .from('factual_memory')
      .select('type, confidence, tags')
      .eq('user_id', userId);

    if (error || !data) {
      console.error('Error getting stats:', error);
      return {
        totalCount: 0,
        byType: {},
        avgConfidence: 0,
        topTags: []
      };
    }

    const byType: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    let totalConfidence = 0;

    for (const row of data) {
      // Count by type
      byType[row.type] = (byType[row.type] || 0) + 1;

      // Sum confidence
      totalConfidence += row.confidence || 0;

      // Count tags
      if (row.tags) {
        for (const tag of row.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCount: data.length,
      byType,
      avgConfidence: data.length > 0 ? totalConfidence / data.length : 0,
      topTags
    };
  }

  /**
   * Map database row to FactualMemory type
   */
  private mapFromDb(row: any): FactualMemory {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      content: row.content,
      source: row.source,
      confidence: row.confidence,
      timestamp: new Date(row.created_at),
      tags: row.tags || [],
      embedding: row.embedding,
      metadata: row.metadata || {}
    };
  }
}

// Singleton instance
export const factualMemoryStore = new FactualMemoryStore();
