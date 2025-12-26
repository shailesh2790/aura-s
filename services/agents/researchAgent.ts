/**
 * Research Agent
 *
 * Handles:
 * - Web search and information gathering
 * - Competitive analysis
 * - Market research
 * - Data extraction and structuring
 */

import { callGroqLLM } from '../llm';
import { AgentState, AgentAction } from '../../types/aura-os';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface CompetitiveAnalysis {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  features: Record<string, any>;
  pricing?: string;
  marketPosition?: string;
}

export interface ResearchReport {
  topic: string;
  summary: string;
  findings: string[];
  sources: SearchResult[];
  recommendations: string[];
  competitiveAnalysis?: CompetitiveAnalysis[];
  timestamp: number;
}

export class ResearchAgent {
  private agentRole = 'research';

  /**
   * Search the web for information
   *
   * Note: For MVP, using Groq LLM with instructions to simulate search
   * TODO: Integrate real search API (Serper or Tavily) in production
   */
  async searchWeb(query: string, numResults: number = 5): Promise<SearchResult[]> {
    console.log(`[RESEARCH AGENT] Searching web for: ${query}`);

    // For MVP: Simulate search with LLM knowledge
    // In production: Use Serper API or Tavily
    const prompt = `You are a web search engine. Generate realistic search results for: "${query}"

Return ${numResults} search results as JSON array:
[
  {
    "title": "Page title",
    "url": "https://example.com/page",
    "snippet": "Brief description of the page content (2-3 sentences)",
    "source": "domain.com"
  }
]

Make the results relevant and realistic. Include a mix of:
- Official product websites
- Review sites
- News articles
- Documentation pages
- Industry analyses

Return ONLY the JSON array, no additional text.`;

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      // Extract JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in search response');
      }

      const results = JSON.parse(jsonMatch[0]);
      return results as SearchResult[];
    } catch (error) {
      console.error('[RESEARCH AGENT] Search error:', error);
      return [];
    }
  }

  /**
   * Conduct competitive analysis
   */
  async analyzeCompetitors(competitors: string[], aspects?: string[]): Promise<CompetitiveAnalysis[]> {
    console.log(`[RESEARCH AGENT] Analyzing competitors: ${competitors.join(', ')}`);

    const aspectsStr = aspects ? ` focusing on: ${aspects.join(', ')}` : '';

    const prompt = `You are a product analyst conducting competitive analysis. Analyze these competitors${aspectsStr}:

Competitors: ${competitors.join(', ')}

For each competitor, provide:
1. Key strengths (3-5 points)
2. Key weaknesses (3-5 points)
3. Notable features
4. Pricing model (if known)
5. Market position

Return as JSON array:
[
  {
    "competitor": "Company Name",
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "features": {
      "feature_category_1": ["feature A", "feature B"],
      "feature_category_2": ["feature C", "feature D"]
    },
    "pricing": "pricing model description",
    "marketPosition": "market position assessment"
  }
]`;

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in analysis response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis as CompetitiveAnalysis[];
    } catch (error) {
      console.error('[RESEARCH AGENT] Analysis error:', error);
      return [];
    }
  }

  /**
   * Extract structured data from text
   */
  async extractStructuredData(text: string, schema: string): Promise<any> {
    console.log(`[RESEARCH AGENT] Extracting structured data`);

    const prompt = `Extract structured data from the following text according to this schema:

Schema: ${schema}

Text:
${text}

Return the extracted data as JSON following the schema structure.`;

    try {
      const response = await callGroqLLM([{ role: 'user', content: prompt }]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in extraction response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[RESEARCH AGENT] Extraction error:', error);
      return {};
    }
  }

  /**
   * Create a comprehensive research report
   */
  async conductResearch(
    topic: string,
    includeCompetitiveAnalysis: boolean = false,
    competitors?: string[]
  ): Promise<ResearchReport> {
    console.log(`[RESEARCH AGENT] Conducting research on: ${topic}`);

    // 1. Search for information
    const searchResults = await this.searchWeb(topic, 10);

    // 2. Synthesize findings
    const synthesisPrompt = `Based on these search results about "${topic}", provide:

Search Results:
${searchResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.url}`).join('\n\n')}

Generate:
1. A comprehensive summary (2-3 paragraphs)
2. Key findings (5-7 bullet points)
3. Actionable recommendations (3-5 points)

