# AURA OS: Architecture Deep-Dive & Build Plan

**Executive Summary (1 Page)**

AURA OS targets a $10B+ TAB: Product Managers spending 60% of time on mechanical work (PRD writing, competitive research, Jira grooming, stakeholder updates). Existing solutions fail:
- **n8n/Zapier**: Node-based workflows require manual DAG construction, brittle integrations, no verification, no memory, no self-healing. PMs can't build complex flows.
- **Agent frameworks (CrewAI/AutoGen)**: Non-deterministic, can't replay, no approval gates, no cost controls, hallucinate outputs, can't debug failures.

**AURA's Core Insight**: Combine workflow engine determinism with agentic autonomy, wrapped in **verification-by-default** and **replayable execution**. PMs state intent ("Create PRD for AI search"); AURA plans (DAG), executes (tools), verifies (evidence), delivers (audited artifact).

**Winning Primitives**:
1. **Plan-First Execution**: Show DAG before running (vs black-box agents)
2. **Evidence Layer**: Every output has proof (API responses, research citations, calculations)
3. **Verification Suites**: Schema validation + LLM quality checks + policy gates
4. **Memory-Native**: Project context persists; no re-explaining Jira structure every run
5. **Replayable Runs**: Exact state reconstruction for debugging
6. **Self-Healing**: Failed steps auto-retry with backoff; entire runs can replan

**MVP Target (6 weeks)**: Ship "PRD Autopilot" - PM enters feature idea, gets publication-ready PRD with competitive research, Jira stories, and exec summary. 99.5% run-start success rate.

**Market Position**: Not "PM tool" (too narrow) or "workflow platform" (too generic). We're **PM Operating System** - the canonical substrate for product work.

---

## Blind Spots Map (12+ Gaps)

