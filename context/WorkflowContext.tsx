
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { WorkflowDefinition, WorkflowNode, ExecutionStep, KnowledgeDocument, Integration, RecentFlow, Template } from '../types';
import { generateWorkflow as apiGenerateWorkflow, executeAgentStep, optimizeWorkflow as apiOptimizeWorkflow, fixWorkflowError } from '../services/llm';
import { conductorAgent } from '../services/agents/conductor';
import { plannerAgent } from '../services/agents/planner';
import { AgentState, AgentAction } from '../types/aura-os';

const SAMPLE_PROMPT = "Build a customer feedback loop. Monitor email for 'complaint', research the customer in CRM, draft a specialized apology, and notify the support team on Slack.";

const INITIAL_INTEGRATIONS: Integration[] = [
    { id: '1', name: 'WhatsApp Business', category: 'Communication', connected: false, icon: '💬', description: 'Send messages & auto-replies' },
    { id: '2', name: 'Slack', category: 'Communication', connected: true, icon: '📢', description: 'Channel notifications & bots' },
    { id: '3', name: 'Gmail', category: 'Communication', connected: false, icon: '✉️', description: 'Read/Write emails' },
    { id: '4', name: 'HubSpot', category: 'CRM', connected: false, icon: '🎯', description: 'Customer data sync' },
    { id: '5', name: 'PostgreSQL', category: 'Database', connected: true, icon: '🐘', description: 'Read/Write operations' },
    { id: '6', name: 'Notion', category: 'Productivity', connected: false, icon: '📓', description: 'Knowledge base sync' },
];

interface WorkflowContextType {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  isOptimizing: boolean;
  workflow: WorkflowDefinition | null;
  selectedNode: WorkflowNode | null;
  setSelectedNode: (node: WorkflowNode | null) => void;
  activeTab: 'design' | 'code' | 'knowledge';
  setActiveTab: (tab: 'design' | 'code' | 'knowledge') => void;
  selectedFile: string;
  setSelectedFile: (file: string) => void;
  executionLog: ExecutionStep[];
  isSimulating: boolean;
  activeNodeId: string | null;
  generateWorkflow: () => Promise<void>;
  optimizeWorkflow: () => Promise<void>;
  runSimulation: () => Promise<void>;
  applyTemplate: (template: Template) => void;

  // RAG / Knowledge Base
  documents: KnowledgeDocument[];
  addDocument: (title: string, content: string) => void;
  removeDocument: (id: string) => void;

  // Integrations & Dashboard Stats
  integrations: Integration[];
  toggleIntegration: (id: string) => void;
  recentFlows: RecentFlow[];
  stats: {
      totalRuns: number;
      successRate: number;
      activeAgents: number;
  };

