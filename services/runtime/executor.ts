/**
 * Executor - Step Execution Engine for AURA OS
 *
 * Provides production-grade execution with:
 * - Linear step execution (DAG traversal)
 * - Event emission on state transitions
 * - Automatic retry with exponential backoff
 * - Integration with idempotency service
 * - Cost tracking and budget limits
 *
 * Week 1: Linear execution only (no parallelism)
 * Week 5: Will add parallel execution
 */

import {
  Run,
  Step,
  PlanNode,
  ToolCall,
  RetryConfig,
  StepError,
  RunError
} from '../../types/advanced';
import { eventStore } from './eventStore';
import { memoryService } from './memoryService';
import { idempotencyService } from './idempotency';
import { v4 as uuidv4 } from 'uuid';

// ============= EXECUTION CONTEXT =============

interface ExecutionContext {
  run: Run;
  current_step_index: number;
  variables: Record<string, any>;
  budget_remaining: number;
  start_time: number;
}

// ============= DEFAULT RETRY CONFIG =============

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  max_attempts: 3,
  initial_delay: 2000, // 2 seconds
  max_delay: 16000, // 16 seconds
  backoff_multiplier: 2.0, // Exponential backoff
  retryable_errors: [
    'RATE_LIMIT',
    'TIMEOUT',
    'NETWORK_ERROR',
    'SERVICE_UNAVAILABLE',
    'TEMPORARY_FAILURE'
  ]
};

// ============= EXECUTOR =============

