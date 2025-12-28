/**
 * Memory Consolidation Engine
 *
 * Implements the "Evolution" dynamic from the paper:
 * - Merge similar experiences
 * - Extract patterns from multiple experiences
 * - Selective forgetting (prune low-importance old memories)
 * - Hierarchical memory compression
 */

import { experientialMemoryStore } from './experientialMemory';
import { factualMemoryStore } from './factualMemory';
import { ExperientialMemory, FactualMemory } from './types';

export class MemoryConsolidationEngine {
  /**
   * Run full consolidation process
   * Should be run periodically (e.g., nightly)
   */
  async consolidate(userId: string): Promise<{
    merged: number;
    patternsExtracted: number;
    pruned: number;
  }> {
    console.log(`Starting memory consolidation for user ${userId}...`);

    const results = {
      merged: 0,
      patternsExtracted: 0,
      pruned: 0
    };

    try {
      // Step 1: Merge similar experiences
      results.merged = await this.mergeSimilarExperiences(userId);

      // Step 2: Extract patterns from clustered experiences
      results.patternsExtracted = await this.extractPatterns(userId);

      // Step 3: Prune low-importance old memories
      results.pruned = await this.pruneMemories(userId);

      console.log(`Consolidation complete:`, results);
      return results;
    } catch (error) {
      console.error('Error during consolidation:', error);
      throw error;
    }
  }

