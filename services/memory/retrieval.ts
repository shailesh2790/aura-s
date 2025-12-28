/**
 * Memory Retrieval Engine
 *
 * Context-aware memory access with:
 * - Semantic search (when embeddings available)
 * - Temporal decay
 * - Importance weighting
 * - Context filtering
 */

import { factualMemoryStore } from './factualMemory';
import { experientialMemoryStore } from './experientialMemory';
import { workingMemoryManager } from './workingMemory';
import {
  FactualMemory,
  ExperientialMemory,
  WorkingMemory,
  MemorySearchResult,
  MemoryRetrievalConfig
} from './types';

export class MemoryRetrievalEngine {
  private config: MemoryRetrievalConfig = {
    semanticSearchEnabled: false, // Enable when embeddings available
    temporalDecayEnabled: true,
    temporalHalfLife: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    maxResults: 10,
    minRelevanceScore: 0.3
  };

  /**
   * Retrieve relevant memories for a query with context
   */
  async retrieve(
    userId: string,
    query: string,
    context?: WorkingMemory
  ): Promise<MemorySearchResult[]> {
    const results: MemorySearchResult[] = [];

    // Step 1: Get candidate memories
    const factualCandidates = await this.getFactualCandidates(userId, query);
    const experientialCandidates = await this.getExperientialCandidates(userId, query);

    // Step 2: Score each candidate
    for (const fact of factualCandidates) {
      const score = this.scoreFactualMemory(fact, query, context);
      if (score >= this.config.minRelevanceScore) {
        results.push({
          memory: {
            id: fact.id,
            function: 'factual',
            data: fact
          },
          relevanceScore: score,
          retrievalReason: this.explainScore(score)
        });
      }
    }

    for (const exp of experientialCandidates) {
      const score = this.scoreExperientialMemory(exp, query, context);
      if (score >= this.config.minRelevanceScore) {
        results.push({
          memory: {
            id: exp.id,
            function: 'experiential',
            data: exp
          },
          relevanceScore: score,
          retrievalReason: this.explainScore(score)
        });
      }
    }

    // Step 3: Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Step 4: Return top results
    return results.slice(0, this.config.maxResults);
  }

  /**
   * Get factual memory candidates
   */
  private async getFactualCandidates(
    userId: string,
    query: string
  ): Promise<FactualMemory[]> {
    // Extract keywords from query
    const keywords = this.extractKeywords(query);

    // Search by tags (simple keyword matching for now)
    const candidates = await factualMemoryStore.retrieve({
      userId,
      limit: 50 // Get more candidates for scoring
    });

    // Filter by keyword overlap
    return candidates.filter(fact => {
      const factKeywords = [
        ...this.extractKeywords(fact.content),
        ...fact.tags
      ];
      return this.hasKeywordOverlap(keywords, factKeywords);
    });
  }

  /**
   * Get experiential memory candidates
   */
  private async getExperientialCandidates(
    userId: string,
    query: string
  ): Promise<ExperientialMemory[]> {
    const keywords = this.extractKeywords(query);

    const candidates = await experientialMemoryStore.retrieve({
      userId,
      limit: 50
    });

    return candidates.filter(exp => {
      const expKeywords = [
        ...this.extractKeywords(exp.context),
        ...this.extractKeywords(exp.action),
        ...exp.learnedSkills
      ];
      return this.hasKeywordOverlap(keywords, expKeywords);
    });
  }

  /**
   * Score a factual memory for relevance
   */
  private scoreFactualMemory(
    fact: FactualMemory,
    query: string,
    context?: WorkingMemory
  ): number {
    let score = 0;

    // Base score: confidence
    score += fact.confidence * 0.3;

    // Keyword overlap score
    const queryKeywords = this.extractKeywords(query);
    const factKeywords = [
      ...this.extractKeywords(fact.content),
      ...fact.tags
    ];
    const overlapScore = this.calculateOverlapScore(queryKeywords, factKeywords);
    score += overlapScore * 0.4;

    // Context relevance (if attention items match)
    if (context) {
      const contextScore = this.calculateContextScore(factKeywords, context.attention);
      score += contextScore * 0.1;
    }

    // Temporal decay (if enabled)
    if (this.config.temporalDecayEnabled) {
      const decayScore = this.calculateTemporalDecay(fact.timestamp);
      score *= decayScore;
    }

    // Type boost
    if (fact.type === 'rule') {
      score *= 1.2; // Rules are more valuable
    } else if (fact.type === 'preference') {
      score *= 1.1; // Preferences are important
    }

    return Math.min(score, 1.0);
  }

