# AURA OS → Autonomous PM Platform Transformation

**Vision:** Enable PMs to go from idea to tested workflow/prototype in < 30 minutes without engineers or AI specialists

**Date:** December 28, 2025
**Status:** 🚀 Transformation Plan Ready
**Timeline:** 6 weeks to MVP

---

## 🎯 TRANSFORMATION VISION

### From: Workflow Automation Tool
- Users create workflows manually
- Requires technical knowledge (nodes, APIs, code)
- Reactive execution of predefined steps
- No memory or learning
- Engineer-dependent

### To: Autonomous PM Operating System
- **PM Language Only** - Describe goals in product terms
- **Auto-generated Workflows** - System creates execution plans
- **Multi-Agent Orchestration** - Autonomous task execution
- **Safe Sandbox** - Test without production risk
- **Project Intelligence** - Memory-powered context
- **Engineering Handoff** - Specs ready for implementation

---

## 📊 KEY METRICS & SUCCESS CRITERIA

### Primary Goal
**70%+ of PMs succeed independently in < 30 minutes**

### MVP Success Metrics (Week 6)
- ⏱️ **Time to Test**: < 30 min from idea to tested workflow
- 🎯 **PM Independence**: > 70% succeed without help
- ♻️ **Reusability**: > 50% workflows reused
- 📈 **Retention**: > 40% week-2 retention

### KPIs to Track
1. **PM Time Saved**: 4-8 hours/week
2. **Tasks Automated**: > 60% of PM work
3. **Document Quality**: > 4.5/5 user rating
4. **Agent Runs**: 5-15 runs/PM/day

---

## 🏗️ ARCHITECTURE: 10 CORE SYSTEMS

### System 1: Intent Interpreter 🧠
**Purpose:** Parse PM goals → Structured execution intent

**Input Examples:**
```
"Create a detailed PRD for an AI Tutor module for Class 6-10"
"Analyze Notion vs Linear vs Coda and give summary"
"Convert this PRD into 12 actionable Jira stories"
```

**Output:** Structured Intent Object
```typescript
{
  type: 'workflow' | 'prototype' | 'experiment',
  goal: string,
  tasks: Task[],
  tools: string[],
  agents: string[],
  constraints: string[],
  success_criteria: string[],
  ambiguities: string[] // Questions to clarify
}
```

**Tech Stack:**
- LLM: Claude 3.5 Sonnet for intent classification
- Prompt engineering for task decomposition
- Tool/agent mapping logic

**Files to Create:**
- `services/intent/interpreter.ts`
- `services/intent/parser.ts`
- `services/intent/validator.ts`

---

### System 2: Prompt-to-Workflow Generator ⚡
**Purpose:** Auto-generate execution plans from PM language

**Features:**
- Parse PM goals → Workflow steps
- Auto-assign agents to tasks
- Generate timeline and dependencies
- Plain English plan (no nodes/code)
- Editable via natural language

**Example:**
```
PM Input: "Create PRD for AI Tutor"

Generated Plan:
1. Research competitors (Duolingo, Khan Academy) - Research Agent
2. Extract feature data - Analyst Agent
3. Draft PRD sections - PRD Writer Agent
4. Create user flows - UX Writer Agent
5. Export to Notion - Document Engine
```

**Tech Stack:**
- CrewAI / LangGraph for workflow generation
- DAG builder for task dependencies
- Natural language plan editor

**Files to Create:**
- `services/workflow/generator.ts`
- `services/workflow/planner.ts`
- `services/workflow/editor.ts`

---

### System 3: Workflow Sandbox 🛡️
**Purpose:** Safe execution environment (no production risk)

**Features:**
- Mock APIs (no real system interaction)
- Simulated users and synthetic data
- Time-compressed execution
- Deterministic replay
- Cost-bounded execution
- Zero data leakage

**Safety Guarantees:**
- ✅ No real Jira tickets created (mock mode)
- ✅ No real Slack messages sent (simulation)
- ✅ No production API calls (stubs)
- ✅ Synthetic datasets only
- ✅ Safe loop prevention
- ✅ Automatic rollback on errors

**Files to Create:**
- `services/sandbox/runtime.ts`
- `services/sandbox/mocks.ts`
- `services/sandbox/simulator.ts`

---

