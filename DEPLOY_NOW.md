# 🚀 Deploy AURA OS to Vercel - Quick Guide

## ✅ Your Supabase is Ready!

Your credentials:
- **URL:** `https://dhkdbbkaghublvdoblxt.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ✅

---

## 📦 Deploy to Vercel (5 minutes)

### Step 1: Go to Vercel

Open: **[https://vercel.com/new](https://vercel.com/new)**

### Step 2: Import Repository

1. Click "Import Git Repository"
2. Select: `shailesh2790/aura-s`
3. Click "Import"

### Step 3: Configure Project

**Framework Preset:** Vite (should auto-detect)

**Build Settings:**
- Build Command: `npm run build` ✅
- Output Directory: `dist` ✅
- Install Command: `npm install` ✅

### Step 4: Add Environment Variables

Click "Environment Variables" and add these **EXACTLY**:

#### Variable 1:
```
Name: VITE_SUPABASE_URL
Value: https://dhkdbbkaghublvdoblxt.supabase.co
```

#### Variable 2:
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoa2RiYmthZ2h1Ymx2ZG9ibHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjMyNjEsImV4cCI6MjA4MjMzOTI2MX0.SHJEW_vpcL30PosFa4OWVyfyHc6hRPKsonTT2CQV6bI
```

#### Variable 3:
```
Name: VITE_APP_URL
Value: https://aura-s.vercel.app
```
(Note: Update this after deployment with your actual URL)

#### Variable 4:
```
Name: VITE_WAITLIST_ENABLED
Value: true
```

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. ✅ Deployment successful!

---

## 🔧 Post-Deployment Setup

### 1. Update App URL

After deployment completes:

1. Copy your actual Vercel URL (e.g., `https://aura-s-xyz123.vercel.app`)
2. Go to Vercel → Your Project → Settings → Environment Variables
3. Edit `VITE_APP_URL` to your actual URL
4. Go to Deployments → Click "..." → "Redeploy"

### 2. Configure Supabase Redirect URLs

1. Go to Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Authentication → URL Configuration
4. **Site URL:** Add your Vercel URL
5. **Redirect URLs:** Add these:
   ```
   https://your-actual-vercel-url.vercel.app
   https://your-actual-vercel-url.vercel.app/**
   http://localhost:3000
   ```
6. Click Save

### 3. Create Database Tables

1. In Supabase Dashboard, go to SQL Editor
2. Click "New query"
3. Paste this SQL:

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

-- Create indexes
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to join waitlist
CREATE POLICY "Anyone can join waitlist"
ON waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to read waitlist status
CREATE POLICY "Users can read own waitlist status"
ON waitlist FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can update
CREATE POLICY "Only admins can update waitlist"
ON waitlist FOR UPDATE
TO authenticated
USING (false);
```

4. Click "Run" (or Ctrl+Enter)
5. Verify: "Success. No rows returned"

---

## ✅ Test Your Deployment

### Test 1: Visit Your Site

1. Go to your Vercel URL
2. Should see Auth screen (not error page) ✅

### Test 2: Join Waitlist

1. Click "Waitlist" tab
2. Enter your email
3. Click "Join Waitlist"
4. Should see success message ✅

### Test 3: Verify in Supabase

1. Supabase → Table Editor → waitlist
2. Should see your email with status: `pending` ✅

### Test 4: Approve & Create Account

1. In Supabase, click your email row
2. Change `status` to `approved`
3. Click Save
4. Go back to app
5. Click "Sign Up" tab
6. Enter same email + password
7. Should see: "Check your email" ✅

### Test 5: Full Flow

1. Check email inbox
2. Click confirmation link
3. Go to app → Sign In
4. Enter email + password
5. Should see Dashboard! ✅

---

## 🎉 Success!

Your AURA OS is now live at:
**https://your-vercel-url.vercel.app**

### Next Steps

1. ✅ Share URL with beta testers
2. ✅ Approve users in Supabase dashboard
3. ✅ Collect feedback
4. ✅ Iterate and improve!

---

## 📞 Need Help?

- **Deployment Guide:** [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **Troubleshooting:** [docs/DEPLOYMENT_GUIDE.md#troubleshooting](docs/DEPLOYMENT_GUIDE.md#troubleshooting)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

---

**Ready to deploy?** Click here: **[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/shailesh2790/aura-s)**
