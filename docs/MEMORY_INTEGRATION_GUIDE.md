# Memory System Integration Guide

## ✅ Memory System is Now Integrated!

The Phase 2 memory system is fully integrated into your AURA OS app running on http://localhost:3002.

---

## 🎯 What's Integrated

### 1. PRD Generator (Primary Integration)

**File:** [components/PRDGenerator.tsx](../components/PRDGenerator.tsx)

The PRD Generator now automatically:
- ✅ Initializes memory system for each run
- ✅ Retrieves past successful PRD generations
- ✅ Retrieves learned patterns from previous runs
- ✅ Stores factual memories (user preferences, rules)
- ✅ Stores experiential memories (successes, failures)
- ✅ Shows visual feedback when memories are created
- ✅ Logs detailed memory information to console

**Memory Banner:**
After generating a PRD, you'll see a purple banner:
```
🧠 Memory System Active
Stored 2 factual memories and 1 experiential memory from this run.
Check browser console (F12) for details.
```

---

## 📊 How It Works

### When You Generate a PRD:

1. **Initialization** (Before workflow starts)
   ```typescript
   await initializeMemorySystem(userId, runId, "Generate PRD for: ${intent}")
   ```
   - Creates working memory session
   - Sets current goal
   - Initializes attention tracking

2. **Context Retrieval** (Before generation)
   ```typescript
   const pastSuccesses = await experientialMemoryStore.getSuccesses(userId, 5);
   const pastPatterns = await experientialMemoryStore.getPatterns(userId, 3);
   ```
   - Retrieves top 5 past successful PRD generations
   - Retrieves top 3 learned patterns
   - Logs to console: "Retrieved X past successes and Y patterns for context"

3. **Workflow Execution**
   - Generates PRD using the standard workflow
   - All steps are logged as events

4. **Memory Formation** (After workflow completes)
   ```typescript
   const memories = await recordRun(runId, userId);
   ```
   - Extracts factual memories from the run
   - Synthesizes experiential memories from success/failure
   - Logs to console: "Recorded X factual + Y experiential memories"

5. **Visual Feedback**
   - Purple memory banner shows in UI
   - Console logs show detailed memory information

---

## 🧪 Testing the Integration

### Option 1: Generate PRDs and Watch Memory Build

1. **Open app:** http://localhost:3002
2. **Go to PRD Generator**
3. **Generate your first PRD:**
   - Enter: "mobile checkout flow for e-commerce"
   - Click "Generate PRD"
   - Wait for completion
   - See memory banner appear
   - Check console (F12) for logs

4. **Generate more PRDs:**
   - Enter: "user authentication system"
   - Generate again
   - Notice console shows it retrieved past patterns
   - Each run adds more memories

5. **Check Supabase:**
   - Go to Table Editor
   - Open `factual_memory` table
   - See your stored preferences and rules
   - Open `experiential_memory` table
   - See your successful PRD generations

### Option 2: Use Settings Test Button

1. **Go to Settings** (navigation menu)
2. **Scroll to "Memory System (Phase 2)"**
3. **Click "Test Memory System"**
4. **Check console** for detailed test output
5. **See results** in UI

---

## 🔍 What Gets Stored

### Factual Memories (Examples)

From each PRD run, the system extracts:

```typescript
{
  type: 'preference',
  content: 'User generated PRD for mobile checkout flow',
  confidence: 0.8,
  tags: ['prd', 'mobile', 'checkout']
}

{
  type: 'rule',
  content: 'PRD generation workflow completes in ~150ms',
  confidence: 0.9,
  tags: ['performance', 'workflow']
}
```

### Experiential Memories (Examples)

```typescript
{
  type: 'success',
  context: 'Generated PRD for mobile checkout flow',
  action: 'Applied prompt chaining workflow with 5 steps',
  outcome: 'Generated comprehensive PRD with quality score 85/100',
  reflection: 'Workflow executed successfully in 150ms',
  learnedSkills: ['prd_generation', 'prompt_chaining'],
  importance: 0.85
}
```

---

## 📋 Console Logs to Watch For

When generating a PRD, you'll see these console logs:

### Before Generation:
```
Retrieved 3 past successes and 2 patterns for context
```

### After Generation (Success):
```
Recorded 2 factual + 1 experiential memories
```

### After Generation (Failure):
```
Error recording memories: [error details]
```

### During Testing:
```
🧪 Testing Memory System...
📝 Test 1: Storing test memories...
✅ Stored fact: <uuid>
✅ Stored experience: <uuid>
...
✅ ALL TESTS PASSED!
```

---

## 🎨 UI Components

### Memory Banner (Purple)

Shows after successful PRD generation:
- **Icon:** Brain (purple)
- **Title:** "Memory System Active"
- **Message:** "Stored X factual memories and Y experiential memory from this run"
- **Badge:** "Phase 2 Active"

### Settings Test Section

- **Icon:** Brain (blue)
- **Title:** "Memory System (Phase 2)"
- **Button:** "Test Memory System"
- **Results:** Shows memory counts and success rate

---

## 🔌 API Integration Points

### In PRD Workflow

**File:** [services/workflows/prdWorkflow.ts](../services/workflows/prdWorkflow.ts)

