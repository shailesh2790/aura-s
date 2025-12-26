/**
 * PLANNER AGENT
 *
 * Role: Workflow graph generation and planning specialist
 *
 * Responsibilities:
 * - Parse natural language goal into structured workflow
 * - Design optimal agent graph (nodes + edges)
 * - Determine required integrations and tools
 * - Create execution plan with proper dependencies
 * - Generate LangGraph-compatible workflow definition
 */

import { AgentState, AgentAction, AgentRole, Flow, WorkflowNode as FlowNode, WorkflowEdge, Goal } from '../../types/aura-os';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge as LegacyEdge } from '../../types';
import { queryGroq } from '../llm';

export class PlannerAgent {
  private agentRole: AgentRole = 'planner';

  /**
   * Main entry point: Create a workflow from natural language goal
   */
  async createWorkflow(state: AgentState): Promise<WorkflowDefinition> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(state);

    try {
      const response = await queryGroq(systemPrompt, userPrompt);
      const workflowDef = this.parseWorkflowResponse(response, state);

      // Log successful planning action
      const action: AgentAction = {
        agentRole: this.agentRole,
        action: 'create_workflow',
        input: { goal: state.goal.description },
        output: { workflow: workflowDef },
        timestamp: Date.now(),
        success: true
      };

      return workflowDef;
    } catch (error) {
      console.error('[PLANNER AGENT] Error creating workflow:', error);

      // Log failed action
      const action: AgentAction = {
        agentRole: this.agentRole,
        action: 'create_workflow',
        input: { goal: state.goal.description },
        error: (error as Error).message,
        timestamp: Date.now(),
        success: false
      };

      throw error;
    }
  }

  /**
   * Refine an existing workflow based on feedback
   */
  async refineWorkflow(
    currentWorkflow: WorkflowDefinition,
    feedback: string,
    state: AgentState
  ): Promise<WorkflowDefinition> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = `
CURRENT WORKFLOW:
${JSON.stringify(currentWorkflow, null, 2)}

REFINEMENT REQUEST:
${feedback}

Please refine the workflow based on the feedback. Return the COMPLETE updated workflow in the same JSON format.
`;

    const response = await queryGroq(systemPrompt, userPrompt);
    return this.parseWorkflowResponse(response, state);
  }

  /**
   * Build system prompt with planner instructions
   */
  private buildSystemPrompt(): string {
    return `You are the PLANNER AGENT in AURA OS - a multi-agent automation platform.

ROLE: Workflow graph generation and planning specialist

YOUR EXPERTISE:
- Parsing natural language into structured workflows
- Designing optimal agent architectures
- Determining required integrations and tools
- Creating execution plans with proper dependencies
- Generating LangGraph-compatible workflows

WORKFLOW DESIGN PRINCIPLES:
1. Start with a "start" node, end with an "end" node
2. Use "agent" nodes for AI-powered decision-making and actions
3. Use "router" nodes for conditional branching
4. Use "tool" nodes for API calls and integrations
5. Keep workflows simple and efficient (3-8 nodes ideal)
6. Ensure clear data flow between nodes
7. Add proper error handling paths

AVAILABLE AGENT TYPES:
- Planner: Strategic planning and workflow design
- Executor: Tool/API execution
- Debugger: Error analysis and fixes
- Optimizer: Performance improvements
- Auditor: Security and compliance checks
- Self-Healer: Automatic incident remediation

AVAILABLE INTEGRATIONS:
- Stripe (payments, subscriptions)
- Shopify (e-commerce, orders, carts)
- SendGrid (email)
- Twilio (SMS, WhatsApp)
- Slack (notifications)
- HubSpot (CRM)
- Notion (knowledge base)
- Airtable (databases)
- Google Sheets (spreadsheets)
- OpenAI (GPT-4, DALL-E)

OUTPUT FORMAT:
You must respond with a valid JSON object containing:
{
  "name": "Workflow Name",
  "description": "Brief description",
  "summary": "Detailed summary",
  "nodes": [
    {
      "id": "unique_id",
      "type": "start|agent|tool|router|end",
      "label": "Human-readable label",
      "data": {
        "role": "agent role or tool name",
        "goal": "specific goal for this node",
        "description": "what this node does",
        "tools": ["tool1", "tool2"]
      }
    }
  ],
  "edges": [
    {
      "source": "node_id",
      "target": "node_id",
      "label": "condition (optional)"
    }
  ],
  "files": [
    {
      "filename": "main.py",
      "content": "# LangGraph implementation\\n..."
    },
    {
      "filename": "agents.py",
      "content": "# Agent definitions\\n..."
    },
    {
      "filename": "state.py",
      "content": "# State schema\\n..."
    }
  ]
}

IMPORTANT:
- Ensure all node IDs are unique
- Every node must have proper connections (except start has no input, end has no output)
- Generate working Python/LangGraph code in the files array
- Include imports, state definitions, and complete implementation
- Keep code production-ready and well-documented
`;
  }

  /**
   * Build user prompt from agent state
   */
  private buildUserPrompt(state: AgentState): string {
    const { goal, context } = state;

    let prompt = `CREATE WORKFLOW PLAN

GOAL:
${goal.description}

PRIORITY: ${goal.priority}
${goal.constraints?.length ? `CONSTRAINTS:\n${goal.constraints.join('\n')}` : ''}
`;

    // Add context about available integrations
    if (context.integrations && context.integrations.length > 0) {
      prompt += `\n\nAVAILABLE INTEGRATIONS:\n${context.integrations.map((i: any) => `- ${i.name}`).join('\n')}`;
    }

    // Add context about knowledge base
    if (context.documents && context.documents.length > 0) {
      prompt += `\n\nKNOWLEDGE BASE: ${context.documents.length} documents available for RAG`;
    }

    prompt += `\n\nPlease design a complete workflow that achieves this goal. Return a valid JSON object with the structure described in your system prompt.`;

    return prompt;
  }

  /**
   * Parse LLM response into WorkflowDefinition
   */
  private parseWorkflowResponse(response: string, state: AgentState): WorkflowDefinition {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.name || !parsed.nodes || !parsed.edges) {
        throw new Error('Invalid workflow structure: missing required fields');
      }

      // Ensure files array exists
      if (!parsed.files || parsed.files.length === 0) {
        parsed.files = this.generateDefaultFiles(parsed);
      }

      // Convert to WorkflowDefinition format
      const workflow: WorkflowDefinition = {
        name: parsed.name,
        description: parsed.description || '',
        summary: parsed.summary || '',
        nodes: parsed.nodes.map((node: any) => this.convertToLegacyNode(node)),
        edges: parsed.edges.map((edge: any) => this.convertToLegacyEdge(edge)),
        files: parsed.files,
        optimizationScore: this.calculateInitialScore(parsed)
      };

      return workflow;
    } catch (error) {
      console.error('[PLANNER AGENT] Error parsing workflow:', error);
      console.error('Response was:', response);

      // Return a fallback workflow
      return this.createFallbackWorkflow(state);
    }
  }

  /**
   * Convert new FlowNode format to legacy WorkflowNode format
   */
  private convertToLegacyNode(node: any): WorkflowNode {
    return {
      id: node.id,
      type: node.type,
      label: node.label,
      data: node.data || {}
    };
  }

  /**
   * Convert new WorkflowEdge format to legacy format
   */
  private convertToLegacyEdge(edge: any): LegacyEdge {
    return {
      source: edge.source,
      target: edge.target,
      label: edge.label
    };
  }

  /**
   * Generate default Python/LangGraph files
   */
  private generateDefaultFiles(workflow: any): any[] {
    const mainPy = `#!/usr/bin/env python3
"""
${workflow.name}

${workflow.description}

Generated by AURA Planner Agent
"""

from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

# Define workflow state
class WorkflowState(TypedDict):
    goal: str
    context: dict
    result: str
    errors: list

# Agent functions
${workflow.nodes
  .filter((n: any) => n.type === 'agent')
  .map((n: any) => `
def ${n.id.replace('-', '_')}(state: WorkflowState) -> WorkflowState:
    """${n.data?.goal || n.label}"""
    print(f"[${n.label}] Processing...")

    # TODO: Implement ${n.label} logic
    state["result"] = f"${n.label} completed"
    return state
`)
  .join('\n')}

# Build workflow graph
workflow = StateGraph(WorkflowState)

# Add nodes
${workflow.nodes
  .map((n: any) => {
    if (n.type === 'agent') {
      return `workflow.add_node("${n.id}", ${n.id.replace('-', '_')})`;
    }
    return `# ${n.label} (${n.type})`;
  })
  .join('\n')}