Return as JSON:
{
  "summary": "comprehensive summary",
  "findings": ["finding 1", "finding 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

    let summary = '';
    let findings: string[] = [];
    let recommendations: string[] = [];

    try {
      const synthesisResponse = await callGroqLLM([{ role: 'user', content: synthesisPrompt }]);
      const jsonMatch = synthesisResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const synthesis = JSON.parse(jsonMatch[0]);
        summary = synthesis.summary;
        findings = synthesis.findings;
        recommendations = synthesis.recommendations;
      }
    } catch (error) {
      console.error('[RESEARCH AGENT] Synthesis error:', error);
      summary = `Research conducted on: ${topic}`;
      findings = ['Unable to synthesize findings'];
      recommendations = ['Please review search results manually'];
    }

    // 3. Competitive analysis (if requested)
    let competitiveAnalysis: CompetitiveAnalysis[] | undefined;

    if (includeCompetitiveAnalysis && competitors && competitors.length > 0) {
      competitiveAnalysis = await this.analyzeCompetitors(competitors);
    }

    return {
      topic,
      summary,
      findings,
      sources: searchResults,
      recommendations,
      competitiveAnalysis,
      timestamp: Date.now()
    };
  }

  /**
   * Execute research node in workflow
   */
  async executeResearchTask(
    task: string,
    state: AgentState
  ): Promise<{
    output: string;
    data: any;
    updatedState: AgentState;
  }> {
    const startTime = Date.now();

    try {
      console.log(`[RESEARCH AGENT] Executing task: ${task}`);

      // Determine task type
      let result: any;
      let output: string;

      if (task.toLowerCase().includes('competitor') || task.toLowerCase().includes('compare')) {
        // Extract competitor names
        const competitors = this.extractCompetitorNames(task);

        if (competitors.length > 0) {
          result = await this.conductResearch(task, true, competitors);
          output = this.formatResearchReport(result);
        } else {
          result = await this.conductResearch(task);
          output = this.formatResearchReport(result);
        }
      } else {
        // General research
        result = await this.conductResearch(task);
        output = this.formatResearchReport(result);
      }

      const duration = Date.now() - startTime;

      // Create success action
      const action: AgentAction = {
        agentRole: this.agentRole as any,
        action: 'research',
        input: { task },
        output: { result, duration },
        timestamp: Date.now(),
        success: true
      };

      const updatedState: AgentState = {
        ...state,
        history: [...state.history, action],
        context: {
          ...state.context,
          lastResearch: result,
          lastOutput: output
        },
        timestamp: Date.now()
      };

      return {
        output,
        data: result,
        updatedState
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`[RESEARCH AGENT] Error:`, errorMessage);

      const action: AgentAction = {
        agentRole: this.agentRole as any,
        action: 'research',
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
            nodeId: 'research_agent',
            severity: 'HIGH',
            category: 'AGENT_FAILURE',
            status: 'OPEN',
            title: 'Research Agent Failed',
            description: errorMessage,
            createdAt: Date.now()
          }
        ],
        timestamp: Date.now()
      };

      return {
        output: `Research failed: ${errorMessage}`,
        data: null,
        updatedState
      };
    }
  }

  /**
   * Extract competitor names from task description
   */
  private extractCompetitorNames(task: string): string[] {
    // Simple extraction - look for "vs" or "versus" or comma-separated list
    const vsMatch = task.match(/([A-Z][a-zA-Z0-9\s]+)\s+(?:vs|versus)\s+([A-Z][a-zA-Z0-9\s]+)/i);
    if (vsMatch) {
      return [vsMatch[1].trim(), vsMatch[2].trim()];
    }

    // Look for "compare X, Y, and Z" pattern
    const compareMatch = task.match(/compare\s+([A-Z][a-zA-Z0-9\s,]+?)(?:\s+and\s+|\s*$)/i);
    if (compareMatch) {
      return compareMatch[1]
        .split(/,\s*(?:and\s+)?/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    return [];
  }

  /**
   * Format research report as readable text
   */
  private formatResearchReport(report: ResearchReport): string {
    let output = `# Research Report: ${report.topic}\n\n`;

    output += `## Summary\n${report.summary}\n\n`;

    output += `## Key Findings\n`;
    report.findings.forEach((finding, idx) => {
      output += `${idx + 1}. ${finding}\n`;
    });
    output += '\n';

    if (report.competitiveAnalysis && report.competitiveAnalysis.length > 0) {
      output += `## Competitive Analysis\n\n`;

      report.competitiveAnalysis.forEach(comp => {
        output += `### ${comp.competitor}\n\n`;

        output += `**Strengths:**\n`;
        comp.strengths.forEach(s => output += `- ${s}\n`);
        output += '\n';

        output += `**Weaknesses:**\n`;
        comp.weaknesses.forEach(w => output += `- ${w}\n`);
        output += '\n';

        if (comp.pricing) {
          output += `**Pricing:** ${comp.pricing}\n\n`;
        }

        if (comp.marketPosition) {
          output += `**Market Position:** ${comp.marketPosition}\n\n`;
        }
      });
    }

    output += `## Recommendations\n`;
    report.recommendations.forEach((rec, idx) => {
      output += `${idx + 1}. ${rec}\n`;
    });
    output += '\n';

    output += `## Sources\n`;
    report.sources.slice(0, 5).forEach((source, idx) => {
      output += `${idx + 1}. [${source.title}](${source.url})\n`;
    });

    output += `\n*Research conducted at ${new Date(report.timestamp).toLocaleString()}*`;

    return output;
  }
}

// Export singleton
export const researchAgent = new ResearchAgent();
