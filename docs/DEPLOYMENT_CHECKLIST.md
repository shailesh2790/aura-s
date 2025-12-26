# Deployment Checklist

Use this checklist to deploy AURA OS to production in ~12 minutes.

---

## ☑️ Pre-Deployment (Local Testing)

- [ ] Clone/pull latest code
- [ ] Run `npm install`
- [ ] Run `npm run dev` - verify app works locally
- [ ] Test PRD Generator - generate a sample PRD
- [ ] Test Runtime Demo - execute a sample run
- [ ] No errors in browser console

**Time:** 5 minutes

---

## ☑️ Supabase Setup (5 minutes)

### Create Project
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Click "New Project"
- [ ] Fill in:
  - [ ] Project name: `aura-os` (or your choice)
  - [ ] Database password: Generate strong password
  - [ ] Region: Choose closest to users
  - [ ] Pricing: Free
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for setup

### Get Credentials
- [ ] Go to Settings → API
- [ ] Copy **Project URL** (save in notepad)
- [ ] Copy **anon public key** (save in notepad)

### Create Database Tables
- [ ] Go to SQL Editor
- [ ] Click "New query"
- [ ] Copy SQL from [DEPLOYMENT_GUIDE.md Step 3](./DEPLOYMENT_GUIDE.md#step-3-create-database-tables)
- [ ] Paste and run (Ctrl+Enter)
- [ ] Verify: "Success. No rows returned"
- [ ] Go to Table Editor → verify `waitlist` table exists

### Configure Auth
- [ ] Go to Authentication → Providers
- [ ] Verify Email is enabled (should be ON by default)
- [ ] Enable email confirmations: ON
- [ ] Click Save

**Time:** 5 minutes

---

## ☑️ GitHub Setup (2 minutes)

### Push Code
```bash
cd c:\MLProject\auraagentsos

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Add waitlist auth and deployment config"

# Create GitHub repo (via web interface)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/aura-os.git
git branch -M main
git push -u origin main
```

- [ ] Code pushed to GitHub
- [ ] Repository is public or you have Vercel access

**Time:** 2 minutes

---

## ☑️ Vercel Deployment (5 minutes)

### Import Project
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Add New..." → "Project"
- [ ] Select your GitHub repository
- [ ] Click "Import"

### Configure Build
- [ ] Project Name: `aura-os` (or your choice)
- [ ] Framework Preset: **Vite** (should auto-detect)
- [ ] Root Directory: `./` (leave default)
- [ ] Build Command: `npm run build` (leave default)
- [ ] Output Directory: `dist` (leave default)

### Add Environment Variables
Click "Environment Variables" and add:

- [ ] **VITE_SUPABASE_URL**
  - Value: Your Supabase Project URL
  - Example: `https://xxxxx.supabase.co`

- [ ] **VITE_SUPABASE_ANON_KEY**
  - Value: Your Supabase anon public key
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

- [ ] **VITE_APP_URL**
  - Value: Will be your Vercel URL
  - For now: `https://aura-os.vercel.app` (update after deploy)

- [ ] **VITE_WAITLIST_ENABLED**
  - Value: `true`

### Deploy
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for build
- [ ] Deployment successful ✅

### Get App URL
- [ ] Copy your Vercel URL (e.g., `https://aura-os-xyz.vercel.app`)
- [ ] Go to Settings → Environment Variables
- [ ] Update **VITE_APP_URL** with actual URL
- [ ] Go to Deployments → click "..." → "Redeploy"
- [ ] Wait for redeploy to complete

**Time:** 5 minutes

---

## ☑️ Configure Supabase Redirect URLs (2 minutes)

### Add URLs
- [ ] Go back to Supabase dashboard
- [ ] Go to Authentication → URL Configuration
- [ ] Set **Site URL**: Your Vercel URL
  - Example: `https://aura-os-xyz.vercel.app`

- [ ] Add to **Redirect URLs**:
  - [ ] `https://aura-os-xyz.vercel.app`
  - [ ] `https://aura-os-xyz.vercel.app/**`
  - [ ] `http://localhost:3000` (for local dev)

- [ ] Click "Save"

**Time:** 2 minutes

---

## ☑️ Test Production Deployment (3 minutes)

### Test Waitlist Flow
- [ ] Visit your Vercel URL
- [ ] Should see Auth screen (not error)
- [ ] Click "Waitlist" tab
- [ ] Enter test email (e.g., `test@example.com`)
- [ ] Fill in name, company (optional)
- [ ] Click "Join Waitlist"
- [ ] Should see: "Successfully joined the waitlist!"

### Verify in Supabase
- [ ] Go to Supabase → Table Editor → waitlist
- [ ] Should see your test email
- [ ] Status should be `pending`

### Test Approval Flow
- [ ] Click the test user row in Supabase
- [ ] Change `status` from `pending` to `approved`
- [ ] Click Save
- [ ] Go back to app
- [ ] Click "Sign Up" tab
- [ ] Enter same test email
- [ ] Create password (min 8 characters)
- [ ] Click "Create Account"
- [ ] Should see: "Check your email to verify"

### Verify Email
- [ ] Check email inbox
- [ ] Find "Confirm your email" from Supabase
- [ ] Click confirmation link
- [ ] Should redirect to app

### Test Sign In
- [ ] Go to app
- [ ] Click "Sign In" tab
- [ ] Enter test email + password
- [ ] Click "Sign In"
- [ ] Should see Dashboard ✅

### Test Features
- [ ] Click "PRD Generator"
- [ ] Enter: "AI-powered search"
- [ ] Click "Generate PRD"
- [ ] Should see formatted PRD ✅
- [ ] Go to Settings
- [ ] Should see your email
- [ ] Click "Sign Out"
- [ ] Should return to auth screen ✅

**Time:** 3 minutes

---

## ☑️ Security & Monitoring (Optional)

### Security
- [ ] Enable 2FA on Supabase account
- [ ] Enable 2FA on Vercel account
- [ ] Change Supabase database password
- [ ] Review Supabase RLS policies

### Monitoring
- [ ] Set up Vercel email alerts
- [ ] Bookmark Supabase dashboard
- [ ] Bookmark Vercel dashboard

---

## ☑️ Share with Beta Users

### Approve First Users
- [ ] Decide approval strategy:
  - Manual (approve each signup)
  - Batch (approve 10 at a time)
  - Auto (approve everyone - not recommended for beta)

- [ ] Share app URL with beta testers
- [ ] Send instructions:
  1. Go to [your-url].vercel.app
  2. Join waitlist
  3. Wait for approval email
  4. Create account
  5. Start using!

### Collect Feedback
- [ ] Set up feedback form (Google Forms, Typeform)
- [ ] Monitor Supabase logs for errors
- [ ] Check Vercel logs for deployment issues

---

## 📊 Post-Deployment

### Day 1
- [ ] Monitor for signup errors
- [ ] Approve first 5-10 beta users
- [ ] Check email delivery (confirmations sent?)
- [ ] Test sign in from different device

### Week 1
- [ ] Review user activity in Supabase
- [ ] Check Vercel bandwidth usage
- [ ] Collect user feedback
- [ ] Fix any reported bugs

### Month 1
- [ ] Review metrics:
  - Total signups
  - Approval rate
  - Active users
  - Feature usage
- [ ] Decide if ready to scale

---

## 🚨 Troubleshooting

### Deployment fails on Vercel
- [ ] Check build logs in Vercel dashboard
- [ ] Verify all environment variables are set
- [ ] Try rebuilding: Deployments → "..." → "Redeploy"

### Auth screen shows error
- [ ] Check browser console for errors
- [ ] Verify Supabase credentials in Vercel env vars
- [ ] Verify redirect URLs in Supabase

### Email not sending
- [ ] Check Supabase → Authentication → Providers → Email is ON
- [ ] Check spam folder
- [ ] Verify email in Supabase → Authentication → Users

### Can't sign in after creating account
- [ ] Verify email was confirmed
- [ ] Check Supabase → Authentication → Users → verify status
- [ ] Try password reset

---

## ✅ Success Criteria

Your deployment is successful when:

- [x] App loads at Vercel URL (no white screen)
- [x] Can join waitlist
- [x] User appears in Supabase waitlist table
- [x] Can approve user in Supabase
- [x] Can create account with approved email
- [x] Receive confirmation email
- [x] Can sign in after email confirmation
- [x] See Dashboard after sign in
- [x] Can generate PRD
- [x] Can sign out

---

## 📈 Next Steps

After successful deployment:

1. **Week 1:** Approve 10-20 beta users, collect feedback
2. **Week 2:** Add Claude LLM integration to PRD workflow
3. **Week 3:** Implement user feedback, add features
4. **Month 2:** Scale to 100+ users
5. **Month 3:** Consider upgrading Supabase/Vercel plans

---

**Total Deployment Time:** ~12 minutes
**Status:** Ready for Production
**Cost:** $0/month (free tier)

---

## 📞 Need Help?

- **Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Local Development:** [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
- **Supabase Docs:** [docs.supabase.com](https://docs.supabase.com)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)

Good luck! 🚀
