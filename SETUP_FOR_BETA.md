# Setup Guide for Beta Release

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend server
cd server
npm install
cd ..
```

### 2. Environment Variables

Create `.env.local` in root:
```env
# Groq AI (Required)
VITE_GROQ_API_KEY=your_groq_api_key

# Backend URL
VITE_API_URL=http://localhost:3001

# Real API Keys (For beta testing)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_SHOPIFY_STORE_URL=your-store.myshopify.com
```

Create `server/.env`:
```env
# Server
PORT=3001
NODE_ENV=development

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Shopify
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...

# SendGrid
SENDGRID_API_KEY=SG...

# Webhooks
WEBHOOK_SECRET=your_secret_key
NGROK_AUTH_TOKEN=your_ngrok_token
```

### 3. Run Development Servers

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server
npm run dev

# Terminal 3: Ngrok tunnel (for webhooks)
ngrok http 3001
```

## Real API Integration Setup

### Stripe

1. **Create Stripe Account**: https://dashboard.stripe.com/register
2. **Get API Keys**: Developers → API Keys
   - Copy `Publishable key` → `VITE_STRIPE_PUBLIC_KEY`
   - Copy `Secret key` → `STRIPE_SECRET_KEY`
3. **Set up Webhook**:
   - Developers → Webhooks → Add endpoint
   - URL: `https://your-ngrok-url.ngrok.io/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `customer.subscription.created`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### Shopify

1. **Create Shopify Partner Account**: https://partners.shopify.com/
2. **Create App**:
   - Apps → Create app → Public app
   - App URL: `http://localhost:3000`
   - Allowed redirection URL: `http://localhost:3000/auth/shopify/callback`
3. **Get Credentials**:
   - Copy `API key` → `SHOPIFY_API_KEY`
   - Copy `API secret key` → `SHOPIFY_API_SECRET`
4. **Install on Development Store**:
   - Create development store
   - Install your app
   - Grant permissions

### SendGrid

1. **Create SendGrid Account**: https://signup.sendgrid.com/
2. **Get API Key**:
   - Settings → API Keys → Create API Key
   - Full Access
   - Copy key → `SENDGRID_API_KEY`
3. **Verify Sender**:
   - Settings → Sender Authentication
   - Verify single sender email
4. **Domain Authentication** (Production):
   - Settings → Sender Authentication → Authenticate Your Domain

## MCP Server Setup

### 1. Install MCP CLI

```bash
npm install -g @modelcontextprotocol/cli
```

### 2. Available MCP Servers

#### File System Server
```bash
# In server/mcp-servers/
npx -y @modelcontextprotocol/server-filesystem /tmp
```

**Tools Available**:
- `read_file` - Read file contents
- `write_file` - Write to file
- `list_directory` - List files
- `create_directory` - Make directory
- `move_file` - Move/rename file
- `delete_file` - Delete file

#### GitHub Server
```bash
# Set token
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...

# Run server
npx -y @modelcontextprotocol/server-github
```

**Tools Available**:
- `create_or_update_file` - Push changes
- `search_repositories` - Find repos
- `create_repository` - New repo
- `get_file_contents` - Read file
- `create_issue` - New issue
- `create_pull_request` - New PR

#### Slack Server
```bash
# Set tokens
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_TEAM_ID=T...

# Run server
npx -y @modelcontextprotocol/server-slack
```

**Tools Available**:
- `slack_list_channels` - List all channels
- `slack_post_message` - Send message
- `slack_reply_to_thread` - Reply
- `slack_add_reaction` - React to message
- `slack_get_channel_history` - Read messages

### 3. Configure in AURA

1. Navigate to **Settings** → **MCP Servers**
2. Click **Add Server**
3. Select server type
4. Enter credentials
5. Click **Connect**
6. Verify tools are loaded

## Database Setup (Optional - for production)

### Supabase

1. **Create Project**: https://supabase.com/dashboard
2. **Get Credentials**:
   - Settings → API → Project URL → `VITE_SUPABASE_URL`
   - Settings → API → anon public → `VITE_SUPABASE_ANON_KEY`
3. **Create Tables**:
   ```sql
   -- Flows table
   CREATE TABLE flows (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id UUID NOT NULL,
     name TEXT NOT NULL,
     description TEXT,
     status TEXT NOT NULL,
     definition JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Executions table
   CREATE TABLE executions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     flow_id UUID REFERENCES flows(id),
     status TEXT NOT NULL,
     started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     completed_at TIMESTAMP WITH TIME ZONE,
     logs JSONB,
     error TEXT
   );

   -- Credentials table (encrypted)
   CREATE TABLE credentials (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id UUID NOT NULL,
     integration_id TEXT NOT NULL,
     name TEXT NOT NULL,
     credentials JSONB NOT NULL, -- Encrypted
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     last_used_at TIMESTAMP WITH TIME ZONE
   );
   ```