  /**
   * Score an experiential memory for relevance
   */
  private scoreExperientialMemory(
    exp: ExperientialMemory,
    query: string,
    context?: WorkingMemory
  ): number {
    let score = 0;

    // Base score: importance
    score += exp.importance * 0.3;

    // Keyword overlap score
    const queryKeywords = this.extractKeywords(query);
    const expKeywords = [
      ...this.extractKeywords(exp.context),
      ...this.extractKeywords(exp.action),
      ...exp.learnedSkills
    ];
    const overlapScore = this.calculateOverlapScore(queryKeywords, expKeywords);
    score += overlapScore * 0.4;

    // Context relevance
    if (context) {
      const contextScore = this.calculateContextScore(expKeywords, context.attention);
      score += contextScore * 0.1;
    }

    // Temporal decay
    if (this.config.temporalDecayEnabled) {
      const decayScore = this.calculateTemporalDecay(exp.timestamp);
      score *= decayScore;
    }

    // Type boost
    if (exp.type === 'pattern') {
      score *= 1.3; // Patterns are most valuable
    } else if (exp.type === 'success') {
      score *= 1.1; // Successes are valuable
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate temporal decay score
   * Uses exponential decay with configurable half-life
   */
  private calculateTemporalDecay(timestamp: Date): number {
    const now = Date.now();
    const age = now - timestamp.getTime();
    const halfLife = this.config.temporalHalfLife;

    // Exponential decay: score = e^(-ln(2) * age / halfLife)
    const decay = Math.exp(-Math.log(2) * age / halfLife);

    return decay;
  }

  /**
   * Calculate overlap score between two keyword sets
   */
  private calculateOverlapScore(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const intersection = new Set([...set1].filter(k => set2.has(k)));
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity
    return intersection.size / union.size;
  }

  /**
   * Calculate context relevance score
   */
  private calculateContextScore(keywords: string[], attentionItems: string[]): number {
    if (attentionItems.length === 0) {
      return 0;
    }

    const attentionKeywords = attentionItems.flatMap(item =>
      this.extractKeywords(item)
    );

    return this.calculateOverlapScore(keywords, attentionKeywords);
  }

  /**
   * Check if there's any keyword overlap
   */
  private hasKeywordOverlap(keywords1: string[], keywords2: string[]): boolean {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    for (const keyword of set1) {
      if (set2.has(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 3) // Filter short words
      .filter(word => !this.isStopWord(word));
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'that', 'this', 'with', 'from', 'have', 'been',
      'were', 'will', 'what', 'when', 'where', 'which',
      'who', 'whom', 'their', 'them', 'they', 'there',
      'then', 'than', 'these', 'those', 'through'
    ]);
    return stopWords.has(word);
  }

  /**
   * Explain the relevance score
   */
  private explainScore(score: number): string {
    if (score > 0.8) {
      return 'highly_relevant';
    } else if (score > 0.6) {
      return 'relevant';
    } else if (score > 0.4) {
      return 'somewhat_relevant';
    } else {
      return 'low_relevance';
    }
  }

  /**
   * Get the best matching rule for a query
   */
  async getBestRule(userId: string, query: string): Promise<FactualMemory | null> {
    const results = await this.retrieve(userId, query);

    const rules = results.filter(r =>
      r.memory.function === 'factual' &&
      (r.memory.data as FactualMemory).type === 'rule'
    );

    if (rules.length === 0) {
      return null;
    }

    return rules[0].memory.data as FactualMemory;
  }

  /**
   * Get similar past experiences
   */
  async getSimilarExperiences(
    userId: string,
    query: string,
    type?: 'success' | 'failure' | 'pattern'
  ): Promise<ExperientialMemory[]> {
    const results = await this.retrieve(userId, query);

    const experiences = results
      .filter(r => r.memory.function === 'experiential')
      .map(r => r.memory.data as ExperientialMemory);

    if (type) {
      return experiences.filter(exp => exp.type === type);
    }

    return experiences;
  }

  /**
   * Update retrieval configuration
   */
  configure(config: Partial<MemoryRetrievalConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}

// Singleton instance
export const memoryRetrievalEngine = new MemoryRetrievalEngine();
