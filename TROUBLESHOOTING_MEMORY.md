# Memory System Troubleshooting

## Common Errors and Solutions

### Error: "Cannot read property 'id' of undefined" or "user is undefined"

**Cause:** Not signed in to the app

**Solution:**
1. Make sure you're signed in
2. Check that `user` object exists in AuthContext
3. In browser console, type: `localStorage.getItem('supabase.auth.token')`

---

### Error: "relation 'factual_memory' does not exist"

**Cause:** Database schema not run

**Solution:**
1. Go to Supabase Dashboard
2. Run `supabase/migration-safe.sql`
3. Verify tables exist in Table Editor

---

### Error: "Supabase not configured"

**Cause:** Environment variables not loaded

**Solution:**
1. Check `.env.local` has Supabase credentials
2. Restart dev server: Kill current server and run `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R)

---

### Error: "Module not found" or import errors

**Cause:** Import path issue

**Solution:**
Check import paths match file structure:
```typescript
// Should be:
import { useAuth } from '../context/AuthContext';
// NOT:
import { useAuth } from './context/AuthContext';
```

---

### Error: "RLS policy violation" or "new row violates row-level security"

**Cause:** Row Level Security blocking access

**Solution:**
1. Make sure you're signed in
2. Check user ID matches: Run in Supabase SQL Editor:
   ```sql
   SELECT auth.uid();
   ```
3. Verify RLS policies exist

---

## Quick Diagnostic Steps

### 1. Check App is Running
```bash
curl http://localhost:3000
```
Should return HTML

### 2. Check Supabase Connection
Open browser console and run:
```javascript
console.log(window.location.href);
// Go to Settings and check if "Supabase not configured" warning appears
```

### 3. Check User is Signed In
Open browser console and run:
```javascript
// Check localStorage
localStorage.getItem('supabase.auth.token')
```

### 4. Check Database Tables Exist
Go to Supabase Dashboard → Table Editor
Should see:
- factual_memory
- experiential_memory
- proactive_actions
- reflections
- capabilities

### 5. Test Memory Functions Directly
Open browser console and run:
```javascript
// This will test if imports are working
import { getMemoryStats } from './services/memory';
```

---

## Step-by-Step Debug Process

### Step 1: Verify App Loads
1. Open http://localhost:3000
2. Do you see the app UI?
   - ✅ Yes → Go to Step 2
   - ❌ No → Check dev server is running, check for compile errors

### Step 2: Check Console Errors
1. Press F12
2. Go to Console tab
3. Do you see any RED error messages?
   - ✅ No errors → Go to Step 3
   - ❌ Has errors → Copy exact error message and check solutions above

### Step 3: Verify Sign In
1. Are you signed in?
   - ✅ Yes → Go to Step 4
   - ❌ No → Sign in first

### Step 4: Try PRD Generator
1. Go to PRD Generator
2. Enter test text: "mobile app"
3. Click Generate
4. Do you see the purple memory banner?
   - ✅ Yes → Memory system working!
   - ❌ No → Check console for errors

### Step 5: Try Settings Test
1. Go to Settings
2. Click "Test Memory System"
3. Does test complete?
   - ✅ Yes → Check results
   - ❌ No → Check console error

---

## Temporary Workaround: Disable Memory Integration

If you need to use the app while debugging, you can temporarily disable memory:

**Edit `components/PRDGenerator.tsx`:**

Change line 65:
```typescript
// FROM:
const result = await generatePRD(userIntent, user?.id);

// TO:
const result = await generatePRD(userIntent); // No userId = no memory
```

This will make PRD generation work without the memory system.

---

## Get Help

If none of these solutions work:

1. **Copy exact error message** from console
2. **Note what you were doing** when error occurred
3. **Check browser console** (F12) for full error stack trace
4. **Share error details** so we can debug further

---

## Common Success Indicators

When memory system is working correctly, you should see:

✅ Purple memory banner after PRD generation
✅ Console logs: "Retrieved X past successes..."
✅ Console logs: "Recorded X factual + Y experiential memories"
✅ No red errors in console
✅ Data appearing in Supabase tables