# Add edges
${workflow.edges
  .map((e: any) => `workflow.add_edge("${e.source}", "${e.target}")`)
  .join('\n')}

# Set entry point
workflow.set_entry_point("${workflow.nodes[0]?.id || 'start'}")

# Compile
app = workflow.compile()

if __name__ == "__main__":
    result = app.invoke({
        "goal": "${workflow.description}",
        "context": {},
        "result": "",
        "errors": []
    })
    print("\\nWorkflow Result:", result)
`;

    const agentsPy = `"""
Agent Definitions for ${workflow.name}

This module contains the core agent logic.
"""

from typing import Dict, Any

${workflow.nodes
  .filter((n: any) => n.type === 'agent')
  .map(
    (n: any) => `
class ${n.id.replace('-', '_').replace(/^./, (c: string) => c.toUpperCase())}Agent:
    """${n.data?.description || n.label}"""

    def __init__(self):
        self.name = "${n.label}"
        self.role = "${n.data?.role || 'assistant'}"
        ${n.data?.tools ? `self.tools = ${JSON.stringify(n.data.tools)}` : 'self.tools = []'}

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent logic"""
        # TODO: Implement agent behavior
        return state
`
  )
  .join('\n')}
`;

    const statePy = `"""
State Management for ${workflow.name}
"""

