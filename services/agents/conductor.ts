import { AgentState, AgentAction, AgentRole, Goal, FlowRun, Incident } from '../../types/aura-os';
import { executeAgentStep } from '../llm';

/**
 * CONDUCTOR AGENT - The orchestration brain of AURA OS
 *
 * Responsibilities:
 * - High-level planning and coordination
 * - Decides which specialist agent to invoke next
 * - Tracks progress towards Goal
 * - Maintains conversation context
 * - Routes to appropriate specialist based on context
 */

export class ConductorAgent {
  private agentRole: AgentRole = 'conductor';

  /**
   * Main decision loop - decides next action based on current state
   */
  async decide(state: AgentState): Promise<{
    nextAgent: AgentRole | null;
    action: string;
    reasoning: string;
    updatedState: AgentState;
  }> {
    const systemPrompt = this.buildSystemPrompt(state);

    const response = await this.callLLM(systemPrompt, state);

    // Parse LLM response to determine next steps
    const decision = this.parseDecision(response, state);

    // Update state with new action
    const action: AgentAction = {
      agentRole: this.agentRole,
      action: decision.action,
      input: { reasoning: decision.reasoning },
      timestamp: Date.now(),
      success: true
    };

    const updatedState: AgentState = {
      ...state,
      history: [...state.history, action],
      timestamp: Date.now()
    };

    return {
      nextAgent: decision.nextAgent,
      action: decision.action,
      reasoning: decision.reasoning,
      updatedState
    };
  }

  private buildSystemPrompt(state: AgentState): string {
    return `You are the CONDUCTOR AGENT in AURA OS - a multi-agent automation platform.

Your role: High-level orchestrator and decision-maker.

CURRENT SITUATION:
Goal: ${state.goal.description}
${state.goal.constraints ? `Constraints: ${state.goal.constraints.join(', ')}` : ''}
${state.goal.successCriteria ? `Success Criteria: ${state.goal.successCriteria.join(', ')}` : ''}

AVAILABLE SPECIALIST AGENTS:
1. PLANNER - Creates workflow graphs from natural language
   - Use when: Need to design new automation flow
   - Input: Goal description, integration catalog, user context
   - Output: Complete workflow graph (nodes, edges, triggers)

2. EXECUTOR - Executes tools, APIs, and integrations
   - Use when: Need to run actions or call external services
   - Input: Node configuration, parameters, credentials
   - Output: Execution results, response data

3. DEBUGGER - Analyzes failures and proposes fixes
   - Use when: Execution failed or high error rate detected
   - Input: Error trace, node config, logs, integration metadata
   - Output: Root cause analysis, fix proposals

4. OPTIMIZER - Improves workflow performance and cost
   - Use when: Workflow complete but can be improved
   - Input: Workflow graph, metrics, cost data, latency
   - Output: Optimization proposals (merge nodes, change providers, etc.)

5. AUDITOR - Ensures security and compliance
   - Use when: Need to validate data flows, permissions, policies
   - Input: Workflow graph, data mappings, user context
   - Output: Compliance issues, security risks, recommendations

6. SELF_HEALER - Automatically remediates incidents
   - Use when: Incident detected, need automatic recovery
   - Input: Incident details, remediation playbooks
   - Output: Applied remediation, success/failure

EXECUTION HISTORY:
${this.formatHistory(state.history)}

ACTIVE INCIDENTS:
${state.incidents.length > 0 ? state.incidents.map(i => `- [${i.severity}] ${i.title}: ${i.description}`).join('\n') : 'None'}

DECISION PROTOCOL:
1. Analyze current state and goal progress
2. Identify what needs to happen next
3. Choose the most appropriate specialist agent
4. If goal is achieved or blocked, return NULL
5. Provide clear reasoning for your decision

RESPONSE FORMAT (JSON):
{
  "nextAgent": "planner" | "executor" | "debugger" | "optimizer" | "auditor" | "self_healer" | null,
  "action": "brief description of what should happen next",
  "reasoning": "why this agent and action were chosen",
  "goalProgress": "percentage complete (0-100)",
  "blocked": false,
  "blockReason": null
}`;
  }

  private async callLLM(systemPrompt: string, state: AgentState): Promise<string> {
    // Use existing LLM service with a dummy node for conductor decisions
    const dummyNode = {
      id: 'conductor',
      type: 'agent' as const,
      label: 'Conductor Agent',
      data: {
        role: 'Conductor',
        goal: state.goal.description,
        description: 'Orchestrates specialist agents'
      }
    };

    const inputState = JSON.stringify({
      goal: state.goal,
      history: state.history.slice(-5), // Last 5 actions for context
      incidents: state.incidents,
      context: state.context
    }, null, 2);

    const response = await executeAgentStep(dummyNode, inputState, []);

    return response;
  }

  private parseDecision(llmResponse: string, state: AgentState): {
    nextAgent: AgentRole | null;
    action: string;
    reasoning: string;
  } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(llmResponse);

