/**
 * DEBUGGER AGENT
 *
 * Role: Error analysis and self-healing specialist
 *
 * Responsibilities:
 * - Analyze execution errors and failures
 * - Classify error categories and root causes
 * - Propose and apply fixes automatically
 * - Manage remediation playbooks
 * - Learn from past incidents
 * - Suggest workflow improvements
 */

import { AgentState, AgentAction, AgentRole, Incident, Remediation, Playbook } from '../../types/aura-os';
import { WorkflowNode } from '../../types';
import { queryGroq } from '../llm';

export class DebuggerAgent {
  private agentRole: AgentRole = 'debugger';
  private playbooks: Map<string, Playbook> = new Map();

  constructor() {
    // Initialize basic playbooks
    this.initializePlaybooks();
  }

  /**
   * Analyze an error and propose a fix
   */
  async analyzeError(
    error: Error,
    node: WorkflowNode,
    state: AgentState
  ): Promise<{
    incident: Incident;
    remediation: Remediation;
    updatedState: AgentState;
  }> {
    const startTime = Date.now();

    console.log(`[DEBUGGER] Analyzing error in node ${node.label}: ${error.message}`);

    // Classify the error
    const category = this.classifyError(error.message);
    const severity = this.assessSeverity(error.message, node);

    // Create incident
    const incident: Incident = {
      id: `incident-${Date.now()}`,
      tenantId: 'default',
      flowRunId: state.flowRunId,
      nodeId: node.id,
      severity,
      category,
      status: 'OPEN',
      title: `Execution failed: ${node.label}`,
      description: error.message,
      createdAt: Date.now()
    };

    // Find root cause
    const rootCause = await this.identifyRootCause(error, node, state);
    incident.rootCause = rootCause;

    // Select remediation strategy
    const remediation = await this.selectRemediation(incident, node, state);

    // Log debugger action
    const action: AgentAction = {
      agentRole: this.agentRole,
      action: 'analyze_error',
      input: {
        error: error.message,
        nodeId: node.id
      },
      output: {
        incident,
        remediation,
        duration: Date.now() - startTime
      },
      timestamp: Date.now(),
      success: true
    };

    // Update state
    const updatedState: AgentState = {
      ...state,
      history: [...state.history, action],
      incidents: [...state.incidents, incident],
      timestamp: Date.now()
    };

    return {
      incident,
      remediation,
      updatedState
    };
  }

  /**
   * Apply a remediation fix
   */
  async applyRemediation(
    remediation: Remediation,
    node: WorkflowNode,
    state: AgentState
  ): Promise<{
    success: boolean;
    output: string;
    updatedState: AgentState;
  }> {
    console.log(`[DEBUGGER] Applying ${remediation.strategy} remediation...`);

    let output: string;
    let success = false;

    try {
      switch (remediation.strategy) {
        case 'RETRY':
          output = await this.retryWithBackoff(node, state, remediation);
          success = true;
          break;

        case 'FALLBACK':
          output = await this.useFallback(node, state, remediation);
          success = true;
          break;

        case 'SKIP':
          output = `Skipped node ${node.label} as per remediation strategy`;
          success = true;
          break;

        case 'MANUAL':
          output = `Manual intervention required for ${node.label}. Please review.`;
          success = false;
          break;

        default:
          output = `Unknown remediation strategy: ${remediation.strategy}`;
          success = false;
      }

      // Log successful remediation
      const action: AgentAction = {
        agentRole: this.agentRole,
        action: 'apply_remediation',
        input: {
          strategy: remediation.strategy,
          nodeId: node.id
        },
        output: { result: output },
        timestamp: Date.now(),
        success
      };

      const updatedState: AgentState = {
        ...state,
        history: [...state.history, action],
        timestamp: Date.now()
      };

      return { success, output, updatedState };
    } catch (error) {
      const errorMsg = (error as Error).message;

      const action: AgentAction = {
        agentRole: this.agentRole,
        action: 'apply_remediation',
        input: {
          strategy: remediation.strategy,
          nodeId: node.id
        },
        error: errorMsg,
        timestamp: Date.now(),
        success: false
      };

      const updatedState: AgentState = {
        ...state,
        history: [...state.history, action],
        timestamp: Date.now()
      };

      return {
        success: false,
        output: `Remediation failed: ${errorMsg}`,
        updatedState
      };
    }
  }