| # | Gap | Existing Tool Behavior | User Impact | AURA Primitive | MVP Priority |
|---|-----|----------------------|-------------|----------------|--------------|
| **STATE & MEMORY** |
| 1 | **No Project Context** | n8n: Zero cross-run memory. CrewAI: RAG retrieval brittle, no schemas. | PM re-explains Jira board structure, OKRs, competitors every single run. Wastes 10min/run. | **Memory Service** with scoped layers: User prefs, Org metadata (Jira config), Project context (OKRs, competitors), Run-specific (intermediate artifacts). TTL + versioning. | ✅ Week 2 |
| 2 | **No Artifact Lineage** | Zapier: Outputs disappear into void. AutoGen: Logs are chaos. | "Where did this PRD come from? What research backed section 3?" No audit trail for compliance/review. | **Artifact Store** with provenance graph: artifact → evidence → tool calls → inputs. Immutable, content-addressed. | ✅ Week 3 |
| 3 | **State Explosion** | n8n: Each node stores entire payload. CrewAI: Agent memory grows unbounded. | Runs OOM after 20 steps. Costs spiral. | **Incremental State**: Store only deltas. Steps reference artifacts by hash. LLM context managed via summarization. | ⏳ Week 5 |
| **DETERMINISM & REPRODUCIBILITY** |
| 4 | **Non-Reproducible Runs** | AutoGen: Different outputs every time. n8n: External API changes break silently. | Can't debug failures. "Works on my machine" for automations. | **Run Replay**: Hash inputs + tool calls + LLM responses. Replay mode uses cached responses. Diff viewer shows what changed. | ✅ Week 4 |
| 5 | **Variance Creep** | CrewAI: Temp=0.7 → 30% output variance. No schema enforcement. | PRDs inconsistent format. Jira tickets missing fields. Exec reports unreadable. | **Variance Controls**: LLM schemas (JSON mode), output validators, variance budget (max 2 retries), fallback templates. | ✅ Week 3 |
| 6 | **No Idempotency** | Zapier: Re-run creates duplicate Jira tickets. n8n: Partial failures leave orphaned data. | Manual cleanup hell. Data corruption. | **Idempotency Keys**: Every tool call tagged with `{run_id}_{step_id}_{attempt}`. Jira/Notion dedupe by key. | ✅ Week 2 |
| **VERIFICATION & CORRECTNESS** |
| 7 | **No Output Verification** | All tools: Execute → hope it worked. No quality gates. | Hallucinated research. PRDs missing sections. Jira tickets malformed. Ships broken work. | **Verification Engine**: 3-layer checks: (1) Schema validation, (2) LLM quality (completeness, accuracy), (3) Policy gates (no PII, budget limits). | ✅ Week 3 |
| 8 | **No Approval Gates** | n8n: Workflow pauses but no context. CrewAI: Can't inject human review. | PM can't approve before Jira ticket creation or Slack blast. Risk of embarrassing auto-posts. | **Approval Requests**: Steps marked `require_approval`. Run pauses, PM sees preview + evidence, approves/edits/rejects. | ⏳ Week 5 |
| 9 | **No Evidence Trail** | AutoGen: "I researched X" → no proof. n8n: API response buried in logs. | Can't trust outputs. Compliance nightmare. Reviewers demand "show your work." | **Evidence Attachments**: Every artifact links to: API responses (raw JSON), web scrapes (HTML + screenshot), LLM prompts/completions. Timestamped + signed. | ✅ Week 3 |
| **OBSERVABILITY & DEBUGGING** |
| 10 | **Black Box Failures** | CrewAI: Agents fail silently. n8n: Error node → dead end. | "Run failed" → no idea why. Spend 2 hours debugging. | **Structured Events**: `RunStarted`, `StepPlanned`, `ToolCalled`, `ToolFailed`, `VerificationFailed`, `StepRetried`, `RunCompleted`. Queryable event log. | ✅ Week 1 |
| 11 | **No Time-Travel Debugging** | All tools: Logs are append-only text. No state snapshots. | Can't see "what was context at step 5?" or "why did planner choose this path?" | **Run Snapshots**: Capture state after every step: memory, artifacts, plan DAG, decisions. Debugger UI shows timeline + state viewer. | ⏳ Week 6 |
| 12 | **No Cost Attribution** | AutoGen: Bills spiral. n8n: No per-run cost tracking. | $500 OpenAI bill surprise. Can't tell which workflow costs $$$. | **Cost Ledger**: Track LLM tokens, API calls, compute per run/step. Budget limits (`max_cost: $5`). Alert before exceeding. | ⏳ Week 5 |
| **GOVERNANCE & PERMISSIONS** |
| 13 | **No Policy Engine** | n8n: Binary "can edit workflow". CrewAI: YOLO mode. | Junior PM auto-posts to #general. Deletes prod Jira epics. No guardrails. | **Policy Engine**: Rules like `if tool==jira.delete && env==prod → require_approval`. Checked at plan-time + exec-time. | ⏳ Week 6 |
| 14 | **Credential Sprawl** | Zapier: Creds stored per-connection. n8n: Encrypted but no rotation/audit. | Leaked API keys in logs. No "who accessed what when?" | **Secret Vault**: Centralized creds with: scoped access (user/workspace/project), auto-rotation, audit log, just-in-time provisioning. | ⏳ Post-MVP |
| **INTEGRATION BRITTLENESS & SELF-HEALING** |
| 15 | **Brittle Integrations** | n8n: Jira API changes → workflow breaks. No detection. | PM discovers breakage when run fails. Manual fix required. | **Integration Health**: Periodic schema checks. Auto-migrate to new API versions. Fallback modes (Jira v2 → v3). | ⏳ Post-MVP |
| 16 | **No Self-Healing** | All tools: Retry 3x → fail. No replan. | Transient Slack downtime kills entire run. Must re-run from scratch. | **Healing Strategies**: (1) Exponential backoff, (2) Alternate tools (Slack → email), (3) Replan: Ask planner "Jira failed, what now?". | ⏳ Week 5 |
| **CI/CD FOR AUTOMATIONS** |
| 17 | **No Testing Story** | n8n: Manual test runs. CrewAI: Pray + deploy. | PM changes workflow → breaks prod PRD generation. No safety net. | **Workflow CI**: Synthetic test runs with fixtures. Schema diffs (plan changed?). Cost/time regression tests. | ⏳ Post-MVP |
| 18 | **No Versioning** | Zapier: Edit in-place. n8n: Manual export/import. | Can't rollback bad workflow change. No A/B testing. | **Workflow Versions**: Git-like branching. Deploy flow v2 to 10% traffic. Diff viewer for plan changes. | ⏳ Post-MVP |

