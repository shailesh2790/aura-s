/**
 * Proactive Agents - Central Exports
 *
 * Self-reflective agents that plan and act autonomously
 */

// Reflection Engine
export { reflectionEngine, ReflectionEngine, scheduleDailyReflection } from './reflection';

// Types
export type {
  Reflection,
  ProactiveAction,
  PerformanceSummary
} from '../memory/types';

// Convenience functions
import { reflectionEngine } from './reflection';

/**
 * Run reflection for a user
 */
export async function performReflection(userId: string, periodHours: number = 24) {
  const reflection = await reflectionEngine.performReflection(userId, periodHours);

  console.log(`Reflection completed for user ${userId}:`, {
    insights: reflection.insights.length,
    actions: reflection.actionsProposed.length,
    successRate: reflection.summary.successRate
  });

  return reflection;
}

/**
 * Get pending proactive actions for a user
 */
export async function getPendingActions(userId: string) {
  const actions = await reflectionEngine.getPendingActions(userId);

  console.log(`Found ${actions.length} pending actions for user ${userId}`);

  return actions;
}

/**
 * Get recent reflections
 */
export async function getReflections(userId: string, limit: number = 10) {
  const reflections = await reflectionEngine.getReflections(userId, limit);

  return reflections;
}
