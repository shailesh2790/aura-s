# PRD Workflow Implementation

## Overview

Implemented Anthropic's **Prompt Chaining** pattern for automated PRD (Product Requirements Document) generation. This is the first production workflow following the Anthropic agent engineering principles.

## Pattern: Prompt Chaining

Sequential steps with programmatic validation gates between stages.

```
Extract → Generate Stories → Generate Metrics → Generate Technical → Write PRD
```

## Implementation Details

### File Structure

```
services/workflows/prdWorkflow.ts - Core workflow logic
components/PRDGenerator.tsx       - UI component
```

### Workflow Steps

#### 1. Extract Entities (`extractEntities`)
**Purpose:** Parse feature name, target users, and problem statement from raw user intent

**Implementation:**
- Uses regex pattern matching (NO LLM yet - following "start simple" principle)
- Extracts feature name, target users, problem statement
- Returns confidence score (0.6-0.9)

**Validation Gate:**
- Must extract feature_name (throws error if missing)

**Event Emission:**
- `step.started` (step_id: 'extract')
- `step.completed` (step_id: 'extract')

#### 2. Generate User Stories (`generateUserStories`)
**Purpose:** Create 5 user stories from templates

**Implementation:**
- Template-based generation: "As a [user], I want to [feature] so that I can [problem]"
- Generates 5 variations (use, real-time, configure, share, track)

**Validation Gate:**
- Minimum 3 stories required (throws error if <3)

**Event Emission:**
- `step.started` (step_id: 'stories')
- `step.completed` (step_id: 'stories', output: { count })

#### 3. Generate Success Metrics (`generateSuccessMetrics`)
**Purpose:** Define 5 measurable success criteria

**Implementation:**
- Template-based metrics with feature name interpolation
- Covers: completion rate, time, satisfaction, adoption, error rate

**Event Emission:**
- `step.started` (step_id: 'metrics')
- `step.completed` (step_id: 'metrics', output: { count })

#### 4. Generate Technical Considerations (`generateTechnicalConsiderations`)
**Purpose:** Outline 6 technical requirements

**Implementation:**
- Template-based technical requirements
- Covers: Frontend, Backend, Database, Performance, Security, Testing

**Event Emission:**
- `step.started` (step_id: 'technical')
- `step.completed` (step_id: 'technical', output: { count })

#### 5. Write PRD (`writePRD`)
**Purpose:** Compile comprehensive PRD document

**Implementation:**
- Assembles all components into PRDContent structure
- Includes: title, problem, users, stories, metrics, technical, timeline, constraints

**Validation Gate:**
- All required sections must be present and non-empty
- Validates: title, problem, user_stories, success_metrics, technical_considerations

**Event Emission:**
- `step.started` (step_id: 'write')
- `step.completed` (step_id: 'write', output: { sections })

### Orchestration (`generatePRD`)

**Entry Point:** `async function generatePRD(intent: Intent): Promise<Artifact>`

**Flow:**
1. Generate run_id
2. Emit `run.started` with full plan (DAG with 5 nodes)
3. Execute steps sequentially (no parallelization in v1)
4. Create Artifact with verification
5. Emit `artifact.created`
6. Emit `run.completed` with duration and cost
7. Return artifact

**Error Handling:**
- Try/catch wrapper around entire execution
- Emits `run.failed` event on any error
- Includes error code, message, recoverable flag

### Artifact Structure

```typescript
{
  id: string,
  run_id: string,
  type: 'prd',
  content: PRDContent,
  hash: string,
  verification: {
    status: 'passed',
    score: 85,
    checks: [
      { type: 'schema', name: 'Required sections', passed: true, score: 100 },
      { type: 'schema', name: 'User stories count', passed: true, score: 100 },
      { type: 'schema', name: 'Success metrics', passed: true, score: 100 }
    ]
  },
  provenance: {
    evidence_ids: [],
    tool_calls: [],
    input_artifact_ids: [],
    memory_context: []
  },
  created_at: number
}
```

## UI Component (`PRDGenerator.tsx`)

### Features

1. **Intent Input**
   - Textarea for feature description
   - Placeholder guidance
   - Error display

2. **Plan Preview**
   - Shows all 5 steps before execution
   - Displays estimated duration for each step
   - Total time: ~150ms
   - Transparency principle: User sees the plan before running

3. **Execution States**
   - `idle` - Waiting for input
   - `planning` - Showing plan (currently auto-shows)
   - `executing` - Running workflow with loading spinner
   - `completed` - Success state with PRD output
   - `failed` - Error state with retry option

4. **Success View**
   - Emerald banner with quality score
   - Formatted PRD output (monospace, pre-wrapped)
   - Copy to clipboard button
   - Verification details with per-check breakdown
   - Event timeline (real-time execution log)

5. **Design System**
   - White background (bg-white)
   - Slate grays for text hierarchy (slate-900/600/500)
   - Emerald-600 for success states
   - Red-600 for errors
   - Clean borders (slate-200)
   - Subtle shadows (shadow-sm)

