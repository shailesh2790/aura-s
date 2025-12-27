# Proactive Agents with Long-Term Memory - AURA OS Design

**Based on:** "Memory in the Age of AI Agents" (arXiv:2512.13564)
**Date:** December 27, 2025

---

## Executive Summary

This document outlines the architecture for transforming AURA OS agents from reactive to proactive systems with sophisticated long-term memory capabilities, based on cutting-edge research from the paper "Memory in the Age of AI Agents."

**Key Improvements:**
- ✅ Multi-layer memory system (Token-level, Experiential, Working)
- ✅ Proactive behavior through reflection and planning
- ✅ Self-evolving capabilities via experience synthesis
- ✅ Temporal reasoning with timeline-based organization
- ✅ Memory consolidation and selective forgetting

---

## 1. Research Insights Summary

### Paper: "Memory in the Age of AI Agents"

**Authors:** Yuyang Hu, Shichun Liu, and 45 co-authors (Dec 2025)
**ArXiv:** https://arxiv.org/abs/2512.13564
**GitHub:** https://github.com/Shichun-Liu/Agent-Memory-Paper-List

### Three-Dimensional Memory Framework

#### A. Forms (Storage Medium)
1. **Token-level Memory** - Explicit, discrete storage in databases
2. **Parametric Memory** - Implicit knowledge in model weights
3. **Latent Memory** - Hidden state representations

#### B. Functions (Purpose)
1. **Factual Memory** - Knowledge retention (facts, rules, entities)
2. **Experiential Memory** - Skills and insights from interactions
3. **Working Memory** - Active context during task execution

#### C. Dynamics (Lifecycle)
1. **Formation** - Memory extraction and encoding
2. **Evolution** - Consolidation and selective forgetting
3. **Retrieval** - Access and activation strategies

---

## 2. Current AURA OS Architecture

### Existing Memory System (Limited)

**Location:** `services/runtime/memoryService.ts`

**Current Capabilities:**
- ✅ 4-layer scoping (User → Org → Project → Run)
- ✅ Event-based memory formation
- ✅ Basic key-value storage
- ❌ No long-term consolidation
- ❌ No reflection mechanisms
- ❌ No proactive behavior
- ❌ No experience synthesis
- ❌ No selective forgetting

**Current Structure:**
```typescript
interface MemoryLayer {
  scope: 'user' | 'org' | 'project' | 'run';
  values: Map<string, any>;
  timestamp: Date;
}
```

---

## 3. Proposed Proactive Agent Architecture

### 3.1 Enhanced Memory System

#### Three-Layer Memory Architecture

```typescript
// Token-Level Memory (Factual)
interface FactualMemory {
  id: string;
  type: 'fact' | 'rule' | 'entity' | 'relation';
  content: string;
  source: string;
  confidence: number;
  timestamp: Date;
  tags: string[];
  embeddings?: number[];
}

// Experiential Memory (Skills & Insights)
interface ExperientialMemory {
  id: string;
  type: 'success' | 'failure' | 'pattern' | 'lesson';
  context: string;
  action: string;
  outcome: string;
  reflection: string;
  learnedSkills: string[];
  timestamp: Date;
  importance: number; // 0-1 for selective retention
}

// Working Memory (Active Context)
interface WorkingMemory {
  currentGoal: string;
  activeContext: Map<string, any>;
  recentEvents: Event[];
  attention: string[]; // What to focus on
  planningState: {
    hypothesis: string[];
    nextActions: string[];
    uncertainties: string[];
  };
}
```

### 3.2 Memory Dynamics

#### A. Formation - Memory Extraction

**When:** After each agent run, user interaction, or task completion

```typescript
class MemoryFormationEngine {
  async extractMemories(runId: string): Promise<void> {
    const events = await eventStore.getRunEvents(runId);

    // Extract factual memories
    const facts = await this.extractFacts(events);
    await this.storeFactualMemories(facts);

    // Synthesize experiential memories
    const experiences = await this.synthesizeExperiences(events);
    await this.storeExperientialMemories(experiences);

    // Update working memory
    await this.updateWorkingMemory(events);
  }

  private async synthesizeExperiences(events: Event[]): Promise<ExperientialMemory[]> {
    // Use LLM to reflect on what worked/didn't work
    const prompt = `
    Analyze these agent events and extract key learnings:
    ${JSON.stringify(events, null, 2)}

    For each significant pattern, provide:
    1. What action was taken
    2. What outcome resulted
    3. Why it worked or failed
    4. What skill or insight was gained
    `;

    const reflection = await this.callLLM(prompt);
    return this.parseReflection(reflection);
  }
}
```