  /**
   * Merge similar experiences to reduce redundancy
   * Uses simple similarity heuristics (can be enhanced with embeddings)
   */
  private async mergeSimilarExperiences(userId: string): Promise<number> {
    // Get all experiences from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const experiences = await experientialMemoryStore.retrieve({
      userId,
      timeRange: {
        start: sevenDaysAgo,
        end: new Date()
      },
      limit: 100
    });

    if (experiences.length < 2) {
      return 0;
    }

    // Group by type and similar context
    const groups = this.groupSimilarExperiences(experiences);
    let mergedCount = 0;

    for (const group of groups) {
      if (group.length > 1) {
        // Merge this group into a single consolidated experience
        await this.mergeExperienceGroup(userId, group);
        mergedCount++;
      }
    }

    return mergedCount;
  }

  /**
   * Group experiences by similarity
   * Simple heuristic: same type + similar context keywords
   */
  private groupSimilarExperiences(experiences: ExperientialMemory[]): ExperientialMemory[][] {
    const groups: ExperientialMemory[][] = [];

    for (const exp of experiences) {
      let foundGroup = false;

      for (const group of groups) {
        const representative = group[0];

        // Check if similar
        if (this.areSimilar(exp, representative)) {
          group.push(exp);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        groups.push([exp]);
      }
    }

    return groups;
  }

  /**
   * Check if two experiences are similar
   */
  private areSimilar(exp1: ExperientialMemory, exp2: ExperientialMemory): boolean {
    // Must be same type
    if (exp1.type !== exp2.type) {
      return false;
    }

    // Extract keywords from context
    const keywords1 = this.extractKeywords(exp1.context);
    const keywords2 = this.extractKeywords(exp2.context);

    // Calculate overlap
    const overlap = keywords1.filter(k => keywords2.includes(k)).length;
    const total = new Set([...keywords1, ...keywords2]).size;

    // Similar if >50% keyword overlap
    return overlap / total > 0.5;
  }

  /**
   * Extract keywords from text (simple tokenization)
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3) // Filter short words
      .filter(word => !['that', 'this', 'with', 'from', 'have'].includes(word)); // Common words
  }

  /**
   * Merge a group of similar experiences into one consolidated experience
   */
  private async mergeExperienceGroup(
    userId: string,
    group: ExperientialMemory[]
  ): Promise<void> {
    // Calculate consolidated importance (max of group)
    const importance = Math.max(...group.map(e => e.importance));

    // Combine learned skills
    const allSkills = new Set<string>();
    group.forEach(e => e.learnedSkills.forEach(s => allSkills.add(s)));

    // Create consolidated reflection
    const successCount = group.filter(e => e.type === 'success').length;
    const failureCount = group.filter(e => e.type === 'failure').length;
    const totalCount = group.length;

    const reflection = `Consolidated from ${totalCount} similar experiences. Success rate: ${(successCount / totalCount * 100).toFixed(0)}%. ${group[0].reflection}`;

    // Store as a pattern (consolidated experience)
    await experientialMemoryStore.store({
      userId,
      type: 'pattern',
      context: group[0].context, // Use first as representative
      action: group[0].action,
      outcome: `Observed ${totalCount} times. ${successCount} successes, ${failureCount} failures.`,
      reflection,
      learnedSkills: Array.from(allSkills),
      importance,
      relatedMemories: group.map(e => e.id),
      metadata: {
        consolidated: true,
        sourceCount: totalCount,
        consolidatedAt: new Date().toISOString()
      }
    });

    // Update importance of source experiences (lower since now consolidated)
    for (const exp of group) {
      await experientialMemoryStore.updateImportance(exp.id, exp.importance * 0.5);
    }
  }

  /**
   * Extract high-level patterns from experiences
   */
  private async extractPatterns(userId: string): Promise<number> {
    // Get successes from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const successes = await experientialMemoryStore.retrieve({
      userId,
      type: 'success',
      timeRange: {
        start: thirtyDaysAgo,
        end: new Date()
      },
      minImportance: 0.6, // Only high-importance successes
      limit: 50
    });

    if (successes.length < 3) {
      return 0; // Need at least 3 to extract pattern
    }

    // Cluster by learned skills
    const skillClusters = this.clusterBySkills(successes);
    let patternsExtracted = 0;

    for (const [skill, experiences] of Object.entries(skillClusters)) {
      if (experiences.length >= 3) {
        // Extract pattern as a rule
        await this.createPatternRule(userId, skill, experiences);
        patternsExtracted++;
      }
    }

    return patternsExtracted;
  }

  /**
   * Cluster experiences by learned skills
   */
  private clusterBySkills(experiences: ExperientialMemory[]): Record<string, ExperientialMemory[]> {
    const clusters: Record<string, ExperientialMemory[]> = {};

    for (const exp of experiences) {
      for (const skill of exp.learnedSkills) {
        if (!clusters[skill]) {
          clusters[skill] = [];
        }
        clusters[skill].push(exp);
      }
    }

    return clusters;
  }

  /**
   * Create a rule from a pattern
   */
  private async createPatternRule(
    userId: string,
    skill: string,
    experiences: ExperientialMemory[]
  ): Promise<void> {
    // Calculate confidence based on success rate and count
    const confidence = Math.min(0.9, experiences.length * 0.15); // Max 0.9

    const rule = `When applying '${skill}', observed ${experiences.length} successful outcomes. This pattern is reliable.`;

    // Store as factual memory (rule)
    await factualMemoryStore.store({
      userId,
      type: 'rule',
      content: rule,
      source: 'pattern_extraction',
      confidence,
      tags: [skill, 'pattern', 'extracted'],
      metadata: {
        experienceCount: experiences.length,
        extractedAt: new Date().toISOString(),
        sourceExperiences: experiences.map(e => e.id)
      }
    });
  }

  /**
   * Prune old low-importance memories
   */
  private async pruneMemories(userId: string): Promise<number> {
    const threshold = 0.3; // Importance threshold
    const maxAgeDays = 30; // Max age in days

    const pruned = await experientialMemoryStore.pruneOldMemories(
      userId,
      threshold,
      maxAgeDays
    );

    return pruned;
  }

  /**
   * Get consolidation statistics
   */
  async getStats(userId: string): Promise<{
    totalExperiences: number;
    patterns: number;
    rules: number;
    avgImportance: number;
  }> {
    const [expStats, factStats] = await Promise.all([
      experientialMemoryStore.getStats(userId),
      factualMemoryStore.getStats(userId)
    ]);

    return {
      totalExperiences: expStats.totalCount,
      patterns: expStats.byType['pattern'] || 0,
      rules: factStats.byType['rule'] || 0,
      avgImportance: expStats.avgImportance
    };
  }
}

// Singleton instance
export const memoryConsolidationEngine = new MemoryConsolidationEngine();

/**
 * Schedule consolidation to run periodically
 * Call this when app starts to set up automatic consolidation
 */
export function scheduleConsolidation(userId: string, intervalHours: number = 24) {
  const intervalMs = intervalHours * 60 * 60 * 1000;

  // Run immediately on schedule
  memoryConsolidationEngine.consolidate(userId).catch(console.error);

  // Then run periodically
  const interval = setInterval(() => {
    memoryConsolidationEngine.consolidate(userId).catch(console.error);
  }, intervalMs);

  console.log(`Scheduled memory consolidation every ${intervalHours} hours for user ${userId}`);

  return interval;
}
