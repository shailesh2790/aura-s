
import React, { useState } from 'react';
import { Activity, Zap, Shield, Clock, Users, ArrowUpRight, ArrowRight, Play, AlertCircle, ShoppingBag, FileSpreadsheet, MessageCircle, Mail, FileText, Target, TrendingUp, BarChart3, Sparkles, Search, CheckSquare, ListTodo, PenTool, Brain, BookOpen, GitBranch, RefreshCw, Eye, CheckCircle2, Rocket, Plus, Code, Database, BarChart, Wand2 } from 'lucide-react';
import { DashboardStat, RecentFlow, Template } from '../types';
import { useWorkflow } from '../context/WorkflowContext';

interface DashboardProps {
    onCreateNew: () => void;
}

const pmAgents = [
    { name: 'Intent Engine', desc: 'Transforms goals into plans', color: 'from-violet-500 to-purple-600', icon: '🧠', status: 'live' },
    { name: 'Research Agent', desc: 'Competitive & market research', color: 'from-indigo-500 to-blue-600', icon: '🔍', status: 'live' },
    { name: 'PRD Writer', desc: 'Professional documentation', color: 'from-blue-500 to-cyan-600', icon: '📄', status: 'live' },
    { name: 'Analyst Agent', desc: 'Metrics & insights', color: 'from-emerald-500 to-teal-600', icon: '📊', status: 'beta' },
    { name: 'Jira Manager', desc: 'Ticket automation', color: 'from-amber-500 to-orange-600', icon: '✓', status: 'soon' },
];

const quickActions = [
    {
        id: 'prd',
        title: 'Generate PRD',
        description: 'From idea to comprehensive PRD in 2 minutes',
        icon: FileText,
        gradient: 'from-blue-500 via-blue-600 to-indigo-600',
        prompt: 'Create a detailed PRD for [your feature name]. Include problem statement, objectives, KPIs, requirements, and user stories.',
        timeSaved: '4-8h',
        badge: 'Most Popular'
    },
    {
        id: 'competitive',
        title: 'Competitive Analysis',
        description: 'Deep competitive insights with SWOT',
        icon: Target,
        gradient: 'from-purple-500 via-purple-600 to-pink-600',
        prompt: 'Conduct competitive analysis for [your product] against [competitor 1], [competitor 2], [competitor 3]. Include SWOT analysis and strategic recommendations.',
        timeSaved: '3-5h',
        badge: null
    },
    {
        id: 'automation',
        title: 'Build Automation',
        description: 'Visual workflow builder - no code needed',
        icon: Wand2,
        gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
        prompt: 'Create automation workflow for [your task]. I will help you connect apps and build the workflow visually.',
        timeSaved: '10+h',
        badge: 'New'
    },
    {
        id: 'integrate',
        title: 'Connect Apps',
        description: 'One-click Jira, Notion, Slack integration',
        icon: Database,
        gradient: 'from-amber-500 via-amber-600 to-orange-600',
        prompt: 'Help me connect [app name] to AURA OS and set up initial sync.',
        timeSaved: '1-2h',
        badge: null
    }
];

const integrations = [
    { name: 'Jira', icon: '🎯', connected: true, color: 'bg-blue-500' },
    { name: 'Notion', icon: '📝', connected: true, color: 'bg-slate-700' },
    { name: 'Slack', icon: '💬', connected: false, color: 'bg-purple-500' },
    { name: 'Linear', icon: '📊', connected: false, color: 'bg-indigo-500' },
];