      return {
        nextAgent: parsed.nextAgent as AgentRole | null,
        action: parsed.action || 'Continue execution',
        reasoning: parsed.reasoning || 'LLM decision'
      };
    } catch {
      // Fallback: Extract from natural language response
      return this.extractDecisionFromText(llmResponse, state);
    }
  }

  private extractDecisionFromText(text: string, state: AgentState): {
    nextAgent: AgentRole | null;
    action: string;
    reasoning: string;
  } {
    const lowerText = text.toLowerCase();

    // Simple heuristics to determine next agent
    if (lowerText.includes('plan') || lowerText.includes('design') || lowerText.includes('workflow')) {
      return {
        nextAgent: 'planner',
        action: 'Generate workflow plan',
        reasoning: 'Need to create or update workflow graph'
      };
    }

    if (lowerText.includes('execute') || lowerText.includes('run') || lowerText.includes('call')) {
      return {
        nextAgent: 'executor',
        action: 'Execute workflow step',
        reasoning: 'Ready to execute next action'
      };
    }

    if (lowerText.includes('error') || lowerText.includes('fail') || lowerText.includes('debug')) {
      return {
        nextAgent: 'debugger',
        action: 'Analyze and fix error',
        reasoning: 'Error detected, need debugging'
      };
    }

    if (lowerText.includes('optimize') || lowerText.includes('improve') || lowerText.includes('performance')) {
      return {
        nextAgent: 'optimizer',
        action: 'Optimize workflow',
        reasoning: 'Workflow can be improved'
      };
    }

    if (state.incidents.length > 0) {
      return {
        nextAgent: 'self_healer',
        action: 'Apply self-healing',
        reasoning: 'Active incidents require remediation'
      };
    }

    // Default: continue with executor if we have a plan
    if (state.history.some(a => a.agentRole === 'planner')) {
      return {
        nextAgent: 'executor',
        action: 'Continue execution',
        reasoning: 'Plan exists, continue execution'
      };
    }

    // Otherwise, need planning first
    return {
      nextAgent: 'planner',
      action: 'Create execution plan',
      reasoning: 'No plan exists, starting with planning phase'
    };
  }

  private formatHistory(history: AgentAction[]): string {
    if (history.length === 0) return 'No actions taken yet';

    return history.slice(-10).map((action, idx) => {
      const timestamp = new Date(action.timestamp).toISOString();
      const status = action.success ? '✓' : '✗';
      return `${idx + 1}. [${timestamp}] ${status} ${action.agentRole.toUpperCase()}: ${action.action}`;
    }).join('\n');
  }

  /**
   * Evaluate if goal has been achieved
   */
  async evaluateGoalCompletion(state: AgentState): Promise<{
    completed: boolean;
    progress: number;
    assessment: string;
  }> {
    const systemPrompt = `You are evaluating goal completion for AURA OS.

GOAL: ${state.goal.description}
${state.goal.successCriteria ? `SUCCESS CRITERIA:\n${state.goal.successCriteria.map(c => `- ${c}`).join('\n')}` : ''}

EXECUTION HISTORY:
${this.formatHistory(state.history)}

CURRENT CONTEXT:
${JSON.stringify(state.context, null, 2)}

Evaluate:
1. Has the goal been fully achieved?
2. What percentage complete (0-100)?
3. What still needs to be done?

RESPONSE FORMAT (JSON):
{
  "completed": true/false,
  "progress": 0-100,
  "assessment": "detailed evaluation",
  "nextSteps": ["step1", "step2"] or null if complete
}`;

    const dummyNode = {
      id: 'conductor_eval',
      type: 'agent' as const,
      label: 'Goal Evaluator',
      data: { role: 'Conductor', goal: 'Evaluate goal completion' }
    };

    const response = await executeAgentStep(dummyNode, systemPrompt, []);

    try {
      const parsed = JSON.parse(response);
      return {
        completed: parsed.completed || false,
        progress: parsed.progress || 0,
        assessment: parsed.assessment || response
      };
    } catch {
      // Fallback parsing
      return {
        completed: response.toLowerCase().includes('goal achieved') ||
                  response.toLowerCase().includes('completed successfully'),
        progress: 50,
        assessment: response
      };
    }
  }

  /**
   * Handle errors and decide on recovery strategy
   */
  async handleError(state: AgentState, error: Error): Promise<{
    strategy: 'retry' | 'debug' | 'escalate' | 'abort';
    reasoning: string;
  }> {
    const errorContext = {
      message: error.message,
      lastAction: state.history[state.history.length - 1],
      retryCount: state.history.filter(a => !a.success).length
    };

    // Simple heuristics for error handling
    if (errorContext.retryCount >= 3) {
      return {
        strategy: 'escalate',
        reasoning: 'Multiple retries failed, human intervention required'
      };
    }

    if (error.message.includes('auth') || error.message.includes('credential')) {
      return {
        strategy: 'escalate',
        reasoning: 'Authentication issue requires credential update'
      };
    }

    if (error.message.includes('rate limit') || error.message.includes('timeout')) {
      return {
        strategy: 'retry',
        reasoning: 'Transient error, retry with backoff'
      };
    }

    return {
      strategy: 'debug',
      reasoning: 'Error requires analysis by Debugger agent'
    };
  }
}

// Singleton instance
export const conductorAgent = new ConductorAgent();