### System 4: PM Agent Suite 🤖
**Purpose:** Pre-built specialist agents for PM workflows

#### Agent 1: Research Agent
**Capabilities:**
- Web search (Google/Bing integration)
- Competitive analysis
- Data extraction from websites
- Summarization of research

**Tools:**
- Tavily Search API
- Web scraping (Cheerio/Playwright)
- PDF extraction

#### Agent 2: PRD Writer Agent
**Capabilities:**
- Structured PRD creation
- Section generation (problem, solution, requirements)
- User story writing
- Acceptance criteria definition

**Templates:**
- Problem Statement
- Objectives & KPIs
- Technical Notes
- Success Criteria

#### Agent 3: UX Writer Agent
**Capabilities:**
- User flows
- Interface copy
- Microcopy
- Error messages

#### Agent 4: Analyst Agent
**Capabilities:**
- Data analysis
- Metrics calculation
- Comparison tables
- SWOT analysis

#### Agent 5: Jira Manager Agent
**Capabilities:**
- Epic creation
- User story generation
- Ticket creation (mock/real)
- Backlog grooming

#### Agent 6: Communication Agent
**Capabilities:**
- Slack notifications
- Email drafts
- Status reports
- Stakeholder updates

**Files to Create:**
- `services/agents/research.ts`
- `services/agents/prdWriter.ts`
- `services/agents/uxWriter.ts`
- `services/agents/analyst.ts`
- `services/agents/jiraManager.ts`
- `services/agents/communication.ts`

---

### System 5: Prototype Builder 🎨
**Purpose:** Generate testable prototypes from workflows

**Features:**
- Auto-generate conversational flows
- Handle branching logic
- Log user interactions
- Shareable prototype links
- A/B variant creation

**Output:**
- Interactive prototype URL
- Interaction logs
- User journey visualization

**Tech Stack:**
- React for prototype UI
- State machine for flow logic
- Firebase/Supabase for hosting

**Files to Create:**
- `services/prototype/builder.ts`
- `services/prototype/flowEngine.ts`
- `components/PrototypeRunner.tsx`

---

### System 6: Experiment Engine 🧪
**Purpose:** A/B testing and hypothesis validation

**Features:**
- Auto-define hypothesis
- Create test variants
- Run simulations
- Compare outcomes with metrics
- Winner recommendation

**Workflow:**
1. PM: "Test 3 onboarding variants"
2. System: Generates variants A, B, C
3. System: Simulates 1000 users per variant
4. System: Measures completion rate, time, errors
5. System: Recommends winner with reasoning

**Files to Create:**
- `services/experiment/engine.ts`
- `services/experiment/simulator.ts`
- `services/experiment/evaluator.ts`

---

### System 7: Explainability Engine 💭
**Purpose:** Plain English reasoning (no technical jargon)

**Features:**
- Why plan was chosen
- Why outcome happened
- What failed and why
- What to try next
- Complete learning reports

**Example Output:**
```
Why this plan was chosen:
Your goal required competitive research followed by PRD creation.
I selected the Research Agent because it can search and extract data from competitor websites.
Then the PRD Writer Agent because it follows standard PRD structure.

Why it succeeded:
- Found 3 competitor features (Duolingo gamification, Khan Academy videos)
- Extracted 12 key features
- Generated PRD with all required sections
- Quality score: 4.7/5

What you learned:
- Competitors focus heavily on gamification
- Video content is table stakes
- Personalization is a key differentiator

What to try next:
- Create user flows for the gamification system
- Design A/B test for video vs text explanations
```

**Files to Create:**
- `services/explain/reasoner.ts`
- `services/explain/reporter.ts`

---

### System 8: Enhanced Memory System 🧠
**Purpose:** Project-scoped intelligence with PM context

**Current Features (Phase 2):**
- ✅ Factual memory (facts, rules, preferences)
- ✅ Experiential memory (successes, failures)
- ✅ Working memory (session context)
- ✅ Consolidation (pattern extraction)
- ✅ Retrieval (temporal decay)
- ✅ Reflection (daily analysis)

**Enhancements Needed for PM Platform:**