---

## AURA Architecture (To Win)

### Components

```
┌──────────────────────────────────────────────────────────────┐
│                         AURA OS                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │   Intent   │ ─→ │  Planner   │ ─→ │  Executor  │        │
│  │   Parser   │    │  (DAG Gen) │    │ (Tool Mgr) │        │
│  └────────────┘    └────────────┘    └────────────┘        │
│         │                 │                  │               │
│         ↓                 ↓                  ↓               │
│  ┌────────────────────────────────────────────────┐         │
│  │            Memory Service (4 Layers)           │         │
│  │  User│Org│Project│Run  (Scoped, TTL, Versioned)│         │
│  └────────────────────────────────────────────────┘         │
│         │                 │                  │               │
│         ↓                 ↓                  ↓               │
│  ┌─────────┐       ┌──────────┐      ┌─────────┐           │
│  │ Policy  │←──────│ Verifier │──────→│ Run     │           │
│  │ Engine  │       │ (3-Layer)│       │ Store   │           │
│  └─────────┘       └──────────┘       └─────────┘           │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│                           ↓                                  │
│              ┌──────────────────────────┐                    │
│              │  Integration Layer       │                    │
│              │  Jira│Notion│Slack│Web  │                    │
│              └──────────────────────────┘                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Intent Parser
- **Input**: Natural language goal ("Create PRD for AI-powered search feature")
- **Output**: Structured intent: `{ type: 'prd_generation', subject: 'AI search', context: {...} }`
- **Tech**: Fine-tuned classifier (Llama 3.3 8B) + prompt template
- **Fallback**: If ambiguous → ask clarifying questions (interactive loop)

#### Planner (DAG Generator)
- **Input**: Structured intent + Memory (project context, past runs)
- **Output**: Execution DAG (steps, dependencies, tools, inputs/outputs)
- **Tech**: LLM chain-of-thought → JSON schema validation
- **Key Features**:
  - Parallel step detection (research competitors while analyzing Jira backlog)
  - Conditional branches (`if competitive_data.length < 3 → research_more`)
  - Approval gates (`before: jira.create_epic → require_approval`)
- **Variance Control**: Plan hashing; detect when re-planning changes >20% of steps

#### Executor (Tool Manager)
- **Input**: DAG + Memory
- **Output**: Artifacts + Evidence
- **Tech**: State machine (pending → running → verifying → completed/failed)
- **Key Features**:
  - Parallel execution (max 5 concurrent)
  - Idempotency (tool call deduplication)
  - Retry with exponential backoff (max 3 attempts)
  - Caching: Tool responses cached by `hash(tool, params)` for 24h
  - Dead letter queue: Failed steps after retries → manual review

#### Verifier (3-Layer Checks)
- **Layer 1: Schema Validation**: Zod schemas for all artifacts
  - PRD must have: `title, problem, objectives, requirements[], user_stories[]`
- **Layer 2: LLM Quality Check**: Prompt GPT-4o-mini
  - "Is this PRD complete? Are requirements specific? Score 0-10"
  - Threshold: 7/10 to pass
- **Layer 3: Policy Gates**: Rules engine
  - `if artifact.contains(PII) → fail`
  - `if cost > $5 → require_approval`
  - `if tool==jira.delete → require_approval`

#### Policy Engine
- **Rules DSL**: YAML-based
  ```yaml
  - name: No prod Jira deletes without approval
    condition: tool == 'jira.delete' AND env == 'production'
    action: require_approval
  - name: Cost limit
    condition: run.cost > 5.00
    action: halt_execution
  ```
- **Enforcement Points**: Plan-time (reject invalid plans) + Exec-time (block tool calls)

#### Memory Service (4-Layer Scoping)
```
User Layer:     PM preferences (writing style, notification prefs)
Org Layer:      Jira workspace URL, Notion DB IDs, team roster
Project Layer:  OKRs, competitor list, product roadmap, past PRDs
Run Layer:      Intermediate artifacts (research results, outlines)
```
- **TTL**: Run (24h), Project (90d), Org/User (∞)
- **Versioning**: Git-like; can query "project context as of 2 weeks ago"
- **Retrieval**: Semantic search (embeddings) + keyword filters

#### Run Store (Event Log)
- **Events**: All run lifecycle events (RunStarted, StepCompleted, ToolCalled, etc.)
- **Storage**: Append-only, immutable
- **Queryability**: SQL-like `SELECT * FROM events WHERE run_id = ? AND type = 'ToolFailed'`
- **Snapshots**: After every step, capture full state (memory, artifacts, plan)
- **Replay**: Given run ID, reconstruct exact state + re-execute with cached responses

#### Integration Layer
- **Connectors**: Jira, Notion, Slack, Google Drive, Web scraping
- **Abstraction**: Unified interface `Tool.call(method, params) → result`
- **Features**:
  - Auto-retry with backoff
  - Rate limiting (Jira: 10 req/s)
  - Schema migration (Jira API v2 → v3 auto-handled)
  - Health checks (ping every 5min, alert if down)
  - Credential injection (from Secret Vault, scoped by workspace)

---

### Data Model

```typescript
// Core Entities
interface Workspace {
  id: string;
  name: string;
  members: User[];
  integrations: Integration[]; // Jira, Notion, etc.
  policies: Policy[];
}