from typing import TypedDict, List, Dict, Any

class WorkflowState(TypedDict):
    """Main workflow state"""
    goal: str
    context: Dict[str, Any]
    result: str
    errors: List[str]

def create_initial_state(goal: str) -> WorkflowState:
    """Create initial workflow state"""
    return {
        "goal": goal,
        "context": {},
        "result": "",
        "errors": []
    }
`;

    return [
      { filename: 'main.py', content: mainPy },
      { filename: 'agents.py', content: agentsPy },
      { filename: 'state.py', content: statePy }
    ];
  }

  /**
   * Calculate initial optimization score
   */
  private calculateInitialScore(workflow: any): number {
    let score = 70; // Base score

    // Bonus for reasonable node count (3-8 nodes is optimal)
    const nodeCount = workflow.nodes?.length || 0;
    if (nodeCount >= 3 && nodeCount <= 8) {
      score += 10;
    } else if (nodeCount > 15) {
      score -= 10; // Too complex
    }

    // Bonus for having agent nodes
    const agentCount = workflow.nodes?.filter((n: any) => n.type === 'agent').length || 0;
    if (agentCount > 0) {
      score += 10;
    }

    // Bonus for proper start/end nodes
    const hasStart = workflow.nodes?.some((n: any) => n.type === 'start');
    const hasEnd = workflow.nodes?.some((n: any) => n.type === 'end');
    if (hasStart && hasEnd) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Create fallback workflow when parsing fails
   */
  private createFallbackWorkflow(state: AgentState): WorkflowDefinition {
    return {
      name: 'Simple Workflow',
      description: state.goal.description,
      summary: 'A simple workflow created as fallback',
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Start',
          data: {}
        },
        {
          id: 'main-agent',
          type: 'agent',
          label: 'Main Agent',
          data: {
            role: 'executor',
            goal: state.goal.description,
            description: 'Execute the main workflow logic',
            tools: []
          }
        },
        {
          id: 'end',
          type: 'end',
          label: 'End',
          data: {}
        }
      ],
      edges: [
        { source: 'start', target: 'main-agent' },
        { source: 'main-agent', target: 'end' }
      ],
      files: [
        {
          filename: 'main.py',
          content: `# Simple workflow\n# Goal: ${state.goal.description}\nprint("Workflow executed")`
        }
      ],
      optimizationScore: 50
    };
  }
}

// Export singleton instance
export const plannerAgent = new PlannerAgent();
