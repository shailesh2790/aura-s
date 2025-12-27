# Memory System Setup Guide

**Proactive Agents with Long-Term Memory for AURA OS**

This guide will help you set up and test the new memory system based on research from ["Memory in the Age of AI Agents"](https://arxiv.org/abs/2512.13564).

---

## 📋 Prerequisites

Before setting up the memory system, ensure you have:

✅ **Supabase Project** - Created and configured (see DEPLOY_NOW.md)
✅ **PostgreSQL + pgvector** - Enabled in Supabase
✅ **Node.js 18+** - Installed locally
✅ **Git** - Code pushed to repository

---

## 🗄️ Step 1: Set Up Database Schema

The memory system requires several tables in Supabase. We've created a comprehensive SQL schema that sets everything up.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **dhkdbbkaghublvdoblxt**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **"New query"**
5. Copy the entire contents of `supabase/schema.sql` from this repository
6. Paste into the SQL editor
7. Click **"Run"** (or press Ctrl+Enter)
8. Wait for execution to complete
9. ✅ Verify success: "Success. No rows returned"

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref dhkdbbkaghublvdoblxt

# Run migrations
supabase db push --db-url "your-connection-string"
```

### What Gets Created

The schema creates:

**Tables:**
- `factual_memory` - Facts, rules, preferences
- `experiential_memory` - Success/failure experiences
- `proactive_actions` - Autonomous suggestions
- `reflections` - Periodic self-analysis
- `capabilities` - Learned skills

**Indexes:**
- Vector embeddings index (pgvector)
- User ID indexes
- Timestamp indexes
- Tag indexes (GIN)

**Views:**
- `memory_stats` - Memory statistics by user
- `experience_stats` - Experience summary
- `proactive_summary` - Proactive actions summary

**RLS Policies:**
- User-scoped access control
- Secure data isolation

---

## 🔧 Step 2: Enable pgvector Extension

For semantic search capabilities, you need to enable the pgvector extension:

1. In Supabase Dashboard, go to **Database** → **Extensions**
2. Search for **"vector"**
3. Click **"Enable"** on the `vector` extension
4. Wait for activation (usually instant)
5. ✅ Verify: The extension should show as "Enabled"

---

## 📦 Step 3: Install Dependencies

The memory system requires the UUID library (already included):

```bash
cd c:\MLProject\auraagentsos
npm install
```

All dependencies should already be installed from your previous setup.

---

## 🔌 Step 4: Verify Supabase Connection

Make sure your environment variables are correctly set:

**For Local Development:**

Create `.env.local` (if it doesn't exist):

```env
VITE_SUPABASE_URL=https://dhkdbbkaghublvdoblxt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoa2RiYmthZ2h1Ymx2ZG9ibHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjMyNjEsImV4cCI6MjA4MjMzOTI2MX0.SHJEW_vpcL30PosFa4OWVyfyHc6hRPKsonTT2CQV6bI
```

**For Production (Vercel):**

Environment variables are already set in your Vercel project.

---

## 🧪 Step 5: Test the Memory System

### Test 1: Basic Memory Storage

Create a test file `test-memory.ts`:

```typescript
import { factualMemoryStore, experientialMemoryStore } from './services/memory';

async function testMemorySystem() {
  const userId = 'test-user-123';

  // Test 1: Store a factual memory
  console.log('Test 1: Storing factual memory...');
  const fact = await factualMemoryStore.store({
    userId,
    type: 'preference',
    content: 'User prefers concise PRDs with bullet points',
    source: 'user_feedback',
    confidence: 0.9,
    tags: ['prd', 'formatting', 'preference']
  });
  console.log('✅ Factual memory stored:', fact.id);

  // Test 2: Retrieve factual memories
  console.log('\nTest 2: Retrieving factual memories...');
  const facts = await factualMemoryStore.retrieve({ userId, limit: 10 });
  console.log(`✅ Retrieved ${facts.length} factual memories`);

  // Test 3: Store an experiential memory
  console.log('\nTest 3: Storing experiential memory...');
  const experience = await experientialMemoryStore.store({
    userId,
    type: 'success',
    context: 'Generating PRD for e-commerce checkout',
    action: 'Used prompt chaining workflow',
    outcome: 'Generated comprehensive PRD in 150ms',
    reflection: 'Prompt chaining pattern works well for structured documents',
    learnedSkills: ['prd_generation', 'prompt_chaining'],
    importance: 0.8,
    relatedMemories: []
  });
  console.log('✅ Experiential memory stored:', experience.id);

  // Test 4: Get memory stats
  console.log('\nTest 4: Getting memory stats...');
  const factStats = await factualMemoryStore.getStats(userId);
  const expStats = await experientialMemoryStore.getStats(userId);
  console.log('✅ Factual stats:', factStats);
  console.log('✅ Experiential stats:', expStats);

  console.log('\n🎉 All tests passed!');
}

testMemorySystem().catch(console.error);
```

Run the test:

```bash
npx tsx test-memory.ts
```

Expected output:
```
Test 1: Storing factual memory...
✅ Factual memory stored: <uuid>
Test 2: Retrieving factual memories...
✅ Retrieved 1 factual memories
Test 3: Storing experiential memory...
✅ Experiential memory stored: <uuid>
Test 4: Getting memory stats...
✅ Factual stats: { totalCount: 1, byType: { preference: 1 }, avgConfidence: 0.9, ... }
✅ Experiential stats: { totalCount: 1, byType: { success: 1 }, avgImportance: 0.8, ... }
🎉 All tests passed!
```

### Test 2: PRD Workflow with Memory

Update your PRD Generator component to pass userId:

```typescript
// In components/PRDGenerator.tsx
import { useAuth } from '../context/AuthContext';

const { user } = useAuth();

// When calling generatePRD:
const artifact = await generatePRD(intent, user?.id);
```

Then test:

1. Run the app: `npm run dev`
2. Sign in
3. Generate a PRD
4. Check browser console for memory logs:
   ```
   Retrieved 0 past successes and 0 patterns for context
   Recorded 1 factual + 1 experiential memories
   ```
5. Generate another PRD
6. You should see:
   ```
   Retrieved 1 past successes and 0 patterns for context
   Recorded 2 factual + 2 experiential memories
   ```

### Test 3: Verify in Supabase

1. Go to **Supabase Dashboard** → **Table Editor**
2. Click on `factual_memory` table
3. ✅ You should see rows with your memories
4. Click on `experiential_memory` table
5. ✅ You should see success records from PRD runs

---

## 🚀 Step 6: Deploy to Production

Once you've tested locally, deploy to Vercel:

```bash
npm run build
git add -A
git commit -m "Add memory system with long-term learning"
git push
vercel --prod
```

The memory system will automatically work in production using your Supabase credentials.

---

## 📊 Step 7: Monitor Memory Growth

### View Memory Statistics

Create a simple dashboard component:

```typescript
import { useState, useEffect } from 'react';
import { getMemoryStats } from '../services/memory';
import { useAuth } from '../context/AuthContext';

export function MemoryDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      getMemoryStats(user.id).then(setStats);
    }
  }, [user]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h2 className="text-xl font-bold mb-4">Memory System Stats</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded">
          <h3 className="font-semibold text-sm text-slate-600">Factual Memories</h3>
          <p className="text-2xl font-bold">{stats.factual.totalCount}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded">
          <h3 className="font-semibold text-sm text-slate-600">Experiences</h3>
          <p className="text-2xl font-bold">{stats.experiential.totalCount}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded">
          <h3 className="font-semibold text-sm text-slate-600">Success Rate</h3>
          <p className="text-2xl font-bold">
            {(stats.experiential.successRate * 100).toFixed(1)}%
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded">
          <h3 className="font-semibold text-sm text-slate-600">Skills Learned</h3>
          <p className="text-2xl font-bold">{stats.experiential.uniqueSkills}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔍 Troubleshooting

