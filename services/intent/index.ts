/**
 * Intent Interpreter - PM Goal Parser
 *
 * Transforms plain English PM goals into structured, executable workflow plans.
 */

export {
  parseIntent,
  needsClarification,
  formatAmbiguities,
  getExecutionOrder,
  estimateTotalDuration
} from './interpreter';

export type { Intent, Task } from './interpreter';

export { exampleGoals, testAllExamples } from './examples';