  // Save/Load functionality
  saveWorkflowToFile: () => void;
  loadWorkflowFromFile: (file: File) => Promise<void>;
  clearAllData: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// LocalStorage Keys
const STORAGE_KEYS = {
  WORKFLOW: 'aura_workflow',
  DOCUMENTS: 'aura_documents',
  INTEGRATIONS: 'aura_integrations',
  RECENT_FLOWS: 'aura_recent_flows',
  STATS: 'aura_stats',
  PROMPT: 'aura_prompt',
  EXECUTION_LOG: 'aura_execution_log'
};

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prompt, setPrompt] = useState(() => loadFromStorage(STORAGE_KEYS.PROMPT, SAMPLE_PROMPT));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(() => loadFromStorage(STORAGE_KEYS.WORKFLOW, null));
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'code' | 'knowledge'>('design');
  const [selectedFile, setSelectedFile] = useState<string>('main.py');

  // Knowledge Base State
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => loadFromStorage(STORAGE_KEYS.DOCUMENTS, []));

  // Simulation State
  const [executionLog, setExecutionLog] = useState<ExecutionStep[]>(() => loadFromStorage(STORAGE_KEYS.EXECUTION_LOG, []));
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Platform OS State
  const [integrations, setIntegrations] = useState<Integration[]>(() => loadFromStorage(STORAGE_KEYS.INTEGRATIONS, INITIAL_INTEGRATIONS));
  const [recentFlows, setRecentFlows] = useState<RecentFlow[]>(() => loadFromStorage(STORAGE_KEYS.RECENT_FLOWS, []));
  const [stats, setStats] = useState(() => loadFromStorage(STORAGE_KEYS.STATS, {
      totalRuns: 142,
      successRate: 94,
      activeAgents: 12
  }));

  // Persist state changes to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.WORKFLOW, workflow);
  }, [workflow]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DOCUMENTS, documents);
  }, [documents]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INTEGRATIONS, integrations);
  }, [integrations]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RECENT_FLOWS, recentFlows);
  }, [recentFlows]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STATS, stats);
  }, [stats]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROMPT, prompt);
  }, [prompt]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXECUTION_LOG, executionLog);
  }, [executionLog]);

  const addDocument = (title: string, content: string) => {
    const newDoc: KnowledgeDocument = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        content,
        type: 'text',
        dateAdded: Date.now()
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const toggleIntegration = (id: string) => {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  const generateWorkflow = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setWorkflow(null);
    setExecutionLog([]);
    setSelectedNode(null);

    // Log agent activity
    const agentLog: ExecutionStep[] = [];
    const addAgentLog = (agent: string, output: string) => {
      const step: ExecutionStep = {
        nodeId: agent,
        output,
        timestamp: Date.now(),
        status: 'completed'
      };
      agentLog.push(step);
      setExecutionLog(prev => [...prev, step]);
    };

    try {
      // NEW: Use Conductor → Planner multi-agent flow
      addAgentLog('conductor', '🧠 Conductor Agent: Analyzing goal and selecting strategy...');

      // Build initial agent state
      const activeIntegrations = integrations.filter(i => i.connected);
      const initialState: AgentState = {
        flowRunId: uuidv4(),
        goal: {
          id: uuidv4(),
          description: prompt,
          priority: 'high',
          status: 'IN_PROGRESS',
          createdAt: Date.now()
        },
        history: [],
        context: {
          integrations: activeIntegrations,
          documents,
          availableTools: activeIntegrations.map(i => i.name)
        },
        incidents: [],
        timestamp: Date.now()
      };

      // Step 1: Conductor decides strategy
      const conductorDecision = await conductorAgent.decide(initialState);

      addAgentLog(
        'conductor',
        `✓ Strategy: ${conductorDecision.reasoning}\n→ Next Agent: ${conductorDecision.nextAgent?.toUpperCase() || 'COMPLETE'}`
      );

      let result: WorkflowDefinition;

      // Step 2: Based on conductor's decision, invoke appropriate agent
      if (conductorDecision.nextAgent === 'planner') {
        addAgentLog('planner', '📋 Planner Agent: Designing workflow architecture...');

        result = await plannerAgent.createWorkflow(conductorDecision.updatedState);

        addAgentLog(
          'planner',
          `✓ Workflow Created: "${result.name}"\n` +
          `  Nodes: ${result.nodes.length}\n` +
          `  Agents: ${result.nodes.filter(n => n.type === 'agent').length}\n` +
          `  Score: ${result.optimizationScore || 'N/A'}/100`
        );
      } else {
        // Fallback to direct generation if conductor doesn't select planner
        addAgentLog('system', '⚠️ Falling back to direct workflow generation...');

        // Inject Integrations Context for legacy path
        let adjustedPrompt = prompt;
        const activeIntegrationNames = activeIntegrations.map(i => i.name).join(", ");

        if (activeIntegrationNames) {
          adjustedPrompt += `\n\n[System Note]: The following tools are CONNECTED and available for use: ${activeIntegrationNames}. Assign agents to use them where relevant.`;
        }

        if (documents.length > 0) {
          adjustedPrompt += "\n\n[System Note]: Include a Retrieval capability to access the provided knowledge base documents.";
        }

        result = await apiGenerateWorkflow(adjustedPrompt);
      }

      // Set workflow and update UI
      setWorkflow(result);
      if (result.files.length > 0) setSelectedFile(result.files[0].filename);

      // Update Dashboard Stats
      setStats(prev => ({
        ...prev,
        activeAgents: prev.activeAgents + result.nodes.filter(n => n.type === 'agent').length
      }));

      setRecentFlows(prev => [
        {
          id: uuidv4(),
          name: result.name,
          status: 'active',
          lastRun: Date.now(),
          agents: result.nodes.filter(n => n.type === 'agent').length
        },
        ...prev.slice(0, 4)
      ]);

      addAgentLog('system', '✅ Workflow generation complete! Ready to execute.');

    } catch (e) {
      console.error('[WORKFLOW GENERATION ERROR]', e);
      setExecutionLog(prev => [
        ...prev,
        {
          nodeId: 'error',
          output: `❌ Error: ${(e as Error).message}`,
          timestamp: Date.now(),
          status: 'failed'
        }
      ]);
      alert("Failed to generate workflow. The model might be busy, please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTemplate = (template: Template) => {
      setPrompt(template.prompt);
      // We'll trigger generation immediately
      setTimeout(() => {
          generateWorkflow();
      }, 100);
  };

  const optimizeWorkflow = async () => {
      if (!workflow) return;
      setIsOptimizing(true);
      try {
          const optimized = await apiOptimizeWorkflow(workflow);
          setWorkflow(optimized);
          // Force refresh file view
          if(optimized.files.length > 0) setSelectedFile(optimized.files[0].filename);
          alert("Workflow optimized by AURA Optimizer Agent.");
      } catch (e) {
          console.error(e);
          alert("Optimization failed.");
      } finally {
          setIsOptimizing(false);
      }
  };

  const runSimulation = async () => {
    if (!workflow || isSimulating) return;
    setIsSimulating(true);
    setExecutionLog([]);
    setActiveTab('design');

    // Update stats
    setStats(prev => ({ ...prev, totalRuns: prev.totalRuns + 1 }));

    // Initial state includes the prompt
    let currentState = `User Request: ${prompt}`;

    // Find Start
    let currentNode = workflow.nodes.find(n => n.type === 'start') || workflow.nodes[0];
    const maxSteps = 15;
    let stepCount = 0;

    while (currentNode && stepCount < maxSteps && currentNode.type !== 'end') {
        const nodeId = currentNode.id;
        setActiveNodeId(nodeId);
        
        // Copy node for closure safety
        const currentLoopNode = currentNode; 
        setSelectedNode(currentLoopNode);

        // Visual delay
        await new Promise(r => setTimeout(r, 1200));

        let output = "";
        try {
            // Real execution using Gemini
            output = await executeAgentStep(currentLoopNode, currentState, documents);
        } catch (err) {
            console.error("Simulation Error", err);
            
            // SELF-HEALING LOGIC
            // If execution fails, we invoke the Debugger Agent
            setExecutionLog(prev => [...prev, {
                nodeId: currentLoopNode.id,
                output: "Error Detected. Invoking Debugger Agent...",
                timestamp: Date.now(),
                status: 'failed'
            }]);
            
            await new Promise(r => setTimeout(r, 1000));
            
            const fix = await fixWorkflowError((err as Error).message, currentLoopNode.label);
            output = `[DEBUGGER AGENT FIX APPLIED]: ${fix}`;
        }
        
        const step: ExecutionStep = {
            nodeId: currentLoopNode.id,
            output: output,
            timestamp: Date.now(),
            status: 'completed'
        };

        setExecutionLog(prev => [...prev, step]);
        // Update the conversation state with the new output
        currentState += `\n\n[Output from ${currentLoopNode.label}]:\n${output}`;

        // Find Next Node logic
        const edges = workflow.edges.filter(e => e.source === nodeId);
        if (edges.length === 0) break;
        
        let nextEdge = edges[0];
        
        if (edges.length > 1) {
             const heuristicEdge = edges.find(e => e.label && output.toLowerCase().includes(e.label.toLowerCase()));
             if (heuristicEdge) {
                 nextEdge = heuristicEdge;
             } else {
                 nextEdge = edges[Math.floor(Math.random() * edges.length)];
             }
        }
        
        const nextNode = workflow.nodes.find(n => n.id === nextEdge.target);
        if (!nextNode) break;

        currentNode = nextNode;
        stepCount++;
    }

    // Finalize
    if(currentNode && currentNode.type === 'end') {
        setActiveNodeId(currentNode.id);
        setExecutionLog(prev => [...prev, { nodeId: currentNode.id, output: "Workflow Finished.", timestamp: Date.now(), status: 'completed' }]);
        await new Promise(r => setTimeout(r, 1000));
    }

    setActiveNodeId(null);
    setIsSimulating(false);
  };

  // Simple ID generator fallback if uuid import fails in some envs
  const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Save/Load functionality
  const saveWorkflowToFile = () => {
    const data = {
      workflow,
      documents,
      integrations,
      recentFlows,
      stats,
      prompt,
      executionLog,
      exportedAt: Date.now()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aura-workflow-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadWorkflowFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.workflow) setWorkflow(data.workflow);
      if (data.documents) setDocuments(data.documents);
      if (data.integrations) setIntegrations(data.integrations);
      if (data.recentFlows) setRecentFlows(data.recentFlows);
      if (data.stats) setStats(data.stats);
      if (data.prompt) setPrompt(data.prompt);
      if (data.executionLog) setExecutionLog(data.executionLog);

      alert('Workflow loaded successfully!');
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert('Failed to load workflow. Please check the file format.');
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      setWorkflow(null);
      setDocuments([]);
      setIntegrations(INITIAL_INTEGRATIONS);
      setRecentFlows([]);
      setStats({
        totalRuns: 0,
        successRate: 0,
        activeAgents: 0
      });
      setPrompt(SAMPLE_PROMPT);
      setExecutionLog([]);
      alert('All data cleared successfully!');
    }
  };

  return (
    <WorkflowContext.Provider value={{
      prompt,
      setPrompt,
      isGenerating,
      isOptimizing,
      workflow,
      selectedNode,
      setSelectedNode,
      activeTab,
      setActiveTab,
      selectedFile,
      setSelectedFile,
      executionLog,
      isSimulating,
      activeNodeId,
      generateWorkflow,
      optimizeWorkflow,
      runSimulation,
      applyTemplate,
      documents,
      addDocument,
      removeDocument,
      integrations,
      toggleIntegration,
      recentFlows,
      stats,
      saveWorkflowToFile,
      loadWorkflowFromFile,
      clearAllData
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
