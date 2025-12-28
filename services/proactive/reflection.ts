/**
 * Reflection Engine
 *
 * Periodic self-analysis of agent performance
 * Generates insights and proactive action suggestions
 */

import { supabase } from '../../lib/supabase';
import { experientialMemoryStore } from '../memory/experientialMemory';
import { factualMemoryStore } from '../memory/factualMemory';
import { eventStore } from '../runtime/eventStore';
import { Reflection, ProactiveAction } from '../memory/types';
import { v4 as uuidv4 } from 'uuid';

export class ReflectionEngine {
  /**
   * Perform daily reflection
   * Analyzes recent performance and generates insights
   */
  async performReflection(userId: string, periodHours: number = 24): Promise<Reflection> {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - periodHours * 60 * 60 * 1000);

    console.log(`Performing reflection for user ${userId} (${periodHours}h period)...`);

    // Gather data
    const experiences = await experientialMemoryStore.retrieve({
      userId,
      timeRange: { start: periodStart, end: periodEnd },
      limit: 100
    });

    const facts = await factualMemoryStore.retrieve({
      userId,
      timeRange: { start: periodStart, end: periodEnd },
      limit: 50
    });

    // Analyze performance
    const summary = this.analyzPerformance(experiences);
    const insights = this.generateInsights(experiences, facts);
    const actions = await this.proposeActions(userId, insights, summary);

    // Create reflection record
    const reflection: Omit<Reflection, 'id'> = {
      userId,
      period: {
        start: periodStart,
        end: periodEnd
      },
      summary,
      insights,
      actionsProposed: actions,
      timestamp: new Date()
    };

    // Store in database
    const stored = await this.storeReflection(reflection);

    console.log(`Reflection complete: ${insights.length} insights, ${actions.length} actions proposed`);

    return stored;
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformance(experiences: any[]): Reflection['summary'] {
    const total = experiences.length;
    const successes = experiences.filter(e => e.type === 'success').length;
    const failures = experiences.filter(e => e.type === 'failure').length;
    const patterns = experiences.filter(e => e.type === 'pattern').length;

    const successRate = total > 0 ? successes / total : 0;

    // Extract top patterns (most common learned skills)
    const skillCounts: Record<string, number> = {};
    for (const exp of experiences) {
      for (const skill of exp.learnedSkills || []) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    }

    const topPatterns = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);

    // Identify improvements (new patterns)
    const improvements = patterns > 0
      ? [`Identified ${patterns} new behavioral patterns`]
      : [];

    if (successRate > 0.8) {
      improvements.push('High success rate maintained');
    }

    // Identify challenges (failures)
    const challenges: string[] = [];
    if (failures > 0) {
      challenges.push(`${failures} failed attempts need investigation`);
    }
    if (successRate < 0.5 && total > 5) {
      challenges.push('Success rate below 50% - review approach');
    }

