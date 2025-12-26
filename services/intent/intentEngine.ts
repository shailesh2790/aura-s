/**
 * Intent Engine
 *
 * Transforms PM goals into executable multi-agent plans
 * Core component of AURA OS - PM Automation
 */

import { callGroqLLM } from '../llm';

// Domain classification
export type PMDomain =
  | 'research'        // Competitive analysis, market research
  | 'writing'         // PRD, documentation, copy
  | 'analysis'        // Metrics, reports, data analysis
  | 'planning'        // Roadmap, sprint planning
  | 'execution'       // Jira updates, task management
  | 'communication';  // Slack, email, stakeholder updates

// Agent types
export type AgentType =
  | 'research'        // Web search, competitive analysis
  | 'prd_writer'      // PRD generation
  | 'ux_writer'       // UX copy, microcopy
  | 'analyst'         // Metrics, reporting
  | 'jira_manager'    // Jira/Linear integration
  | 'planner'         // Multi-step planning
  | 'executor';       // Tool execution

export interface ParsedGoal {
  intent: string;
  domain: PMDomain;
  deliverables: string[];
  constraints: string[];
  timeline?: string;
  context?: string;
}

export interface ExecutionStep {
  id: string;
  description: string;
  agent: AgentType;
  tools: string[];
  inputs: Record<string, any>;
  expectedOutput: string;
  estimatedTime: number; // seconds
}

export interface Dependency {
  stepId: string;
  dependsOn: string[];
}

export interface TaskPlan {
  goal: string;
  steps: ExecutionStep[];
  dependencies: Dependency[];
  estimatedTotalTime: number;
  requiredTools: string[];
  requiredAgents: AgentType[];
}