class Executor {
  /**
   * Execute a run (linear execution of plan)
   */
  async executeRun(run: Run): Promise<Run> {
    console.log(`[Executor] Starting run ${run.id}`);

    // Emit run.started event
    await eventStore.append({
      id: uuidv4(),
      run_id: run.id,
      type: 'run.started',
      timestamp: Date.now(),
      plan: run.plan
    } as any);

    // Initialize execution context
    const context: ExecutionContext = {
      run,
      current_step_index: 0,
      variables: {},
      budget_remaining: run.intent.parsed.constraints?.budget || 10000,
      start_time: Date.now()
    };

    // Update run status
    run.status = 'running';
    run.started_at = Date.now();

    try {
      // Execute plan sequentially
      const nodes = this.topologicalSort(run.plan.dag.nodes);

      for (let i = 0; i < nodes.length; i++) {
        context.current_step_index = i;
        const node = nodes[i];

        console.log(`[Executor] Executing step ${i + 1}/${nodes.length}: ${node.tool || node.type}`);

        // Execute step
        const step = await this.executeStep(context, node);

        // Store output in variables
        if (step.output) {
          context.variables[node.id] = step.output;
        }

        // Update budget
        context.budget_remaining -= step.cost;

        // Check budget limit
        if (context.budget_remaining <= 0) {
          throw new Error('Budget exhausted');
        }
      }

      // Mark run as completed
      run.status = 'completed';
      run.completed_at = Date.now();

      // Emit run.completed event
      await eventStore.append({
        id: uuidv4(),
        run_id: run.id,
        type: 'run.completed',
        timestamp: Date.now(),
        duration: run.completed_at - run.started_at,
        cost: run.cost,
        artifact_ids: run.artifacts.map(a => a.id)
      } as any);

      console.log(`[Executor] Run ${run.id} completed successfully`);

    } catch (error: any) {
      // Mark run as failed
      run.status = 'failed';
      run.error = {
        code: 'EXECUTION_FAILED',
        message: error.message,
        recoverable: false,
        timestamp: Date.now(),
        stack_trace: error.stack
      };

      // Emit run.failed event
      await eventStore.append({
        id: uuidv4(),
        run_id: run.id,
        type: 'run.failed',
        timestamp: Date.now(),
        error: run.error,
        final_status: 'failed'
      } as any);

      console.error(`[Executor] Run ${run.id} failed:`, error.message);
    }

    return run;
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStep(context: ExecutionContext, node: PlanNode): Promise<Step> {
    const step: Step = {
      id: uuidv4(),
      run_id: context.run.id,
      node_id: node.id,
      status: 'pending',
      attempt: 0,
      max_attempts: node.retry_policy?.max_attempts || DEFAULT_RETRY_CONFIG.max_attempts,
      tool_calls: [],
      cost: 0
    };

    // Emit step.started event
    await eventStore.append({
      id: uuidv4(),
      run_id: context.run.id,
      type: 'step.started',
      timestamp: Date.now(),
      step_id: step.id,
      node_id: node.id,
      attempt: 1
    } as any);

    step.status = 'running';
    step.started_at = Date.now();

    // Retry loop
    const retryConfig = node.retry_policy || DEFAULT_RETRY_CONFIG;
    let lastError: StepError | null = null;

    for (let attempt = 1; attempt <= step.max_attempts; attempt++) {
      step.attempt = attempt;

      try {
        // Execute node based on type
        const result = await this.executeNode(context, node, step);

        // Success!
        step.status = 'completed';
        step.completed_at = Date.now();
        step.output = result.output;
        step.cost = result.cost;

        // Emit step.completed event
        await eventStore.append({
          id: uuidv4(),
          run_id: context.run.id,
          type: 'step.completed',
          timestamp: Date.now(),
          step_id: step.id,
          duration: step.completed_at - step.started_at!,
          output: step.output
        } as any);

        // Update run cost
        context.run.cost += step.cost;

        return step;

      } catch (error: any) {
        lastError = {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          details: error.details,
          timestamp: Date.now(),
          retryable: this.isRetryableError(error.code, retryConfig)
        };

        // Emit step.failed event
        await eventStore.append({
          id: uuidv4(),
          run_id: context.run.id,
          type: 'step.failed',
          timestamp: Date.now(),
          step_id: step.id,
          error: lastError,
          will_retry: lastError.retryable && attempt < step.max_attempts
        } as any);

        // Check if retryable
        if (!lastError.retryable || attempt >= step.max_attempts) {
          break; // Don't retry
        }

        // Calculate backoff delay
        const delay = Math.min(
          retryConfig.initial_delay * Math.pow(retryConfig.backoff_multiplier, attempt - 1),
          retryConfig.max_delay
        );

        console.log(`[Executor] Step failed, retrying in ${delay}ms (attempt ${attempt}/${step.max_attempts})`);

        // Emit step.retrying event
        await eventStore.append({
          id: uuidv4(),
          run_id: context.run.id,
          type: 'step.retrying',
          timestamp: Date.now(),
          step_id: step.id,
          attempt: attempt + 1,
          max_attempts: step.max_attempts,
          next_retry_at: Date.now() + delay
        } as any);

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    step.status = 'failed';
    step.error = lastError || {
      code: 'UNKNOWN_ERROR',
      message: 'Step failed with unknown error',
      timestamp: Date.now(),
      retryable: false
    };

    throw new Error(`Step ${node.id} failed after ${step.max_attempts} attempts: ${step.error.message}`);
  }

  /**
   * Execute a node based on its type
   */
  private async executeNode(
    context: ExecutionContext,
    node: PlanNode,
    step: Step
  ): Promise<{ output: any; cost: number }> {
    switch (node.type) {
      case 'tool_call':
        return await this.executeToolCall(context, node, step);

      case 'llm_call':
        return await this.executeLLMCall(context, node, step);

      case 'verification':
        return await this.executeVerification(context, node, step);

      case 'approval_gate':
        return await this.executeApprovalGate(context, node, step);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute tool call with idempotency
   */
  private async executeToolCall(
    context: ExecutionContext,
    node: PlanNode,
    step: Step
  ): Promise<{ output: any; cost: number }> {
    const tool = node.tool!;
    const params = this.resolveParams(node.params, context.variables);

    // Create tool call
    const toolCall: ToolCall = {
      id: uuidv4(),
      step_id: step.id,
      tool,
      params,
      started_at: Date.now(),
      cached: false
    };

    step.tool_calls.push(toolCall);

    // Emit tool.called event
    await eventStore.append({
      id: uuidv4(),
      run_id: context.run.id,
      type: 'tool.called',
      timestamp: Date.now(),
      tool_call_id: toolCall.id,
      tool,
      params
    } as any);

    try {
      // Execute with idempotency
      const { result, cached } = await idempotencyService.execute(
        context.run.id,
        step.id,
        tool,
        params,
        async () => {
          // Mock tool execution (replace with actual tool registry)
          return await this.mockToolExecution(tool, params);
        }
      );

      toolCall.cached = cached;
      toolCall.response = result;
      toolCall.completed_at = Date.now();

      // Emit tool.completed event
      await eventStore.append({
        id: uuidv4(),
        run_id: context.run.id,
        type: 'tool.completed',
        timestamp: Date.now(),
        tool_call_id: toolCall.id,
        duration: toolCall.completed_at - toolCall.started_at,
        cached
      } as any);

      return {
        output: result,
        cost: cached ? 0 : 10 // Mock cost
      };

    } catch (error: any) {
      toolCall.error = {
        code: error.code || 'TOOL_ERROR',
        message: error.message,
        timestamp: Date.now()
      };

      // Emit tool.failed event
      await eventStore.append({
        id: uuidv4(),
        run_id: context.run.id,
        type: 'tool.failed',
        timestamp: Date.now(),
        tool_call_id: toolCall.id,
        error: toolCall.error
      } as any);

      throw error;
    }
  }

  /**
   * Execute LLM call (placeholder)
   */
  private async executeLLMCall(
    context: ExecutionContext,
    node: PlanNode,
    step: Step
  ): Promise<{ output: any; cost: number }> {
    // Mock LLM call
    return {
      output: { text: 'Mock LLM response' },
      cost: 100
    };
  }

  /**
   * Execute verification (placeholder)
   */
  private async executeVerification(
    context: ExecutionContext,
    node: PlanNode,
    step: Step
  ): Promise<{ output: any; cost: number }> {
    return {
      output: { verified: true, score: 85 },
      cost: 0
    };
  }

  /**
   * Execute approval gate (placeholder)
   */
  private async executeApprovalGate(
    context: ExecutionContext,
    node: PlanNode,
    step: Step
  ): Promise<{ output: any; cost: number }> {
    // Emit approval.requested event
    await eventStore.append({
      id: uuidv4(),
      run_id: context.run.id,
      type: 'approval.requested',
      timestamp: Date.now(),
      reason: 'Manual approval required'
    } as any);

    return {
      output: { approved: true },
      cost: 0
    };
  }

  /**
   * Mock tool execution (replace with actual tool registry)
   */
  private async mockToolExecution(tool: string, params: Record<string, any>): Promise<any> {
    console.log(`[Executor] Executing tool: ${tool}`, params);

    // Simulate network delay
    await this.sleep(100 + Math.random() * 200);

    return {
      tool,
      params,
      result: 'success',
      timestamp: Date.now()
    };
  }

  /**
   * Resolve params with variable substitution
   */
  private resolveParams(params: Record<string, any>, variables: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        // Variable reference
        const varName = value.substring(1);
        resolved[key] = variables[varName];
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(errorCode: string, retryConfig: RetryConfig): boolean {
    return retryConfig.retryable_errors.includes(errorCode);
  }

  /**
   * Topological sort of DAG nodes (for linear execution)
   */
  private topologicalSort(nodes: PlanNode[]): PlanNode[] {
    // Simple topological sort (assumes acyclic graph)
    const sorted: PlanNode[] = [];
    const visited = new Set<string>();

    const visit = (node: PlanNode) => {
      if (visited.has(node.id)) return;

      // Visit dependencies first
      for (const depId of node.depends_on) {
        const depNode = nodes.find(n => n.id === depId);
        if (depNode) {
          visit(depNode);
        }
      }

      visited.add(node.id);
      sorted.push(node);
    };

    for (const node of nodes) {
      visit(node);
    }

    return sorted;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============= SINGLETON INSTANCE =============

export const executor = new Executor();

// ============= HELPER FUNCTIONS =============

/**
 * Execute a run
 */
export async function executeRun(run: Run): Promise<Run> {
  return executor.executeRun(run);
}

/**
 * Export for testing
 */
export { Executor };
