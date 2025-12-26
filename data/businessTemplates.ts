import { BusinessTemplate } from '../types/advanced';
import { PM_TEMPLATES } from './pmTemplates';

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  // PM Templates (Product Management focused)
  ...PM_TEMPLATES,

  // E-commerce & Business Templates
  {
    id: 'shopify_quickstart',
    name: 'Shopify Quick Start',
    category: 'e-commerce',
    description: 'Simple workflow to test your Shopify integration - fetches recent orders and sends summary',
    longDescription: 'A quick start workflow to verify your Shopify connection is working correctly. Fetches your recent orders, calculates total revenue, and displays results.',
    useCase: 'Perfect for testing your Shopify integration before building more complex workflows.',
    complexity: 'beginner',
    estimatedSetupTime: 5,
    requiredIntegrations: ['shopify'],
    optionalIntegrations: [],
    workflow: {
      prompt: `Build a simple Shopify test workflow:
1. **Start Node**: Initialize workflow
2. **Shopify Orders Agent**: Fetch last 10 orders from Shopify
   - Use 'shopify_get_orders' action
   - Parameters: { status: 'any', limit: 10 }
3. **Data Analysis Agent**: Calculate order statistics
   - Count total orders
   - Sum total revenue
   - Identify top products
4. **Summary Agent**: Generate summary report
5. **End Node**: Display results

This is a simple test to verify Shopify integration is working.`
    },
    configuration: [
      { key: 'shopify_credential', label: 'Shopify Credentials', type: 'credential', required: true, description: 'Select your Shopify store credentials' }
    ],
    roi: 'Test workflow - verifies integration setup',
    testimonials: [],
    icon: '🛍️',
    tags: ['shopify', 'quickstart', 'test', 'e-commerce'],
    popularity: 1000,
    createdAt: Date.now()
  },

  {
    id: 'ecommerce_abandoned_cart',
    name: 'Abandoned Cart Recovery',
    category: 'e-commerce',
    description: 'Automatically recover abandoned carts with AI-personalized emails and SMS',
    longDescription: 'When a customer adds items to cart but doesn\'t complete checkout, this workflow automatically sends a personalized recovery sequence via email and SMS. Uses AI to analyze customer behavior and craft compelling messages with dynamic discount offers.',
    useCase: 'E-commerce stores losing $18B annually to cart abandonment. Recover 10-30% of abandoned carts automatically.',
    complexity: 'intermediate',
    estimatedSetupTime: 15,
    requiredIntegrations: ['shopify', 'sendgrid'],
    optionalIntegrations: ['twilio', 'stripe'],
    workflow: {
      prompt: `Build an abandoned cart recovery system:
1. **Trigger**: Shopify webhook when cart is abandoned (30 min no activity)
2. **Data Enrichment Agent**: Fetch customer purchase history and cart value
3. **AI Personalization Agent**: Analyze customer data and generate personalized email copy
   - Use past purchase patterns
   - Calculate optimal discount (5-15% based on cart value)
   - Craft urgency messaging
4. **Email Agent**: Send personalized recovery email via SendGrid
5. **Wait Node**: 4 hours
6. **Conditional Router**:
   - If cart still abandoned → Continue
   - If purchased → End workflow
7. **SMS Agent** (optional): Send follow-up SMS via Twilio with limited-time discount
8. **Wait Node**: 20 hours
9. **Final Email Agent**: Last chance email with highest discount
10. **Analytics Agent**: Log conversion data to tracking system

Use retry logic for all API calls with exponential backoff.
Include fallback templates if AI generation fails.`
    },
    configuration: [
      { key: 'shopify_store', label: 'Shopify Store URL', type: 'text', required: true, description: 'Your Shopify store domain' },
      { key: 'sendgrid_credential', label: 'SendGrid API Key', type: 'credential', required: true, description: 'SendGrid API credentials' },
      { key: 'from_email', label: 'From Email', type: 'text', required: true, description: 'Email address to send from' },
      { key: 'enable_sms', label: 'Enable SMS Follow-up', type: 'select', required: false, description: 'Send SMS after email', options: [{label: 'Yes', value: true}, {label: 'No', value: false}] },
      { key: 'discount_strategy', label: 'Discount Strategy', type: 'select', required: true, description: 'How to calculate discounts', options: [{label: 'Fixed 10%', value: 'fixed'}, {label: 'Dynamic (AI-based)', value: 'dynamic'}] }
    ],
    roi: '15-30% cart recovery rate. Average $4,500 additional revenue/month for stores with 500 monthly abandonments.',
    testimonials: [
      { company: 'FashionBrand Co', role: 'E-commerce Manager', quote: 'Recovered 22% of abandoned carts in first month. ROI was immediate.', metrics: '$8,200 recovered revenue/month' }
    ],
    icon: '🛒',
    tags: ['e-commerce', 'email', 'sms', 'revenue', 'automation'],
    popularity: 950,
    createdAt: Date.now()
  },

  {
    id: 'saas_onboarding',
    name: 'AI-Powered User Onboarding',
    category: 'saas',
    description: 'Intelligent onboarding sequence that adapts to user behavior and sends targeted guidance',
    longDescription: 'Automatically onboard new SaaS users with AI-personalized email sequences, in-app messages, and Slack notifications to internal team. Tracks activation events and adjusts messaging based on user actions.',
    useCase: 'Increase user activation rate from 25% to 60%+ with personalized guidance and timely interventions.',
    complexity: 'advanced',
    estimatedSetupTime: 30,
    requiredIntegrations: ['sendgrid', 'slack'],
    optionalIntegrations: ['hubspot', 'airtable'],
    workflow: {
      prompt: `Build an adaptive user onboarding workflow:
1. **Trigger**: New user signup (webhook from app)
2. **Welcome Email Agent**: Send immediate welcome email via SendGrid
3. **Slack Notification Agent**: Alert sales team in #new-users channel
4. **User Profile Agent**: Create/update user in CRM (HubSpot)
5. **Wait Node**: 24 hours
6. **Activity Checker Agent**: Check if user completed key action (API call to app)
7. **Conditional Router**:
   - If activated → Send congratulations email, end onboarding
   - If not activated → Continue
8. **AI Guidance Agent**: Analyze which feature user needs help with
9. **Targeted Email Agent**: Send specific tutorial email
10. **Wait Node**: 48 hours
11. **Second Activity Check**: Check activation status
12. **Conditional Router**:
    - If still not activated → Alert customer success team on Slack
    - If activated → Success path
13. **Human Intervention Agent**: Create task for customer success call
14. **Analytics Agent**: Log onboarding metrics to Airtable

Include dropout detection and re-engagement paths.`
    },
    configuration: [
      { key: 'app_webhook_url', label: 'App Webhook URL', type: 'text', required: true, description: 'Your app webhook endpoint' },
      { key: 'activation_api', label: 'Activation Check API', type: 'text', required: true, description: 'API to check user activation' },
      { key: 'slack_channel', label: 'Slack Channel', type: 'text', required: true, description: 'Channel for notifications (e.g., #new-users)' },
      { key: 'key_activation_event', label: 'Key Activation Event', type: 'text', required: true, description: 'What action defines activation?' }
    ],
    roi: '2.5x increase in activation rate. Reduced customer success workload by 60%.',
    testimonials: [
      { company: 'ProjectTool SaaS', role: 'Head of Growth', quote: 'Activation rate jumped from 28% to 67% in 2 months.', metrics: '140% increase in activated users' }
    ],
    icon: '🚀',
    tags: ['saas', 'onboarding', 'activation', 'growth', 'email'],
    popularity: 880,
    createdAt: Date.now()
  },

  {
    id: 'support_ticket_routing',
    name: 'Intelligent Support Ticket Routing',
    category: 'customer-support',
    description: 'AI analyzes support tickets and routes to right team with priority and context',
    longDescription: 'Automatically categorize, prioritize, and route support tickets using AI. Analyzes sentiment, urgency, and technical complexity to assign to appropriate team member. Includes SLA monitoring and escalation.',
    useCase: 'Reduce first response time by 75% and improve customer satisfaction scores by automatically routing tickets to specialized teams.',
    complexity: 'intermediate',
    estimatedSetupTime: 20,
    requiredIntegrations: ['slack'],
    optionalIntegrations: ['sendgrid', 'twilio'],
    workflow: {
      prompt: `Build intelligent ticket routing system:
1. **Trigger**: New support ticket received (webhook/email)
2. **AI Analysis Agent**: Analyze ticket using GPT-4
   - Extract: category (billing/technical/general), urgency (low/med/high), sentiment
   - Detect: angry customer, churning signals, VIP customer
   - Summarize: core issue in 1-2 sentences
3. **Customer Lookup Agent**: Fetch customer data (plan, LTV, past tickets)
4. **Priority Calculator Agent**: Assign priority score (1-10)
   - High value customer + angry = Priority 10
   - Technical + urgent = Priority 8
   - General question = Priority 3
5. **Routing Logic Agent**: Determine best team/person
   - Billing issues → Finance team
   - Technical bugs → Engineering
   - Angry customer → Senior support
6. **Slack Notification Agent**: Post to appropriate channel with:
   - Ticket summary
   - Priority tag
   - Customer context
   - Suggested response (AI-generated)
7. **Auto-Response Agent**: Send acknowledgment email to customer
8. **SLA Monitor Agent**: Start SLA timer based on priority
9. **Escalation Agent** (runs every 30min):
   - Check if SLA breached
   - Escalate to manager if needed
10. **Follow-up Agent**: After resolution, send NPS survey

Include sentiment detection and churn risk flags.`
    },
    configuration: [
      { key: 'support_email', label: 'Support Email', type: 'text', required: true, description: 'Email where tickets arrive' },
      { key: 'slack_support_channel', label: 'Slack Support Channel', type: 'text', required: true, description: 'Main support channel' },
      { key: 'sla_high_priority', label: 'High Priority SLA (minutes)', type: 'number', required: true, description: 'Response time for P1 tickets', default: 15 },
      { key: 'enable_auto_response', label: 'Auto-acknowledge Tickets', type: 'select', required: true, description: 'Send automatic acknowledgment', options: [{label: 'Yes', value: true}, {label: 'No', value: false}] }
    ],
    roi: '75% faster first response. 40% reduction in support costs. 25% increase in CSAT.',
    testimonials: [
      { company: 'CloudHost Inc', role: 'Support Director', quote: 'Game changer for our team. Response times dropped from 4 hours to 45 minutes.', metrics: '75% faster response' }
    ],
    icon: '🎫',
    tags: ['support', 'customer-service', 'ai', 'routing', 'sla'],
    popularity: 920,
    createdAt: Date.now()
  },

  {
    id: 'lead_enrichment_scoring',
    name: 'Lead Enrichment & Scoring',
    category: 'sales',
    description: 'Automatically enrich, score, and route new leads to sales reps',
    longDescription: 'When a new lead comes in, automatically enrich with company data, score based on ICP fit, and route to appropriate sales rep. Includes Slack notifications and CRM updates.',
    useCase: 'Sales teams waste 50% of time on bad leads. This workflow qualifies leads automatically and ensures reps only talk to high-intent prospects.',
    complexity: 'intermediate',
    estimatedSetupTime: 20,
    requiredIntegrations: ['hubspot', 'slack'],
    optionalIntegrations: ['sendgrid'],
    workflow: {
      prompt: `Build lead qualification automation:
1. **Trigger**: New lead submitted (form/webhook)
2. **Data Validation Agent**: Validate email and basic info
3. **Enrichment Agent**: Fetch company data from external APIs
   - Company size, industry, revenue, tech stack
   - LinkedIn profile analysis
4. **AI Scoring Agent**: Calculate lead score (0-100)
   - ICP match: company size, industry, budget signals
   - Intent signals: job title, form responses
   - Engagement: website behavior, content downloads
5. **Conditional Router**:
   - Score 80-100 (Hot Lead) → Immediate sales notification
   - Score 50-79 (Warm Lead) → Add to nurture sequence
   - Score 0-49 (Cold Lead) → Add to long-term nurture
6. **CRM Update Agent**: Update HubSpot contact with score + enriched data
7. **For Hot Leads**:
   a. Slack Agent: Notify assigned rep with full context
   b. Email Agent: Send personalized intro email to lead
   c. Task Agent: Create follow-up task in CRM (call within 1 hour)
8. **For Warm Leads**:
   a. Add to email nurture sequence
   b. Assign to SDR for qualification call
9. **Analytics Agent**: Log lead source, score, and routing to dashboard

Include deduplication and existing customer checks.`
    },
    configuration: [
      { key: 'form_source', label: 'Lead Form Source', type: 'text', required: true, description: 'Where leads come from (URL or integration)' },
      { key: 'icp_criteria', label: 'Ideal Customer Profile', type: 'text', required: true, description: 'Describe your ideal customer' },
      { key: 'hot_lead_threshold', label: 'Hot Lead Score Threshold', type: 'number', required: true, description: 'Minimum score for immediate routing', default: 80 },
      { key: 'sales_slack_channel', label: 'Sales Slack Channel', type: 'text', required: true, description: 'Channel for hot lead alerts' }
    ],
    roi: 'Sales reps spend 3x more time on qualified leads. Close rate increased 45%.',
    testimonials: [
      { company: 'B2B Software Co', role: 'VP Sales', quote: 'Our reps now only talk to pre-qualified leads. Close rate went from 12% to 23%.', metrics: '45% higher close rate' }
    ],
    icon: '🎯',
    tags: ['sales', 'lead-gen', 'crm', 'enrichment', 'scoring'],
    popularity: 890,
    createdAt: Date.now()
  },

  {
    id: 'invoice_payment_reminder',
    name: 'Automated Invoice & Payment Reminders',
    category: 'finance',
    description: 'Send smart payment reminders and handle dunning automatically',
    longDescription: 'Automatically send payment reminders for overdue invoices with escalating urgency. Handles payment failures, retries, and subscription pausing. Integrates with Stripe and accounting software.',
    useCase: 'Reduce DSO (Days Sales Outstanding) by 40% and improve cash flow with automated, polite payment reminders.',
    complexity: 'intermediate',
    estimatedSetupTime: 25,
    requiredIntegrations: ['stripe', 'sendgrid'],
    optionalIntegrations: ['slack', 'airtable'],
    workflow: {
      prompt: `Build automated dunning and payment reminder system:
1. **Scheduled Trigger**: Run daily at 9 AM
2. **Invoice Checker Agent**: Fetch all overdue invoices from Stripe
3. **For Each Overdue Invoice**:
   a. Customer Lookup Agent: Get customer details and payment history
   b. Days Overdue Calculator: Calculate how many days overdue
   c. Conditional Router by Days Overdue:
      - 1-3 days: Gentle reminder email
      - 4-7 days: Urgent reminder + payment link
      - 8-14 days: Final notice before service pause
      - 15+ days: Pause service + escalation
   d. AI Email Generator: Create appropriate email based on:
      - Customer relationship (new vs loyal)
      - Invoice amount
      - Payment history
   e. SendGrid Agent: Send personalized email
   f. For 15+ days overdue:
      - Stripe Agent: Pause subscription
      - Slack Agent: Alert finance team
      - CRM Agent: Flag account for review
4. **Payment Retry Agent**: For failed payments, retry with:
   - Day 1: Immediate retry
   - Day 3: Second retry
   - Day 7: Contact customer
5. **Success Handler**: On payment received:
   - Send thank you email
   - Update accounting system
   - Remove from dunning sequence
6. **Analytics Agent**: Track collection rates and email effectiveness

Include customer communication preferences and whitelisting for VIP customers.`
    },
    configuration: [
      { key: 'stripe_credential', label: 'Stripe API Key', type: 'credential', required: true, description: 'Stripe API credentials' },
      { key: 'grace_period', label: 'Grace Period (days)', type: 'number', required: true, description: 'Days before first reminder', default: 1 },
      { key: 'pause_after_days', label: 'Pause Service After (days)', type: 'number', required: true, description: 'When to pause service', default: 15 },
      { key: 'finance_slack_channel', label: 'Finance Team Slack', type: 'text', required: false, description: 'Channel for escalations' }
    ],
    roi: '40% reduction in DSO. 85% payment recovery rate. 10 hours/week saved in manual follow-ups.',
    testimonials: [
      { company: 'SaaS Metrics Inc', role: 'CFO', quote: 'Cash flow improved dramatically. We recover 85% of late payments automatically now.', metrics: '40% lower DSO' }
    ],
    icon: '💰',
    tags: ['finance', 'payments', 'dunning', 'stripe', 'automation'],
    popularity: 870,
    createdAt: Date.now()
  },

  {
    id: 'content_social_media',
    name: 'AI Content Creation & Social Distribution',
    category: 'marketing',
    description: 'Generate blog posts, social content, and distribute across channels automatically',
    longDescription: 'Use AI to generate blog content, create social media variations, schedule posts, and track engagement. Includes SEO optimization and multi-platform distribution.',
    useCase: 'Marketing teams spend 15+ hours/week on content creation. Automate 70% of routine content generation and distribution.',
    complexity: 'advanced',
    estimatedSetupTime: 35,
    requiredIntegrations: ['openai'],
    optionalIntegrations: ['notion', 'slack', 'airtable'],
    workflow: {
      prompt: `Build AI-powered content creation and distribution system:
1. **Scheduled Trigger**: Weekly content generation (Monday 8 AM)
2. **Topic Research Agent**: Analyze trending topics in industry
   - Google Trends API
   - Competitor content analysis
   - Social media listening
3. **AI Content Generator** (OpenAI GPT-4):
   - Generate 2000-word blog post
   - SEO optimization (keywords, meta description)
   - Include data and statistics
4. **Quality Review Agent**: Check for:
   - Factual accuracy
   - Readability score
   - SEO best practices
5. **Image Generation Agent**: Create featured image (DALL-E or Unsplash)
6. **CMS Publisher Agent**: Publish to blog/Notion
7. **Social Media Repurposing Agent**: Create variations for:
   - Twitter/X: Thread (8-10 tweets)
   - LinkedIn: Professional post
   - Instagram: Caption + story ideas
   - Facebook: Engagement post
8. **Scheduling Agent**: Schedule posts across platforms
   - Best time analysis per platform
   - Stagger throughout week
9. **Slack Notification Agent**: Alert team with preview links
10. **Analytics Tracker**: Monitor:
    - Engagement rates
    - Click-through rates
    - Top performing content
11. **Optimization Agent**: Analyze what content performs best
    - Adjust future topics
    - Optimize posting times

Include brand voice consistency checks and human approval checkpoints for sensitive topics.`
    },
    configuration: [
      { key: 'openai_credential', label: 'OpenAI API Key', type: 'credential', required: true, description: 'OpenAI API credentials' },
      { key: 'content_topics', label: 'Content Topics', type: 'text', required: true, description: 'Core topics to write about (comma-separated)' },
      { key: 'brand_voice', label: 'Brand Voice', type: 'text', required: true, description: 'Describe your brand voice and tone' },
      { key: 'platforms', label: 'Social Platforms', type: 'multi_select', required: true, description: 'Which platforms to post on', options: [{label: 'Twitter', value: 'twitter'}, {label: 'LinkedIn', value: 'linkedin'}, {label: 'Instagram', value: 'instagram'}] }
    ],
    roi: '15 hours/week saved. 3x increase in content output. 45% more organic traffic.',
    testimonials: [
      { company: 'MarketingPro Agency', role: 'Content Director', quote: 'We went from 2 blog posts/week to 10 with AI automation. Quality is consistently high.', metrics: '5x content output' }
    ],
    icon: '📝',
    tags: ['marketing', 'content', 'ai', 'social-media', 'seo'],
    popularity: 910,
    createdAt: Date.now()
  }
];

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): BusinessTemplate[] {
  return BUSINESS_TEMPLATES.filter(t => t.category === category);
}

// Helper function to get popular templates
export function getPopularTemplates(limit: number = 5): BusinessTemplate[] {
  return [...BUSINESS_TEMPLATES].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

// Helper function to search templates
export function searchTemplates(query: string): BusinessTemplate[] {
  const lowerQuery = query.toLowerCase();
  return BUSINESS_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.includes(lowerQuery))
  );
}