4. **Enable Row Level Security**:
   ```sql
   ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
   ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

   -- Policy: Users can only access their tenant's data
   CREATE POLICY tenant_isolation ON flows
     USING (tenant_id = (SELECT id FROM tenants WHERE user_id = auth.uid()));
   ```

### Redis (for queues)

```bash
# Local development
docker run -d -p 6379:6379 redis:7-alpine

# Or use Upstash (free tier)
# https://upstash.com/
```

## Testing Real Integrations

### Test Stripe Payment

```typescript
// In AURA workflow:
const workflow = `
Create a payment processing workflow:
1. Create Stripe customer
2. Create payment intent for $10
3. Send confirmation email via SendGrid
`;

// Expected result:
// ✅ Customer created: cus_...
// ✅ Payment intent: pi_...
// ✅ Email sent to customer
```

### Test Shopify Order

```typescript
// In AURA workflow:
const workflow = `
When new Shopify order is created:
1. Get order details
2. Calculate shipping
3. Send order confirmation via SendGrid
4. Notify team on Slack
`;

// Test with Shopify webhook:
POST /webhooks/shopify/{workflowId}
{
  "id": 123456,
  "email": "customer@example.com",
  "total_price": "99.00",
  "line_items": [...]
}
```

### Test MCP Tools

```typescript
// In AURA workflow:
const workflow = `
Use GitHub MCP to:
1. Search for repositories with "automation"
2. Read the README file
3. Create a summary
4. Post summary to Slack
`;

// Expected result:
// ✅ Found 50 repositories
// ✅ Read README from top 5
// ✅ AI summary generated
// ✅ Posted to #automation-updates
```

## Beta User Checklist

Before inviting beta users, ensure:

### ✅ Core Features Working
- [ ] User can sign up/sign in
- [ ] Workflow generation works
- [ ] At least 3 real integrations functional
- [ ] Execution history saved
- [ ] Error handling with retry logic
- [ ] Webhooks receiving and processing
- [ ] MCP tools callable from workflows

### ✅ Security
- [ ] API keys encrypted at rest
- [ ] HTTPS enabled (production)
- [ ] CORS configured properly
- [ ] Webhook signatures verified
- [ ] Rate limiting enabled
- [ ] SQL injection prevented
- [ ] XSS protection enabled

### ✅ UX/UI
- [ ] Onboarding flow complete
- [ ] All buttons have loading states
- [ ] Errors display user-friendly messages
- [ ] Mobile responsive (basic)
- [ ] Dark mode working
- [ ] Tooltips for complex features

### ✅ Documentation
- [ ] Getting started guide
- [ ] Video tutorial (5 min)
- [ ] API integration guides
- [ ] MCP setup guide
- [ ] Troubleshooting page
- [ ] FAQ section

### ✅ Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (PostHog)
- [ ] Logging (structured JSON)
- [ ] Uptime monitoring
- [ ] Performance tracking

## Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Backend (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd server
railway up
```

### Webhooks (Cloudflare Workers)

```bash
# Install Wrangler
npm i -g wrangler

# Deploy
cd server/webhooks
wrangler deploy
```

## Beta Invitation Email Template

```
Subject: You're invited to beta test AURA Automate! 🚀

Hi [Name],

You've been selected for early access to AURA Automate - the AI-native automation platform that builds workflows from natural language.

🎯 What you can do:
- Connect Stripe, Shopify, SendGrid in minutes
- Build automation with plain English
- AI agents handle errors automatically
- See results in real-time

📝 Getting Started:
1. Sign up: https://app.aura-automate.com/beta
2. Use code: BETA2024
3. Watch 5-min tutorial
4. Build your first workflow

💬 We'd love your feedback!
- Weekly check-in calls
- Direct Slack channel access
- Priority feature requests

Let's automate together!

[Your Name]
Founder, AURA Automate
```

## Support Channels

### Discord Server
- #general - Introductions
- #support - Get help
- #feature-requests - Ideas
- #showcase - Share workflows

### Email
- support@aura-automate.com
- Response time: <24 hours

### Documentation
- docs.aura-automate.com

## Next Steps

1. **This Week**: Set up real APIs (Stripe, Shopify, SendGrid)
2. **Next Week**: Deploy backend + webhooks
3. **Week 3**: Invite first 10 beta users
4. **Week 4**: Iterate based on feedback
5. **Week 5-6**: Scale to 50-100 users

---

**Questions?** Open an issue or email founders@aura-automate.com