#### B. Evolution - Consolidation & Forgetting

**Pattern:** Hierarchical consolidation with importance scoring

```typescript
class MemoryEvolutionEngine {
  async consolidateMemories(): Promise<void> {
    // 1. Merge similar memories
    await this.mergeSimilarExperiences();

    // 2. Abstract patterns from multiple experiences
    await this.abstractPatterns();

    // 3. Selective forgetting (low importance + old)
    await this.pruneMemories();
  }

  private async abstractPatterns(): Promise<void> {
    const experiences = await this.getRecentExperiences(100);

    // Cluster similar experiences
    const clusters = await this.clusterExperiences(experiences);

    // For each cluster, extract meta-pattern
    for (const cluster of clusters) {
      const pattern = await this.extractPattern(cluster);

      await this.storeFactualMemory({
        type: 'rule',
        content: pattern.rule,
        confidence: pattern.confidence,
        source: 'consolidated_experience'
      });
    }
  }

  private async pruneMemories(): Promise<void> {
    const threshold = 0.3; // Importance threshold
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Remove low-importance old memories
    await this.deleteMemories({
      importance: { $lt: threshold },
      timestamp: { $lt: Date.now() - maxAge }
    });
  }
}
```

#### C. Retrieval - Context-Aware Access

**Pattern:** Semantic search + temporal relevance + importance weighting

```typescript
class MemoryRetrievalEngine {
  async retrieveRelevantMemories(
    query: string,
    context: WorkingMemory
  ): Promise<Memory[]> {
    // 1. Semantic search (embeddings)
    const semanticMatches = await this.semanticSearch(query, limit: 20);

    // 2. Temporal relevance boost
    const temporalScored = this.applyTemporalDecay(semanticMatches);

    // 3. Importance weighting
    const importanceScored = this.applyImportanceWeight(temporalScored);

    // 4. Context filtering
    const contextFiltered = this.filterByContext(importanceScored, context);

    return contextFiltered.slice(0, 10); // Top 10
  }

  private applyTemporalDecay(memories: Memory[]): Memory[] {
    const now = Date.now();
    const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days

    return memories.map(m => ({
      ...m,
      score: m.score * Math.exp(-Math.log(2) * (now - m.timestamp) / halfLife)
    }));
  }
}
```

---

## 4. Proactive Agent Behavior

### 4.1 Reflection Loop

**Frequency:** After each significant run or on schedule (daily)

```typescript
class ReflectionEngine {
  async performReflection(): Promise<void> {
    const recentRuns = await this.getRecentRuns(24 * 60 * 60 * 1000); // 24h

    const reflectionPrompt = `
    Reflect on your recent activities:

    Runs completed: ${recentRuns.length}
    Success rate: ${this.calculateSuccessRate(recentRuns)}

    Recent experiences:
    ${await this.getRecentExperiences()}

    Questions to reflect on:
    1. What patterns do you notice in successful vs failed runs?
    2. What new skills have you developed?
    3. What mistakes are you repeating?
    4. What should you do differently tomorrow?
    5. What proactive actions should you take?
    `;

    const reflection = await this.callLLM(reflectionPrompt);

    // Store reflection as experiential memory
    await this.storeReflection(reflection);

    // Generate proactive action plan
    await this.generateProactivePlan(reflection);
  }
}
```

### 4.2 Proactive Planning

**Pattern:** Goal-based autonomous action generation

```typescript
class ProactivePlanningEngine {
  async generateDailyPlan(): Promise<ProactivePlan> {
    // 1. Review user goals and context
    const userGoals = await this.getUserGoals();
    const recentActivity = await this.getRecentActivity();
    const reflections = await this.getRecentReflections();

    // 2. Generate proactive suggestions
    const planPrompt = `
    Based on user goals and recent activity, suggest proactive actions:

    User Goals:
    ${JSON.stringify(userGoals, null, 2)}

    Recent Activity:
    ${recentActivity}

    Your Reflections:
    ${reflections}

    Generate 3-5 proactive actions you should take today to:
    - Help achieve user goals
    - Improve system performance
    - Address recurring issues
    - Learn new skills
    `;

    const plan = await this.callLLM(planPrompt);

    return this.parsePlan(plan);
  }

  async executeProactivePlan(plan: ProactivePlan): Promise<void> {
    for (const action of plan.actions) {
      // Check if action is still relevant
      if (await this.isActionRelevant(action)) {
        await this.executeAction(action);

        // Record outcome for learning
        await this.recordActionOutcome(action);
      }
    }
  }
}
```

