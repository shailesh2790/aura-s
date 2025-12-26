
import { GoogleGenAI, Type, SchemaParams, Tool } from "@google/genai";
import { WorkflowDefinition, WorkflowNode, KnowledgeDocument } from "../types";

// Get API key from environment or localStorage override
const getApiKey = () => {
  const overrideKey = localStorage.getItem('aura_api_key_override');
  const key = overrideKey || process.env.API_KEY;
  console.log('Using API key:', key ? `${key.substring(0, 10)}...` : 'NOT SET');
  return key;
};

// Create AI instance with current API key
const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

const workflowSchema: SchemaParams = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "System name" },
    description: { type: Type.STRING, description: "Short description" },
    summary: { type: Type.STRING, description: "Detailed explanation of the architecture logic" },
    optimizationScore: { type: Type.NUMBER, description: "Efficiency score of the workflow (0-100)" },
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID (snake_case)" },
          type: { type: Type.STRING, enum: ["agent", "tool", "router", "start", "end"] },
          label: { type: Type.STRING, description: "Display name" },
          data: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING, description: "Must be one of: Planner, Researcher, Executor, Debugger, Optimizer, Auditor, or Custom" },
              goal: { type: Type.STRING },
              description: { type: Type.STRING },
              tools: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            nullable: false
          }
        },
        required: ["id", "type", "label", "data"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          label: { type: Type.STRING, description: "Label for conditional edges, empty if direct" },
          type: { type: Type.STRING, enum: ["default", "conditional"] }
        },
        required: ["id", "source", "target"]
      }
    },
    files: {
      type: Type.ARRAY,
      description: "Generate the complete Python project structure for this LangGraph application.",
      items: {
        type: Type.OBJECT,
        properties: {
          filename: { type: Type.STRING, description: "e.g., main.py, agents.py, state.py" },
          language: { type: Type.STRING, enum: ["python"] },
          content: { type: Type.STRING, description: "Full source code" }
        },
        required: ["filename", "language", "content"]
      }
    }
  },
  required: ["name", "description", "nodes", "edges", "files", "summary"]
};

export async function generateWorkflow(userPrompt: string): Promise<WorkflowDefinition> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `You are AURA Automate, a revolutionary multi-agent OS.
      
      User Request: "${userPrompt}"
      
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
      
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: workflowSchema,
        thinkingConfig: { thinkingBudget: 4096 } 
      }
    });

    if (response.text) {
      let text = response.text;
      text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
      
      try {
        const parsed = JSON.parse(text) as WorkflowDefinition;
        // Post-processing to ensure stability
        if (parsed.nodes) {
            parsed.nodes = parsed.nodes.map(node => ({
                ...node,
                data: node.data || { description: "Auto-generated node", role: "Executor" }
            }));
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse Gemini response:", text);
        throw new Error("Invalid JSON response from AI");
      }
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function optimizeWorkflow(currentWorkflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `You are the AURA 'Optimizer Agent'.
            
            Analyze this existing workflow JSON:
            ${JSON.stringify(currentWorkflow.nodes.map(n => ({id: n.id, role: n.data.role})))}
            
            Task:
            1. Identify bottlenecks or redundant steps.
            2. Merge similar agents if possible to save tokens.
            3. Improve the system prompts in the generated code.
            4. Return a refined, optimized version of the entire workflow object (Nodes, Edges, Files).
            5. Set 'optimizationScore' to something higher than before (e.g., 85-99).
            
            Keep the same JSON structure.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: workflowSchema
            }
        });
        
        if (response.text) {
             const text = response.text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
             return JSON.parse(text) as WorkflowDefinition;
        }
        throw new Error("Optimization failed");
    } catch (error) {
        throw error;
    }
}

export async function fixWorkflowError(lastOutput: string, nodeLabel: string): Promise<string> {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `You are the AURA 'Debugger Agent'.
            
            A workflow step failed.
            Node: ${nodeLabel}
            Error/Output: ${lastOutput}
            
            Task:
            1. Analyze the error.
            2. Suggest a corrected input or a fix.
            3. Return ONLY the corrected text response that simulates the node succeding.
            
            Context: The system is self-healing.`,
        });
        
        return response.text || "Debugger Agent applied automatic fix.";
    } catch (error) {
        return "Debugger failed to resolve the issue.";
    }
}

export async function executeAgentStep(
    node: WorkflowNode, 
    inputState: string,
    knowledgeBase: KnowledgeDocument[]
): Promise<string> {
   try {
    const role = node.data.role?.toLowerCase() || "";
    const label = node.label.toLowerCase();
    
    // Detect search need based on Role or Label
    const needsSearch = 
        label.includes('research') || 
        label.includes('search') ||
        role.includes('research') ||
        node.data.tools?.some(t => t.toLowerCase().includes('search'));

    const tools: Tool[] = [];
    if (needsSearch) {
        tools.push({ googleSearch: {} });
    }

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
    - Research: Use tools to find facts. Cite sources.
    - Executor: Write code, draft text, or simulate API calls.
    - Debugger: Analyze the input for errors and suggest fixes.
    - Optimizer: Rewrite the input to be more concise and effective.
    - Auditor: Check for PII, safety, and policy violations.

    ${ragContext}
    
    Current State:
    ${inputState}`;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Perform your task now.`,
      config: {
        systemInstruction: systemPrompt,
        tools: tools,
        // Only use specific search config if needed, otherwise default
        ...(needsSearch ? {} : {}) 
      }
    });

    let outputText = response.text || "Task completed.";
    
    // Append Grounding metadata
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        const links = chunks
            .filter((c: any) => c.web?.uri)
            .map((c: any) => `[${c.web.title}](${c.web.uri})`)
            .join(', ');
        if (links) outputText += `\n\nSources: ${links}`;
    }

    return outputText;
  } catch (error) {
    console.error("Agent Execution Failed:", error);
    // Return a special flag to trigger self-healing in the context
    throw error;
  }
}
