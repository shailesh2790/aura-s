/**
 * PM-Focused Workflow Templates
 *
 * Templates for common Product Management tasks
 */

import { BusinessTemplate } from '../types/advanced';

export const PM_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'pm_prd_generator',
    name: 'PRD Generator',
    category: 'pm',
    description: 'Generate a comprehensive Product Requirements Document from a feature description',
    longDescription: 'Automatically create a complete PRD with problem statement, objectives, KPIs, requirements, acceptance criteria, and user stories. The AI will conduct research, analyze competitors, and structure everything in a professional format ready for Notion or Jira.',
    useCase: 'Save 4-8 hours writing PRDs. Perfect for new features, product enhancements, or experiments.',
    complexity: 'beginner',
    estimatedSetupTime: 5,
    requiredIntegrations: [],
    optionalIntegrations: ['notion', 'google-docs', 'jira'],
    workflow: {
      prompt: `Create a complete PRD using AI agents:

**Goal**: Generate PRD for [your feature name]

**Execution Plan**:
1. **Research Agent**: Conduct market research and competitive analysis
   - Search for similar features
   - Analyze competitor implementations
   - Gather best practices

2. **PRD Writer Agent**: Generate comprehensive PRD
   - Executive Summary
   - Problem Statement
   - Objectives & KPIs
   - User Personas
   - Functional Requirements
   - Non-Functional Requirements
   - Technical Requirements
   - Acceptance Criteria

3. **PRD Writer Agent**: Generate User Stories
   - 8-12 detailed user stories
   - Acceptance criteria per story
   - Story point estimates
   - Priority levels

4. **Executor Agent** (Optional): Export to tools
   - Create Notion page
   - Generate Google Doc
   - Create Jira epic with stories

**Example Usage**:
"Create PRD for AI-powered search feature for our knowledge base"
"Generate PRD for mobile app redesign focusing on onboarding"
"Write PRD for payment integration with Stripe"`
    },
    configuration: [
      {
        key: 'feature_description',
        label: 'Feature Description',
        type: 'text',
        required: true,
        description: 'Describe the feature you want to build'
      },
      {
        key: 'include_competitive_analysis',
        label: 'Include Competitive Analysis',
        type: 'select',
        required: false,
        description: 'Research and analyze competitors',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        key: 'export_format',
        label: 'Export Format',
        type: 'select',
        required: false,
        description: 'Choose output format',
        options: [
          { label: 'Markdown', value: 'markdown' },
          { label: 'Notion', value: 'notion' },
          { label: 'Google Docs', value: 'google_docs' },
          { label: 'Jira', value: 'jira' }
        ]
      }
    ],
    roi: '4-8 hours saved per PRD. Professional quality documentation every time.',
    testimonials: [],
    icon: '📄',
    tags: ['pm', 'prd', 'documentation', 'requirements', 'user-stories'],
    popularity: 1000,
    createdAt: Date.now()
  },

  {
    id: 'pm_competitive_analysis',
    name: 'Competitive Analysis Generator',
    category: 'pm',
    description: 'Automatically research and compare competitors with detailed feature analysis',
    longDescription: 'AI conducts comprehensive competitive research, extracts key information, and generates professional comparison reports with strengths, weaknesses, pricing, and strategic recommendations.',
    useCase: 'Perfect for market positioning, feature prioritization, and strategic planning. Get insights in minutes instead of days.',
    complexity: 'beginner',
    estimatedSetupTime: 3,
    requiredIntegrations: [],
    optionalIntegrations: ['notion', 'google-docs'],
    workflow: {
      prompt: `Conduct comprehensive competitive analysis:

**Goal**: Compare [Competitor A] vs [Competitor B] vs [Competitor C]

**Execution Plan**:
1. **Research Agent**: Gather competitor information
   - Search for official websites
   - Extract product information
   - Find pricing details
   - Identify key features
   - Gather user reviews

2. **Research Agent**: Analyze each competitor
   - Strengths analysis
   - Weaknesses analysis
   - Feature comparison
   - Pricing analysis
   - Market positioning
   - Target audience

3. **Analyst Agent**: Create comparison matrices
   - Feature comparison grid
   - Pricing comparison table
   - SWOT analysis
   - Market positioning map

4. **PRD Writer Agent**: Generate insights report
   - Executive summary
   - Detailed findings
   - Strategic recommendations
   - Opportunities identified
   - Competitive advantages

**Example Usage**:
"Compare Notion vs Confluence vs Coda"
"Analyze Linear vs Jira vs Asana"
"Compare Shopify vs WooCommerce vs BigCommerce"`
    },
    configuration: [
      {
        key: 'competitors',
        label: 'Competitors to Analyze',
        type: 'text',
        required: true,
        description: 'Comma-separated list of competitors (e.g., Notion, Linear, Coda)'
      },
      {
        key: 'focus_areas',
        label: 'Focus Areas',
        type: 'text',
        required: false,
        description: 'Specific aspects to analyze (e.g., features, pricing, UX)'
      }
    ],
    roi: 'Save 2-3 days of research. Get comprehensive analysis in 5 minutes.',
    testimonials: [],
    icon: '📊',
    tags: ['pm', 'research', 'competitive-analysis', 'market-research', 'strategy'],
    popularity: 950,
    createdAt: Date.now()
  },

  {
    id: 'pm_sprint_report',
    name: 'Sprint Report Generator',
    category: 'pm',
    description: 'Automatically generate sprint retrospective and progress reports',
    longDescription: 'Pull data from Jira/Linear, analyze sprint performance, and create comprehensive reports with completed stories, blockers, metrics, and next sprint planning.',
    useCase: 'Save 1-2 hours per sprint on reporting. Perfect for weekly updates and stakeholder communication.',
    complexity: 'intermediate',
    estimatedSetupTime: 10,
    requiredIntegrations: ['jira'],
    optionalIntegrations: ['slack', 'notion'],
    workflow: {
      prompt: `Generate comprehensive sprint report:

**Goal**: Create sprint report for [sprint name/number]

**Execution Plan**:
1. **Jira Manager Agent**: Fetch sprint data
   - Get all stories in sprint
   - Fetch completion status
   - Get story points
   - Extract blockers
   - Gather comments

2. **Analyst Agent**: Calculate metrics
   - Completed story points
   - Incomplete story points
   - Velocity calculation
   - Burndown analysis
   - Blocker analysis

3. **PRD Writer Agent**: Generate report
   - Sprint summary
   - Completed stories list
   - Incomplete stories with reasons
   - Blockers identified
   - Team velocity
   - Next sprint goals

4. **Executor Agent** (Optional): Distribute report
   - Post to Slack channel
   - Create Notion page
   - Email stakeholders

**Example Usage**:
"Generate sprint report for Sprint 48"
"Create retrospective for Q4 Sprint 3"`
    },
    configuration: [
      {
        key: 'sprint_id',
        label: 'Sprint ID or Name',
        type: 'text',
        required: true,
        description: 'Jira sprint ID or name'
      },
      {
        key: 'include_recommendations',
        label: 'Include Recommendations',
        type: 'select',
        required: false,
        description: 'AI-generated recommendations for next sprint',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ],
    roi: '1-2 hours saved per sprint. Consistent, data-driven reporting.',
    testimonials: [],
    icon: '📈',
    tags: ['pm', 'sprint', 'reporting', 'jira', 'metrics', 'retrospective'],
    popularity: 800,
    createdAt: Date.now()
  },

  {
    id: 'pm_user_feedback_analyzer',
    name: 'User Feedback Analyzer',
    category: 'pm',
    description: 'Automatically analyze user feedback, extract insights, and create actionable tasks',
    longDescription: 'Upload customer feedback, support tickets, user interviews, or survey results. AI extracts patterns, prioritizes issues, generates insights, and creates Jira tickets automatically.',
    useCase: 'Turn unstructured feedback into actionable product improvements. Perfect for customer-driven development.',
    complexity: 'intermediate',
    estimatedSetupTime: 5,
    requiredIntegrations: [],
    optionalIntegrations: ['jira', 'notion'],
    workflow: {
      prompt: `Analyze user feedback and extract insights:

**Goal**: Process and analyze user feedback from [source]

**Execution Plan**:
1. **Analyst Agent**: Process feedback data
   - Parse uploaded documents
   - Extract key themes
   - Identify pain points
   - Categorize feedback
   - Prioritize issues

2. **Analyst Agent**: Generate insights
   - Common complaints
   - Feature requests frequency
   - User sentiment analysis
   - Impact assessment
   - Urgency scoring

3. **PRD Writer Agent**: Create recommendations
   - Top 5 issues to address
   - Feature recommendations
   - UX improvements needed
   - Technical debt identified

4. **Jira Manager Agent** (Optional): Create tickets
   - Generate bug tickets
   - Create feature request epics
   - Add to backlog with priority

**Example Usage**:
"Analyze customer support tickets from last month"
"Process user interview transcripts"
"Extract insights from NPS survey responses"`
    },
    configuration: [
      {
        key: 'feedback_source',
        label: 'Feedback Source',
        type: 'text',
        required: true,
        description: 'Where is the feedback from? (e.g., support tickets, interviews, surveys)'
      },
      {
        key: 'create_jira_tickets',
        label: 'Auto-create Jira Tickets',
        type: 'select',
        required: false,
        description: 'Automatically create tickets for top issues',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ],
    roi: 'Save 3-5 hours analyzing feedback. Never miss important user insights.',
    testimonials: [],
    icon: '💬',
    tags: ['pm', 'feedback', 'user-research', 'insights', 'analysis'],
    popularity: 750,
    createdAt: Date.now()
  },

  {
    id: 'pm_feature_prioritization',
    name: 'Feature Prioritization Framework',
    category: 'pm',
    description: 'AI-powered feature prioritization using multiple frameworks (RICE, WSJF, ICE)',
    longDescription: 'Input your feature backlog and AI automatically scores each feature using multiple prioritization frameworks, considers dependencies, and generates a recommended priority order with justification.',
    useCase: 'Make data-driven prioritization decisions. Perfect for roadmap planning and quarterly planning.',
    complexity: 'intermediate',
    estimatedSetupTime: 10,
    requiredIntegrations: [],
    optionalIntegrations: ['jira', 'notion'],
    workflow: {
      prompt: `Prioritize features using AI:

**Goal**: Prioritize [number] features in the backlog

**Execution Plan**:
1. **Analyst Agent**: Score features
   - RICE scoring (Reach, Impact, Confidence, Effort)
   - WSJF scoring (Weighted Shortest Job First)
   - ICE scoring (Impact, Confidence, Ease)
   - Value vs Effort matrix

2. **Research Agent**: Gather context
   - Market demand analysis
   - Competitive landscape
   - Technical dependencies

3. **Analyst Agent**: Generate recommendations
   - Recommended priority order
   - Justification for each ranking
   - Risk assessment
   - Resource requirements

4. **PRD Writer Agent**: Create prioritization report
   - Executive summary
   - Detailed scoring matrix
   - Recommendations
   - Next steps

**Example Usage**:
"Prioritize Q1 2025 feature backlog"
"Score and rank 15 feature requests"`
    },
    configuration: [
      {
        key: 'features_list',
        label: 'Features to Prioritize',
        type: 'text',
        required: true,
        description: 'List features (one per line or comma-separated)'
      },
      {
        key: 'framework',
        label: 'Prioritization Framework',
        type: 'select',
        required: false,
        description: 'Choose framework or use all',
        options: [
          { label: 'All Frameworks', value: 'all' },
          { label: 'RICE', value: 'rice' },
          { label: 'WSJF', value: 'wsjf' },
          { label: 'ICE', value: 'ice' }
        ]
      }
    ],
    roi: 'Make confident prioritization decisions in 30 minutes vs days of debate.',
    testimonials: [],
    icon: '🎯',
    tags: ['pm', 'prioritization', 'roadmap', 'planning', 'strategy'],
    popularity: 700,
    createdAt: Date.now()
  },

  {
    id: 'pm_market_research',
    name: 'Market Research Report',
    category: 'pm',
    description: 'Comprehensive market research with TAM/SAM/SOM analysis and opportunity assessment',
    longDescription: 'AI conducts market research, analyzes market size, identifies trends, evaluates opportunities, and generates professional market research reports with strategic recommendations.',
    useCase: 'Perfect for new market entry, product launches, investor decks, and strategic planning.',
    complexity: 'advanced',
    estimatedSetupTime: 15,
    requiredIntegrations: [],
    optionalIntegrations: ['notion', 'google-docs'],
    workflow: {
      prompt: `Conduct comprehensive market research:

**Goal**: Research market for [product/industry]

**Execution Plan**:
1. **Research Agent**: Market size analysis
   - TAM (Total Addressable Market)
   - SAM (Serviceable Addressable Market)
   - SOM (Serviceable Obtainable Market)
   - Growth rates

2. **Research Agent**: Trend analysis
   - Industry trends
   - Technology trends
   - Customer behavior trends
   - Regulatory landscape

3. **Research Agent**: Competitive landscape
   - Key players
   - Market share analysis
   - Positioning strategies

4. **Analyst Agent**: Opportunity assessment
   - Market gaps identified
   - Customer pain points
   - Untapped segments
   - Strategic opportunities

5. **PRD Writer Agent**: Generate report
   - Executive summary
   - Market overview
   - Competitive analysis
   - Opportunities & recommendations

**Example Usage**:
"Research AI automation tools market"
"Analyze ed-tech market for K-12 segment"`
    },
    configuration: [
      {
        key: 'market_or_industry',
        label: 'Market/Industry',
        type: 'text',
        required: true,
        description: 'What market or industry to research?'
      },
      {
        key: 'geographic_focus',
        label: 'Geographic Focus',
        type: 'text',
        required: false,
        description: 'Focus region (e.g., North America, Global, APAC)'
      }
    ],
    roi: 'Professional market research in hours vs weeks. Perfect for pitches and planning.',
    testimonials: [],
    icon: '🌍',
    tags: ['pm', 'market-research', 'strategy', 'tam-sam-som', 'opportunity'],
    popularity: 650,
    createdAt: Date.now()
  }
];

// Combine with existing templates
export function getAllPMTemplates(): BusinessTemplate[] {
  return PM_TEMPLATES;
}

// Get template by ID
export function getPMTemplateById(id: string): BusinessTemplate | undefined {
  return PM_TEMPLATES.find(t => t.id === id);
}

// Get templates by category
export function getPMTemplatesByCategory(category: string): BusinessTemplate[] {
  return PM_TEMPLATES.filter(t => t.category === category);
}