const Dashboard: React.FC<DashboardProps> = ({ onCreateNew }) => {
    const { stats, recentFlows, applyTemplate, setPrompt } = useWorkflow();
    const [goalInput, setGoalInput] = useState('');
    const [isHoveredCard, setIsHoveredCard] = useState<string | null>(null);

    const displayStats: DashboardStat[] = [
        { label: 'PRDs Created', value: '12', trend: 'up', trendValue: '+3 this week', icon: FileText, color: 'text-blue-400' },
        { label: 'Hours Saved', value: '47', trend: 'up', trendValue: '+12 this week', icon: Clock, color: 'text-emerald-400' },
        { label: 'Research Reports', value: '8', trend: 'up', trendValue: '+2 today', icon: Search, color: 'text-purple-400' },
        { label: 'Active Agents', value: stats.activeAgents.toString(), trend: 'up', trendValue: 'Live', icon: Users, color: 'text-amber-400' },
    ];

    const handleTemplateClick = (t: Template) => {
        applyTemplate(t);
        onCreateNew();
    };

    const handleQuickAction = (action: typeof quickActions[0]) => {
        setPrompt(action.prompt);
        onCreateNew();
    };

    const handleGoalSubmit = () => {
        if (goalInput.trim()) {
            setPrompt(goalInput);
            onCreateNew();
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

                {/* Hero Section - PostHog Style */}
                <div className="relative">
                    {/* Gradient Background Orb */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-aura-500/20 via-indigo-500/10 to-transparent blur-3xl rounded-full -z-10" />

                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-aura-500/10 border border-aura-500/20 mb-4">
                            <Sparkles size={14} className="text-aura-400" />
                            <span className="text-xs font-medium text-aura-400">Autonomous PM Platform</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
                            Build Products Faster.<br />
                            <span className="bg-gradient-to-r from-aura-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                Without the Busywork.
                            </span>
                        </h1>

                        <p className="text-lg text-slate-400 max-w-2xl">
                            From PRDs to automation—AURA OS handles PM workflows so you can focus on building great products.
                        </p>
                    </div>

                    {/* Smart Command Bar */}
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-aura-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
                        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-1.5 shadow-2xl">
                            <div className="flex items-center gap-3 p-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-aura-500 to-indigo-600 shadow-lg">
                                    <Rocket size={20} className="text-white" />
                                </div>
                                <textarea
                                    value={goalInput}
                                    onChange={(e) => setGoalInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                            handleGoalSubmit();
                                        }
                                    }}
                                    placeholder='Try: "Create PRD for AI search feature" or "Analyze top 5 competitors" or "Build workflow to sync Jira with Notion"'
                                    className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:outline-none resize-none text-base"
                                    rows={1}
                                />
                                <button
                                    onClick={handleGoalSubmit}
                                    disabled={!goalInput.trim()}
                                    className="group/btn relative px-6 py-3 bg-gradient-to-r from-aura-500 to-indigo-600 hover:from-aura-400 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl font-semibold shadow-lg shadow-aura-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <span className="flex items-center gap-2">
                                        <Sparkles size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                        Execute
                                    </span>
                                </button>
                            </div>
                            <div className="px-4 pb-3 flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">⌘</kbd>
                                    <span>+</span>
                                    <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Enter</kbd>
                                    <span className="ml-1">to execute</span>
                                </span>
                                <span className="text-slate-700">•</span>
                                <span>AI agents will plan, execute & verify autonomously</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - Game Changer Cards */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="text-aura-400" size={24} />
                            Quick Start
                        </h2>
                        <button className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                            View all templates
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action) => (
                            <div
                                key={action.id}
                                onClick={() => handleQuickAction(action)}
                                onMouseEnter={() => setIsHoveredCard(action.id)}
                                onMouseLeave={() => setIsHoveredCard(null)}
                                className="group relative cursor-pointer"
                            >
                                {/* Hover Glow Effect */}
                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${action.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-300`} />

                                <div className="relative h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 group-hover:bg-slate-900/70 group-hover:shadow-xl">
                                    {/* Badge */}
                                    {action.badge && (
                                        <div className="absolute top-3 right-3">
                                            <span className="px-2 py-1 rounded-md bg-aura-500/20 border border-aura-500/30 text-aura-400 text-[10px] font-bold">
                                                {action.badge}
                                            </span>
                                        </div>
                                    )}

                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <action.icon size={24} className="text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-aura-400 transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed mb-4 min-h-[40px]">
                                        {action.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                                        <span className="text-xs text-emerald-400 font-semibold">
                                            Save {action.timeSaved}
                                        </span>
                                        <ArrowUpRight
                                            size={16}
                                            className={`text-slate-600 group-hover:text-aura-400 transition-all duration-300 ${isHoveredCard === action.id ? 'translate-x-0.5 -translate-y-0.5' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats Grid - PostHog Style */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {displayStats.map((stat, i) => (
                        <div key={i} className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                            <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-200">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2 rounded-lg bg-slate-800/50 ${stat.color}`}>
                                        <stat.icon size={18} />
                                    </div>
                                    <div className="text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        {stat.trendValue}
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-xs text-slate-500">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Autonomous Pipeline */}
                    <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <GitBranch size={20} className="text-aura-400" />
                            <h3 className="text-lg font-bold text-white">Autonomous Pipeline</h3>
                            <div className="ml-auto text-[10px] text-slate-500 font-mono">
                                Goal → Plan → Execute → Verify → Deliver
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { label: 'Goal', icon: Target, color: 'blue', desc: 'Intent' },
                                { label: 'Plan', icon: Brain, color: 'purple', desc: 'DAG gen' },
                                { label: 'Execute', icon: Play, color: 'emerald', desc: 'Tools' },
                                { label: 'Verify', icon: Eye, color: 'amber', desc: 'Check' },
                                { label: 'Deliver', icon: CheckCircle2, color: 'green', desc: 'Output' }
                            ].map((stage, i) => (
                                <div key={i} className="relative group/stage">
                                    <div className={`bg-${stage.color}-500/10 border border-${stage.color}-500/30 rounded-xl p-3 text-center transition-all duration-200 hover:border-${stage.color}-500/50 hover:bg-${stage.color}-500/20 cursor-pointer`}>
                                        <div className={`w-10 h-10 rounded-lg bg-${stage.color}-500/20 border border-${stage.color}-500/30 flex items-center justify-center mx-auto mb-2 group-hover/stage:scale-110 transition-transform`}>
                                            <stage.icon size={18} className={`text-${stage.color}-400`} />
                                        </div>
                                        <div className="text-xs font-bold text-white mb-0.5">{stage.label}</div>
                                        <div className="text-[10px] text-slate-500">{stage.desc}</div>
                                    </div>
                                    {i < 4 && (
                                        <ArrowRight size={12} className="absolute -right-4 top-1/2 -translate-y-1/2 text-slate-700" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Product Principles Compact */}
                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield size={16} className="text-emerald-400" />
                                <span className="text-sm font-bold text-white">Production-Grade Reliability</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { icon: GitBranch, label: 'Plan-first', color: 'blue' },
                                    { icon: CheckCircle2, label: 'Verified', color: 'emerald' },
                                    { icon: RefreshCw, label: 'Replayable', color: 'indigo' },
                                ].map((principle, i) => (
                                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${principle.color}-500/10 border border-${principle.color}-500/20`}>
                                        <principle.icon size={12} className={`text-${principle.color}-400`} />
                                        <span className="text-xs font-medium text-slate-300">{principle.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Integrations & Agents */}
                    <div className="space-y-6">
                        {/* Connected Apps */}
                        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Database size={16} className="text-aura-400" />
                                    Connected Apps
                                </h3>
                                <button className="text-xs text-aura-400 hover:text-aura-300 flex items-center gap-1">
                                    <Plus size={12} />
                                    Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {integrations.map((app, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg ${app.color} flex items-center justify-center text-base`}>
                                                {app.icon}
                                            </div>
                                            <span className="text-sm font-medium text-white">{app.name}</span>
                                        </div>
                                        {app.connected ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-[10px] text-emerald-400 font-medium">Live</span>
                                            </div>
                                        ) : (
                                            <button className="text-[10px] text-slate-500 hover:text-aura-400 transition-colors">
                                                Connect
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PM Agents */}
                        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Brain size={16} className="text-aura-400" />
                                <h3 className="text-sm font-bold text-white">PM Agents</h3>
                            </div>
                            <div className="space-y-2">
                                {pmAgents.map((agent, i) => (
                                    <div key={i} className="group/agent flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-all cursor-pointer">
                                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg shadow-lg group-hover/agent:scale-110 transition-transform`}>
                                            {agent.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white">{agent.name}</div>
                                            <div className="text-[10px] text-slate-500 truncate">{agent.desc}</div>
                                        </div>
                                        <div className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                            agent.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                            agent.status === 'beta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-slate-700/50 text-slate-500 border border-slate-700'
                                        }`}>
                                            {agent.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Activity size={16} className="text-aura-400" />
                            Recent Activity
                        </h3>
                        <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                            View all
                            <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                        {recentFlows.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                                    <Rocket size={20} className="text-slate-600" />
                                </div>
                                <p className="text-sm text-slate-500 mb-1">No recent activity</p>
                                <p className="text-xs text-slate-600">Start by generating your first PRD or automation</p>
                            </div>
                        ) : (
                            recentFlows.map((flow) => (
                                <div key={flow.id} className="p-4 flex items-center justify-between hover:bg-slate-900/50 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-2 h-2 rounded-full ${flow.status === 'active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white group-hover:text-aura-400 transition-colors truncate">
                                                {flow.name}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                <span>{new Date(flow.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>•</span>
                                                <span>{flow.agents} agents</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-800 rounded-lg transition-all">
                                        <Play size={14} className="text-slate-400" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