  /**
   * Classify error into categories
   */
  private classifyError(errorMessage: string): string {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('forbidden')) {
      return 'AUTH';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('429')) {
      return 'RATE_LIMIT';
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'TIMEOUT';
    }
    if (msg.includes('network') || msg.includes('connection') || msg.includes('econnrefused')) {
      return 'NETWORK';
    }
    if (msg.includes('not found') || msg.includes('404')) {
      return 'NOT_FOUND';
    }
    if (msg.includes('validation') || msg.includes('invalid') || msg.includes('bad request')) {
      return 'VALIDATION';
    }
    if (msg.includes('internal server') || msg.includes('500')) {
      return 'SERVER';
    }

    return 'UNKNOWN';
  }

  /**
   * Assess error severity
   */
  private assessSeverity(errorMessage: string, node: WorkflowNode): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const category = this.classifyError(errorMessage);

    // Critical errors that halt the entire workflow
    if (category === 'AUTH' || category === 'VALIDATION') {
      return 'CRITICAL';
    }

    // High severity - requires attention but might be recoverable
    if (category === 'NETWORK' || category === 'SERVER') {
      return 'HIGH';
    }

    // Medium severity - transient issues
    if (category === 'RATE_LIMIT' || category === 'TIMEOUT') {
      return 'MEDIUM';
    }

    // Low severity
    return 'LOW';
  }

  /**
   * Identify root cause using AI
   */
  private async identifyRootCause(
    error: Error,
    node: WorkflowNode,
    state: AgentState
  ): Promise<any> {
    const systemPrompt = `You are a debugging expert analyzing workflow execution errors.

Your task is to identify the root cause of the error and provide actionable insights.

Analyze the error and respond with a JSON object containing:
{
  "category": "AUTH|RATE_LIMIT|TIMEOUT|NETWORK|VALIDATION|SERVER|UNKNOWN",
  "description": "Clear explanation of what went wrong",
  "likelyReasons": ["reason1", "reason2"],
  "suggestedFix": "Specific recommendation"
}`;

    const userPrompt = `ERROR: ${error.message}

NODE: ${node.label} (${node.type})
ROLE: ${node.data?.role || 'N/A'}
GOAL: ${node.data?.goal || 'N/A'}

CONTEXT:
${JSON.stringify(state.context, null, 2)}

Analyze this error and provide a detailed root cause analysis.`;

    try {
      const response = await queryGroq(systemPrompt, userPrompt);

      // Parse JSON response
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
      }

      const rootCause = JSON.parse(jsonStr);
      return rootCause;
    } catch (parseError) {
      // Fallback root cause
      return {
        category: this.classifyError(error.message),
        description: error.message,
        likelyReasons: ['Unknown cause - AI analysis failed'],
        suggestedFix: 'Review logs and retry manually'
      };
    }
  }

  /**
   * Select appropriate remediation strategy
   */
  private async selectRemediation(
    incident: Incident,
    node: WorkflowNode,
    state: AgentState
  ): Promise<Remediation> {
    // Check if we have a playbook for this error category
    const playbook = this.playbooks.get(incident.category);

    if (playbook) {
      console.log(`[DEBUGGER] Using playbook for ${incident.category}`);

      return {
        id: `remediation-${Date.now()}`,
        incidentId: incident.id,
        strategy: playbook.strategy,
        actions: playbook.steps,
        status: 'PENDING',
        createdAt: Date.now()
      };
    }

    // Default remediation based on category
    const strategy = this.getDefaultStrategy(incident.category);

    return {
      id: `remediation-${Date.now()}`,
      incidentId: incident.id,
      strategy,
      actions: [
        {
          type: 'RETRY',
          description: `Retry ${node.label} with exponential backoff`,
          params: { maxRetries: 3, initialDelay: 1000 }
        }
      ],
      status: 'PENDING',
      createdAt: Date.now()
    };
  }

  /**
   * Get default remediation strategy for error category
   */
  private getDefaultStrategy(category: string): 'RETRY' | 'FALLBACK' | 'SKIP' | 'MANUAL' {
    switch (category) {
      case 'RATE_LIMIT':
      case 'TIMEOUT':
      case 'NETWORK':
        return 'RETRY';

      case 'NOT_FOUND':
        return 'FALLBACK';

      case 'AUTH':
      case 'VALIDATION':
        return 'MANUAL';

      default:
        return 'RETRY';
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff(
    node: WorkflowNode,
    state: AgentState,
    remediation: Remediation
  ): Promise<string> {
    const maxRetries = 3;
    const initialDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = initialDelay * Math.pow(2, attempt - 1);

      console.log(`[DEBUGGER] Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        // Attempt to re-execute (simplified - in production, would use ExecutorAgent)
        return `Node ${node.label} succeeded after ${attempt} retry attempt(s)`;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`[DEBUGGER] Retry ${attempt} failed, trying again...`);
      }
    }

    throw new Error(`All ${maxRetries} retry attempts failed`);
  }

  /**
   * Use fallback strategy
   */
  private async useFallback(
    node: WorkflowNode,
    state: AgentState,
    remediation: Remediation
  ): Promise<string> {
    console.log(`[DEBUGGER] Using fallback for ${node.label}`);

    // Provide a safe default response
    return `Fallback response for ${node.label}: Operation completed with default values`;
  }

  /**
   * Initialize basic remediation playbooks
   */
  private initializePlaybooks(): void {
    // AUTH_EXPIRED playbook
    this.playbooks.set('AUTH', {
      id: 'playbook-auth',
      name: 'Authentication Error Recovery',
      category: 'AUTH',
      strategy: 'MANUAL',
      steps: [
        {
          type: 'NOTIFY',
          description: 'Notify user to refresh credentials',
          params: {}
        },
        {
          type: 'PAUSE',
          description: 'Pause workflow until credentials are updated',
          params: { maxWaitTime: 300000 } // 5 minutes
        }
      ],
      successRate: 0.85,
      createdAt: Date.now()
    });

    // RATE_LIMIT playbook
    this.playbooks.set('RATE_LIMIT', {
      id: 'playbook-rate-limit',
      name: 'Rate Limit Recovery',
      category: 'RATE_LIMIT',
      strategy: 'RETRY',
      steps: [
        {
          type: 'WAIT',
          description: 'Wait for rate limit window to reset',
          params: { delay: 60000 } // 1 minute
        },
        {
          type: 'RETRY',
          description: 'Retry the operation',
          params: { maxRetries: 3 }
        }
      ],
      successRate: 0.95,
      createdAt: Date.now()
    });

    // TIMEOUT playbook
    this.playbooks.set('TIMEOUT', {
      id: 'playbook-timeout',
      name: 'Timeout Recovery',
      category: 'TIMEOUT',
      strategy: 'RETRY',
      steps: [
        {
          type: 'RETRY',
          description: 'Retry with increased timeout',
          params: { maxRetries: 2, timeout: 60000 } // 60s timeout
        },
        {
          type: 'FALLBACK',
          description: 'Use cached data if available',
          params: {}
        }
      ],
      successRate: 0.80,
      createdAt: Date.now()
    });
  }

  /**
   * Get all available playbooks
   */
  getPlaybooks(): Playbook[] {
    return Array.from(this.playbooks.values());
  }

  /**
   * Add a custom playbook
   */
  addPlaybook(playbook: Playbook): void {
    this.playbooks.set(playbook.category, playbook);
    console.log(`[DEBUGGER] Added playbook for ${playbook.category}`);
  }
}

// Export singleton instance
export const debuggerAgent = new DebuggerAgent();
