# Intent Interpreter - Quick Start Guide

## ✅ What's Built

The Intent Interpreter is now fully integrated into AURA OS! This is **Week 1, Days 1-2** of the transformation plan.

---

## 🎯 What It Does

Transforms plain English PM goals into structured, executable workflow plans.

**Input (PM Language):**
```
"Create a detailed PRD for an AI Tutor module for Class 6-10"
```

**Output (Structured Intent):**
```typescript
{
  type: "document",
  goal: "Generate a comprehensive PRD for an AI Tutor system",
  tasks: [
    {
      id: "task_1",
      name: "Research competitive AI tutor products",
      agent: "research",
      estimated_duration: 15
    },
    {
      id: "task_2",
      name: "Draft PRD with technical specifications",
      agent: "prd_writer",
      estimated_duration: 20
    }
  ],
  agents: ["research", "prd_writer"],
  tools: ["web_search", "document_generator"],
  success_criteria: [
    "PRD includes market analysis",
    "Technical requirements defined",
    "User flows documented"
  ],
  estimated_duration: 35
}
```

---

## 📁 Files Created

### Core Implementation
- [services/intent/interpreter.ts](services/intent/interpreter.ts) - Main parser using Claude Sonnet 4.5
- [services/intent/examples.ts](services/intent/examples.ts) - 10 example PM goals for testing
- [services/intent/index.ts](services/intent/index.ts) - Exports and utilities

### UI Component
- [components/IntentTester.tsx](components/IntentTester.tsx) - Interactive testing interface

### Configuration
- `.env.local` - Added ANTHROPIC_API_KEY requirement

---

## 🚀 How to Use

### Step 1: Add Your Anthropic API Key

Edit [.env.local](.env.local):

```env
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

**Don't have an API key?**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy and paste into `.env.local`

### Step 2: Restart Dev Server

```bash
# Kill current server (Ctrl+C)
npm run dev
```

### Step 3: Test Intent Interpreter

1. Open http://localhost:3000
2. Click **Brain icon** in left sidebar (Intent Interpreter)
3. Try example goals or enter your own
4. Click "Parse Intent"
5. See structured execution plan

---

## 🎨 Features

### 1. PM Language Input
No technical knowledge required. Just describe what you want in plain English.

**Examples:**
- "Create a detailed PRD for an AI Tutor module for Class 6-10"
- "Analyze Notion vs Linear vs Coda and give me a summary"
- "Design a user onboarding flow with 3 variants to A/B test"
- "Convert this PRD into 12 actionable Jira stories"

### 2. Auto-Generated Tasks
System breaks your goal into 3-7 executable tasks with:
- Task name and description
- Assigned agent (research, prd_writer, ux_writer, analyst, jira_manager, communication)
- Dependencies
- Estimated duration
- Expected outputs

### 3. Ambiguity Detection
If your goal is unclear, the system will ask clarifying questions:
```
⚠️ Questions to Clarify:
1. Which grade level should the AI Tutor target?
2. What subjects should be covered?
3. Should the PRD include technical implementation details?
```

### 4. Confidence Scoring
Every parsed intent includes a confidence score (0-100%):
- **High (80%+)**: Clear goal, ready to execute
- **Medium (60-79%)**: Good understanding, minor ambiguities
- **Low (<60%)**: Needs clarification

### 5. Visual Plan
See your execution plan visually:
- Step-by-step breakdown
- Agent assignments
- Duration estimates
- Success criteria

---

## 🔧 Technical Details

### Supported Agent Types
1. **research** - Web search, competitive analysis, data gathering
2. **prd_writer** - PRD documents, technical specs, feature definitions
3. **ux_writer** - User flows, interface copy, UX documentation
4. **analyst** - Data analysis, metrics, insights, recommendations
5. **jira_manager** - Ticket creation, backlog grooming, sprint planning
6. **communication** - Emails, Slack messages, reports, updates

### Supported Intent Types
- **workflow** - Multi-step process automation
- **prototype** - Conversational flows, mockups, testable demos
- **experiment** - A/B tests, hypothesis validation
- **analysis** - Research, comparison, data analysis
- **document** - PRDs, specs, reports, documentation

### Task Dependencies
Tasks are automatically ordered based on dependencies:
```typescript
[
  { id: "task_1", dependencies: [] },        // Runs first
  { id: "task_2", dependencies: ["task_1"] }, // Runs after task_1
  { id: "task_3", dependencies: ["task_1"] }  // Runs after task_1 (parallel with task_2)
]
```

---

## 📊 Example Use Cases

### 1. PRD Generation
**PM Goal:** "Create a detailed PRD for an AI Tutor module for Class 6-10"

**Generated Plan:**
1. Research competitors (Duolingo, Khan Academy) - Research Agent - 15s
2. Extract feature data - Analyst Agent - 10s
3. Draft PRD sections - PRD Writer Agent - 20s
4. Create user flows - UX Writer Agent - 15s
5. Export to Notion - Communication Agent - 5s

**Total:** ~65 seconds

### 2. Competitive Analysis
**PM Goal:** "Analyze Notion vs Linear vs Coda and give summary"

**Generated Plan:**
1. Research each product - Research Agent - 20s
2. Compare features - Analyst Agent - 15s
3. Generate summary report - Communication Agent - 10s

**Total:** ~45 seconds

### 3. A/B Test Design
**PM Goal:** "Design user onboarding flow with 3 variants to A/B test"

**Generated Plan:**
1. Create base onboarding flow - UX Writer Agent - 15s
2. Generate 3 variants - UX Writer Agent - 20s
3. Set up A/B test parameters - Analyst Agent - 10s
4. Create simulation plan - Analyst Agent - 10s

**Total:** ~55 seconds

---

## 🧪 Testing

### Browser Testing
1. Go to http://localhost:3000
2. Click Brain icon (Intent Interpreter)
3. Use example goals or enter custom goal
4. Verify structured output

### Programmatic Testing
```typescript
import { parseIntent } from './services/intent';