    return {
      totalRuns: total,
      successRate,
      topPatterns,
      improvements,
      challenges
    };
  }

  /**
   * Generate insights from experiences and facts
   */
  private generateInsights(experiences: any[], facts: any[]): string[] {
    const insights: string[] = [];

    // Insight 1: Success patterns
    const successes = experiences.filter(e => e.type === 'success');
    if (successes.length >= 3) {
      const commonSkills = this.findCommonSkills(successes);
      if (commonSkills.length > 0) {
        insights.push(`Most successful when using: ${commonSkills.join(', ')}`);
      }
    }

    // Insight 2: Failure patterns
    const failures = experiences.filter(e => e.type === 'failure');
    if (failures.length >= 2) {
      const commonContext = this.findCommonContext(failures);
      if (commonContext) {
        insights.push(`Failures tend to occur in context: ${commonContext}`);
      }
    }

    // Insight 3: Learning velocity
    const uniqueSkills = new Set(
      experiences.flatMap(e => e.learnedSkills || [])
    );
    if (uniqueSkills.size > 0) {
      insights.push(`Learned ${uniqueSkills.size} new skills this period`);
    }

    // Insight 4: Knowledge growth
    const newFacts = facts.length;
    if (newFacts > 0) {
      insights.push(`Acquired ${newFacts} new facts/rules`);
    }

    // Insight 5: Improvement trajectory
    if (experiences.length >= 5) {
      const recentSuccessRate = this.calculateRecentSuccessRate(experiences);
      const earlySuccessRate = this.calculateEarlySuccessRate(experiences);

      if (recentSuccessRate > earlySuccessRate + 0.1) {
        insights.push('Performance improving over time');
      } else if (recentSuccessRate < earlySuccessRate - 0.1) {
        insights.push('Performance degrading - may need intervention');
      }
    }

    return insights;
  }

  /**
   * Find skills common across experiences
   */
  private findCommonSkills(experiences: any[]): string[] {
    const skillCounts: Record<string, number> = {};

    for (const exp of experiences) {
      for (const skill of exp.learnedSkills || []) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    }

    const threshold = Math.ceil(experiences.length * 0.5); // Present in >50%

    return Object.entries(skillCounts)
      .filter(([, count]) => count >= threshold)
      .map(([skill]) => skill);
  }

  /**
   * Find common context in experiences
   */
  private findCommonContext(experiences: any[]): string | null {
    if (experiences.length === 0) return null;

    // Extract keywords from all contexts
    const allKeywords = experiences.map(e =>
      e.context.toLowerCase().split(/\s+/)
    );

    // Find most common keyword
    const keywordCounts: Record<string, number> = {};
    for (const keywords of allKeywords) {
      for (const keyword of keywords) {
        if (keyword.length > 3) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      }
    }

    const sorted = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a);

    return sorted[0]?.[0] || null;
  }

  /**
   * Calculate success rate for recent half of experiences
   */
  private calculateRecentSuccessRate(experiences: any[]): number {
    const mid = Math.floor(experiences.length / 2);
    const recent = experiences.slice(mid);

    const successes = recent.filter(e => e.type === 'success').length;
    return successes / recent.length;
  }

  /**
   * Calculate success rate for early half of experiences
   */
  private calculateEarlySuccessRate(experiences: any[]): number {
    const mid = Math.floor(experiences.length / 2);
    const early = experiences.slice(0, mid);

    const successes = early.filter(e => e.type === 'success').length;
    return successes / early.length;
  }

  /**
   * Propose proactive actions based on insights
   */
  private async proposeActions(
    userId: string,
    insights: string[],
    summary: Reflection['summary']
  ): Promise<ProactiveAction[]> {
    const actions: Omit<ProactiveAction, 'id'>[] = [];

    // Action 1: Address failures
    if (summary.challenges.length > 0) {
      actions.push({
        type: 'optimization',
        title: 'Investigate Recent Failures',
        description: `${summary.challenges[0]}. Review failure logs and identify root causes.`,
        rationale: 'Addressing failures improves overall success rate',
        priority: 'high',
        estimatedImpact: 0.7,
        requiredApproval: false,
        status: 'suggested',
        createdAt: new Date(),
        metadata: {
          challenges: summary.challenges
        }
      });
    }

    // Action 2: Consolidate learnings if many experiences
    if (summary.totalRuns > 10) {
      actions.push({
        type: 'learning',
        title: 'Run Memory Consolidation',
        description: 'Consolidate recent experiences into patterns and rules to improve future performance.',
        rationale: `${summary.totalRuns} experiences can be consolidated for better insights`,
        priority: 'medium',
        estimatedImpact: 0.6,
        requiredApproval: false,
        status: 'suggested',
        createdAt: new Date()
      });
    }

    // Action 3: Share successful patterns
    if (summary.topPatterns.length > 0) {
      actions.push({
        type: 'suggestion',
        title: 'Apply Successful Patterns',
        description: `Your most successful approaches involve: ${summary.topPatterns.slice(0, 3).join(', ')}. Consider applying these to new tasks.`,
        rationale: 'Leveraging proven patterns increases success probability',
        priority: 'medium',
        estimatedImpact: 0.5,
        requiredApproval: false,
        status: 'suggested',
        createdAt: new Date(),
        metadata: {
          patterns: summary.topPatterns
        }
      });
    }

    // Action 4: Low success rate intervention
    if (summary.successRate < 0.5 && summary.totalRuns > 5) {
      actions.push({
        type: 'optimization',
        title: 'Performance Review Required',
        description: `Success rate is ${(summary.successRate * 100).toFixed(0)}%. Review workflow and identify bottlenecks.`,
        rationale: 'Low success rate indicates systemic issues needing attention',
        priority: 'urgent',
        estimatedImpact: 0.8,
        requiredApproval: true,
        status: 'suggested',
        createdAt: new Date()
      });
    }

    // Store actions in database
    const stored: ProactiveAction[] = [];
    for (const action of actions) {
      const storedAction = await this.storeProactiveAction(userId, action);
      stored.push(storedAction);
    }

    return stored;
  }

  /**
   * Store reflection in database
   */
  private async storeReflection(
    reflection: Omit<Reflection, 'id'>
  ): Promise<Reflection> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping reflection storage');
      return { ...reflection, id: uuidv4() };
    }

    const { data, error } = await supabase
      .from('reflections')
      .insert([{
        user_id: reflection.userId,
        period_start: reflection.period.start.toISOString(),
        period_end: reflection.period.end.toISOString(),
        total_runs: reflection.summary.totalRuns,
        success_rate: reflection.summary.successRate,
        top_patterns: reflection.summary.topPatterns,
        improvements: reflection.summary.improvements,
        challenges: reflection.summary.challenges,
        insights: reflection.insights,
        actions_proposed: reflection.actionsProposed
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing reflection:', error);
      throw new Error(`Failed to store reflection: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      period: {
        start: new Date(data.period_start),
        end: new Date(data.period_end)
      },
      summary: {
        totalRuns: data.total_runs,
        successRate: data.success_rate,
        topPatterns: data.top_patterns,
        improvements: data.improvements,
        challenges: data.challenges
      },
      insights: data.insights,
      actionsProposed: data.actions_proposed,
      timestamp: new Date(data.created_at)
    };
  }

  /**
   * Store proactive action in database
   */
  private async storeProactiveAction(
    userId: string,
    action: Omit<ProactiveAction, 'id'>
  ): Promise<ProactiveAction> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping action storage');
      return { ...action, id: uuidv4() };
    }

    const { data, error } = await supabase
      .from('proactive_actions')
      .insert([{
        user_id: userId,
        type: action.type,
        title: action.title,
        description: action.description,
        rationale: action.rationale,
        priority: action.priority,
        estimated_impact: action.estimatedImpact,
        required_approval: action.requiredApproval,
        status: action.status,
        scheduled_for: action.scheduledFor?.toISOString(),
        metadata: action.metadata
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing proactive action:', error);
      throw new Error(`Failed to store action: ${error.message}`);
    }

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      rationale: data.rationale,
      priority: data.priority,
      estimatedImpact: data.estimated_impact,
      requiredApproval: data.required_approval,
      status: data.status,
      createdAt: new Date(data.created_at),
      scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : undefined,
      metadata: data.metadata
    };
  }

  /**
   * Get recent reflections
   */
  async getReflections(userId: string, limit: number = 10): Promise<Reflection[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error('Error retrieving reflections:', error);
      return [];
    }

    return data.map(d => ({
      id: d.id,
      userId: d.user_id,
      period: {
        start: new Date(d.period_start),
        end: new Date(d.period_end)
      },
      summary: {
        totalRuns: d.total_runs,
        successRate: d.success_rate,
        topPatterns: d.top_patterns,
        improvements: d.improvements,
        challenges: d.challenges
      },
      insights: d.insights,
      actionsProposed: d.actions_proposed,
      timestamp: new Date(d.created_at)
    }));
  }

  /**
   * Get pending proactive actions
   */
  async getPendingActions(userId: string): Promise<ProactiveAction[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('proactive_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'suggested')
      .order('priority', { ascending: false });

    if (error || !data) {
      console.error('Error retrieving actions:', error);
      return [];
    }

    return data.map(d => ({
      id: d.id,
      type: d.type,
      title: d.title,
      description: d.description,
      rationale: d.rationale,
      priority: d.priority,
      estimatedImpact: d.estimated_impact,
      requiredApproval: d.required_approval,
      status: d.status,
      createdAt: new Date(d.created_at),
      scheduledFor: d.scheduled_for ? new Date(d.scheduled_for) : undefined,
      completedAt: d.completed_at ? new Date(d.completed_at) : undefined,
      outcome: d.outcome,
      metadata: d.metadata
    }));
  }
}

// Singleton instance
export const reflectionEngine = new ReflectionEngine();

/**
 * Schedule daily reflection
 */
export function scheduleDailyReflection(userId: string, hourOfDay: number = 0) {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(hourOfDay, 0, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const msUntilNextRun = nextRun.getTime() - now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Run first reflection after delay
  setTimeout(() => {
    reflectionEngine.performReflection(userId).catch(console.error);

    // Then run daily
    setInterval(() => {
      reflectionEngine.performReflection(userId).catch(console.error);
    }, oneDayMs);
  }, msUntilNextRun);

  console.log(`Scheduled daily reflection at ${hourOfDay}:00 for user ${userId}`);
}
