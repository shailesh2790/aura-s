import { WorkflowExecution, ExecutionStepDetail, ExecutionError, SelfHealingAction, RetryPolicy } from '../types/advanced';
import { WorkflowDefinition, WorkflowNode } from '../types';
import { APIExecutor, DEFAULT_RETRY_POLICY, getIntegrationById, getActionById } from './apiIntegrations';
import { credentialManager } from './credentialManager';
import { executeAgentStep, fixWorkflowError } from './llm';

// ============= WORKFLOW EXECUTION ENGINE =============

export class WorkflowEngine {
  private executionHistory: Map<string, WorkflowExecution> = new Map();
  private activeExecutions: Set<string> = new Set();

  constructor() {
    this.loadExecutionHistory();
  }

  async executeWorkflow(
    workflow: WorkflowDefinition,
    input: Record<string, any>,
    trigger: {
      type: 'manual' | 'webhook' | 'schedule' | 'api';
      source?: string;
    }
  ): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.name,
      workflowName: workflow.name,
      status: 'running',
      startedAt: Date.now(),
      trigger: {
        type: trigger.type,
        source: trigger.source,
        payload: input,
        timestamp: Date.now()
      },
      steps: [],
      input,
      retryCount: 0,
      maxRetries: 3,
      metadata: {}
    };

    this.activeExecutions.add(executionId);
    this.executionHistory.set(executionId, execution);
    this.saveExecutionHistory();

    try {
      // Find start node
      let currentNode = workflow.nodes.find(n => n.type === 'start') || workflow.nodes[0];
      let currentState: Record<string, any> = { ...input };
      const maxSteps = 50;
      let stepCount = 0;

      while (currentNode && stepCount < maxSteps && currentNode.type !== 'end') {
        const step = await this.executeStep(
          currentNode,
          currentState,
          execution,
          workflow
        );

        execution.steps.push(step);

        // Update execution status
        if (step.status === 'failed' && !step.error?.recoverable) {
          execution.status = 'failed';
          execution.error = step.error;
          break;
        }

        // Merge step output into current state
        if (step.output) {
          currentState = { ...currentState, ...step.output };
        }

        // Find next node
        const nextNode = this.getNextNode(workflow, currentNode, step, currentState);
        if (!nextNode) break;

        currentNode = nextNode;
        stepCount++;
      }

      // Mark as completed if reached end
      if (currentNode?.type === 'end' && execution.status === 'running') {
        execution.status = 'completed';
        execution.output = currentState;
      }

      execution.completedAt = Date.now();
      execution.duration = execution.completedAt - execution.startedAt;

      this.executionHistory.set(executionId, execution);
      this.saveExecutionHistory();

    } catch (error: any) {
      execution.status = 'failed';
      execution.error = {
        code: 'EXECUTION_ERROR',
        message: error.message || 'Unknown error',
        timestamp: Date.now(),
        recoverable: false,
        stackTrace: error.stack
      };

      execution.completedAt = Date.now();
      execution.duration = execution.completedAt - execution.startedAt;

      this.executionHistory.set(executionId, execution);
      this.saveExecutionHistory();
    } finally {
      this.activeExecutions.delete(executionId);
    }

    return execution;
  }

  private async executeStep(
    node: WorkflowNode,
    state: Record<string, any>,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<ExecutionStepDetail> {
    const step: ExecutionStepDetail = {
      id: this.generateStepId(),
      nodeId: node.id,
      nodeName: node.label,
      nodeType: node.type,
      status: 'running',
      startedAt: Date.now(),
      input: { ...state },
      retries: 0,
      logs: []
    };

    try {
      this.logStep(step, 'info', `Executing ${node.label}...`);

      // Execute based on node type
      let output: Record<string, any> = {};

      switch (node.type) {
        case 'agent':
          output = await this.executeAgentNode(node, state, step);
          break;

        case 'tool':
          output = await this.executeToolNode(node, state, step);
          break;

        case 'router':
          output = await this.executeRouterNode(node, state, step);
          break;

        default:
          output = { status: 'skipped' };
      }

      step.output = output;
      step.status = 'completed';
      step.completedAt = Date.now();
      step.duration = step.completedAt - step.startedAt;

      this.logStep(step, 'info', `Completed ${node.label} in ${step.duration}ms`);

      return step;

    } catch (error: any) {
      this.logStep(step, 'error', `Error in ${node.label}: ${error.message}`);

      // Self-healing attempt
      if (execution.retryCount < execution.maxRetries) {
        const healingAction = await this.attemptSelfHealing(error, node, step, execution);

        if (healingAction.success) {
          // Retry after healing
          execution.retryCount++;
          this.logStep(step, 'info', `Self-healing successful. Retrying... (${execution.retryCount}/${execution.maxRetries})`);

          return await this.executeStep(node, state, execution, workflow);
        }
      }

      // Mark step as failed
      step.status = 'failed';
      step.error = {
        code: error.code || 'STEP_ERROR',
        message: error.message,
        timestamp: Date.now(),
        recoverable: execution.retryCount < execution.maxRetries,
        stackTrace: error.stack
      };

      step.completedAt = Date.now();
      step.duration = step.completedAt - step.startedAt;

      return step;
    }
  }

  private async executeAgentNode(
    node: WorkflowNode,
    state: Record<string, any>,
    step: ExecutionStepDetail
  ): Promise<Record<string, any>> {
    this.logStep(step, 'info', 'Executing AI agent...');

    const inputState = JSON.stringify(state, null, 2);
    const result = await executeAgentStep(node, inputState, []);

    return {
      agentOutput: result,
      nodeType: 'agent',
      role: node.data.role
    };
  }

  private async executeToolNode(
    node: WorkflowNode,
    state: Record<string, any>,
    step: ExecutionStepDetail
  ): Promise<Record<string, any>> {
    this.logStep(step, 'info', 'Executing tool/API call...');

    // Parse node data to extract integration and action info
    const toolConfig = this.parseToolConfig(node);

    if (!toolConfig) {
      throw new Error('Invalid tool configuration');
    }

    const { integrationId, actionId, parameters } = toolConfig;

    // Get integration and action
    const integration = getIntegrationById(integrationId);
    const action = getActionById(integrationId, actionId);

    if (!integration || !action) {
      throw new Error(`Integration or action not found: ${integrationId}/${actionId}`);
    }

    // Get credentials
    const credentials = credentialManager.getCredentialsByIntegration(integrationId);
    const credential = credentials[0]; // Use first available credential

    if (!credential && action.requiresAuth) {
      throw new Error(`No credentials configured for ${integration.name}`);
    }

    // Execute API call with retry logic
    const executor = new APIExecutor(credential);

    // Resolve parameters from state
    const resolvedParams = this.resolveParameters(parameters, state);

    this.logStep(step, 'debug', `Calling ${integration.name} API: ${action.name}`);

    const result = await executor.execute(
      integration,
      action,
      resolvedParams,
      DEFAULT_RETRY_POLICY
    );

    if (credential) {
      credentialManager.updateLastUsed(credential.id);
    }

    return {
      toolOutput: result,
      integration: integration.name,
      action: action.name
    };
  }

  private async executeRouterNode(
    node: WorkflowNode,
    state: Record<string, any>,
    step: ExecutionStepDetail
  ): Promise<Record<string, any>> {
    this.logStep(step, 'info', 'Evaluating conditional logic...');

    // Router nodes make decisions based on state
    // The actual routing is handled by getNextNode()

    return {
      routerEvaluated: true,
      currentState: state
    };
  }

  private async attemptSelfHealing(
    error: Error,
    node: WorkflowNode,
    step: ExecutionStepDetail,
    execution: WorkflowExecution
  ): Promise<SelfHealingAction> {
    this.logStep(step, 'warn', 'Attempting self-healing...');

    try {
      // Use AI to analyze error and suggest fix
      const aiAnalysis = await fixWorkflowError(
        error.message,
        node.label
      );

      return {
        triggeredBy: {
          code: 'SELF_HEAL',
          message: error.message,
          timestamp: Date.now(),
          recoverable: true
        },
        action: 'retry',
        timestamp: Date.now(),
        success: true,
        details: 'AI-based error analysis completed',
        aiAnalysis
      };

    } catch (healError: any) {
      return {
        triggeredBy: {
          code: 'SELF_HEAL_FAILED',
          message: error.message,
          timestamp: Date.now(),
          recoverable: false
        },
        action: 'human_intervention',
        timestamp: Date.now(),
        success: false,
        details: healError.message
      };
    }
  }

  private getNextNode(
    workflow: WorkflowDefinition,
    currentNode: WorkflowNode,
    step: ExecutionStepDetail,
    state: Record<string, any>
  ): WorkflowNode | null {
    const edges = workflow.edges.filter(e => e.source === currentNode.id);

    if (edges.length === 0) return null;

    // If only one edge, follow it
    if (edges.length === 1) {
      return workflow.nodes.find(n => n.id === edges[0].target) || null;
    }

    // Multiple edges - conditional routing
    // For now, use simple label matching
    // In production, this would evaluate complex conditions
    const output = step.output?.agentOutput || step.output?.toolOutput || '';
    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    for (const edge of edges) {
      if (edge.label && outputStr.toLowerCase().includes(edge.label.toLowerCase())) {
        return workflow.nodes.find(n => n.id === edge.target) || null;
      }
    }

    // Default to first edge if no match
    return workflow.nodes.find(n => n.id === edges[0].target) || null;
  }

  private parseToolConfig(node: WorkflowNode): {
    integrationId: string;
    actionId: string;
    parameters: Record<string, any>;
  } | null {
    // Parse tool configuration from node data
    // This would typically come from the workflow definition
    const tools = node.data.tools || [];

    if (tools.length === 0) return null;

    // Example format: "stripe:create_customer"
    const [integrationId, actionId] = tools[0].split(':');

    return {
      integrationId,
      actionId,
      parameters: {} // Would extract from node.data
    };
  }

  private resolveParameters(params: Record<string, any>, state: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Variable reference: {{variable_name}}
        const varName = value.slice(2, -2).trim();
        resolved[key] = state[varName] || value;
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private logStep(step: ExecutionStepDetail, level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    step.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data
    });
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============= EXECUTION HISTORY =============

  getExecutionHistory(limit: number = 50): WorkflowExecution[] {
    return Array.from(this.executionHistory.values())
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  }

  getExecutionById(id: string): WorkflowExecution | null {
    return this.executionHistory.get(id) || null;
  }

  getExecutionsByWorkflow(workflowId: string, limit: number = 20): WorkflowExecution[] {
    return Array.from(this.executionHistory.values())
      .filter(e => e.workflowId === workflowId)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  }

  private loadExecutionHistory(): void {
    try {
      const stored = localStorage.getItem('aura_execution_history');
      if (stored) {
        const executions: WorkflowExecution[] = JSON.parse(stored);
        executions.forEach(exec => this.executionHistory.set(exec.id, exec));
      }
    } catch (error) {
      console.error('Error loading execution history:', error);
    }
  }

  private saveExecutionHistory(): void {
    try {
      const executions = Array.from(this.executionHistory.values());
      // Keep only last 100 executions to avoid storage bloat
      const recent = executions.slice(-100);
      localStorage.setItem('aura_execution_history', JSON.stringify(recent));
    } catch (error) {
      console.error('Error saving execution history:', error);
    }
  }

  clearExecutionHistory(): void {
    this.executionHistory.clear();
    localStorage.removeItem('aura_execution_history');
  }

  // ============= REPLAY CAPABILITY =============

  async replayExecution(executionId: string, workflow: WorkflowDefinition): Promise<WorkflowExecution> {
    const original = this.getExecutionById(executionId);

    if (!original) {
      throw new Error(`Execution ${executionId} not found`);
    }

    // Replay with same input
    return await this.executeWorkflow(
      workflow,
      original.input,
      {
        type: 'manual',
        source: `replay_of_${executionId}`
      }
    );
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();