### Issue: "table 'factual_memory' does not exist"

**Solution:** Run the SQL schema (Step 1) - the tables haven't been created yet.

### Issue: "extension 'vector' does not exist"

**Solution:** Enable pgvector extension in Supabase Dashboard → Database → Extensions.

### Issue: "row-level security policy violation"

**Solution:** Make sure you're passing the correct `userId` that matches the authenticated user.

### Issue: Memories not being stored

**Check:**
1. Are you passing `userId` to `generatePRD()`?
2. Is Supabase connected? (Check console for warnings)
3. Are RLS policies configured correctly?

---

## 📚 Next Steps

Now that your memory system is set up, you can:

1. **Phase 2:** Implement memory consolidation (nightly pattern extraction)
2. **Phase 3:** Add proactive planning and reflection
3. **Phase 4:** Implement self-evolution with capability learning

See [PROACTIVE_AGENTS_DESIGN.md](./PROACTIVE_AGENTS_DESIGN.md) for the complete roadmap.

---

## 🎯 Success Criteria

Your memory system is working correctly when:

- ✅ Factual memories are stored after each PRD run
- ✅ Experiential memories capture success/failure
- ✅ Past experiences are retrieved for context
- ✅ Memory stats show growing numbers
- ✅ No errors in browser console
- ✅ Data visible in Supabase Table Editor

---

## 📖 Additional Resources

- [Memory System Design](./PROACTIVE_AGENTS_DESIGN.md)
- [Paper: Memory in the Age of AI Agents](https://arxiv.org/abs/2512.13564)
- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

**Status:** Ready for Testing
**Last Updated:** December 27, 2025
