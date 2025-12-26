/**
 * Pricing Component - Transparent Pricing
 *
 * Philosophy: "Don't make PMs think about pricing"
 * - Generous free tier (90% of users stay free)
 * - Usage-based, not seat-based
 * - Clear value propositions
 * - Transparent limits
 */

import React, { useState } from 'react';
import { Check, X, Zap, Users, Building2, Sparkles, ArrowRight, Clock, FileText, Search, Target } from 'lucide-react';

export const Pricing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const tiers = [
    {
      name: 'Free',
      tagline: 'Perfect for getting started',
      price: 0,
      period: 'forever',
      description: 'Everything you need to try AURA OS',
      icon: Sparkles,
      color: 'from-slate-600 to-slate-700',
      popular: false,
      limits: {
        prds: '5 PRDs/month',
        research: '10 competitive analyses',
        stories: 'Unlimited user stories',
        queries: '100 research queries',
        workspaces: '1 product workspace'
      },
      features: [
        'Intent Engine (goal → plan)',
        'Research Agent',
        'PRD Writer Agent',
        'User story generation',
        'Markdown export',
        'Community templates',
        'Email support'
      ],
      notIncluded: [
        'Jira/Linear integration',
        'Notion integration',
        'Memory layer',
        'Team collaboration',
        'Priority support'
      ],
      cta: 'Start Free',
      ctaLink: '#'
    },
    {
      name: 'Pro',
      tagline: 'For serious Product Managers',
      price: 29,
      period: 'per PM/month',
      description: 'Unlimited PM workflows + integrations',
      icon: Zap,
      color: 'from-aura-600 to-indigo-600',
      popular: true,
      limits: {
        prds: 'Unlimited PRDs',
        research: 'Unlimited competitive analyses',
        stories: 'Unlimited user stories',
        queries: 'Unlimited research',
        workspaces: '5 product workspaces'
      },
      features: [
        'Everything in Free',
        'Unlimited PRDs & research',
        'Jira integration',
        'Linear integration',
        'Notion integration',
        'Memory layer (project context)',
        'Custom templates',
        'Slack notifications',
        'Priority support',
        'Advanced analytics'
      ],
      notIncluded: [
        'Team collaboration',
        'Shared memory',
        'Admin dashboard',
        'SSO/SAML'
      ],
      cta: 'Start 14-Day Trial',
      ctaLink: '#'
    },
    {
      name: 'Team',
      tagline: 'For product organizations',
      price: 99,
      period: 'per team/month',
      subPeriod: 'up to 10 PMs',
      description: 'Collaboration + shared memory',
      icon: Users,
      color: 'from-emerald-600 to-teal-600',
      popular: false,
      limits: {
        prds: 'Unlimited everything',
        research: 'Shared memory across team',
        stories: 'Team templates',
        queries: 'Collaboration features',
        workspaces: '20 product workspaces'
      },
      features: [
        'Everything in Pro',
        'Up to 10 PMs',
        'Shared memory across team',
        'Team templates library',
        'Collaboration features',
        'Admin dashboard',
        'Usage analytics',
        'Teams/Slack integration',
        'Onboarding session',
        'Dedicated support'
      ],
      notIncluded: [
        'SSO/SAML',
        'Private deployment',
        'Custom agents',
        'SLA'
      ],
      cta: 'Start 14-Day Trial',
      ctaLink: '#'
    },
    {
      name: 'Enterprise',
      tagline: 'For large companies',
      price: null,
      period: 'custom pricing',
      description: 'Everything + custom features',
      icon: Building2,
      color: 'from-purple-600 to-pink-600',
      popular: false,
      features: [
        'Everything in Team',
        '50+ PMs',
        'SSO & SAML',
        'Private deployment',
        'Custom agents',
        'API access',
        'SLA & dedicated support',
        'Training & onboarding',
        'Custom integrations',
        'Annual contract'
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      ctaLink: '#'
    }
  ];

  const timeSavings = [
    { task: 'PRD Generation', manual: '4-8 hours', aura: '2-3 min', savings: '97%', icon: FileText },
    { task: 'Competitive Research', manual: '5-8 hours', aura: '1-2 min', savings: '95%', icon: Search },
    { task: 'Sprint Reports', manual: '2-3 hours', aura: '30 sec', savings: '99%', icon: Clock },
    { task: 'Feedback Analysis', manual: '3-4 hours', aura: '1 min', savings: '98%', icon: Target }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#030712] p-8 text-slate-200">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Transparent Pricing, Generous Free Tier
          </h1>
          <p className="text-slate-400 text-lg mb-2">
            Start free. Upgrade when your team grows. No surprises.
          </p>
          <p className="text-sm text-slate-500">
            Pricing that scales with automation value, not seat count
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-aura-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-aura-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative bg-[#0f111a] border ${
                tier.popular ? 'border-aura-500' : 'border-slate-800'
              } rounded-2xl p-6 flex flex-col ${tier.popular ? 'ring-2 ring-aura-500/20 shadow-xl shadow-aura-500/10' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-gradient-to-r from-aura-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <tier.icon size={24} className="text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{tier.tagline}</p>

                <div className="mb-2">
                  {tier.price !== null ? (
                    <>
                      <span className="text-4xl font-bold text-white">
                        ${billingPeriod === 'annual' && tier.price > 0 ? Math.floor(tier.price * 0.8) : tier.price}
                      </span>
                      <span className="text-slate-500 text-sm ml-2">{tier.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-white">Custom</span>
                  )}
                </div>
                {tier.subPeriod && (
                  <p className="text-xs text-slate-600">{tier.subPeriod}</p>
                )}
                <p className="text-sm text-slate-400 mt-2">{tier.description}</p>
              </div>

              {tier.limits && (
                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="space-y-2 text-xs">
                    {Object.values(tier.limits).map((limit, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-400">
                        <div className="w-1 h-1 rounded-full bg-aura-500"></div>
                        {limit}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 mb-6">
                <div className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                  {tier.notIncluded?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <X size={16} className="text-slate-700 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  tier.popular
                    ? 'bg-gradient-to-r from-aura-600 to-indigo-600 hover:from-aura-500 hover:to-indigo-500 text-white shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                {tier.cta} <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Time Savings Comparison */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            The Time You'll Save
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeSavings.map((item, index) => (
              <div key={index} className="bg-[#0f111a] border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-aura-600 to-indigo-600 flex items-center justify-center">
                    <item.icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.task}</h3>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Manual:</span>
                    <span className="text-red-400 font-mono">{item.manual}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">AURA OS:</span>
                    <span className="text-emerald-400 font-mono">{item.aura}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{item.savings}</div>
                    <div className="text-xs text-slate-500">time saved</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">Why is the free tier so generous?</h3>
              <p className="text-slate-400 text-sm">
                We believe 90%+ of users should be able to use AURA OS for free. We make money when teams grow and upgrade, not by nickel-and-diming individual PMs. Our model aligns with your success.
              </p>
            </div>

            <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-slate-400 text-sm">
                Yes! No contracts, no commitment. Upgrade when you need more, downgrade when you don't. You're only charged for what you use.
              </p>
            </div>

            <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">What happens if I hit my free tier limits?</h3>
              <p className="text-slate-400 text-sm">
                We'll let you know when you're close to your limits. You can either wait for the next month (limits reset) or upgrade to Pro for unlimited access.
              </p>
            </div>

            <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">Do you offer refunds?</h3>
              <p className="text-slate-400 text-sm">
                Yes. If you're not happy within the first 30 days, we'll refund you completely. No questions asked.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to save 20 hours per week?
          </h2>
          <p className="text-slate-400 mb-8">
            Join hundreds of Product Managers who've already made the switch
          </p>
          <button className="bg-gradient-to-r from-aura-600 to-indigo-600 hover:from-aura-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-aura-600/30 transition-all">
            Start Free Today <ArrowRight size={20} className="inline ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};
