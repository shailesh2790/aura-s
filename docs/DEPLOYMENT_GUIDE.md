# Deployment Guide - AURA OS with Waitlist Authentication

## Overview

This guide will help you deploy AURA OS to Vercel with Supabase authentication and waitlist management.

## Prerequisites

1. **GitHub Account** - To store code and connect to Vercel
2. **Vercel Account** - For deployment (free tier available)
3. **Supabase Account** - For authentication and database (free tier available)

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in project details:
   - **Name:** `aura-os` (or your preferred name)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free
6. Click "Create new project"
7. Wait 2-3 minutes for project to be created

### Step 2: Get API Credentials

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy these values (you'll need them later):
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...` (long string)

### Step 3: Create Database Tables

1. Click "SQL Editor" in the sidebar
2. Click "New query"
3. Paste the following SQL:

```sql
-- Create waitlist table
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on email for faster lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to join the waitlist (insert)
CREATE POLICY "Anyone can join waitlist"
ON waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to read their own waitlist status
CREATE POLICY "Users can read own waitlist status"
ON waitlist FOR SELECT
TO anon, authenticated
USING (true);

-- Only service role can update waitlist status (you'll do this manually via dashboard)
CREATE POLICY "Only admins can update waitlist"
ON waitlist FOR UPDATE
TO authenticated
USING (false);
```

4. Click "Run" (or press Ctrl+Enter)
5. Verify success: "Success. No rows returned"

### Step 4: Configure Authentication

1. Click "Authentication" in the sidebar
2. Click "Providers"
3. Ensure "Email" is enabled (it should be by default)
4. Configure email settings:
   - **Enable Email Provider:** ON
   - **Enable Email Confirmations:** ON (recommended)
   - **Secure email change:** ON
5. Click "Save"

### Step 5: Configure Email Templates (Optional)

1. Click "Email Templates" under Authentication
2. Customize the confirmation email if desired
3. The default templates work fine for testing

---

## Part 2: Vercel Deployment

### Step 1: Push Code to GitHub

```bash
# Navigate to project directory
cd c:\MLProject\auraagentsos

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Add waitlist authentication and deployment config"

# Create GitHub repository (via GitHub web interface)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/aura-os.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Project Name:** `aura-os` (or your preferred name)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click "Environment Variables"
6. Add the following environment variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `VITE_APP_URL` | `https://your-app.vercel.app` (will be shown after deployment) |
| `VITE_WAITLIST_ENABLED` | `true` |

7. Click "Deploy"
8. Wait 2-3 minutes for deployment to complete

### Step 3: Get Your App URL

1. After deployment, Vercel will show your app URL
2. Copy it (e.g., `https://aura-os.vercel.app`)
3. Go back to "Settings" → "Environment Variables"
4. Update `VITE_APP_URL` with the actual URL
5. Trigger a redeploy (go to "Deployments" → click "..." → "Redeploy")

### Step 4: Configure Supabase Redirect URLs

1. Go back to Supabase dashboard
2. Click "Authentication" → "URL Configuration"
3. Add your Vercel URL to "Site URL": `https://your-app.vercel.app`
4. Add to "Redirect URLs":
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/**`
   - `http://localhost:3000` (for local development)
5. Click "Save"

---

## Part 3: Managing the Waitlist

### Approving Users

#### Method 1: Supabase Dashboard (Easiest)

1. Go to Supabase dashboard
2. Click "Table Editor"
3. Select "waitlist" table
4. Find the user's row
5. Click the row to edit
6. Change "status" from `pending` to `approved`
7. Set "approved_at" to current timestamp (or leave empty, it will be set on signup)
8. Click "Save"
9. User can now create an account!

#### Method 2: SQL Query (Bulk Approve)

```sql
-- Approve a single user
UPDATE waitlist
SET status = 'approved', approved_at = NOW()
WHERE email = 'user@example.com';

-- Approve all pending users (be careful!)
UPDATE waitlist
SET status = 'approved', approved_at = NOW()
WHERE status = 'pending';

-- Approve first 10 users
UPDATE waitlist
SET status = 'approved', approved_at = NOW()
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 10;
```

### Viewing Waitlist

```sql
-- See all waitlist entries
SELECT email, status, created_at, approved_at, metadata
FROM waitlist
ORDER BY created_at DESC;

-- Count by status
SELECT status, COUNT(*) as count
FROM waitlist
GROUP BY status;

-- Recent signups (last 7 days)
SELECT email, status, created_at
FROM waitlist
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Rejecting Users (Optional)

```sql
UPDATE waitlist
SET status = 'rejected'
WHERE email = 'spam@example.com';
```

---

## Part 4: Testing the Deployment

### Test Waitlist Flow

1. Visit your app URL
2. Should see Auth screen
3. Click "Waitlist" tab
4. Enter email and optional info
5. Click "Join Waitlist"
6. Should see success message
7. Check Supabase Table Editor - user should appear with `status = 'pending'`

### Test Approval Flow

1. In Supabase, approve the test user (change status to `approved`)
2. Go back to app
3. Click "Sign Up" tab
4. Enter same email + create password
5. Should see "Account created! Check your email to verify"
6. Check email inbox for confirmation link
7. Click confirmation link
8. Go back to app and sign in
9. Should now see the full AURA OS dashboard!

### Test Sign In Flow

1. After email confirmation, go to app
2. Click "Sign In" tab
3. Enter email + password
4. Click "Sign In"
5. Should be logged in and see dashboard

---

## Part 5: Local Development Setup

### Environment Variables

1. Create `.env` file in project root:

```bash
# Copy from .env.example
cp .env.example .env
```

2. Fill in values from Supabase:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
VITE_APP_URL=http://localhost:3000
VITE_WAITLIST_ENABLED=true
```

### Run Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser to http://localhost:3000
```

---

## Part 6: Monitoring and Maintenance

### View User Activity

1. Supabase → Authentication → Users
2. See all registered users
3. View last sign-in time
4. Manually delete users if needed

### View Logs

1. Vercel → Your Project → Logs
2. Filter by errors, warnings
3. Debug deployment issues

### Analytics (Optional)

Add to Supabase to track usage:

```sql
-- Create analytics table
CREATE TABLE user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);
```

---

## Troubleshooting

### Issue: "Failed to resolve import @supabase/supabase-js"

**Solution:** Install Supabase package
```bash
npm install @supabase/supabase-js
```

### Issue: "Email not on waitlist"

**Solution:**
1. Check Supabase waitlist table - is email there?
2. Check spelling - email must match exactly
3. Ensure status is `approved` not `pending`

### Issue: "Sign up failed"

**Solution:**
1. Check Supabase logs (Authentication → Logs)
2. Verify email confirmation is enabled
3. Ensure password is 8+ characters
4. Check that status is `approved` in waitlist table

### Issue: App shows white screen after deployment

**Solution:**
1. Check Vercel build logs for errors
2. Ensure all environment variables are set
3. Check browser console for errors
4. Verify `VITE_APP_URL` matches actual Vercel URL

### Issue: Redirect URL mismatch

**Solution:**
1. Go to Supabase → Authentication → URL Configuration
2. Add your Vercel URL to "Redirect URLs"
3. Include both:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/**`

---

## Security Considerations

### Production Checklist

- [ ] Change Supabase database password
- [ ] Enable 2FA on Supabase account
- [ ] Enable 2FA on Vercel account
- [ ] Review Supabase RLS policies
- [ ] Set up email rate limiting
- [ ] Configure CORS if needed
- [ ] Monitor auth logs for suspicious activity
- [ ] Set up alerts for failed login attempts

### Rate Limiting

Consider adding Vercel edge middleware for rate limiting:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add rate limiting logic here
  return NextResponse.next();
}
```

---

## Cost Estimate

### Free Tier Limits

**Supabase Free Tier:**
- 500MB database storage
- 2GB file storage
- 2GB bandwidth per month
- 50,000 monthly active users
- Unlimited API requests

**Vercel Free Tier:**
- 100GB bandwidth per month
- 6,000 build minutes per month
- Unlimited deployments
- Automatic SSL

**Total Cost:** $0/month for small projects!

### When to Upgrade

Upgrade when you hit:
- 50,000+ monthly active users (Supabase Pro: $25/month)
- 100GB+ bandwidth (Vercel Pro: $20/month)

---

## Next Steps

1. **Deploy to production** - Follow steps above
2. **Test thoroughly** - All auth flows
3. **Approve beta users** - First 10-50 testers
4. **Collect feedback** - Survey early users
5. **Iterate** - Based on feedback
6. **Scale up** - Upgrade plans as needed

---

## Support

If you encounter issues:
- Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Vercel: [https://vercel.com/docs](https://vercel.com/docs)
- GitHub Issues: Create issue in your repo

---

**Status:** Ready for Deployment
**Last Updated:** December 26, 2025