interface Project {
  id: string;
  workspace_id: string;
  name: string; // "iOS App Rewrite"
  context: Memory[]; // OKRs, competitors, roadmap
  runs: Run[];
}

interface Run {
  id: string; // Unique run ID
  project_id: string;
  intent: Intent;
  plan: Plan; // DAG
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  started_at: timestamp;
  completed_at: timestamp;
  cost: number; // USD
  artifacts: Artifact[];
  events: Event[];
  snapshots: Snapshot[]; // State after each step
}

interface Plan {
  steps: Step[];
  dependencies: { [step_id]: step_id[] }; // DAG edges
  hash: string; // Content hash for change detection
}

interface Step {
  id: string; // step_001
  type: 'tool_call' | 'llm_task' | 'approval_gate';
  tool?: string; // jira.create_issue
  params?: object;
  requires_approval?: boolean;
  max_retries: number;
  timeout_seconds: number;
  idempotency_key: string; // {run_id}_{step_id}_{attempt}
  status: 'pending' | 'running' | 'verifying' | 'completed' | 'failed' | 'awaiting_approval';
  attempts: number;
  output?: Artifact;
  evidence?: Evidence[];
}

interface Artifact {
  id: string;
  run_id: string;
  step_id: string;
  type: 'prd' | 'competitive_analysis' | 'jira_epic' | 'slack_message';
  content: object; // Typed per artifact type
  hash: string; // Content-addressed
  created_at: timestamp;
  provenance: {
    evidence_ids: string[];
    tool_calls: ToolCall[];
    inputs: Artifact[]; // What artifacts fed into this?
  };
}

interface Evidence {
  id: string;
  artifact_id: string;
  type: 'api_response' | 'web_scrape' | 'llm_completion' | 'calculation';
  data: object; // Raw API response, HTML, etc.
  timestamp: timestamp;
  signature: string; // HMAC for tamper detection
}

interface Memory {
  id: string;
  scope: 'user' | 'org' | 'project' | 'run';
  scope_id: string;
  key: string; // "competitors", "jira_board_id"
  value: object;
  ttl: timestamp;
  version: number;
}

interface Policy {
  id: string;
  workspace_id: string;
  name: string;
  condition: string; // DSL expression
  action: 'allow' | 'deny' | 'require_approval' | 'notify';
  created_by: User;
}

interface Event {
  id: string;
  run_id: string;
  step_id?: string;
  type: EventType; // See event types below
  timestamp: timestamp;
  data: object;
}

