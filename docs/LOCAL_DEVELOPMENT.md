# Local Development Guide

## Running Without Authentication (Quick Start)

The app is configured to work **without Supabase credentials** for local development. This is perfect for:
- Testing features quickly
- Contributing without setting up authentication
- Exploring the app before deploying

### Quick Start

```bash
# Install dependencies
npm install

# Start dev server (no .env needed!)
npm run dev

# Open http://localhost:3000
```

**That's it!** The app will run with a mock user (`dev@local.host`) and skip authentication.

### What You'll See

When you run without Supabase credentials, you'll see this in the console:

```
⚠️ Supabase credentials not configured. Authentication is disabled.
📝 To enable authentication:
   1. Create a .env file in the project root
   2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   3. See docs/DEPLOYMENT_GUIDE.md for setup instructions

💡 The app will run without authentication for local development.
🔓 Running in development mode without authentication
```

This is **completely normal** for local development!

### Available Features Without Auth

✅ **Fully Working:**
- PRD Generator
- Event Timeline
- Runtime Demo
- Multi-Agent Builder
- Dashboard
- All features except sign in/out

❌ **Disabled Without Auth:**
- Waitlist signup
- Sign in / Sign up
- User-specific data persistence

---

## Running With Authentication (Optional)

If you want to test the full authentication flow locally:

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project (free tier)
3. Wait for project setup (~2 minutes)

### Step 2: Get Credentials

1. Go to Project Settings → API
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJhbGc...`)

### Step 3: Create Database Tables

1. Go to SQL Editor
2. Click "New query"
3. Copy SQL from [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#step-3-create-database-tables)
4. Run the query

### Step 4: Configure Environment

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:3000
VITE_WAITLIST_ENABLED=true
```

### Step 5: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

Now you'll see the auth screen and can test the full flow!

---

## Development Modes

### Mode 1: No Auth (Default)
- **Setup:** None required
- **User:** Mock user (`dev@local.host`)
- **Features:** All except auth flows
- **Use Case:** Quick feature testing

### Mode 2: With Auth
- **Setup:** .env with Supabase credentials
- **User:** Real authentication
- **Features:** Everything
- **Use Case:** Testing auth flows, production prep

---

## Hot Module Replacement (HMR)

Vite's HMR is enabled. Changes to code will instantly reload in the browser:

- **Component changes:** Instant update, state preserved
- **Style changes:** Instant update
- **Config changes:** May require full reload

---

## Browser Console

Open DevTools (F12) to see:

**Without Auth:**
```
⚠️ Supabase credentials not configured. Authentication is disabled.
🔓 Running in development mode without authentication
```

**With Auth:**
```
✅ Supabase configured
✅ User authenticated: user@example.com
```

---

## Port and Network

The dev server runs on:
- **Local:** http://localhost:3000
- **Network:** http://YOUR_IP:3000

The network URL allows testing from other devices on same WiFi.

---

## Troubleshooting

### Issue: "Module not found: @supabase/supabase-js"
**Solution:** Run `npm install`

### Issue: White screen
**Solution:**
1. Check browser console (F12) for errors
2. Try `npm run dev` again
3. Clear browser cache (Ctrl+Shift+R)

### Issue: HMR not working
**Solution:**
1. Stop server (Ctrl+C)
2. Delete `node_modules/.vite` folder
3. Run `npm run dev` again

### Issue: Want to disable auth warning
**Solution:** This is just a warning, not an error. The app works fine!

---

## Recommended Workflow

### For Feature Development
1. Run **without auth** (no setup needed)
2. Test your feature
3. Commit changes
4. Deploy to staging with auth enabled

### For Auth Testing
1. Set up Supabase (one-time, 5 minutes)
2. Run **with auth**
3. Test waitlist → approval → signup → signin
4. Deploy to production

---

## Next Steps

- **Local Testing:** Keep developing without auth
- **Ready to Deploy?** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Questions?** Check [README.md](../README.md)

---

**Key Takeaway:** You can develop the entire app without any authentication setup. Auth is only needed for production deployment!
