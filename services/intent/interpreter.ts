/**
 * Intent Interpreter - Parse PM goals into structured execution plans
 *
 * Transforms plain English PM goals into executable workflow plans.
 *
 * Examples:
 * - "Create a detailed PRD for an AI Tutor module for Class 6-10"
 * - "Analyze Notion vs Linear vs Coda and give summary"
 * - "Convert this PRD into 12 actionable Jira stories"
 * - "Design a user onboarding flow with 3 variants to A/B test"
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export interface Intent {
  type: 'workflow' | 'prototype' | 'experiment' | 'analysis' | 'document';
  goal: string;
  tasks: Task[];
  tools: string[];
  agents: string[];
  constraints: string[];
  success_criteria: string[];
  ambiguities: string[]; // Questions to clarify with user
  estimated_duration: number; // seconds
  confidence: number; // 0-1, how confident in the interpretation
}

export interface Task {
  id: string;
  name: string;
  description: string;
  agent: string;
  dependencies: string[]; // IDs of tasks that must complete first
  estimated_duration: number; // seconds
  outputs: string[]; // What this task produces
}

/**
 * Parse PM goal into structured intent
 */
export async function parseIntent(pmGoal: string): Promise<Intent> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    temperature: 0,
    messages: [{
      role: 'user',
      content: `You are an AI PM assistant. Parse this PM goal into a structured execution plan.

PM Goal: "${pmGoal}"

Analyze the goal and return a JSON object with this structure:

{
  "type": "workflow | prototype | experiment | analysis | document",
  "goal": "Restated goal in clear terms",
  "tasks": [
    {
      "id": "task_1",
      "name": "Short task name",
      "description": "What needs to be done",
      "agent": "research | prd_writer | ux_writer | analyst | jira_manager | communication",
      "dependencies": [],
      "estimated_duration": 15,
      "outputs": ["What this task produces"]
    }
  ],
  "tools": ["List of tools needed: web_search, notion, jira, slack, etc"],
  "agents": ["List of agents needed"],
  "constraints": ["Any constraints or requirements"],
  "success_criteria": ["How to measure success"],
  "ambiguities": ["Questions to clarify with user, if any"],
  "estimated_duration": 60,
  "confidence": 0.85
}

Rules:
- Break complex goals into 3-7 tasks
- Assign each task to the most appropriate agent
- Identify dependencies between tasks
- Estimate realistic durations
- Flag any ambiguities that need user clarification
- Use only these agents: research, prd_writer, ux_writer, analyst, jira_manager, communication
- Be specific about success criteria

Return ONLY the JSON object, no other text.`
    }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    const intent: Intent = JSON.parse(content.text);

    // Validate the intent structure
    validateIntent(intent);

    return intent;
  } catch (error) {
    throw new Error(`Failed to parse intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate intent structure
 */
function validateIntent(intent: Intent): void {
  const validTypes = ['workflow', 'prototype', 'experiment', 'analysis', 'document'];
  const validAgents = ['research', 'prd_writer', 'ux_writer', 'analyst', 'jira_manager', 'communication'];

  if (!validTypes.includes(intent.type)) {
    throw new Error(`Invalid intent type: ${intent.type}`);
  }

  if (!intent.goal || intent.goal.trim().length === 0) {
    throw new Error('Intent goal is required');
  }

  if (!Array.isArray(intent.tasks) || intent.tasks.length === 0) {
    throw new Error('Intent must have at least one task');
  }

  // Validate each task
  intent.tasks.forEach((task, index) => {
    if (!task.id || !task.name || !task.agent) {
      throw new Error(`Task ${index} is missing required fields`);
    }

    if (!validAgents.includes(task.agent)) {
      throw new Error(`Invalid agent for task ${task.id}: ${task.agent}`);
    }

    if (task.estimated_duration <= 0) {
      throw new Error(`Task ${task.id} must have positive duration`);
    }
  });

  // Validate confidence is between 0 and 1
  if (intent.confidence < 0 || intent.confidence > 1) {
    throw new Error('Confidence must be between 0 and 1');
  }
}

/**
 * Check if user clarification is needed
 */
export function needsClarification(intent: Intent): boolean {
  return intent.ambiguities.length > 0 || intent.confidence < 0.7;
}

/**
 * Format ambiguities as user-friendly questions
 */
export function formatAmbiguities(intent: Intent): string {
  if (intent.ambiguities.length === 0) {
    return '';
  }

  return intent.ambiguities
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n');
}

/**
 * Get task execution order based on dependencies
 */
export function getExecutionOrder(intent: Intent): Task[] {
  const tasks = [...intent.tasks];
  const ordered: Task[] = [];
  const completed = new Set<string>();

  // Simple topological sort
  while (ordered.length < tasks.length) {
    const nextTask = tasks.find(task =>
      !completed.has(task.id) &&
      task.dependencies.every(dep => completed.has(dep))
    );

    if (!nextTask) {
      throw new Error('Circular dependency detected in tasks');
    }

    ordered.push(nextTask);
    completed.add(nextTask.id);
  }

  return ordered;
}

/**
 * Estimate total workflow duration
 */
export function estimateTotalDuration(intent: Intent): number {
  const executionOrder = getExecutionOrder(intent);

  // Calculate critical path (tasks that can't run in parallel)
  // For MVP, we run tasks sequentially
  return executionOrder.reduce((total, task) => total + task.estimated_duration, 0);
}