type EventType =
  | 'RunStarted'
  | 'IntentParsed'
  | 'PlanGenerated'
  | 'StepStarted'
  | 'ToolCalled'
  | 'ToolSucceeded'
  | 'ToolFailed'
  | 'StepRetrying'
  | 'VerificationStarted'
  | 'VerificationFailed'
  | 'VerificationPassed'
  | 'StepCompleted'
  | 'ApprovalRequested'
  | 'ApprovalGranted'
  | 'ApprovalRejected'
  | 'RunPaused'
  | 'RunResumed'
  | 'RunCompleted'
  | 'RunFailed'
  | 'CostLimitExceeded'
  | 'PolicyViolation';
```

---

### Execution Semantics

#### Retries
- **Trigger**: Tool call fails (network error, API 500, timeout)
- **Strategy**: Exponential backoff (2s, 4s, 8s)
- **Max Attempts**: 3 per step
- **Idempotency**: Same `idempotency_key` → Jira/Notion dedupe
- **Failure Handling**: After 3 attempts → step status = `failed` → run pauses → notify PM

#### Replan Boundaries
- **When to Replan**:
  - Step fails 3x AND step is marked `allow_replan`
  - External context changes (Jira board restructured)
  - PM edits plan mid-run
- **How**: Planner receives: original intent + partial artifacts + failure reason → generates new DAG
- **Safety**: Show diff (old plan vs new) → require approval before executing new plan

#### Idempotency
- **Mechanism**: Every tool call tagged with `{run_id}_{step_id}_{attempt}`
- **Jira**: Use `idempotency_key` field (custom field)
- **Notion**: Check for existing page with same title + parent (before create)
- **Slack**: Deduplication via `client_msg_id`
- **LLM**: Cached by hash of (prompt, model, temp); reuse completion if cached

#### Caching
- **Tool Responses**: Cache for 24h, keyed by `hash(tool, params)`
  - Example: `jira.search_issues({jql: "project=FOO"})` → cache JSON response
- **LLM Completions**: Cache by `hash(prompt, model, temperature)`
- **Invalidation**: Manual (PM clicks "bust cache") or TTL expiry

#### Dead Letter Queue (DLQ)
- **Purpose**: Steps that failed after max retries
- **Storage**: Separate queue table
- **PM Action**: Review DLQ → retry with edits OR skip step OR cancel run

#### Partial Completion
- **Scenario**: Run completes 8/10 steps, last 2 fail
- **Outcome**: Mark run as `partial_success`, deliver available artifacts
- **PM Options**: Retry failed steps, replan remaining work, or accept partial output

---

### Determinism Strategy

#### 1. Variance Controls
- **LLM Temp**: Default 0.3 (lower = more deterministic)
- **Schemas**: All LLM outputs use JSON mode with Zod schemas
- **Variance Budget**: Max 2 retries if output doesn't match schema
- **Fallback Templates**: If LLM fails, use hardcoded template (PRD outline)

#### 2. Caching Tool Outputs
- **Mechanism**: Before calling tool, check cache by `hash(tool, params)`
- **Hit**: Return cached response (instant, $0)
- **Miss**: Call tool → cache response
- **Replay**: In replay mode, cache is guaranteed hit (exact state reconstruction)

#### 3. Replay
- **Goal**: Given run ID, re-execute with exact same outputs
- **How**:
  1. Fetch all events from run
  2. Rebuild plan from `PlanGenerated` event
  3. For each `ToolCalled` event, return cached response
  4. LLM completions also cached
- **UI**: Replay mode shows "🔁 Replaying" badge; outputs identical to original

#### 4. Diffing
- **Plan Diff**: When replan occurs, show side-by-side:
  ```
  Old Plan         New Plan
  Step 1: Research competitors  [same]
  Step 2: Jira query   [REMOVED]
  Step 3: Draft PRD    Step 2: Draft PRD [MOVED]
  [NEW] Step 3: Validate with team
  ```
- **Artifact Diff**: Text diff for PRDs, JSON diff for structured data

---

## MVP Build Plan (6 Weeks)

**Goal**: Ship "PRD Autopilot" - PM enters feature idea, gets verified PRD + Jira stories in 2-3 minutes.

**Success Criteria**:
- 99.5% run-start success (runs don't crash)
- <5% verification failure rate
- <$2 cost per PRD
- PM can replay any run and get identical output

---

### Week 1: Foundation + Event System

**Deliverables**:
1. ✅ Data model (TypeScript interfaces) + DB schema (Postgres)
2. ✅ Event system: `RunStarted`, `StepStarted`, `ToolCalled`, `ToolFailed`, `StepCompleted`, `RunCompleted`
3. ✅ Run Store: Append-only event log + queryability
4. ✅ Basic Executor: Execute linear plan (no parallelism yet), emit events

**Definition of Done**:
- Can create a Run, execute 3 sequential steps (mock tools), query events by run ID
- Events visible in debug UI (simple table view)

**Risks**:
- Event schema too narrow (can't capture all needed data) → Mitigation: Make `data: object` flexible

**Instrumentation**:
- Metrics: `run_started_count`, `run_completed_count`, `run_failed_count`, `event_write_latency_ms`

---

### Week 2: Memory + Idempotency + Jira Integration

**Deliverables**:
1. ✅ Memory Service: 4-layer scoping (User, Org, Project, Run)
2. ✅ Idempotency: Step hashing + `idempotency_key` injection
3. ✅ Jira integration: `jira.search_issues`, `jira.create_issue`, `jira.create_epic`
4. ✅ Credential vault: Encrypt/decrypt Jira API keys

**Definition of Done**:
- Can store/retrieve project context (e.g., Jira board ID, OKRs)
- Re-running same step doesn't create duplicate Jira tickets
- Jira integration works end-to-end (auth, API call, error handling)

**Risks**:
- Jira API rate limits hit → Mitigation: Implement rate limiter (10 req/s)

**Instrumentation**:
- Metrics: `memory_read_latency_ms`, `jira_api_call_count`, `jira_api_error_rate`

---

### Week 3: Verification Engine + Evidence + Variance Controls

**Deliverables**:
1. ✅ Verifier Layer 1: Schema validation (Zod) for PRD artifact
2. ✅ Verifier Layer 2: LLM quality check (GPT-4o-mini scores PRD 0-10)
3. ✅ Evidence attachments: Link artifacts to tool call responses
4. ✅ Variance controls: LLM JSON mode, retry budget (max 2)

**Definition of Done**:
- PRD with missing sections fails schema validation
- Low-quality PRD (score <7) triggers retry
- Every artifact has provenance (what tool calls produced it)

**Critical Verifiers** (MVP Priority):
1. **PRD Schema Verifier**: Must have title, problem, objectives, requirements[], user_stories[]
2. **Competitive Research Quality**: LLM checks: "Are there ≥3 competitors? Is analysis substantive?"
3. **Jira Ticket Completeness**: Must have summary, description, acceptance_criteria, story_points

**Risks**:
- LLM quality check too slow (>5s) → Mitigation: Use GPT-4o-mini (fast, cheap)

**Instrumentation**:
- Metrics: `verification_pass_rate`, `verification_fail_rate`, `llm_quality_score_avg`

---

### Week 4: Planner + Replay + Intent Parser

**Deliverables**:
1. ✅ Intent Parser: Classify PM input → structured intent (`prd_generation`, `competitive_analysis`)
2. ✅ Planner: LLM generates DAG (steps, dependencies) from intent
3. ✅ Plan hashing: Detect when replan changes >20% of steps
4. ✅ Replay mode: Re-execute run with cached tool responses

**Definition of Done**:
- PM inputs "Create PRD for AI search" → Planner outputs 5-step DAG
- Replaying run ID from Week 3 produces identical PRD
- Plan diff UI shows side-by-side comparison

**Risks**:
- Planner generates invalid DAG (circular deps) → Mitigation: DAG validator (topological sort)

**Instrumentation**:
- Metrics: `plan_generation_latency_ms`, `plan_hash_collision_rate`, `replay_success_rate`

---

### Week 5: Parallel Execution + Self-Healing + Cost Tracking

**Deliverables**:
1. ✅ Parallel step execution (max 5 concurrent)
2. ✅ Retry with exponential backoff (2s, 4s, 8s)
3. ✅ Replan on failure: Planner receives failure reason → generates new DAG
4. ✅ Cost ledger: Track LLM tokens + API calls per run

**Definition of Done**:
- Can execute 3 independent steps in parallel (verify via event timestamps)
- Transient Jira API error triggers retry → succeeds on attempt 2
- Run exceeding $5 budget halts + alerts PM

**Risks**:
- Parallel execution race conditions (shared state) → Mitigation: Immutable artifacts, event-driven coordination

**Instrumentation**:
- Metrics: `parallel_step_count`, `retry_success_rate`, `cost_per_run_avg`, `cost_exceeded_count`

---

### Week 6: E2E PRD Autopilot + Approval Gates + Polish

**Deliverables**:
1. ✅ E2E PRD flow: Intent → Plan → Execute (research + Jira + draft PRD) → Verify → Deliver
2. ✅ Approval gates: PM reviews PRD before Jira epic creation
3. ✅ UI: Run timeline viewer, artifact viewer, plan diff
4. ✅ Synthetic test: Fixture input → assert output PRD matches snapshot

**Definition of Done**:
- PM can generate PRD end-to-end in <3 minutes
- Approval gate pauses run, shows preview, accepts approval/rejection
- 99.5% run-start success on 20 test runs

**Risks**:
- E2E reliability <99.5% → Mitigation: Add more retries, fallback templates

**Instrumentation**:
- Metrics: `e2e_run_success_rate`, `e2e_run_duration_p50/p95`, `approval_grant_rate`

---

## API Event Types (Comprehensive List)

```typescript
// Run Lifecycle
type RunStarted = {
  run_id: string;
  project_id: string;
  intent: Intent;
  timestamp: number;
};

