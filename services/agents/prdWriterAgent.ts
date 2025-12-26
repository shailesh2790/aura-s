/**
 * PRD Writer Agent
 *
 * Generates Product Requirements Documents with:
 * - Problem Statement
 * - Objectives & KPIs
 * - Technical Requirements
 * - Acceptance Criteria
 * - User Stories
 */

import { callGroqLLM } from '../llm';
import { AgentState, AgentAction } from '../../types/aura-os';

export interface PRDSection {
  title: string;
  content: string;
}

export interface UserStory {
  id: string;
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  estimatedPoints?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface PRD {
  title: string;
  version: string;
  author: string;
  date: string;
  sections: {
    executiveSummary: string;
    problemStatement: string;
    objectives: string[];
    kpis: string[];
    userPersonas?: string[];
    useCases?: string[];
    requirements: {
      functional: string[];
      nonFunctional: string[];
      technical?: string[];
    };
    acceptanceCriteria: string[];
    userStories?: UserStory[];
    risks?: string[];
    successMetrics?: string[];
  };
  timestamp: number;
}

export class PRDWriterAgent {
  private agentRole = 'prd_writer';

  /**
   * Generate a complete PRD from a feature description
   */
  async generatePRD(
    featureDescription: string,
    context?: string,
    researchData?: any
  ): Promise<PRD> {
    console.log(`[PRD WRITER] Generating PRD for: ${featureDescription}`);

    const contextStr = context ? `\n\nContext: ${context}` : '';
    const researchStr = researchData ? `\n\nResearch Data: ${JSON.stringify(researchData, null, 2)}` : '';

    const prompt = `You are an expert Product Manager writing a comprehensive PRD. Create a detailed Product Requirements Document for:

Feature: ${featureDescription}${contextStr}${researchStr}

Generate a complete PRD with the following sections. Return as JSON:

{
  "title": "Feature name",
  "executiveSummary": "2-3 sentence overview",
  "problemStatement": "Clear problem description (2-3 paragraphs)",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "kpis": ["KPI 1", "KPI 2", "KPI 3"],
  "userPersonas": ["persona 1 description", "persona 2 description"],
  "useCases": ["use case 1", "use case 2"],
  "requirements": {
    "functional": ["req 1", "req 2", "req 3", "req 4", "req 5"],
    "nonFunctional": ["req 1", "req 2", "req 3"],
    "technical": ["tech req 1", "tech req 2"]
  },
  "acceptanceCriteria": ["criteria 1", "criteria 2", "criteria 3"],
  "risks": ["risk 1", "risk 2"],
  "successMetrics": ["metric 1", "metric 2"]
}

Make it comprehensive, specific, and actionable.`;

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in PRD response');
      }

      const prdData = JSON.parse(jsonMatch[0]);

      const prd: PRD = {
        title: prdData.title,
        version: '1.0',
        author: 'AURA OS - PM Automation',
        date: new Date().toLocaleDateString(),
        sections: {
          executiveSummary: prdData.executiveSummary,
          problemStatement: prdData.problemStatement,
          objectives: prdData.objectives,
          kpis: prdData.kpis,
          userPersonas: prdData.userPersonas,
          useCases: prdData.useCases,
          requirements: prdData.requirements,
          acceptanceCriteria: prdData.acceptanceCriteria,
          risks: prdData.risks,
          successMetrics: prdData.successMetrics
        },
        timestamp: Date.now()
      };