export class IntentEngine {
  /**
   * Parse user's PM goal into structured intent
   */
  async parseGoal(input: string, context?: string): Promise<ParsedGoal> {
    const prompt = `You are an expert Product Manager and AI planning system. Analyze the following PM goal and extract structured information.

Goal: "${input}"
${context ? `Context: ${context}` : ''}

Extract:
1. Intent - What is the user trying to accomplish?
2. Domain - Classify as: research, writing, analysis, planning, execution, or communication
3. Deliverables - List of concrete outputs expected
4. Constraints - Any time, quality, or scope constraints
5. Timeline - If mentioned, extract timeline

Return as JSON:
{
  "intent": "concise statement of intent",
  "domain": "domain category",
  "deliverables": ["deliverable 1", "deliverable 2"],
  "constraints": ["constraint 1", "constraint 2"],
  "timeline": "timeline if mentioned or null",
  "context": "relevant context extracted"
}`;

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse goal - no JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as ParsedGoal;
    } catch (error) {
      console.error('Error parsing goal:', error);
      // Fallback to basic parsing
      return {
        intent: input,
        domain: this.inferDomain(input),
        deliverables: [input],
        constraints: [],
        timeline: undefined,
        context
      };
    }
  }

  /**
   * Decompose parsed goal into executable steps
   */
  async decomposeTask(goal: ParsedGoal): Promise<TaskPlan> {
    const prompt = `You are an expert Product Manager and workflow architect. Create a detailed execution plan for this PM goal.

Goal: ${goal.intent}
Domain: ${goal.domain}
Deliverables: ${goal.deliverables.join(', ')}
Constraints: ${goal.constraints.join(', ')}

Available Agents:
- research: Web search, competitive analysis, market research
- prd_writer: PRD generation, technical documentation
- ux_writer: UX copy, microcopy, user messaging
- analyst: Metrics extraction, reporting, data analysis
- jira_manager: Jira/Linear ticket management
- planner: Multi-step planning and coordination
- executor: Tool execution and API calls

Available Tools:
- web_search: Search the web
- shopify: E-commerce operations
- stripe: Payment processing
- sendgrid: Email sending
- notion: Documentation
- google_docs: Document creation
- jira: Task management
- slack: Team communication

Create a step-by-step execution plan. For each step specify:
1. Description of what needs to be done
2. Which agent should handle it
3. Which tools are needed
4. Expected output
5. Estimated time in seconds

Return as JSON:
{
  "steps": [
    {
      "id": "step_1",
      "description": "step description",
      "agent": "agent_type",
      "tools": ["tool1", "tool2"],
      "inputs": {},
      "expectedOutput": "what this step produces",
      "estimatedTime": 20
    }
  ],
  "dependencies": [
    {"stepId": "step_2", "dependsOn": ["step_1"]}
  ]
}`;

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      // Extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to decompose task - no JSON found');
      }

      const planData = JSON.parse(jsonMatch[0]);

      // Calculate total time
      const totalTime = planData.steps.reduce((sum: number, step: any) => sum + (step.estimatedTime || 0), 0);

      // Extract unique tools and agents
      const requiredTools = [...new Set(planData.steps.flatMap((s: any) => s.tools || []))];
      const requiredAgents = [...new Set(planData.steps.map((s: any) => s.agent))];

      const plan: TaskPlan = {
        goal: goal.intent,
        steps: planData.steps,
        dependencies: planData.dependencies || [],
        estimatedTotalTime: totalTime,
        requiredTools,
        requiredAgents
      };

      return plan;
    } catch (error) {
      console.error('Error decomposing task:', error);

      // Fallback to basic plan
      return this.createFallbackPlan(goal);
    }
  }

  /**
   * Generate complete plan from raw input
   */
  async generatePlan(input: string, context?: string): Promise<TaskPlan> {
    // Parse goal
    const parsedGoal = await this.parseGoal(input, context);

    // Decompose into steps
    const plan = await this.decomposeTask(parsedGoal);

    return plan;
  }

  /**
   * Allow natural language editing of plan
   */
  async editPlan(plan: TaskPlan, edit: string): Promise<TaskPlan> {
    const prompt = `You are modifying an execution plan based on user feedback.

Current Plan:
${JSON.stringify(plan, null, 2)}

User Edit Request: "${edit}"

Modify the plan according to the user's request. You can:
- Add new steps
- Remove steps
- Reorder steps
- Change agents or tools
- Update descriptions
- Modify dependencies

Return the complete modified plan as JSON with the same structure.`;

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to edit plan - no JSON found');
      }

      const modifiedPlan = JSON.parse(jsonMatch[0]);

      // Recalculate metadata
      modifiedPlan.estimatedTotalTime = modifiedPlan.steps.reduce(
        (sum: number, step: any) => sum + (step.estimatedTime || 0),
        0
      );
      modifiedPlan.requiredTools = [...new Set(modifiedPlan.steps.flatMap((s: any) => s.tools || []))];
      modifiedPlan.requiredAgents = [...new Set(modifiedPlan.steps.map((s: any) => s.agent))];

      return modifiedPlan;
    } catch (error) {
      console.error('Error editing plan:', error);
      return plan; // Return original if edit fails
    }
  }

  /**
   * Infer domain from input text
   */
  private inferDomain(input: string): PMDomain {
    const lower = input.toLowerCase();

    if (lower.includes('prd') || lower.includes('document') || lower.includes('write')) {
      return 'writing';
    }
    if (lower.includes('research') || lower.includes('analysis') || lower.includes('compare') || lower.includes('competitor')) {
      return 'research';
    }
    if (lower.includes('metric') || lower.includes('report') || lower.includes('data') || lower.includes('analytics')) {
      return 'analysis';
    }
    if (lower.includes('jira') || lower.includes('ticket') || lower.includes('story') || lower.includes('task')) {
      return 'execution';
    }
    if (lower.includes('roadmap') || lower.includes('plan') || lower.includes('sprint')) {
      return 'planning';
    }
    if (lower.includes('slack') || lower.includes('email') || lower.includes('notify') || lower.includes('communicate')) {
      return 'communication';
    }

    // Default to research for unknown
    return 'research';
  }

  /**
   * Create a basic fallback plan
   */
  private createFallbackPlan(goal: ParsedGoal): TaskPlan {
    const steps: ExecutionStep[] = [];

    // Add steps based on domain
    switch (goal.domain) {
      case 'research':
        steps.push({
          id: 'step_1',
          description: 'Conduct research on the topic',
          agent: 'research',
          tools: ['web_search'],
          inputs: { query: goal.intent },
          expectedOutput: 'Research findings and data',
          estimatedTime: 30
        });
        steps.push({
          id: 'step_2',
          description: 'Analyze and summarize findings',
          agent: 'analyst',
          tools: [],
          inputs: {},
          expectedOutput: 'Structured analysis report',
          estimatedTime: 20
        });
        break;

      case 'writing':
        steps.push({
          id: 'step_1',
          description: 'Generate document content',
          agent: 'prd_writer',
          tools: [],
          inputs: { topic: goal.intent },
          expectedOutput: 'Draft document',
          estimatedTime: 40
        });
        break;

      case 'analysis':
        steps.push({
          id: 'step_1',
          description: 'Extract and analyze data',
          agent: 'analyst',
          tools: [],
          inputs: {},
          expectedOutput: 'Analysis report',
          estimatedTime: 30
        });
        break;

      default:
        steps.push({
          id: 'step_1',
          description: goal.intent,
          agent: 'planner',
          tools: [],
          inputs: {},
          expectedOutput: 'Completed task',
          estimatedTime: 30
        });
    }

    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    return {
      goal: goal.intent,
      steps,
      dependencies: steps.slice(1).map((step, idx) => ({
        stepId: step.id,
        dependsOn: [steps[idx].id]
      })),
      estimatedTotalTime: totalTime,
      requiredTools: [...new Set(steps.flatMap(s => s.tools))],
      requiredAgents: [...new Set(steps.map(s => s.agent))]
    };
  }

  /**
   * Validate plan for execution
   */
  validatePlan(plan: TaskPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for steps
    if (!plan.steps || plan.steps.length === 0) {
      errors.push('Plan must have at least one step');
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      if (visiting.has(stepId)) return true;
      if (visited.has(stepId)) return false;

      visiting.add(stepId);

      const deps = plan.dependencies.find(d => d.stepId === stepId);
      if (deps) {
        for (const depId of deps.dependsOn) {
          if (hasCycle(depId)) return true;
        }
      }

      visiting.delete(stepId);
      visited.add(stepId);
      return false;
    };

    for (const step of plan.steps) {
      if (hasCycle(step.id)) {
        errors.push('Plan contains circular dependencies');
        break;
      }
    }

    // Check for invalid dependencies
    const stepIds = new Set(plan.steps.map(s => s.id));
    for (const dep of plan.dependencies) {
      if (!stepIds.has(dep.stepId)) {
        errors.push(`Dependency references non-existent step: ${dep.stepId}`);
      }
      for (const depOn of dep.dependsOn) {
        if (!stepIds.has(depOn)) {
          errors.push(`Dependency references non-existent step: ${depOn}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton
export const intentEngine = new IntentEngine();
