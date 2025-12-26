/**
 * EXECUTOR AGENT
 *
 * Role: Tool/API execution specialist
 *
 * Responsibilities:
 * - Execute API calls to integrated services
 * - Handle tool invocations
 * - Manage data transformations
 * - Execute workflow nodes
 * - Handle retries and timeouts
 * - Report execution results
 */

import { AgentState, AgentAction, AgentRole, WorkflowNode as FlowNode } from '../../types/aura-os';
import { WorkflowNode, ExecutionStep } from '../../types';
import { executeAgentStep } from '../llm';
import { APIExecutor } from '../apiIntegrations';
import { credentialManager } from '../credentialManager';

export class ExecutorAgent {
  private agentRole: AgentRole = 'executor';

  /**
   * Execute a single workflow node
   */
  async executeNode(
    node: WorkflowNode,
    state: AgentState,
    documents: any[] = []
  ): Promise<{
    output: string;
    success: boolean;
    error?: string;
    updatedState: AgentState;
  }> {
    const startTime = Date.now();

    try {
      // Log execution start
      console.log(`[EXECUTOR] Starting execution of node: ${node.label}`);

      let output: string;

      // Different execution strategies based on node type
      switch (node.type) {
        case 'agent':
          output = await this.executeAgentNode(node, state, documents);
          break;

        case 'tool':
          output = await this.executeToolNode(node, state);
          break;

        case 'router':
          output = await this.executeRouterNode(node, state);
          break;

        case 'start':
          output = 'Workflow started';
          break;

        case 'end':
          output = 'Workflow completed';
          break;

        default:
          output = `Executed ${node.type} node`;
      }

      const duration = Date.now() - startTime;

      // Create successful action
      const action: AgentAction = {
        agentRole: this.agentRole,
        action: 'execute_node',
        input: {
          nodeId: node.id,
          nodeLabel: node.label,
          nodeType: node.type
        },
        output: { result: output, duration },
        timestamp: Date.now(),
        success: true
      };

      // Update state with action
      const updatedState: AgentState = {
        ...state,
        history: [...state.history, action],
        context: {
          ...state.context,
          lastNodeId: node.id,
          lastOutput: output
        },
        timestamp: Date.now()
      };

      return {
        output,
        success: true,
        updatedState
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = (error as Error).message;

      console.error(`[EXECUTOR] Error executing node ${node.label}:`, errorMessage);

      // Create failed action
      const action: AgentAction = {
        agentRole: this.agentRole,
        action: 'execute_node',
        input: {
          nodeId: node.id,
          nodeLabel: node.label,
          nodeType: node.type
        },
        error: errorMessage,
        timestamp: Date.now(),
        success: false
      };

      // Update state with error
      const updatedState: AgentState = {
        ...state,
        history: [...state.history, action],
        incidents: [
          ...state.incidents,
          {
            id: `incident-${Date.now()}`,
            tenantId: 'default',
            flowRunId: state.flowRunId,
            nodeId: node.id,
            severity: 'HIGH',
            category: this.categorizeError(errorMessage),
            status: 'OPEN',
            title: `Execution failed: ${node.label}`,
            description: errorMessage,
            createdAt: Date.now()
          }
        ],
        timestamp: Date.now()
      };

      return {
        output: `Error: ${errorMessage}`,
        success: false,
        error: errorMessage,
        updatedState
      };
    }
  }

  /**
   * Execute an agent node (AI-powered)
   */
  private async executeAgentNode(
    node: WorkflowNode,
    state: AgentState,
    documents: any[]
  ): Promise<string> {
    // Build context from state
    const contextString = this.buildContextString(state);

    // Use the existing LLM integration
    const output = await executeAgentStep(node, contextString, documents);

    return output;
  }

  /**
   * Execute a tool node (API/integration call)
   */
  private async executeToolNode(node: WorkflowNode, state: AgentState): Promise<string> {
    const toolName = node.data?.role || node.label;

    console.log(`[EXECUTOR] Executing tool: ${toolName}`);

    // Check if we have credentials for this tool
    const integration = this.findIntegration(toolName);
    if (!integration) {
      throw new Error(`No integration found for tool: ${toolName}`);
    }

    const credentials = credentialManager.getCredentialsByIntegration(integration.id);
    if (credentials.length === 0) {
      throw new Error(`No credentials configured for ${toolName}`);
    }

    // Use the first available credential
    const credential = credentials[0];

    try {
      // Create API executor
      const executor = new APIExecutor(credential);

      // Determine action from node data
      const action = node.data?.action || 'default';
      const params = node.data?.params || {};

      // Execute the API call
      const result = await executor.execute(integration, action, params);

      return `Tool ${toolName} executed successfully. Result: ${JSON.stringify(result, null, 2)}`;
    } catch (error) {
      throw new Error(`Tool execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute a router node (conditional logic)
   */
  private async executeRouterNode(node: WorkflowNode, state: AgentState): Promise<string> {
    const condition = node.data?.condition || 'default';

    console.log(`[EXECUTOR] Evaluating router condition: ${condition}`);

    // Simple condition evaluation based on context
    const lastOutput = state.context.lastOutput || '';

    // Check if condition matches recent output
    if (lastOutput.toLowerCase().includes(condition.toLowerCase())) {
      return `Router condition "${condition}" matched`;
    }

    return `Router evaluated (condition: ${condition})`;
  }

  /**
   * Build context string from agent state
   */
  private buildContextString(state: AgentState): string {
    let context = `Goal: ${state.goal.description}\n\n`;

    // Add recent history
    const recentActions = state.history.slice(-5);
    if (recentActions.length > 0) {
      context += 'Recent Actions:\n';
      recentActions.forEach((action, idx) => {
        context += `${idx + 1}. [${action.agentRole}] ${action.action}\n`;
        if (action.output) {
          context += `   Output: ${JSON.stringify(action.output)}\n`;
        }
      });
      context += '\n';
    }

    // Add current context data
    if (state.context.lastOutput) {
      context += `Last Output: ${state.context.lastOutput}\n`;
    }

    return context;
  }

  /**
   * Find integration by name
   */
  private findIntegration(toolName: string): any {
    // Import integrations from apiIntegrations
    // This is a simplified version - in production, you'd have a registry
    const integrations = [
      { id: 'stripe', name: 'Stripe' },
      { id: 'shopify', name: 'Shopify' },
      { id: 'sendgrid', name: 'SendGrid' },
      { id: 'twilio', name: 'Twilio' },
      { id: 'slack', name: 'Slack' },
      { id: 'hubspot', name: 'HubSpot' },
      { id: 'notion', name: 'Notion' },
      { id: 'airtable', name: 'Airtable' },
      { id: 'google-sheets', name: 'Google Sheets' },
      { id: 'openai', name: 'OpenAI' }
    ];

    return integrations.find(
      i => i.name.toLowerCase() === toolName.toLowerCase() || i.id === toolName.toLowerCase()
    );
  }

  /**
   * Categorize error for incident management
   */
  private categorizeError(errorMessage: string): string {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('auth') || msg.includes('credential') || msg.includes('unauthorized')) {
      return 'AUTH';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'TIMEOUT';
    }
    if (msg.includes('network') || msg.includes('connection')) {
      return 'NETWORK';
    }
    if (msg.includes('not found') || msg.includes('404')) {
      return 'NOT_FOUND';
    }
    if (msg.includes('validation') || msg.includes('invalid')) {
      return 'VALIDATION';
    }

    return 'UNKNOWN';
  }

  /**
   * Execute multiple nodes in sequence
   */
  async executeSequence(
    nodes: WorkflowNode[],
    initialState: AgentState,
    documents: any[] = []
  ): Promise<{
    executionLog: ExecutionStep[];
    finalState: AgentState;
    success: boolean;
  }> {
    const executionLog: ExecutionStep[] = [];
    let currentState = initialState;
    let allSuccessful = true;

    for (const node of nodes) {
      const result = await this.executeNode(node, currentState, documents);

      // Add to execution log
      executionLog.push({
        nodeId: node.id,
        output: result.output,
        timestamp: Date.now(),
        status: result.success ? 'completed' : 'failed'
      });

      // Update state
      currentState = result.updatedState;

      // Stop on first failure (unless configured to continue)
      if (!result.success) {
        allSuccessful = false;
        break;
      }
    }

    return {
      executionLog,
      finalState: currentState,
      success: allSuccessful
    };
  }
}

// Export singleton instance
export const executorAgent = new ExecutorAgent();