#### Project-Scoped Memory
```typescript
{
  projectId: string,
  context: {
    product: string, // "AI Tutor for Class 6-10"
    company: string,
    team: string[],
    goals: string[]
  },
  knowledge: {
    prds: Document[],
    competitive_data: CompetitorInfo[],
    user_feedback: Feedback[],
    past_experiments: Experiment[]
  },
  preferences: {
    prd_style: 'detailed' | 'concise',
    tools: string[], // ['Jira', 'Notion', 'Slack']
    communication: 'verbose' | 'brief'
  }
}
```

#### Document Intelligence
- Store and retrieve PRDs
- Version history
- Cross-reference related docs
- Extract key decisions

#### User Preference Learning
- Preferred PRD format
- Communication style
- Tool preferences
- Workflow patterns

**Files to Create:**
- `services/memory/project.ts`
- `services/memory/document.ts`
- `services/memory/preferences.ts`

---

### System 9: Engineering Handoff Generator 📋
**Purpose:** Specs ready for implementation (no re-explanation)

**Output Components:**
1. **Workflow Specification**
   - Step-by-step execution plan
   - Agent assignments
   - Tool integrations required

2. **API Contracts**
   - Endpoint definitions
   - Request/response schemas
   - Authentication requirements

3. **Edge Cases**
   - Failure scenarios
   - Retry logic
   - Error handling

4. **Metrics & Success Criteria**
   - KPIs to track
   - Success thresholds
   - Monitoring requirements

5. **Implementation Notes**
   - Technical considerations
   - Performance requirements
   - Security requirements

**Files to Create:**
- `services/handoff/generator.ts`
- `services/handoff/formatter.ts`

---

### System 10: Integrated Tool Layer 🔌
**Purpose:** OAuth-based connections to PM tools

**Priority Integrations:**

#### Phase 1 (MVP - Week 1-2)
- ✅ Google Search (via Tavily)
- ✅ Web Browser (Playwright)
- 🔄 Notion (OAuth + API)
- 🔄 Google Docs (OAuth + API)

#### Phase 2 (Week 3-4)
- Jira / Linear (OAuth + API)
- Slack (OAuth + Webhooks)
- Email (SMTP/IMAP)

#### Phase 3 (Week 5-6)
- GitHub (OAuth + API)
- Calendar (Google/Outlook)
- Internal APIs (custom connectors)

**Features:**
- OAuth flow for authentication
- Token management and refresh
- Rate limiting and retry logic
- Sandbox mode (mock responses)
- Real mode (production access)

**Files to Create:**
- `services/integrations/notion.ts`
- `services/integrations/googleDocs.ts`
- `services/integrations/jira.ts`
- `services/integrations/slack.ts`
- `services/integrations/github.ts`

---

## 🎯 MVP BUILD PLAN (6 WEEKS)

### Week 1: Foundation Layer
**Goal:** Intent parsing + Basic workflow generation

**Deliverables:**
- [ ] Intent Interpreter (parse PM goals)
- [ ] Task decomposer (break goals into steps)
- [ ] Basic planner (assign agents to tasks)
- [ ] Simple workflow execution

**Key Files:**
- `services/intent/interpreter.ts`
- `services/workflow/planner.ts`
- `services/agents/base.ts`

**Success Criteria:**
- Can parse "Create PRD for X" → structured intent
- Can generate 5-step execution plan
- Can assign Research + PRD agents

---

### Week 2: Agent Suite Foundation
**Goal:** Pre-built PM agents operational

**Deliverables:**
- [ ] Research Agent (web search + extraction)
- [ ] PRD Writer Agent (structured docs)
- [ ] Document Engine (Notion/Google Docs export)
- [ ] Agent orchestration (sequential execution)

**Key Files:**
- `services/agents/research.ts`
- `services/agents/prdWriter.ts`
- `services/document/engine.ts`

**Success Criteria:**
- Research Agent can search and summarize
- PRD Writer can generate structured PRDs
- Can export to Notion/Google Docs

---

### Week 3: Sandbox + Prototype Builder
**Goal:** Safe execution + Testable prototypes

**Deliverables:**
- [ ] Sandbox runtime (mock APIs)
- [ ] Synthetic data generator
- [ ] Prototype Builder (basic flows)
- [ ] Shareable prototype links

**Key Files:**
- `services/sandbox/runtime.ts`
- `services/sandbox/mocks.ts`
- `services/prototype/builder.ts`