### 4.3 Self-Evolution

**Pattern:** Capability expansion through experience

```typescript
class SelfEvolutionEngine {
  async evolvCapabilities(): Promise<void> {
    // 1. Analyze capability gaps
    const gaps = await this.analyzeCapabilityGaps();

    // 2. Synthesize new tools/skills
    for (const gap of gaps) {
      const newSkill = await this.synthesizeSkill(gap);
      await this.addSkill(newSkill);
    }

    // 3. Optimize existing workflows
    const workflows = await this.getFrequentWorkflows();
    for (const workflow of workflows) {
      const optimized = await this.optimizeWorkflow(workflow);
      await this.updateWorkflow(optimized);
    }
  }

  private async analyzeCapabilityGaps(): Promise<CapabilityGap[]> {
    const failures = await this.getRecentFailures();

    const gapPrompt = `
    Analyze these failures and identify missing capabilities:
    ${JSON.stringify(failures, null, 2)}

    For each gap, specify:
    1. What capability is missing
    2. How it would help
    3. How to implement it
    `;

    const analysis = await this.callLLM(gapPrompt);
    return this.parseGaps(analysis);
  }
}
```

---

## 5. Implementation Roadmap

### Phase 1: Enhanced Memory Storage (Week 1-2)

**Tasks:**
1. ✅ Design database schema for three memory types
2. ✅ Implement FactualMemory storage with PostgreSQL
3. ✅ Implement ExperientialMemory with importance scoring
4. ✅ Implement WorkingMemory state management
5. ✅ Add vector embeddings for semantic search (pgvector)

**Files to Create:**
- `services/memory/factualMemory.ts`
- `services/memory/experientialMemory.ts`
- `services/memory/workingMemory.ts`
- `services/memory/vectorStore.ts`

**Supabase Tables:**
```sql
-- Factual Memory
CREATE TABLE factual_memory (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  confidence FLOAT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[],
  embedding vector(1536)
);

-- Experiential Memory
CREATE TABLE experiential_memory (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  context TEXT,
  action TEXT,
  outcome TEXT,
  reflection TEXT,
  learned_skills TEXT[],
  importance FLOAT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Working Memory (session-based, in-memory or Redis)
-- Not stored in Supabase, kept in runtime
```

### Phase 2: Memory Dynamics (Week 3-4)

**Tasks:**
1. ✅ Implement memory formation engine
2. ✅ Implement consolidation engine (runs nightly)
3. ✅ Implement retrieval engine with semantic search
4. ✅ Add temporal decay function
5. ✅ Add selective forgetting mechanism

**Files to Create:**
- `services/memory/formation.ts`
- `services/memory/consolidation.ts`
- `services/memory/retrieval.ts`

### Phase 3: Proactive Behavior (Week 5-6)

**Tasks:**
1. ✅ Implement reflection engine
2. ✅ Implement proactive planning engine
3. ✅ Add autonomous action execution
4. ✅ Add user goal tracking
5. ✅ Add daily planning cron job

**Files to Create:**
- `services/proactive/reflection.ts`
- `services/proactive/planning.ts`
- `services/proactive/execution.ts`

### Phase 4: Self-Evolution (Week 7-8)

**Tasks:**
1. ✅ Implement capability gap analysis
2. ✅ Add skill synthesis mechanism
3. ✅ Add workflow optimization
4. ✅ Add performance tracking dashboard

**Files to Create:**
- `services/evolution/gapAnalysis.ts`
- `services/evolution/skillSynthesis.ts`
- `services/evolution/optimization.ts`

---

## 6. Integration with Existing AURA OS

### 6.1 PRD Workflow Enhancement

**Current:** Template-based PRD generation
**Enhanced:** Memory-informed PRD generation

```typescript
// services/workflows/prdWorkflow.ts - ENHANCED

export async function generatePRD(intent: Intent): Promise<Artifact> {
  const runId = uuidv4();

  // NEW: Retrieve relevant memories
  const relevantMemories = await memoryRetrieval.retrieveRelevantMemories(
    intent.raw,
    workingMemory.current
  );

  // NEW: Check if we've done something similar before
  const pastExperiences = relevantMemories.filter(m => m.type === 'experiential');

  const prompt = `
  Generate a PRD for: ${intent.raw}

  Relevant past experiences:
  ${JSON.stringify(pastExperiences, null, 2)}

  Apply lessons learned from these experiences.
  `;

  const entities = await extractEntities(prompt, runId);
  // ... rest of workflow

  // NEW: Record this run as an experience
  await memoryFormation.recordExperience(runId, {
    context: intent.raw,
    action: 'generate_prd',
    outcome: prd,
    success: true
  });

  return prd;
}
```

