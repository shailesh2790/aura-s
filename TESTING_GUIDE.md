# Memory System Testing Guide

## Quick Start: Test Your Updated App

### Option 1: Test in Browser (Recommended)

1. **Run the app:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Go to http://localhost:5173

3. **Sign in:**
   - Use your existing account

4. **Go to Settings:**
   - Click "Settings" in the navigation menu

5. **Test Memory System:**
   - Scroll to "Memory System (Phase 2)" section
   - Click "Test Memory System" button
   - Check the test results displayed on screen
   - Open browser console (F12) to see detailed test output

**What You'll See:**

✅ Factual Memories: X
✅ Experiences: X
✅ Success Rate: X%
✅ Pending Actions: X

The console will show detailed logs of all 6 tests running.

---

### Option 2: Run Standalone Test Suite

For more detailed testing without the UI:

```bash
npx tsx test-memory-system.ts
```

**Expected Output:**
```
🧪 AURA OS MEMORY SYSTEM - COMPREHENSIVE TEST
============================================================

📋 TEST 1: Memory System Initialization
------------------------------------------------------------
✅ Memory system initialized successfully

📋 TEST 2: Manual Memory Storage
------------------------------------------------------------
✅ Stored factual memory (preference): <uuid>
✅ Stored experiential memory (success): <uuid>

📋 TEST 3: Memory Statistics
------------------------------------------------------------
Memory Stats: {
  factual: { totalCount: 2, ... },
  experiential: { totalCount: 3, successRate: 0.67 }
}

📋 TEST 4: Memory Retrieval
------------------------------------------------------------
✅ Retrieved 2 memories for "PRD generation workflow"
  1. [factual] Score: 0.85 - highly_relevant
  2. [experiential] Score: 0.72 - relevant

📋 TEST 5: Memory Consolidation
------------------------------------------------------------
Consolidation Results: {
  merged: 1,
  patternsExtracted: 2,
  pruned: 0
}

📋 TEST 6: Reflection & Proactive Actions
------------------------------------------------------------
✅ Reflection complete
Insights (3):
  1. Most successful when using: prd_generation, prompt_chaining
  2. Learned 3 new skills this period
  3. Performance improving over time

Proactive Actions Proposed (2):
  1. [medium] Run Memory Consolidation
  2. [medium] Apply Successful Patterns

✅ ALL TESTS PASSED
```

---

### Option 3: Test in Production

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Visit your deployed app:**
   - URL: https://auraagentsos-ei8shvxxu-shailesh2790s-projects.vercel.app

3. **Follow same steps as Option 1**

---

## Before Testing: Database Setup

**IMPORTANT:** Make sure you've set up the database schema in Supabase!

### Setup Steps:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/dhkdbbkaghublvdoblxt

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run Schema:**
   - Copy entire contents of `supabase/schema.sql`
   - Paste into SQL editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for "Success. No rows returned"

4. **Enable pgvector:**
   - Go to "Database" → "Extensions"
   - Search for "vector"
   - Click "Enable" on the `vector` extension

5. **Verify Tables:**
   - Go to "Table Editor"
   - You should see:
     - factual_memory
     - experiential_memory
     - proactive_actions
     - reflections
     - capabilities

---

## What Gets Tested

### 1. Memory Formation
- Storing factual memories (facts, rules, preferences)
- Recording experiential memories (successes, failures)
- Calculating importance scores
- Auto-generating timestamps and IDs

### 2. Memory Storage
- Supabase database integration
- Data persistence across sessions
- User data isolation (RLS policies)

### 3. Memory Retrieval
- Keyword-based search
- Temporal decay (recent memories score higher)
- Importance weighting
- Context-aware relevance
- Top-10 results with scores

### 4. Memory Consolidation
- Merge similar experiences (>50% keyword overlap)
- Extract patterns from successful runs
- Generate rules from patterns
- Prune old low-importance memories

### 5. Reflection Engine
- Performance analysis (success rate, patterns, challenges)
- Insight generation from experiences
- Proactive action proposals with priorities
- Reflection history tracking

### 6. System Integration
- Working memory management
- Session-based context
- Event logging
- Statistics calculation

---

## Troubleshooting

### "Supabase not configured" Warning

**Cause:** Database schema not set up

**Fix:**
1. Run `supabase/schema.sql` in Supabase Dashboard
2. Enable pgvector extension
3. Verify tables exist in Table Editor

### "User not authenticated" Error

**Cause:** Not signed in

**Fix:**
1. Sign in to the app
2. Use your existing account
3. If no account, create one from waitlist

### Tests Pass but No Data in Supabase

**Cause:** Tables exist but RLS policies preventing access

**Fix:**
1. Check Supabase logs for RLS errors
2. Verify user ID matches auth.users table
3. Check RLS policies are enabled

### "Module not found" Error

**Cause:** Dependencies not installed

**Fix:**
```bash
npm install
```

---

## Verification Checklist

After running tests, verify:

- [ ] Tests complete without errors
- [ ] All 6 test sections pass
- [ ] Console shows detailed logs
- [ ] Memory statistics display correctly
- [ ] Supabase tables populated with data
- [ ] Browser console shows no errors
- [ ] Test results UI shows success metrics

---

## Next Steps After Testing

Once tests pass:

1. **Generate a PRD** to see memory in action
   - Go to "PRD Generator"
   - Enter a product description
   - Generate PRD
   - Check console for memory logs

2. **Generate multiple PRDs** to accumulate memories
   - Each run stores 2-5 memories
   - Watch success rate improve
   - See patterns emerge

3. **Run consolidation** manually
   ```typescript
   // In browser console
   await window.testMemory('<your-user-id>')
   ```

4. **Check reflection insights**
   - Settings → Test Memory System
   - View insights and proactive actions
   - See what the system learned

5. **Schedule automated tasks**
   - Add to app initialization:
   ```typescript
   import { scheduleConsolidation } from './services/memory';
   import { scheduleDailyReflection } from './services/proactive';

   scheduleConsolidation(userId, 24);        // Nightly
   scheduleDailyReflection(userId, 0);       // Midnight
   ```

---

## Performance Benchmarks

Expected performance on your system:

- **Memory Formation:** <100ms per run
- **Retrieval:** <200ms for 1000 memories
- **Consolidation:** <500ms for 100 experiences
- **Reflection:** <300ms for 24-hour period
- **Storage:** 100% success rate

---

## Documentation

- **Setup Guide:** [docs/MEMORY_SYSTEM_SETUP.md](docs/MEMORY_SYSTEM_SETUP.md)
- **Phase 2 Complete:** [docs/PHASE_2_COMPLETE.md](docs/PHASE_2_COMPLETE.md)
- **Design Doc:** [docs/PROACTIVE_AGENTS_DESIGN.md](docs/PROACTIVE_AGENTS_DESIGN.md)
- **Implementation Status:** [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

## Questions?

- Check browser console for detailed logs
- Review error messages in Supabase logs
- See setup guide for common issues
- All test code is in `test-memory-system.ts` and `src/utils/testMemory.ts`
