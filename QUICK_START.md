# Quick Start Guide - AURA OS with Memory System

## ✅ Fixed: Supabase Connection

Your `.env.local` file now has the correct Supabase credentials!

## 🚀 Current Status

**Dev Server Running:** http://localhost:3002
**Supabase:** Connected and configured
**Memory System:** Phase 1 & 2 Complete

---

## 📋 Before You Test

### 1. Run Database Schema in Supabase

**IMPORTANT:** You must set up the database tables before testing!

1. Go to https://supabase.com/dashboard/project/dhkdbbkaghublvdoblxt
2. Click "SQL Editor" → "New query"
3. Copy ALL contents of `supabase/schema.sql` (430 lines)
4. Paste and click "Run"
5. Should see: "Success. No rows returned"

### 2. Enable pgvector Extension

1. Go to "Database" → "Extensions"
2. Search for "vector"
3. Click "Enable" on the `vector` extension
4. Wait for activation

### 3. Verify Tables Created

1. Go to "Table Editor" (left sidebar)
2. You should see these tables:
   - `factual_memory`
   - `experiential_memory`
   - `proactive_actions`
   - `reflections`
   - `capabilities`

---

## 🧪 Testing the Memory System

### In Your Browser:

1. **Open:** http://localhost:3002
2. **Sign in** with your account
3. **Go to Settings** (navigation menu)
4. **Scroll to "Memory System (Phase 2)"**
5. **Click "Test Memory System"** button
6. **Open Console** (F12) to see detailed output

### What You Should See:

**Success:**
```
🧪 Testing Memory System...
📝 Test 1: Storing test memories...
✅ Stored fact: <uuid>
✅ Stored experience: <uuid>
📊 Test 2: Memory Statistics...
🔍 Test 3: Retrieving memories...
🔄 Test 4: Memory Consolidation...
💭 Test 5: Performing Reflection...
⚡ Test 6: Pending Actions...
✅ ALL TESTS PASSED!
```

**In UI:**
- ✅ Tests Passed
- Factual Memories: X
- Experiences: X
- Success Rate: X%
- Pending Actions: X

---

## ❌ Troubleshooting

### "Supabase not configured" Warning

**Cause:** Environment variables not loaded

**Fix:**
1. Restart dev server: `npm run dev`
2. Refresh browser
3. `.env.local` should have:
   ```
   VITE_SUPABASE_URL=https://dhkdbbkaghublvdoblxt.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

### "Table does not exist" Error

**Cause:** Database schema not run

**Fix:**
1. Run `supabase/schema.sql` in Supabase Dashboard
2. Verify tables exist in Table Editor

### "Extension vector does not exist" Error

**Cause:** pgvector not enabled

**Fix:**
1. Go to Database → Extensions
2. Enable "vector" extension

### Tests Still Failing

**Check:**
1. Browser console for specific error (F12)
2. Network tab for failed API calls
3. Supabase logs for RLS policy errors
4. Make sure you're signed in with a valid account

---

## 📁 Environment Files

You have multiple environment files:

- `.env.local` - **For local development** (used by `npm run dev`)
- `.env.production` - For production builds
- `.env.example` - Template for setup

**Required `.env.local` contents:**
```env
GROQ_API_KEY=your_groq_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note:** Your actual `.env.local` file already has the correct values.

**Note:** `.env.local` is in `.gitignore` for security - it won't be committed to git.

---

## 🎯 What to Test

### Test 1: Memory Storage
- Stores factual memory (preference)
- Stores experiential memory (success)
- Verifies data persists in Supabase

### Test 2: Memory Retrieval
- Searches for "PRD generation preferences"
- Returns relevant memories with scores
- Uses temporal decay (recent = higher score)

### Test 3: Memory Consolidation
- Merges similar experiences
- Extracts patterns from successes
- Generates rules automatically
- Prunes old low-importance memories

### Test 4: Reflection Engine
- Analyzes last 24 hours of activity
- Generates insights from patterns
- Proposes proactive actions
- Calculates success rate

### Test 5: Proactive Actions
- Lists suggested actions
- Shows priority and impact
- Tracks action status

---

## 📊 Expected Performance

- **Memory Formation:** <100ms
- **Retrieval:** <200ms
- **Consolidation:** <500ms for 100 experiences
- **Reflection:** <300ms for 24-hour period
- **Storage:** 100% success rate

---

## 🔗 Important URLs

- **App (Local):** http://localhost:3002
- **Supabase Dashboard:** https://supabase.com/dashboard/project/dhkdbbkaghublvdoblxt
- **Supabase SQL Editor:** https://supabase.com/dashboard/project/dhkdbbkaghublvdoblxt/sql
- **Vercel Dashboard:** https://vercel.com/shailesh2790s-projects/auraagentsos

---

## 📚 Documentation

- **Testing Guide:** [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Phase 2 Complete:** [docs/PHASE_2_COMPLETE.md](docs/PHASE_2_COMPLETE.md)
- **Setup Guide:** [docs/MEMORY_SYSTEM_SETUP.md](docs/MEMORY_SYSTEM_SETUP.md)
- **Implementation Status:** [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

## ✅ Checklist

Before testing, make sure:

- [ ] `.env.local` has Supabase credentials ✅ (DONE)
- [ ] Dev server restarted: `npm run dev` ✅ (DONE - running on :3002)
- [ ] SQL schema run in Supabase (YOU NEED TO DO THIS)
- [ ] pgvector extension enabled (YOU NEED TO DO THIS)
- [ ] Tables visible in Supabase Table Editor
- [ ] Signed in to app with valid account
- [ ] Browser console open (F12) to see logs

---

## 🎉 Next Steps

Once tests pass:

1. **Generate PRDs** to accumulate real memories
2. **Check Supabase** Table Editor to see data
3. **Run consolidation** to see pattern extraction
4. **Deploy to production** with `vercel --prod`

---

**Ready to test!** Open http://localhost:3002 and sign in.