**Success Criteria:**
- Can execute workflows without touching production
- Can generate synthetic user data
- Can create shareable prototype URLs

---

### Week 4: Multi-Agent Orchestration
**Goal:** Agents collaborate on complex tasks

**Deliverables:**
- [ ] Shared memory for agents
- [ ] Agent communication bus
- [ ] Automatic retry logic
- [ ] Self-correcting execution
- [ ] Visible reasoning traces

**Key Files:**
- `services/orchestration/crew.ts`
- `services/orchestration/memory.ts`
- `services/orchestration/retry.ts`

**Success Criteria:**
- Research Agent → PRD Writer Agent handoff works
- Agents share context automatically
- Failed steps retry automatically

---

### Week 5: Intelligence Layer
**Goal:** Explainability + Insights + Enhanced memory

**Deliverables:**
- [ ] Explainability Engine (plain English reasoning)
- [ ] Insight Generator (what was learned)
- [ ] Project-scoped memory
- [ ] Document intelligence
- [ ] User preference learning

**Key Files:**
- `services/explain/reasoner.ts`
- `services/memory/project.ts`
- `services/memory/document.ts`

**Success Criteria:**
- Clear explanations of why/how
- Actionable insights generated
- Project context persists across runs

---

### Week 6: Polish + Launch Prep
**Goal:** UX refinement + Demo flows + Documentation

**Deliverables:**
- [ ] PM Command Center UI
- [ ] Real-time status dashboard
- [ ] Project folders view
- [ ] Memory items dashboard
- [ ] Demo workflows (3 scenarios)
- [ ] User documentation

**Key Files:**
- `components/PMCommandCenter.tsx`
- `components/WorkflowDashboard.tsx`
- `components/MemoryDashboard.tsx`

**Success Criteria:**
- End-to-end demo works smoothly
- 3 use cases validated
- Documentation complete

---

## 🔄 TRANSFORMATION PHASES

### Current State: Basic Workflow Tool
- Manual workflow creation
- PRD generator (template-based)
- Event logging
- Basic memory system (Phase 2 complete)

### Phase 1: PM Self-Service (Weeks 1-6) ← **WE ARE HERE**
**Goal:** PMs can create workflows from prompts

**Features:**
- Intent Interpreter
- Auto-workflow generation
- Pre-built PM agents
- Sandbox execution
- Document export

**User Journey:**
1. PM describes goal
2. System generates plan
3. PM edits in plain English
4. System executes in sandbox
5. PM reviews results

---

### Phase 2: Prototype Testing (Weeks 7-12)
**Goal:** PMs can validate ideas with prototypes

**Features:**
- Prototype Builder
- Experiment Engine
- A/B testing
- User simulation
- Metrics dashboard

**User Journey:**
1. PM: "Test 3 onboarding variants"
2. System: Creates prototypes
3. System: Simulates users
4. System: Compares metrics
5. PM: Reviews winner

---

### Phase 3: Autonomous Co-PM (Months 4-6)
**Goal:** System proactively suggests and executes

**Features:**
- Goal-based automation
- KPI monitoring
- Automatic reporting
- Proactive suggestions
- Full autonomy mode

**User Journey:**
1. PM: "Improve retention by 16%"
2. System: Creates strategy
3. System: Executes research
4. System: Runs experiments
5. System: Reports progress weekly

---

## 📐 TECHNICAL ARCHITECTURE

### Frontend (PM Command Center)
```
React (Next.js 14)
├── Pages
│   ├── Dashboard (project overview)
│   ├── Workflow Builder (prompt interface)
│   ├── Agent Runs (execution monitoring)
│   ├── Prototypes (shareable links)
│   ├── Memory (project context)
│   └── Settings (integrations)
├── Components
│   ├── IntentInput (goal entry)
│   ├── PlanEditor (natural language editing)
│   ├── WorkflowVisualization (auto-generated map)
│   ├── AgentStatus (real-time updates)
│   ├── PrototypeViewer (interactive preview)
│   └── InsightPanel (what was learned)
└── Real-time (WebSocket for status updates)
```