### User Flow

1. User navigates to "PRD Generator" in sidebar
2. User enters feature idea in textarea
3. User sees execution plan preview
4. User clicks "Generate PRD"
5. Loading state shows (~150ms)
6. Success banner appears
7. User sees formatted PRD
8. User can copy to clipboard
9. User can view verification details
10. User can view event timeline
11. User can click "New PRD" to reset

## Success Criteria

### Completeness: 95%+
- All required sections present
- Validated via schema checks in `writePRD()`

### Quality Score: 85/100
- Currently hardcoded (will add LLM evaluator in Week 3)
- Based on section presence and count

### Execution Time: <2 minutes
- Current implementation: ~150ms (all synchronous template generation)
- Well under target

## Anthropic Principles Applied

### ✅ Start Simple
- NO LLM calls yet (regex + templates only)
- Validates core workflow before adding complexity

### ✅ Transparency
- Plan preview shows all steps before execution
- Real-time event timeline
- Verification details exposed

### ✅ Workflows-First
- 100% workflow (sequential steps)
- 0% agent (no autonomous decision-making yet)

### ✅ Measure Everything
- Events emitted at every step
- Duration tracking
- Quality scoring
- Success criteria defined

### ✅ Validation Gates
- Feature name extraction required
- Minimum 3 user stories
- All required PRD sections

## Next Steps (Week 2)

### 1. Add LLM Calls
Replace regex/templates with Claude Sonnet 4.5:
- `extractEntities()` → Use LLM to parse intent
- `generateUserStories()` → Use LLM with few-shot examples
- `generateSuccessMetrics()` → Use LLM with context
- `generateTechnicalConsiderations()` → Use LLM with tech stack context

### 2. Add Competitive Research Step
Insert between Extract and Stories:
```
Extract → Research Competitors → Generate Stories → ...
```

### 3. Add Real Verification
Replace hardcoded score with LLM evaluator:
- Schema validation (required sections)
- Completeness check (all fields populated)
- Quality scoring (LLM reads PRD, rates 0-100)

### 4. User Testing
- Get 3 PM test sessions
- Measure baseline (manual PRD time: 4-8 hours)
- Compare AURA results
- Collect feedback

### 5. Memory Integration
- Store user preferences (PM style: detailed vs concise)
- Store successful patterns
- Use memory context in LLM calls

## Migration Path

### Current (Week 1): Template-Based
```typescript
const stories = [
  `As a ${user}, I want to ${feature}...`,
  // ... hardcoded templates
];
```

### Future (Week 2): LLM-Based
```typescript
const stories = await llm.generate({
  model: 'claude-sonnet-4.5',
  prompt: `Generate 5 user stories for: ${feature}

  Context: ${entities}
  Examples: ${fewShotExamples}

  Format: "As a [user], I want to [action] so that [benefit]"`,
  max_tokens: 500
});
```

## File Locations

- **Workflow Logic:** [services/workflows/prdWorkflow.ts](../services/workflows/prdWorkflow.ts)
- **UI Component:** [components/PRDGenerator.tsx](../components/PRDGenerator.tsx)
- **Types:** [types/advanced.ts](../types/advanced.ts)
- **Event Store:** [services/runtime/eventStore.ts](../services/runtime/eventStore.ts)

## Testing

### Manual Testing
1. Navigate to http://localhost:3000
2. Click "PRD Generator" in sidebar
3. Enter: "AI-powered search for documentation"
4. Click "Generate PRD"
5. Verify PRD output includes all sections
6. Check event timeline shows 5 steps

### Expected Output
```markdown
# Product Requirements Document: AI-powered search

## Problem Statement
Enable AI-powered search

## Target Users
- End users

## User Stories
1. As a End users, I want to ai-powered search so that I can enable ai-powered search
2. As a End users, I want to see the results of ai-powered search in real-time
3. As a End users, I want to configure ai-powered search settings to match my preferences
4. As a End users, I want to share ai-powered search results with my team
5. As a End users, I want to track the performance of ai-powered search

## Success Metrics
- 90%+ of users successfully complete ai-powered search within first session
- Average task completion time < 2 minutes
- User satisfaction score ≥ 4.5/5.0
- Feature adoption rate > 60% within 30 days
- <5% error rate during ai-powered search operations

## Technical Considerations
- **Frontend**: React components with TypeScript for type safety
- **Backend**: RESTful API endpoints for ai-powered search operations
- **Database**: Schema design for ai-powered search data persistence
- **Performance**: Response time < 200ms for ai-powered search queries
- **Security**: Input validation and authentication for ai-powered search access
- **Testing**: Unit tests (80%+ coverage) and E2E tests for critical paths

## Timeline
6-8 weeks (detailed breakdown TBD)

---
*Generated by AURA OS PRD Autopilot*
*Workflow: Prompt Chaining (Anthropic Pattern)*
```

---

**Status:** ✅ Implemented (Week 1 Complete)
**Last Updated:** December 26, 2025