### 6.2 Runtime Demo Enhancement

**Current:** Event logging only
**Enhanced:** Event logging + memory formation + reflection

```typescript
// components/RuntimeDemo.tsx - ENHANCED

const handleRunWorkflow = async () => {
  const runId = await runtimeExecutor.run(intent);

  // NEW: After run, form memories
  await memoryFormation.extractMemories(runId);

  // NEW: Periodic reflection (every 5 runs)
  if (runCount % 5 === 0) {
    await reflectionEngine.performReflection();
  }
};
```

### 6.3 Dashboard Enhancement

**New Component:** Proactive Actions Panel

```typescript
// components/ProactivePanel.tsx

export function ProactivePanel() {
  const [suggestions, setSuggestions] = useState<ProactiveAction[]>([]);

  useEffect(() => {
    // Fetch daily proactive suggestions
    const fetchSuggestions = async () => {
      const plan = await proactivePlanning.generateDailyPlan();
      setSuggestions(plan.actions);
    };

    fetchSuggestions();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        Proactive Suggestions
      </h2>
      {suggestions.map(action => (
        <ActionCard key={action.id} action={action} />
      ))}
    </div>
  );
}
```

---

## 7. Success Metrics

### Memory System Health
- **Memory Formation Rate:** Events → Memories conversion %
- **Memory Retention:** % of memories retained after 30 days
- **Retrieval Accuracy:** Relevance score of retrieved memories
- **Consolidation Efficiency:** # patterns extracted / # experiences

### Proactive Behavior
- **Suggestion Acceptance Rate:** % of proactive actions accepted by users
- **Autonomous Success Rate:** % of proactive actions that succeed
- **User Satisfaction:** Rating of proactive suggestions (1-5)

### Self-Evolution
- **Capability Growth:** New skills learned per week
- **Performance Improvement:** Task success rate over time
- **Workflow Efficiency:** Time saved via optimizations

---

## 8. Next Steps

### Immediate Actions (This Week)

1. **Design Supabase Schema** for factual and experiential memory
2. **Implement Basic Memory Formation** after PRD generation
3. **Add Memory Retrieval** to PRD workflow
4. **Create Memory Dashboard** to visualize stored memories

### Short-Term (Next 2 Weeks)

1. **Implement Reflection Engine** (daily runs)
2. **Add Proactive Planning** (morning suggestions)
3. **Integrate Claude API** for memory synthesis

### Long-Term (Next Month)

1. **Full Self-Evolution** system
2. **Multi-agent Memory Sharing** (if multiple agents)
3. **Advanced Consolidation** with graph-based memory

---

## 9. References

### Academic Papers
- [Memory in the Age of AI Agents](https://arxiv.org/abs/2512.13564) - Hu et al., 2025
- [Agent Memory Paper List](https://github.com/Shichun-Liu/Agent-Memory-Paper-List) - Curated research collection

### Implementation Frameworks
- **MemGPT** - OS-like memory management for LLMs
- **HippoRAG** - Neurobiologically inspired long-term memory
- **Mem0** - Production-ready agentic memory

### AURA OS Documentation
- [Anthropic Agent Principles](docs/ANTHROPIC_AGENT_PRINCIPLES_REDESIGN.md)
- [PRD Workflow Implementation](docs/PRD_WORKFLOW_IMPLEMENTATION.md)
- [Runtime System](docs/IMPLEMENTATION_SUMMARY.md)

---

## 10. Conclusion

By implementing this three-dimensional memory framework (Forms, Functions, Dynamics) and proactive behavior patterns, AURA OS will evolve from a reactive workflow automation tool into an intelligent, self-improving agent system that:

✅ **Learns from experience** via experiential memory
✅ **Improves over time** via consolidation and pattern extraction
✅ **Acts proactively** via reflection and planning
✅ **Self-evolves** via capability gap analysis and skill synthesis
✅ **Serves users better** via personalized, context-aware suggestions

This positions AURA OS at the forefront of production agent systems, implementing cutting-edge research from 2025.

---

**Status:** Design Complete - Ready for Implementation
**Priority:** High - Core differentiator for AURA OS
**Timeline:** 8 weeks for full implementation
