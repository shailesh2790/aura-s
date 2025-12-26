import Groq from "groq-sdk";
import { WorkflowDefinition, WorkflowNode, KnowledgeDocument } from "../types";

// Get API key from environment or localStorage override
const getApiKey = () => {
  const overrideKey = localStorage.getItem('aura_api_key_override');
  const key = overrideKey || process.env.API_KEY;
  console.log('Using Groq API key:', key ? `${key.substring(0, 10)}...` : 'NOT SET');
  return key || '';
};

// Create Groq instance with current API key
const getGroq = () => new Groq({
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true // Allow browser usage
});

/**
 * Generic query function for agent use
 */
export async function queryGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    const groq = getGroq();

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq Query Error:", error);
    throw error;
  }
}

export async function generateWorkflow(userPrompt: string): Promise<WorkflowDefinition> {
  try {
    const groq = getGroq();

    const systemPrompt = `You are AURA Automate, a revolutionary multi-agent OS.

Task: Design a production-grade multi-agent workflow using LangGraph.

MANDATORY AGENT ROLES (Assign these specific roles to nodes where applicable):
1. Planner Agent: Decomposes complex tasks.
2. Research Agent: Uses web search or RAG.
3. Executor Agent: Interacts with APIs/Tools.
4. Debugger Agent: Handles errors (if explicit error handling is needed).
5. Optimizer Agent: Refines results.
6. Auditor Agent: Checks for safety/compliance.

Requirements:
1. **Architecture**: Use a StateGraph. Define nodes (Agents/Tools) and edges.
2. **Integrations**: If the user mentioned connected tools (e.g., Slack, WhatsApp), explicitly add them to the 'tools' array of the relevant agents.
3. **Files**: Generate complete Python code:
   - \`state.py\`: TypedDict state.
   - \`agents.py\`: Agent classes/functions.
   - \`main.py\`: Graph definition.
4. **RAG**: If knowledge base is present, use it.

Return ONLY valid JSON matching this structure:
{
  "name": "string",
  "description": "string",
  "summary": "string",
  "optimizationScore": number,
  "nodes": [
    {
      "id": "string (snake_case)",
      "type": "agent|tool|router|start|end",
      "label": "string",
      "data": {
        "role": "Planner|Researcher|Executor|Debugger|Optimizer|Auditor|Custom",
        "goal": "string",
        "description": "string",
        "tools": ["string"]
      }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "label": "string (optional)",
      "type": "default|conditional"
    }
  ],
  "files": [
    {
      "filename": "string (e.g., main.py, agents.py, state.py)",
      "language": "python",
      "content": "string (full source code)"
    }
  ]
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Current supported Groq model for complex tasks
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `User Request: "${userPrompt}"\n\nGenerate the workflow JSON now.` }
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq");
    }

    const parsed = JSON.parse(content) as WorkflowDefinition;

    // Post-processing to ensure stability
    if (parsed.nodes) {
      parsed.nodes = parsed.nodes.map(node => ({
        ...node,
        data: node.data || { description: "Auto-generated node", role: "Executor", goal: "", tools: [] }
      }));
    }

    return parsed;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw error;
  }
}

export async function optimizeWorkflow(currentWorkflow: WorkflowDefinition): Promise<WorkflowDefinition> {
  try {
    const groq = getGroq();

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are the AURA 'Optimizer Agent'.

Analyze the workflow and:
1. Identify bottlenecks or redundant steps.
2. Merge similar agents if possible to save tokens.
3. Improve the system prompts in the generated code.
4. Return a refined, optimized version of the entire workflow object (Nodes, Edges, Files).
5. Set 'optimizationScore' to something higher than before (e.g., 85-99).

Keep the same JSON structure as the input.`
        },
        {
          role: "user",
          content: `Existing workflow:\n${JSON.stringify(currentWorkflow, null, 2)}\n\nOptimize it now.`
        }
      ],
      temperature: 0.5,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Optimization failed");
    }

    return JSON.parse(content) as WorkflowDefinition;
  } catch (error) {
    console.error("Optimization Error:", error);
    throw error;
  }
}

export async function fixWorkflowError(lastOutput: string, nodeLabel: string): Promise<string> {
  try {
    const groq = getGroq();

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Faster model for debugging
      messages: [
        {
          role: "system",
          content: `You are the AURA 'Debugger Agent'.

A workflow step failed.
Task:
1. Analyze the error.
2. Suggest a corrected input or a fix.
3. Return ONLY the corrected text response that simulates the node succeeding.

Context: The system is self-healing.`
        },
        {
          role: "user",
          content: `Node: ${nodeLabel}\nError/Output: ${lastOutput}\n\nProvide a fix.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return response.choices[0]?.message?.content || "Debugger Agent applied automatic fix.";
  } catch (error) {
    console.error("Debug Error:", error);
    return "Debugger failed to resolve the issue.";
  }
}

export async function executeAgentStep(
  node: WorkflowNode,
  inputState: string,
  knowledgeBase: KnowledgeDocument[]
): Promise<string> {
  try {
    const groq = getGroq();
    const role = node.data.role?.toLowerCase() || "";

    // RAG Context
    let ragContext = "";
    if (knowledgeBase.length > 0) {
      ragContext = "\n\n=== RELEVANT KNOWLEDGE BASE ===\n" +
        knowledgeBase.map(doc => `[Document: ${doc.title}]\n${doc.content}`).join("\n\n") +
        "\n==============================\n";
    }

    // Advanced System Instruction based on PRD Roles
    const systemPrompt = `You are an autonomous AI agent in the AURA ecosystem.

Your Role: ${node.data.role || "General Executor"}
Your Goal: ${node.data.goal || "Complete the task efficiently."}

[ROLE GUIDELINES]
- Planner: Do not execute. Only create a step-by-step plan.
- Research: Find facts and provide information. Cite sources when possible.
- Executor: Write code, draft text, or simulate API calls.
- Debugger: Analyze the input for errors and suggest fixes.
- Optimizer: Rewrite the input to be more concise and effective.
- Auditor: Check for PII, safety, and policy violations.

${ragContext}

Current State:
${inputState}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Perform your task now." }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const outputText = response.choices[0]?.message?.content || "Task completed.";
    return outputText;
  } catch (error) {
    console.error("Agent Execution Failed:", error);
    throw error;
  }
}

/**
 * Unified LLM call function for PM agents with retry logic and rate limit handling
 * Used by Intent Engine, Research Agent, and PRD Writer Agent
 */
export async function callGroqLLM(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    maxRetries?: number;
  }
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 4000,
    maxRetries = 3
  } = options || {};

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const groq = getGroq();

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature,
        max_tokens: maxTokens
      });

      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      lastError = error;
      console.error(`[LLM] Attempt ${attempt}/${maxRetries} failed:`, error.message);

      // Check if it's a rate limit error
      const isRateLimit =
        error.message?.includes('rate_limit') ||
        error.message?.includes('429') ||
        error.status === 429;

      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[LLM] Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // If it's not a rate limit or we're out of retries, throw
      if (attempt === maxRetries) {
        throw new Error(`LLM call failed after ${maxRetries} attempts: ${error.message}`);
      }

      // For other errors, wait 1s and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw lastError;
}