type IntentParsed = {
  run_id: string;
  intent: Intent;
  confidence: number; // 0-1
  timestamp: number;
};

type PlanGenerated = {
  run_id: string;
  plan: Plan;
  plan_hash: string;
  generation_time_ms: number;
  timestamp: number;
};

type PlanDiffGenerated = {
  run_id: string;
  old_plan_hash: string;
  new_plan_hash: string;
  diff: PlanDiff;
  timestamp: number;
};

// Step Lifecycle
type StepStarted = {
  run_id: string;
  step_id: string;
  step_type: string;
  tool?: string;
  attempt: number; // 1, 2, 3...
  timestamp: number;
};

type ToolCalled = {
  run_id: string;
  step_id: string;
  tool: string;
  params: object;
  idempotency_key: string;
  timestamp: number;
};

type ToolSucceeded = {
  run_id: string;
  step_id: string;
  tool: string;
  response: object;
  latency_ms: number;
  cost_usd: number;
  timestamp: number;
};

type ToolFailed = {
  run_id: string;
  step_id: string;
  tool: string;
  error: {
    code: string; // 'network_error', 'api_500', 'timeout'
    message: string;
    retryable: boolean;
  };
  attempt: number;
  timestamp: number;
};

type StepRetrying = {
  run_id: string;
  step_id: string;
  attempt: number;
  backoff_ms: number; // 2000, 4000, 8000
  reason: string;
  timestamp: number;
};

