/**
 * AGENT THOUGHTS PANEL
 *
 * Real-time visualization of multi-agent orchestration
 * Shows which agent is currently active and what they're thinking
 */

import React from 'react';
import { ExecutionStep } from '../types';
import { Bot, Brain, Lightbulb, Wrench, Shield, Activity, Target, BookOpen, Loader2 } from 'lucide-react';

interface AgentThoughtsProps {
  executionLog: ExecutionStep[];
  isGenerating: boolean;
}

const AGENT_CONFIG = {
  conductor: {
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    name: 'Conductor',
    role: 'Orchestrator'
  },
  planner: {
    icon: Target,
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    name: 'Planner',
    role: 'Architect'
  },
  executor: {
    icon: Activity,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    name: 'Executor',
    role: 'Executor'
  },
  debugger: {
    icon: Wrench,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    name: 'Debugger',
    role: 'Troubleshooter'
  },
  optimizer: {
    icon: Lightbulb,
    color: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    name: 'Optimizer',
    role: 'Performance Expert'
  },
  auditor: {
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    name: 'Auditor',
    role: 'Security Guardian'
  },
  self_healer: {
    icon: Activity,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-400',
    name: 'Self-Healer',
    role: 'Recovery Specialist'
  },
  thought_manager: {
    icon: BookOpen,
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-400',
    name: 'Thought Manager',
    role: 'Learning Engine'
  },
  system: {
    icon: Bot,
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    textColor: 'text-slate-400',
    name: 'System',
    role: 'Core'
  }
};

export const AgentThoughts: React.FC<AgentThoughtsProps> = ({ executionLog, isGenerating }) => {
  const getAgentConfig = (nodeId: string) => {
    const key = nodeId.toLowerCase().replace(/[^a-z_]/g, '');
    return AGENT_CONFIG[key as keyof typeof AGENT_CONFIG] || AGENT_CONFIG.system;
  };

  // Get the last 5 agent thoughts
  const recentThoughts = executionLog.slice(-5).reverse();
  const currentAgent = recentThoughts[0];

  if (executionLog.length === 0 && !isGenerating) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600">
        <div className="text-center">
          <Bot size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Agents idle. Generate a workflow to see them in action.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Current Active Agent (Compact Display) */}
      {currentAgent && (
        <div className="px-3 py-2 border-b border-slate-800 shrink-0">
          {(() => {
            const config = getAgentConfig(currentAgent.nodeId);
            const Icon = config.icon;
            return (
              <div className="flex items-start gap-2">
                {/* Agent Avatar */}
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shadow flex-shrink-0`}>
                  <Icon size={16} className="text-white" />
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-xs font-bold ${config.textColor}`}>{config.name}</h4>
                    {isGenerating && (
                      <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                    )}
                  </div>

                  {/* Thought Output */}
                  <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {currentAgent.output}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Recent Agent Activity Timeline */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Recent Activity
        </h4>

        <div className="space-y-2">
          {recentThoughts.slice(1).map((thought, idx) => {
            const config = getAgentConfig(thought.nodeId);
            const Icon = config.icon;

            return (
              <div
                key={`${thought.nodeId}-${thought.timestamp}`}
                className="flex items-start gap-2 p-2 rounded hover:bg-slate-800/50 transition"
              >
                {/* Small Agent Icon */}
                <div className={`w-6 h-6 rounded bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={12} className="text-white" />
                </div>

                {/* Compact Thought */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold ${config.textColor}`}>{config.name}</span>
                    <span className="text-[9px] text-slate-600">
                      {new Date(thought.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 font-mono leading-relaxed">
                    {thought.output}
                  </p>
                </div>

                {/* Status Indicator */}
                {thought.status === 'completed' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1"></div>
                )}
                {thought.status === 'failed' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1"></div>
                )}
              </div>
            );
          })}
        </div>

        {recentThoughts.length <= 1 && (
          <div className="text-center py-4 text-slate-600 text-[10px]">
            No previous activity yet
          </div>
        )}
      </div>
    </div>
  );
};
