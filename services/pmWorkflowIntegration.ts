/**
 * PM Workflow Integration Service
 *
 * Bridges the new PM agents (Intent Engine, Research, PRD Writer) with the existing
 * workflow execution system (Conductor, Planner, Executor).
 *
 * Flow:
 * 1. User provides PM goal → Intent Engine parses & generates plan
 * 2. Plan Visualizer shows plan → User approves
 * 3. PM Workflow Integration executes plan using PM agents + existing agents
 * 4. Results returned to user
 */

import { intentEngine, TaskPlan } from './intent/intentEngine';
import { researchAgent } from './agents/researchAgent';
import { prdWriterAgent } from './agents/prdWriterAgent';
import { AgentState, Goal } from '../types/aura-os';

export interface PMWorkflowResult {
  success: boolean;
  output: string;
  data?: any;
  error?: string;
  executionTime: number;
}

export class PMWorkflowIntegration {
  /**
   * Execute a PM goal end-to-end
   * 1. Parse goal & generate plan
   * 2. Execute each step with appropriate agent
   * 3. Collect results and return
   */
  async executePMGoal(
    goalDescription: string,
    context?: string
  ): Promise<{
    plan: TaskPlan;
    results: PMWorkflowResult[];
    finalOutput: string;
  }> {
    console.log('[PM WORKFLOW] Starting PM goal execution:', goalDescription);
    const startTime = Date.now();

    try {
      // Step 1: Generate execution plan using Intent Engine
      console.log('[PM WORKFLOW] Generating plan with Intent Engine...');
      const plan = await intentEngine.generatePlan(goalDescription, context);
      console.log(`[PM WORKFLOW] Plan generated: ${plan.steps.length} steps, ${plan.estimatedTotalTime}s estimated`);

      // Step 2: Validate plan
      const validation = intentEngine.validatePlan(plan);
      if (!validation.valid) {
        throw new Error(`Invalid plan: ${validation.errors.join(', ')}`);
      }

      // Step 3: Execute each step
      const results: PMWorkflowResult[] = [];
      let aggregatedData: any = {};

      for (const step of plan.steps) {
        console.log(`[PM WORKFLOW] Executing step: ${step.description}`);
        const stepStartTime = Date.now();

        try {
          const result = await this.executeStep(step, aggregatedData);
          results.push(result);

          // Store step data for next steps
          if (result.data) {
            aggregatedData = { ...aggregatedData, ...result.data };
          }

          console.log(`[PM WORKFLOW] Step completed in ${Date.now() - stepStartTime}ms`);
        } catch (error) {
          const errorMessage = (error as Error).message;
          console.error(`[PM WORKFLOW] Step failed:`, errorMessage);

          results.push({
            success: false,
            output: `Failed: ${errorMessage}`,
            error: errorMessage,
            executionTime: Date.now() - stepStartTime
          });

          // Decide whether to continue or abort
          // For now, we abort on first failure
          throw error;
        }
      }

      // Step 4: Generate final output
      const finalOutput = this.generateFinalOutput(plan, results, aggregatedData);

      const totalTime = Date.now() - startTime;
      console.log(`[PM WORKFLOW] Goal completed successfully in ${totalTime}ms`);

      return {
        plan,
        results,
        finalOutput
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('[PM WORKFLOW] Goal execution failed:', errorMessage);
      throw error;
    }
  }

  /**
   * Execute a single step with the appropriate agent
   */
  private async executeStep(
    step: any,
    aggregatedData: any
  ): Promise<PMWorkflowResult> {
    const startTime = Date.now();

    // Route to appropriate agent based on agent type
    switch (step.agent) {
      case 'research':
        return await this.executeResearchStep(step, aggregatedData);

      case 'prd_writer':
        return await this.executePRDStep(step, aggregatedData);

      case 'analyst':
        // Analyst agent not yet implemented
        return {
          success: true,
          output: `Analyst task: ${step.description} (Coming soon)`,
          executionTime: Date.now() - startTime
        };

      case 'jira_manager':
        // Jira Manager agent not yet implemented
        return {
          success: true,
          output: `Jira task: ${step.description} (Coming soon)`,
          executionTime: Date.now() - startTime
        };

      case 'ux_writer':
        // UX Writer agent not yet implemented
        return {
          success: true,
          output: `UX writing task: ${step.description} (Coming soon)`,
          executionTime: Date.now() - startTime
        };

      default:
        throw new Error(`Unknown agent type: ${step.agent}`);
    }
  }

  /**
   * Execute research step
   */
  private async executeResearchStep(
    step: any,
    aggregatedData: any
  ): Promise<PMWorkflowResult> {
    const startTime = Date.now();

    try {
      // Extract research query from step description
      const query = this.extractResearchQuery(step.description);

      // Check if competitive analysis is needed
      const needsCompAnalysis = step.description.toLowerCase().includes('compet');
      const competitors = needsCompAnalysis
        ? this.extractCompetitors(step.description)
        : [];

      // Conduct research
      const report = await researchAgent.conductResearch(
        query,
        needsCompAnalysis,
        competitors
      );

      return {
        success: true,
        output: report.summary,
        data: { researchReport: report },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Research step failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute PRD writing step
   */
  private async executePRDStep(
    step: any,
    aggregatedData: any
  ): Promise<PMWorkflowResult> {
    const startTime = Date.now();

    try {
      // Extract feature name from step description
      const featureName = this.extractFeatureName(step.description);

      // Use research data if available
      const researchData = aggregatedData.researchReport;

      // Generate PRD
      const prd = await prdWriterAgent.generatePRD(
        featureName,
        undefined,
        researchData
      );

      // Generate user stories
      const userStories = await prdWriterAgent.generateUserStories(prd, 8);
      prd.sections.userStories = userStories;

      // Format as markdown
      const markdown = prdWriterAgent.formatAsMarkdown(prd);

      return {
        success: true,
        output: markdown,
        data: { prd, userStories },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`PRD writing step failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate final output summary
   */
  private generateFinalOutput(
    plan: TaskPlan,
    results: PMWorkflowResult[],
    aggregatedData: any
  ): string {
    let output = `# PM Workflow Execution Complete\n\n`;
    output += `**Goal**: ${plan.goal.intent}\n\n`;
    output += `**Executed Steps**: ${results.length}/${plan.steps.length}\n\n`;

    output += `## Results\n\n`;

    results.forEach((result, index) => {
      const step = plan.steps[index];
      output += `### Step ${index + 1}: ${step.description}\n`;
      output += `**Agent**: ${step.agent}\n`;
      output += `**Time**: ${result.executionTime}ms\n`;
      output += `**Status**: ${result.success ? '✓ Success' : '✗ Failed'}\n\n`;

      if (result.output) {
        output += `${result.output}\n\n`;
      }

      output += `---\n\n`;
    });

    // Add final deliverables
    if (aggregatedData.prd) {
      output += `## Final Deliverables\n\n`;
      output += `- PRD Document: ${aggregatedData.prd.title}\n`;
      if (aggregatedData.userStories) {
        output += `- User Stories: ${aggregatedData.userStories.length} stories\n`;
      }
      if (aggregatedData.researchReport) {
        output += `- Research Report: ${aggregatedData.researchReport.findings.length} findings\n`;
      }
    }

    return output;
  }

  /**
   * Helper: Extract research query from description
   */
  private extractResearchQuery(description: string): string {
    // Simple extraction - can be improved with NLP
    const match = description.match(/research\s+(?:for\s+|about\s+)?(.+?)(?:\s+and|\s+to|\s*$)/i);
    return match ? match[1].trim() : description;
  }

  /**
   * Helper: Extract competitors from description
   */
  private extractCompetitors(description: string): string[] {
    // Look for patterns like "vs X, Y, and Z" or "against X and Y"
    const vsMatch = description.match(/vs\.?\s+(.+?)(?:\s+and|\s*$)/i);
    const againstMatch = description.match(/against\s+(.+?)(?:\s+and|\s*$)/i);

    const competitorText = vsMatch?.[1] || againstMatch?.[1] || '';
    if (!competitorText) return [];

    // Split by commas and 'and'
    return competitorText
      .split(/,|\s+and\s+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
  }

  /**
   * Helper: Extract feature name from description
   */
  private extractFeatureName(description: string): string {
    // Look for patterns like "PRD for X" or "write PRD about X"
    const forMatch = description.match(/PRD\s+for\s+(.+?)(?:\s+with|\s+including|\s*$)/i);
    const aboutMatch = description.match(/PRD\s+about\s+(.+?)(?:\s+with|\s+including|\s*$)/i);

    return forMatch?.[1] || aboutMatch?.[1] || description;
  }
}

// Export singleton
export const pmWorkflowIntegration = new PMWorkflowIntegration();