// Verification
type VerificationStarted = {
  run_id: string;
  step_id: string;
  artifact_id: string;
  verifier: 'schema' | 'llm_quality' | 'policy';
  timestamp: number;
};

type VerificationPassed = {
  run_id: string;
  step_id: string;
  artifact_id: string;
  verifier: string;
  details: object; // e.g., { schema_valid: true }
  timestamp: number;
};

type VerificationFailed = {
  run_id: string;
  step_id: string;
  artifact_id: string;
  verifier: string;
  reason: string;
  details: object; // e.g., { missing_fields: ['objectives'] }
  timestamp: number;
};

// Step Completion
type StepCompleted = {
  run_id: string;
  step_id: string;
  artifact_id?: string;
  duration_ms: number;
  cost_usd: number;
  timestamp: number;
};

type StepFailed = {
  run_id: string;
  step_id: string;
  reason: string;
  attempts: number;
  will_replan: boolean;
  timestamp: number;
};

// Approval Flow
type ApprovalRequested = {
  run_id: string;
  step_id: string;
  artifact_preview: object;
  evidence_ids: string[];
  requested_by: 'planner' | 'policy_engine';
  timestamp: number;
};

type ApprovalGranted = {
  run_id: string;
  step_id: string;
  approved_by: string; // user_id
  edits?: object; // PM can edit artifact before approval
  timestamp: number;
};