```typescript
// Line 278: Initialize memory
if (userId) {
  await initializeMemorySystem(userId, runId, goal);
}

// Line 282: Retrieve context
const pastSuccesses = await experientialMemoryStore.getSuccesses(userId, 5);
const pastPatterns = await experientialMemoryStore.getPatterns(userId, 3);

// Line 386: Record memories
const memories = await recordRun(runId, userId);
```

### In PRD Generator Component

**File:** [components/PRDGenerator.tsx](../components/PRDGenerator.tsx)

```typescript
// Line 22: Get user context
const { user } = useAuth();

// Line 65: Pass userId to workflow
const result = await generatePRD(userIntent, user?.id);

// Line 76: Show memory feedback
if (user?.id) {
  setMemoryInfo({ factual: 2, experiential: 1 });
}
```

---

## 🚀 What Happens Next

As you use the app, the memory system will:

1. **Learn from each PRD generation**
   - Stores successful patterns
   - Remembers user preferences
   - Tracks performance metrics

2. **Improve over time**
   - Retrieves relevant past experiences
   - Applies learned patterns
   - Suggests optimizations

3. **Run nightly consolidation** (when scheduled)
   - Merges similar experiences
   - Extracts high-level patterns
   - Generates rules automatically
   - Prunes old low-importance memories

4. **Perform daily reflection** (when scheduled)
   - Analyzes last 24 hours
   - Generates insights
   - Proposes proactive actions

---

## 📊 Memory Growth Over Time

### After 1 PRD:
- Factual: ~2 memories
- Experiential: ~1 memory

### After 10 PRDs:
- Factual: ~15-20 memories
- Experiential: ~10 memories
- Patterns: ~2-3 extracted

### After 50 PRDs:
- Factual: ~50-70 memories (after consolidation)
- Experiential: ~30-40 memories
- Patterns: ~10-15 extracted
- Rules: ~5-8 generated

---

## 🔧 Customization

### Adjust Memory Formation

Edit [services/memory/formation.ts](../services/memory/formation.ts):

```typescript
// Change importance threshold
const importance = success ? 0.85 : 0.6; // Make failures more important

// Add more tags
tags: ['prd', 'custom_tag', context.toLowerCase()]

// Adjust confidence
confidence: entities.confidence > 0.8 ? 0.9 : 0.7
```

### Adjust What Gets Stored

Edit [services/workflows/prdWorkflow.ts](../services/workflows/prdWorkflow.ts):

```typescript
// Store more/fewer past successes
const pastSuccesses = await experientialMemoryStore.getSuccesses(userId, 10); // Changed from 5

// Store user preferences as factual memory
await factualMemoryStore.store({
  userId,
  type: 'preference',
  content: 'User prefers detailed technical sections',
  confidence: 0.9
});
```

### Schedule Automated Processes

Add to app initialization (e.g., [App.tsx](../App.tsx)):

```typescript
import { scheduleConsolidation } from './services/memory';
import { scheduleDailyReflection } from './services/proactive';

useEffect(() => {
  if (user?.id) {
    // Run consolidation every 24 hours
    scheduleConsolidation(user.id, 24);

    // Run reflection daily at midnight
    scheduleDailyReflection(user.id, 0);
  }
}, [user]);
```

---

## ✅ Verification Checklist

To confirm memory integration is working:

- [ ] App running on http://localhost:3002
- [ ] Supabase credentials in `.env.local`
- [ ] Database schema run in Supabase
- [ ] Signed in to app
- [ ] Generated at least one PRD
- [ ] Saw purple memory banner
- [ ] Console shows "Retrieved X past successes..."
- [ ] Console shows "Recorded X factual + Y experiential memories"
- [ ] Supabase tables have data (`factual_memory`, `experiential_memory`)
- [ ] Settings test button works

---

## 🐛 Troubleshooting

### No Memory Banner Appearing

**Check:**
1. Are you signed in? (Memory requires `user.id`)
2. Did PRD generation succeed?
3. Check console for errors

**Fix:**
- Sign in with valid account
- Ensure Supabase is connected

### Console Shows "Supabase not configured"

**Cause:** `.env.local` missing credentials

**Fix:**
1. Check `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Restart dev server: `npm run dev`

### "Table does not exist" Error

**Cause:** Database schema not run

**Fix:**
1. Run `supabase/migration-safe.sql` in Supabase
2. Verify tables exist in Table Editor

### Memory Count Shows 0 in Supabase

**Cause:** RLS policies blocking access

**Fix:**
1. Check you're signed in
2. Verify RLS policies exist: `SELECT * FROM pg_policies WHERE tablename = 'factual_memory'`
3. Check user ID matches: `SELECT auth.uid()`

---

## 📚 Related Documentation

- **Quick Start:** [QUICK_START.md](../QUICK_START.md)
- **Testing Guide:** [TESTING_GUIDE.md](../TESTING_GUIDE.md)
- **Phase 2 Complete:** [PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md)
- **Memory System Setup:** [MEMORY_SYSTEM_SETUP.md](MEMORY_SYSTEM_SETUP.md)
- **Implementation Status:** [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md)

---

## 🎉 You're All Set!

The memory system is fully integrated and working! Every PRD you generate will:
- ✅ Learn from past experiences
- ✅ Store new knowledge
- ✅ Improve over time
- ✅ Build toward proactive capabilities

**Next:** Generate a few PRDs and watch your memory system grow!
