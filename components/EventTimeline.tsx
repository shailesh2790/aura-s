/**
 * Event Timeline - Real-time Event Visualization
 *
 * Displays run execution events in chronological order with:
 * - Color-coded event types
 * - Expandable event details
 * - Real-time updates via event subscriptions
 * - Metrics dashboard (events count, latency)
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  Zap,
  Database,
  GitBranch,
  Shield,
  TrendingUp
} from 'lucide-react';
import { Event } from '../types/advanced';

interface EventTimelineProps {
  runId: string;
  events: Event[];
  onRefresh?: () => void;
}

// Event type to icon/color mapping
const eventConfig: Record<string, { icon: any; color: string; label: string }> = {
  'run.started': { icon: PlayCircle, color: 'blue', label: 'Run Started' },
  'run.approved': { icon: CheckCircle, color: 'green', label: 'Approved' },
  'run.completed': { icon: CheckCircle, color: 'green', label: 'Completed' },
  'run.failed': { icon: XCircle, color: 'red', label: 'Failed' },
  'run.paused': { icon: PauseCircle, color: 'yellow', label: 'Paused' },
  'run.cancelled': { icon: XCircle, color: 'gray', label: 'Cancelled' },

  'step.started': { icon: Activity, color: 'blue', label: 'Step Started' },
  'step.completed': { icon: CheckCircle, color: 'green', label: 'Step Completed' },
  'step.failed': { icon: XCircle, color: 'red', label: 'Step Failed' },
  'step.retrying': { icon: Clock, color: 'yellow', label: 'Retrying' },

  'tool.called': { icon: Zap, color: 'purple', label: 'Tool Called' },
  'tool.completed': { icon: CheckCircle, color: 'green', label: 'Tool Completed' },
  'tool.failed': { icon: XCircle, color: 'red', label: 'Tool Failed' },

  'verification.started': { icon: Shield, color: 'blue', label: 'Verification Started' },
  'verification.completed': { icon: CheckCircle, color: 'green', label: 'Verified' },
  'verification.failed': { icon: XCircle, color: 'red', label: 'Verification Failed' },

  'artifact.created': { icon: Database, color: 'indigo', label: 'Artifact Created' },
  'artifact.verified': { icon: Shield, color: 'green', label: 'Artifact Verified' },

  'memory.accessed': { icon: Database, color: 'purple', label: 'Memory Accessed' },
  'memory.created': { icon: Database, color: 'blue', label: 'Memory Created' },

  'approval.requested': { icon: AlertCircle, color: 'yellow', label: 'Approval Requested' },
  'approval.granted': { icon: CheckCircle, color: 'green', label: 'Approval Granted' },
  'approval.denied': { icon: XCircle, color: 'red', label: 'Approval Denied' },

  'policy.violation': { icon: AlertCircle, color: 'red', label: 'Policy Violation' },
  'cost.limit_warning': { icon: TrendingUp, color: 'yellow', label: 'Cost Warning' },
  'replan.triggered': { icon: GitBranch, color: 'orange', label: 'Replanning' }
};

export default function EventTimeline({ runId, events, onRefresh }: EventTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');

  // Toggle event expansion
  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.type.startsWith(filter);
  });

  // Calculate stats
  const stats = {
    total: events.length,
    run: events.filter(e => e.type.startsWith('run.')).length,
    step: events.filter(e => e.type.startsWith('step.')).length,
    tool: events.filter(e => e.type.startsWith('tool.')).length,
    errors: events.filter(e => e.type.includes('failed') || e.type.includes('violation')).length
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Event Timeline</h2>
          <p className="text-slate-600 text-sm mt-1">Run ID: {runId}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 rounded-lg transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-slate-600 text-xs font-medium">Total Events</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-slate-600 text-xs font-medium">Run Events</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{stats.run}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-slate-600 text-xs font-medium">Step Events</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{stats.step}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-slate-600 text-xs font-medium">Tool Calls</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{stats.tool}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-slate-600 text-xs font-medium">Errors</div>
          <div className="text-2xl font-semibold text-red-600 mt-1">{stats.errors}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'run', 'step', 'tool', 'verification', 'artifact'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === filterType
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No events to display
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const config = eventConfig[event.type] || {
              icon: Activity,
              color: 'slate',
              label: event.type
            };
            const Icon = config.icon;
            const isExpanded = expandedEvents.has(event.id);
            const isLast = index === filteredEvents.length - 1;

            // Map colors to actual CSS classes (no dynamic)
            const colorClasses = {
              blue: { icon: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              green: { icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
              red: { icon: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              yellow: { icon: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
              purple: { icon: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
              indigo: { icon: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
              orange: { icon: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
              gray: { icon: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
              slate: { icon: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' }
            };

            const colors = colorClasses[config.color as keyof typeof colorClasses] || colorClasses.slate;

            return (
              <div key={event.id} className="relative">
                {/* Event card */}
                <div
                  onClick={() => toggleEvent(event.id)}
                  className="group cursor-pointer bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                      <Icon size={16} className={colors.icon} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-slate-900 font-medium text-sm">{config.label}</h3>
                          <p className="text-slate-500 text-xs mt-0.5">{event.type}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-600 text-xs font-mono">
                            {formatTime(event.timestamp)}
                          </div>
                          {(event as any).duration && (
                            <div className="text-slate-500 text-xs mt-1">
                              {formatDuration((event as any).duration)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <pre className="text-xs text-slate-700 overflow-x-auto bg-slate-50 p-3 rounded-md border border-slate-200">
                            {JSON.stringify(event, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