const intent = await parseIntent("Create PRD for mobile checkout flow");

console.log(intent.goal);
console.log(intent.tasks);
console.log(intent.estimated_duration);
```

### Run All Examples
```typescript
import { testAllExamples } from './services/intent';

const results = await testAllExamples();
// Tests 10 example goals and reports success rate
```

---

## 🔗 What's Next

The Intent Interpreter is **complete**. Next up (Week 1, Days 3-4):

### Prompt-to-Workflow Generator
Will convert parsed intent → actual executable workflow:
- Generate LangGraph code
- Create agent configurations
- Set up tool connections
- Define state management

**Files to create:**
- `services/workflow/generator.ts` - Workflow code generator
- `services/workflow/orchestrator.ts` - Multi-agent coordination
- `components/WorkflowBuilder.tsx` - Visual workflow editor

---

## 📚 Documentation References

- **Transformation Roadmap:** [docs/PM_PLATFORM_TRANSFORMATION.md](docs/PM_PLATFORM_TRANSFORMATION.md)
- **Start Guide:** [TRANSFORMATION_START.md](TRANSFORMATION_START.md)
- **Implementation Status:** [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

## 💡 Key Insights

### Why This Matters
The Intent Interpreter is the **foundation** of the autonomous PM platform. It enables:

1. **PM Language Only** - No technical jargon, nodes, or code
2. **Auto-Planning** - System designs the execution strategy
3. **Intelligent Decomposition** - Breaks complex goals into tasks
4. **Agent Assignment** - Automatically assigns specialist agents
5. **Validation** - Catches ambiguities before execution

### The Magic
Before: PMs had to manually create workflows, assign agents, configure tools, and design execution plans.

After: PM types goal → System plans everything → PM approves → System executes.

**This is the operating system for PM work.**

---

## ✅ Completion Checklist

- [x] Intent parsing with Claude Sonnet 4.5
- [x] Task decomposition
- [x] Agent assignment logic
- [x] Dependency resolution
- [x] Confidence scoring
- [x] Ambiguity detection
- [x] Visual UI component
- [x] 10 example goals
- [x] Testing utilities
- [x] Navigation integration
- [x] Documentation

**Status:** ✅ Week 1, Days 1-2 Complete

**Next:** Build Prompt-to-Workflow Generator (Week 1, Days 3-4)