### Backend (Autonomous Execution Engine)
```
Node.js + TypeScript
├── Intent Layer
│   ├── Parser (LLM-based)
│   ├── Validator (checks feasibility)
│   └── Decomposer (breaks into tasks)
├── Planning Layer
│   ├── Workflow Generator (creates DAG)
│   ├── Agent Assigner (maps tasks to agents)
│   └── Timeline Estimator (predicts duration)
├── Execution Layer
│   ├── Sandbox Runtime (safe execution)
│   ├── Agent Orchestrator (CrewAI/LangGraph)
│   ├── Tool Router (selects appropriate tools)
│   └── State Manager (tracks progress)
├── Intelligence Layer
│   ├── Memory System (project context)
│   ├── Explainability Engine (reasoning)
│   ├── Insight Generator (learning)
│   └── Preference Learner (personalization)
└── Integration Layer
    ├── Notion/Google Docs
    ├── Jira/Linear
    ├── Slack/Email
    └── Custom APIs
```

### Data Layer
```
PostgreSQL (Supabase)
├── Projects
├── Workflows
├── Runs
├── Steps
├── Artifacts (PRDs, reports, etc.)
├── Metrics
├── Insights
└── Memory (factual, experiential, project)

Vector DB (Pinecone/Chroma)
├── Document embeddings
├── Competitive research
├── Past PRDs
└── User feedback

Redis
├── Session state
├── Agent communication
└── Real-time status
```

---

## 🎨 USER INTERFACE DESIGN