      return prd;
    } catch (error) {
      console.error('[PRD WRITER] Error generating PRD:', error);
      throw error;
    }
  }

  /**
   * Generate user stories from PRD
   */
  async generateUserStories(prd: PRD, numStories: number = 8): Promise<UserStory[]> {
    console.log(`[PRD WRITER] Generating ${numStories} user stories`);

    const prompt = `Based on this PRD, generate ${numStories} detailed user stories in standard format.

PRD:
Title: ${prd.title}
Problem: ${prd.sections.problemStatement}
Requirements: ${prd.sections.requirements.functional.join(', ')}

Generate user stories as JSON array:
[
  {
    "id": "US-1",
    "title": "Brief story title",
    "asA": "user role",
    "iWant": "desired functionality",
    "soThat": "benefit/value",
    "acceptanceCriteria": ["criteria 1", "criteria 2", "criteria 3"],
    "estimatedPoints": 5,
    "priority": "high"
  }
]

Use Fibonacci points (1, 2, 3, 5, 8, 13).
Priority: high, medium, or low.`;

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in user stories response');
      }

      const stories = JSON.parse(jsonMatch[0]);
      return stories as UserStory[];
    } catch (error) {
      console.error('[PRD WRITER] Error generating user stories:', error);
      return [];
    }
  }

  /**
   * Generate a specific PRD section
   */
  async generateSection(
    sectionType: 'problemStatement' | 'objectives' | 'requirements' | 'acceptanceCriteria',
    featureDescription: string,
    context?: string
  ): Promise<any> {
    console.log(`[PRD WRITER] Generating section: ${sectionType}`);

    const contextStr = context ? `\n\nContext: ${context}` : '';

    let prompt = '';
    let returnFormat = '';

    switch (sectionType) {
      case 'problemStatement':
        prompt = `Write a clear, compelling problem statement for this feature:

Feature: ${featureDescription}${contextStr}

The problem statement should:
- Describe the current situation
- Explain why it's a problem
- Quantify impact if possible
- Be 2-3 paragraphs

Return as JSON: {"problemStatement": "your statement here"}`;
        returnFormat = 'object';
        break;

      case 'objectives':
        prompt = `Define 3-5 SMART objectives for this feature:

Feature: ${featureDescription}${contextStr}

Objectives should be:
- Specific
- Measurable
- Achievable
- Relevant
- Time-bound

Return as JSON: {"objectives": ["objective 1", "objective 2", ...]}`;
        returnFormat = 'object';
        break;

      case 'requirements':
        prompt = `Define functional, non-functional, and technical requirements for:

Feature: ${featureDescription}${contextStr}

Return as JSON:
{
  "functional": ["requirement 1", "requirement 2", ...],
  "nonFunctional": ["requirement 1", "requirement 2", ...],
  "technical": ["requirement 1", "requirement 2", ...]
}`;
        returnFormat = 'object';
        break;

      case 'acceptanceCriteria':
        prompt = `Define clear acceptance criteria for:

Feature: ${featureDescription}${contextStr}

Criteria should be:
- Testable
- Specific
- Clear pass/fail conditions

Return as JSON: {"acceptanceCriteria": ["criteria 1", "criteria 2", ...]}`;
        returnFormat = 'object';
        break;
    }

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`No JSON found in ${sectionType} response`);
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error(`[PRD WRITER] Error generating ${sectionType}:`, error);
      return {};
    }
  }

  /**
   * Format PRD as markdown
   */
  formatAsMarkdown(prd: PRD): string {
    let md = `# ${prd.title}\n\n`;
    md += `**Version:** ${prd.version}  \n`;
    md += `**Author:** ${prd.author}  \n`;
    md += `**Date:** ${prd.date}\n\n`;

    md += `---\n\n`;

    md += `## Executive Summary\n\n`;
    md += `${prd.sections.executiveSummary}\n\n`;

    md += `## Problem Statement\n\n`;
    md += `${prd.sections.problemStatement}\n\n`;

    md += `## Objectives\n\n`;
    prd.sections.objectives.forEach((obj, idx) => {
      md += `${idx + 1}. ${obj}\n`;
    });
    md += '\n';

    md += `## Key Performance Indicators (KPIs)\n\n`;
    prd.sections.kpis.forEach((kpi, idx) => {
      md += `${idx + 1}. ${kpi}\n`;
    });
    md += '\n';

    if (prd.sections.userPersonas && prd.sections.userPersonas.length > 0) {
      md += `## User Personas\n\n`;
      prd.sections.userPersonas.forEach((persona, idx) => {
        md += `### Persona ${idx + 1}\n${persona}\n\n`;
      });
    }

    if (prd.sections.useCases && prd.sections.useCases.length > 0) {
      md += `## Use Cases\n\n`;
      prd.sections.useCases.forEach((useCase, idx) => {
        md += `${idx + 1}. ${useCase}\n`;
      });
      md += '\n';
    }

    md += `## Requirements\n\n`;

    md += `### Functional Requirements\n\n`;
    prd.sections.requirements.functional.forEach((req, idx) => {
      md += `${idx + 1}. ${req}\n`;
    });
    md += '\n';

    md += `### Non-Functional Requirements\n\n`;
    prd.sections.requirements.nonFunctional.forEach((req, idx) => {
      md += `${idx + 1}. ${req}\n`;
    });
    md += '\n';

    if (prd.sections.requirements.technical && prd.sections.requirements.technical.length > 0) {
      md += `### Technical Requirements\n\n`;
      prd.sections.requirements.technical.forEach((req, idx) => {
        md += `${idx + 1}. ${req}\n`;
      });
      md += '\n';
    }

    md += `## Acceptance Criteria\n\n`;
    prd.sections.acceptanceCriteria.forEach((criteria, idx) => {
      md += `- [ ] ${criteria}\n`;
    });
    md += '\n';

    if (prd.sections.userStories && prd.sections.userStories.length > 0) {
      md += `## User Stories\n\n`;
      prd.sections.userStories.forEach(story => {
        md += `### ${story.id}: ${story.title}\n\n`;
        md += `**As a** ${story.asA}  \n`;
        md += `**I want** ${story.iWant}  \n`;
        md += `**So that** ${story.soThat}\n\n`;
        md += `**Acceptance Criteria:**\n`;
        story.acceptanceCriteria.forEach(ac => {
          md += `- [ ] ${ac}\n`;
        });
        if (story.estimatedPoints) {
          md += `\n**Story Points:** ${story.estimatedPoints}\n`;
        }
        if (story.priority) {
          md += `**Priority:** ${story.priority}\n`;
        }
        md += '\n';
      });
    }

    if (prd.sections.risks && prd.sections.risks.length > 0) {
      md += `## Risks & Mitigations\n\n`;
      prd.sections.risks.forEach((risk, idx) => {
        md += `${idx + 1}. ${risk}\n`;
      });
      md += '\n';
    }

    if (prd.sections.successMetrics && prd.sections.successMetrics.length > 0) {
      md += `## Success Metrics\n\n`;
      prd.sections.successMetrics.forEach((metric, idx) => {
        md += `${idx + 1}. ${metric}\n`;
      });
      md += '\n';
    }

    md += `---\n\n`;
    md += `*Generated by AURA OS - PM Automation*  \n`;
    md += `*Timestamp: ${new Date(prd.timestamp).toLocaleString()}*`;

    return md;
  }

  /**
   * Execute PRD writing task in workflow
   */
  async executePRDTask(
    task: string,
    state: AgentState,
    researchData?: any
  ): Promise<{
    output: string;
    prd: PRD;
    updatedState: AgentState;
  }> {
    const startTime = Date.now();

    try {
      console.log(`[PRD WRITER] Executing task: ${task}`);

      // Generate PRD
      const prd = await this.generatePRD(task, state.goal.description, researchData);

      // Generate user stories
      const userStories = await this.generateUserStories(prd);
      prd.sections.userStories = userStories;

      // Format as markdown
      const output = this.formatAsMarkdown(prd);

      const duration = Date.now() - startTime;

      // Create success action
      const action: AgentAction = {
        agentRole: this.agentRole as any,
        action: 'write_prd',
        input: { task },
        output: { prd, duration },
        timestamp: Date.now(),
        success: true
      };

      const updatedState: AgentState = {
        ...state,
        history: [...state.history, action],
        context: {
          ...state.context,
          lastPRD: prd,
          lastOutput: output
        },
        timestamp: Date.now()
      };

      return {
        output,
        prd,
        updatedState
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`[PRD WRITER] Error:`, errorMessage);

      const action: AgentAction = {
        agentRole: this.agentRole as any,
        action: 'write_prd',
        input: { task },
        error: errorMessage,
        timestamp: Date.now(),
        success: false
      };

      const updatedState: AgentState = {
        ...state,
        history: [...state.history, action],
        incidents: [
          ...state.incidents,
          {
            id: `incident-${Date.now()}`,
            tenantId: 'default',
            flowRunId: state.flowRunId,
            nodeId: 'prd_writer',
            severity: 'HIGH',
            category: 'AGENT_FAILURE',
            status: 'OPEN',
            title: 'PRD Writer Failed',
            description: errorMessage,
            createdAt: Date.now()
          }
        ],
        timestamp: Date.now()
      };

      throw error;
    }
  }
}

// Export singleton
export const prdWriterAgent = new PRDWriterAgent();