type ApprovalRejected = {
  run_id: string;
  step_id: string;
  rejected_by: string;
  reason: string;
  will_replan: boolean;
  timestamp: number;
};

// Run Pausing/Resuming
type RunPaused = {
  run_id: string;
  reason: 'awaiting_approval' | 'cost_limit' | 'manual';
  timestamp: number;
};

type RunResumed = {
  run_id: string;
  resumed_by: string;
  timestamp: number;
};

// Run Completion
type RunCompleted = {
  run_id: string;
  status: 'success' | 'partial_success';
  artifacts: Artifact[];
  total_cost_usd: number;
  duration_ms: number;
  timestamp: number;
};

type RunFailed = {
  run_id: string;
  reason: string;
  failed_step_id?: string;
  artifacts: Artifact[]; // Partial artifacts
  total_cost_usd: number;
  timestamp: number;
};

// Policy & Budget
type CostLimitExceeded = {
  run_id: string;
  current_cost_usd: number;
  limit_usd: number;
  action: 'halt' | 'notify';
  timestamp: number;
};

type PolicyViolation = {
  run_id: string;
  step_id: string;
  policy_id: string;
  policy_name: string;
  violation: string;
  action: 'deny' | 'require_approval';
  timestamp: number;
};

// Replay & Debugging
type ReplayStarted = {
  original_run_id: string;
  replay_run_id: string;
  timestamp: number;
};

type ReplayCompleted = {
  original_run_id: string;
  replay_run_id: string;
  artifacts_match: boolean;
  diff?: object;
  timestamp: number;
};
```

---

## Integration Plan (Into AURA OS App)

### Phase 1: Core Services (Weeks 1-2)
1. Create `/services/runtime/` folder:
   - `eventStore.ts` - Event log implementation
   - `memoryService.ts` - 4-layer memory
   - `executor.ts` - Step execution engine
   - `idempotency.ts` - Key generation + deduplication

2. Update existing files:
   - `/services/workflowEngine.ts` - Integrate executor
   - `/types/advanced.ts` - Add Run, Step, Event types

### Phase 2: Verification + Integrations (Week 3)
1. Create `/services/verification/`:
   - `schemaVerifier.ts` - Zod validators
   - `llmQualityChecker.ts` - GPT-4o-mini scorer
   - `policyEngine.ts` - Rules DSL executor

2. Enhance integrations:
   - `/services/integrations/jira.ts` - Add idempotency, health checks
   - `/services/integrations/notion.ts` - Same
   - `/services/integrations/web.ts` - Scraping + caching

### Phase 3: Planner + UI (Weeks 4-6)
1. Create `/services/planning/`:
   - `intentParser.ts` - NL → structured intent
   - `planner.ts` - Intent → DAG
   - `replanEngine.ts` - Failure → new plan

2. Build UI components:
   - `/components/RunTimeline.tsx` - Event timeline viewer
   - `/components/PlanDiffViewer.tsx` - Side-by-side plan comparison
   - `/components/ApprovalGate.tsx` - Artifact preview + approve/reject
   - `/components/ArtifactViewer.tsx` - Show PRD with evidence links

---

## Next Steps (Immediate)

1. **Create `/services/runtime/eventStore.ts`**: Implement append-only event log with Postgres
2. **Update `/types/advanced.ts`**: Add all event types from this doc
3. **Build basic Executor**: Linear step execution with event emission
4. **Integrate into Dashboard**: Show "Recent Runs" with real event data

Want me to start implementing the Event Store and Runtime services now?