### 1. PM Command Center (Main Dashboard)
```
┌──────────────────────────────────────────────────┐
│  AURA OS - PM Command Center                    │
├──────────────────────────────────────────────────┤
│                                                  │
│  🎯 What would you like to accomplish today?    │
│  ┌────────────────────────────────────────────┐ │
│  │ "Create PRD for AI Tutor module for..."   │ │
│  └────────────────────────────────────────────┘ │
│                                     [Generate]   │
│                                                  │
│  📁 Recent Projects                              │
│  ┌─ AI Tutor PRD              ┌─ Onboarding    │
│  │  Updated 2h ago            │  A/B Test      │
│  │  3 runs                    │  Running...    │
│  └────────────────             └────────────    │
│                                                  │
│  🤖 Active Runs                                  │
│  ✅ Competitive Analysis - Complete              │
│  🔄 PRD Generation - In Progress (Step 3/5)     │
│  ⏸️  Jira Migration - Paused (needs approval)   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 2. Workflow Execution View
```
┌──────────────────────────────────────────────────┐
│  "Create PRD for AI Tutor module"               │
├──────────────────────────────────────────────────┤
│                                                  │
│  📋 Execution Plan (Editable)                    │
│  ┌────────────────────────────────────────────┐ │
│  │ 1. Research competitors (Duolingo, Khan)  │ │
│  │    ✅ Research Agent - Complete (12s)      │ │
│  │                                            │ │
│  │ 2. Extract feature data                   │ │
│  │    ✅ Analyst Agent - Complete (8s)        │ │
│  │                                            │ │
│  │ 3. Draft PRD sections                     │ │
│  │    🔄 PRD Writer Agent - In Progress...    │ │
│  │    Progress: Problem ✅ Solution 🔄        │ │
│  │                                            │ │
│  │ 4. Create user flows                      │ │
│  │    ⏳ UX Writer Agent - Waiting            │ │
│  │                                            │ │
│  │ 5. Export to Notion                       │ │
│  │    ⏳ Document Engine - Waiting            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  💭 Why this plan?                               │
│  Your goal requires competitive research before  │
│  PRD creation. I'm using the Research Agent to   │
│  find proven features, then PRD Writer to create │
│  structured documentation.                       │
│                                                  │
│  [Pause] [Edit Plan] [View Details]             │
└──────────────────────────────────────────────────┘
```

### 3. Results & Insights View
```
┌──────────────────────────────────────────────────┐
│  ✅ PRD Generation Complete (42 seconds)         │
├──────────────────────────────────────────────────┤
│                                                  │
│  📄 Generated Artifact                           │
│  ┌────────────────────────────────────────────┐ │
│  │ AI Tutor Module PRD                        │ │
│  │                                            │ │
│  │ Problem Statement:                         │ │
│  │ Students in grades 6-10 need personalized  │ │
│  │ learning assistance...                     │ │
│  │                                            │ │
│  │ Competitive Analysis:                      │ │
│  │ - Duolingo: Gamification, streaks         │ │
│  │ - Khan Academy: Video explanations        │ │
│  │ ...                                        │ │
│  └────────────────────────────────────────────┘ │
│  [View Full PRD] [Export to Notion] [Edit]      │
│                                                  │
│  💡 What I Learned                               │
│  - Competitors focus on gamification (3/3)      │
│  - Video content is table stakes (2/3)          │
│  - Personalization is key differentiator        │
│                                                  │
│  🎯 Recommended Next Steps                       │
│  1. Create user flows for gamification system   │
│  2. Design A/B test for video vs text           │
│  3. Draft technical requirements for AI engine  │
│                                                  │
│  [Start New Workflow] [Create Prototype]        │
└──────────────────────────────────────────────────┘
```

---

## 🚀 MIGRATION STRATEGY

### Step 1: Keep Existing Features (Week 1)
- ✅ Current PRD Generator stays
- ✅ Current Memory System stays (Phase 2)
- ✅ Current Event Store stays
- Add new Intent Interpreter alongside

### Step 2: Build New PM Interface (Week 2)
- New "PM Command Center" page
- New prompt-based input
- Auto-workflow generation
- Link to existing PRD generator

### Step 3: Integrate Agents (Week 3-4)
- Add Research Agent
- Add PRD Writer Agent (enhanced)
- Add Analyst Agent
- Multi-agent orchestration

### Step 4: Enable Sandbox (Week 5)
- Add sandbox toggle
- Mock integrations
- Safe execution mode

### Step 5: Launch MVP (Week 6)
- Feature flag for PM Platform
- Beta testers only initially
- Gradual rollout

---

## 📦 DELIVERABLES SUMMARY

### Week 1-2 Deliverables
1. Intent Interpreter service
2. Prompt-to-Workflow generator
3. Research Agent
4. Enhanced PRD Writer Agent
5. Document export (Notion/Google Docs)

### Week 3-4 Deliverables
6. Workflow Sandbox
7. Synthetic data generator
8. Prototype Builder
9. Agent orchestration system
10. Shared memory for agents

### Week 5-6 Deliverables
11. Explainability Engine
12. Insight Generator
13. Project-scoped memory
14. PM Command Center UI
15. Demo workflows + Documentation

---

## 🎯 SUCCESS DEFINITION

### MVP is successful if:
1. ✅ 70%+ PMs create first workflow without help
2. ✅ Average time to first result < 30 minutes
3. ✅ 40%+ week-2 retention
4. ✅ 3+ demo scenarios work end-to-end
5. ✅ Document quality rated 4.5+/5

### Ready for V1 if:
1. ✅ 500+ active users
2. ✅ 10+ paid subscriptions
3. ✅ 60%+ of PM tasks automated
4. ✅ 4-8 hours saved per PM per week
5. ✅ Engineering handoffs accepted without re-explanation

---

## 🎬 NEXT IMMEDIATE ACTIONS

1. **Create Intent Interpreter** (2 days)
   - File: `services/intent/interpreter.ts`
   - Test with 10 PM goal examples

2. **Build Prompt-to-Workflow Generator** (3 days)
   - File: `services/workflow/generator.ts`
   - Generate 5-step execution plans

3. **Implement Research Agent** (3 days)
   - File: `services/agents/research.ts`
   - Web search + extraction

4. **Enhance PRD Writer Agent** (2 days)
   - File: `services/agents/prdWriter.ts`
   - Structured PRD generation

5. **Build PM Command Center UI** (3 days)
   - File: `components/PMCommandCenter.tsx`
   - Prompt interface + plan editor

**Total:** 13 days (< 3 weeks for foundation)

---

## 📚 RESOURCES & REFERENCES

### Documents Analyzed
- Aura_OS_Execution_PRD.docx
- Aura_OS_PM_Workflow_Prototype_PRD.docx
- auraosprdnew (extracted)

### Technical References
- CrewAI documentation
- LangGraph tutorials
- Anthropic Claude API docs
- Tavily Search API

### Current Codebase
- Memory System (Phase 2) - READY ✅
- Event Store - READY ✅
- PRD Workflow - ENHANCE 🔄
- Authentication - READY ✅

---

**Status:** 🚀 Ready to begin transformation
**Timeline:** 6 weeks to MVP
**Confidence:** HIGH (90%+)

Let's build the future of PM work! 🎯
