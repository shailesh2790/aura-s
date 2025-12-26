/**
 * Runtime Demo - Test the AURA OS Runtime System
 *
 * Demonstrates:
 * - Event Store with real-time updates
 * - Memory Service with 4-layer scoping
 * - Idempotency with caching
 * - Executor with retry logic
 * - Event Timeline visualization
 */

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Database, Zap, Activity } from 'lucide-react';
import EventTimeline from './EventTimeline';
import {
  Run,
  Plan,
  Intent,
  DAG,
  PlanNode,
  Event,
  RetryConfig
} from '../types/advanced';
import { eventStore, calculateRunMetrics } from '../services/runtime/eventStore';
import { memoryService, setUserPreference, getUserPreference } from '../services/runtime/memoryService';
import { idempotencyService } from '../services/runtime/idempotency';
import { executor } from '../services/runtime/executor';
import { v4 as uuidv4 } from 'uuid';

export default function RuntimeDemo() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentRun, setCurrentRun] = useState<Run | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  // Subscribe to events
  useEffect(() => {
    if (!currentRun) return;

    const unsubscribe = eventStore.subscribe(currentRun.id, (event) => {
      setEvents(prev => [...prev, event]);
    });

    return unsubscribe;
  }, [currentRun]);

  // Create a demo plan
  const createDemoPlan = (): { run: Run; plan: Plan } => {
    const runId = uuidv4();

    const intent: Intent = {
      raw: 'Create a PRD for AI search feature',
      parsed: {
        type: 'prd',
        goal: 'Generate comprehensive PRD for AI-powered search',
        entities: {
          feature: 'AI Search'
        },
        constraints: {
          budget: 5000,
          max_duration: 300000, // 5 minutes
          approval_required: false
        }
      },
      confidence: 0.95,
      timestamp: Date.now()
    };

    const retryConfig: RetryConfig = {
      max_attempts: 3,
      initial_delay: 2000,
      max_delay: 16000,
      backoff_multiplier: 2.0,
      retryable_errors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
    };

    const nodes: PlanNode[] = [
      {
        id: 'step1',
        type: 'tool_call',
        tool: 'web.scrape',
        params: { url: 'https://example.com/competitors' },
        depends_on: [],
        retry_policy: retryConfig,
        timeout: 30000
      },
      {
        id: 'step2',
        type: 'llm_call',
        tool: 'llm.gpt4',
        params: { prompt: 'Analyze competitive landscape', context: '$step1' },
        depends_on: ['step1'],
        retry_policy: retryConfig,
        timeout: 60000
      },
      {
        id: 'step3',
        type: 'tool_call',
        tool: 'notion.create_page',
        params: { title: 'PRD: AI Search', content: '$step2' },
        depends_on: ['step2'],
        retry_policy: retryConfig,
        timeout: 30000
      },
      {
        id: 'step4',
        type: 'verification',
        params: { artifact_type: 'prd', min_score: 80 },
        depends_on: ['step3'],
        retry_policy: retryConfig,
        timeout: 10000
      }
    ];

    const dag: DAG = {
      nodes,
      edges: [
        { from: 'step1', to: 'step2' },
        { from: 'step2', to: 'step3' },
        { from: 'step3', to: 'step4' }
      ],
      entry_node_id: 'step1',
      exit_node_ids: ['step4']
    };

    const plan: Plan = {
      id: uuidv4(),
      run_id: runId,
      intent,
      dag,
      estimated_cost: 500,
      estimated_duration: 120000, // 2 minutes
      requires_approval: false,
      created_at: Date.now()
    };

    const run: Run = {
      id: runId,
      project_id: 'demo-project',
      user_id: 'demo-user',
      intent,
      plan,
      status: 'pending',
      started_at: Date.now(),
      cost: 0,
      artifacts: [],
      events: [],
      metadata: {
        source: 'dashboard',
        tags: ['demo', 'test']
      }
    };

    return { run, plan };
  };

  // Execute demo run
  const executeDemoRun = async () => {
    setIsExecuting(true);
    setEvents([]);

    try {
      const { run, plan } = createDemoPlan();
      setCurrentRun(run);

      // Store some demo memory
      await setUserPreference('demo-user', 'prd_template', 'comprehensive');
      await memoryService.set('project', 'demo-project', 'tech_stack', 'React + TypeScript', 'context');

      // Execute the run
      const completedRun = await executor.executeRun(run);
      setCurrentRun(completedRun);

      // Calculate metrics
      const runMetrics = await calculateRunMetrics(run.id);
      setMetrics(runMetrics);

      console.log('Run completed:', completedRun);
      console.log('Metrics:', runMetrics);

    } catch (error) {
      console.error('Run execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset demo
  const resetDemo = () => {
    eventStore.clear();
    memoryService.clear();
    idempotencyService.clear();
    setEvents([]);
    setCurrentRun(null);
    setMetrics(null);
  };

  // Get service stats
  const eventStoreStats = eventStore.getMetrics();
  const memoryStats = memoryService.getStats();
  const idempotencyStats = idempotencyService.getStats();

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            Runtime System Demo
          </h1>
          <p className="text-slate-600">
            Production-grade event store, memory service, and execution engine
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Control Panel</h2>
              <p className="text-slate-600 text-sm mt-1">
                Execute a demo run with 4 steps: scrape → analyze → create → verify
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={executeDemoRun}
                disabled={isExecuting}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Play size={16} className={isExecuting ? 'animate-pulse' : ''} />
                  {isExecuting ? 'Executing...' : 'Execute Run'}
                </span>
              </button>
              <button
                onClick={resetDemo}
                disabled={isExecuting}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw size={16} />
                  Reset
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Service Stats */}
        <div className="grid grid-cols-3 gap-4">
          {/* Event Store Stats */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Activity size={18} className="text-slate-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Event Store</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Events</span>
                <span className="text-slate-900 font-mono font-medium">{eventStoreStats.total_events}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Write Latency</span>
                <span className="text-slate-900 font-mono font-medium">{eventStoreStats.avg_write_latency_ms}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">P95 Latency</span>
                <span className="text-slate-900 font-mono font-medium">{eventStoreStats.p95_write_latency_ms}ms</span>
              </div>
            </div>
          </div>

          {/* Memory Service Stats */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Database size={18} className="text-slate-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Memory Service</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Memories</span>
                <span className="text-slate-900 font-mono font-medium">{memoryStats.total_memories}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">User Scope</span>
                <span className="text-slate-900 font-mono font-medium">{memoryStats.by_scope.user}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Project Scope</span>
                <span className="text-slate-900 font-mono font-medium">{memoryStats.by_scope.project}</span>
              </div>
            </div>
          </div>

          {/* Idempotency Stats */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Zap size={18} className="text-slate-700" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Idempotency</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Cached Keys</span>
                <span className="text-slate-900 font-mono font-medium">{idempotencyStats.total_keys}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Cache Size</span>
                <span className="text-slate-900 font-mono font-medium">
                  {(idempotencyStats.cache_size_bytes / 1024).toFixed(2)}KB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Run Metrics */}
        {metrics && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Run Metrics</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="text-slate-600 text-sm font-medium">Total Steps</div>
                <div className="text-3xl font-semibold text-slate-900 mt-2">{metrics.total_steps}</div>
              </div>
              <div>
                <div className="text-slate-600 text-sm font-medium">Completed</div>
                <div className="text-3xl font-semibold text-emerald-600 mt-2">{metrics.completed_steps}</div>
              </div>
              <div>
                <div className="text-slate-600 text-sm font-medium">Duration</div>
                <div className="text-3xl font-semibold text-slate-900 mt-2">
                  {(metrics.total_duration / 1000).toFixed(2)}s
                </div>
              </div>
              <div>
                <div className="text-slate-600 text-sm font-medium">Cache Hit Rate</div>
                <div className="text-3xl font-semibold text-slate-900 mt-2">
                  {(metrics.cache_hit_rate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Timeline */}
        {currentRun && events.length > 0 && (
          <EventTimeline
            runId={currentRun.id}
            events={events}
            onRefresh={() => {
              eventStore.getRunEvents(currentRun.id).then(setEvents);
            }}
          />
        )}

        {/* Empty State */}
        {!currentRun && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
            <Activity size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Run Executed Yet</h3>
            <p className="text-slate-600">Click "Execute Run" to start a demo execution</p>
          </div>
        )}
      </div>
    </div>
  );
}
