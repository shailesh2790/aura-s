/**
 * Event Store - Append-Only Event Log for AURA OS
 *
 * Provides production-grade event logging with:
 * - Append-only semantics (events are immutable)
 * - Fast queryability (by run_id, event type, time range)
 * - Event emission for real-time updates
 * - Metrics instrumentation
 *
 * Target: Sub-10ms write latency, supports 1000+ events/run
 */

import { Event, Run, RunMetrics } from '../../types/advanced';
import { v4 as uuidv4 } from 'uuid';

// ============= EVENT STORE =============

interface EventQuery {
  run_id?: string;
  event_types?: string[];
  start_time?: number;
  end_time?: number;
  limit?: number;
  offset?: number;
}

interface EventStoreMetrics {
  events_written: number;
  events_queried: number;
  write_latency_ms: number[];
  query_latency_ms: number[];
  total_events: number;
}

class EventStore {
  private events: Map<string, Event[]>; // Map<run_id, Event[]>
  private eventsByType: Map<string, Event[]>; // Map<event_type, Event[]>
  private listeners: Map<string, ((event: Event) => void)[]>; // Event listeners
  private metrics: EventStoreMetrics;

  constructor() {
    this.events = new Map();
    this.eventsByType = new Map();
    this.listeners = new Map();
    this.metrics = {
      events_written: 0,
      events_queried: 0,
      write_latency_ms: [],
      query_latency_ms: [],
      total_events: 0
    };
  }

  /**
   * Append event to the log (immutable)
   */
  async append(event: Event): Promise<void> {
    const startTime = performance.now();

    // Ensure event has ID
    if (!event.id) {
      event.id = uuidv4();
    }

    // Add to run_id index
    if (!this.events.has(event.run_id)) {
      this.events.set(event.run_id, []);
    }
    this.events.get(event.run_id)!.push(event);

    // Add to event_type index
    if (!this.eventsByType.has(event.type)) {
      this.eventsByType.set(event.type, []);
    }
    this.eventsByType.get(event.type)!.push(event);

    // Emit to listeners
    this.emit(event);

    // Track metrics
    const latency = performance.now() - startTime;
    this.metrics.write_latency_ms.push(latency);
    this.metrics.events_written++;
    this.metrics.total_events++;

    // Keep only last 1000 latency measurements
    if (this.metrics.write_latency_ms.length > 1000) {
      this.metrics.write_latency_ms.shift();
    }
  }

  /**
   * Query events with filters
   */
  async query(query: EventQuery): Promise<Event[]> {
    const startTime = performance.now();

    let results: Event[] = [];

    // Filter by run_id
    if (query.run_id) {
      results = this.events.get(query.run_id) || [];
    } else {
      // Get all events
      results = Array.from(this.events.values()).flat();
    }

    // Filter by event types
    if (query.event_types && query.event_types.length > 0) {
      results = results.filter(e => query.event_types!.includes(e.type));
    }

    // Filter by time range
    if (query.start_time) {
      results = results.filter(e => e.timestamp >= query.start_time!);
    }
    if (query.end_time) {
      results = results.filter(e => e.timestamp <= query.end_time!);
    }

    // Sort by timestamp (ascending)
    results.sort((a, b) => a.timestamp - b.timestamp);

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    results = results.slice(offset, offset + limit);

    // Track metrics
    const latency = performance.now() - startTime;
    this.metrics.query_latency_ms.push(latency);
    this.metrics.events_queried += results.length;

    if (this.metrics.query_latency_ms.length > 1000) {
      this.metrics.query_latency_ms.shift();
    }

    return results;
  }

  /**
   * Get all events for a run (chronological order)
   */
  async getRunEvents(run_id: string): Promise<Event[]> {
    return this.query({ run_id });
  }

  /**
   * Get events by type across all runs
   */
  async getEventsByType(event_type: string): Promise<Event[]> {
    return this.eventsByType.get(event_type) || [];
  }

  /**
   * Get latest N events for a run
   */
  async getLatestEvents(run_id: string, limit: number): Promise<Event[]> {
    const events = await this.getRunEvents(run_id);
    return events.slice(-limit);
  }

  /**
   * Subscribe to events (real-time updates)
   */
  subscribe(run_id: string, callback: (event: Event) => void): () => void {
    if (!this.listeners.has(run_id)) {
      this.listeners.set(run_id, []);
    }
    this.listeners.get(run_id)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(run_id);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to subscribers
   */
  private emit(event: Event): void {
    const callbacks = this.listeners.get(event.run_id) || [];
    callbacks.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('Event listener error:', err);
      }
    });

    // Also emit to wildcard listeners (run_id: '*')
    const wildcardCallbacks = this.listeners.get('*') || [];
    wildcardCallbacks.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('Wildcard event listener error:', err);
      }
    });
  }

  /**
   * Get event store metrics
   */
  getMetrics(): EventStoreMetrics & {
    avg_write_latency_ms: number;
    p95_write_latency_ms: number;
    avg_query_latency_ms: number;
  } {
    const avgWriteLatency = this.metrics.write_latency_ms.length > 0
      ? this.metrics.write_latency_ms.reduce((a, b) => a + b, 0) / this.metrics.write_latency_ms.length
      : 0;

    const avgQueryLatency = this.metrics.query_latency_ms.length > 0
      ? this.metrics.query_latency_ms.reduce((a, b) => a + b, 0) / this.metrics.query_latency_ms.length
      : 0;

    const p95WriteLatency = this.calculateP95(this.metrics.write_latency_ms);

    return {
      ...this.metrics,
      avg_write_latency_ms: Math.round(avgWriteLatency * 100) / 100,
      p95_write_latency_ms: Math.round(p95WriteLatency * 100) / 100,
      avg_query_latency_ms: Math.round(avgQueryLatency * 100) / 100
    };
  }

  /**
   * Calculate 95th percentile
   */
  private calculateP95(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  /**
   * Clear all events (for testing)
   */
  clear(): void {
    this.events.clear();
    this.eventsByType.clear();
    this.listeners.clear();
    this.metrics = {
      events_written: 0,
      events_queried: 0,
      write_latency_ms: [],
      query_latency_ms: [],
      total_events: 0
    };
  }

  /**
   * Reconstruct Run state from events (for replay)
   */
  async reconstructRun(run_id: string): Promise<Partial<Run> | null> {
    const events = await this.getRunEvents(run_id);
    if (events.length === 0) return null;

    const reconstruction: Partial<Run> = {
      id: run_id,
      events: events,
      status: 'pending',
      cost: 0,
      artifacts: []
    };

    // Replay events to reconstruct state
    for (const event of events) {
      switch (event.type) {
        case 'run.started':
          reconstruction.status = 'running';
          reconstruction.started_at = event.timestamp;
          reconstruction.plan = (event as any).plan;
          break;

        case 'run.approved':
          reconstruction.status = 'approved';
          break;

        case 'run.completed':
          reconstruction.status = 'completed';
          reconstruction.completed_at = event.timestamp;
          reconstruction.cost = (event as any).cost;
          break;

        case 'run.failed':
          reconstruction.status = 'failed';
          reconstruction.error = (event as any).error;
          break;

        case 'run.paused':
          reconstruction.status = 'paused';
          reconstruction.paused_at = event.timestamp;
          break;

        case 'run.cancelled':
          reconstruction.status = 'cancelled';
          break;

        case 'artifact.created':
          // Would fetch artifact details from artifact store
          break;
      }
    }

    return reconstruction;
  }
}

// ============= SINGLETON INSTANCE =============

export const eventStore = new EventStore();

// ============= HELPER FUNCTIONS =============

/**
 * Emit a run event
 */
export async function emitRunEvent(event: Event): Promise<void> {
  await eventStore.append(event);
}

/**
 * Get run timeline (all events for a run)
 */
export async function getRunTimeline(run_id: string): Promise<Event[]> {
  return eventStore.getRunEvents(run_id);
}

/**
 * Calculate run metrics from events
 */
export async function calculateRunMetrics(run_id: string): Promise<RunMetrics | null> {
  const events = await getRunTimeline(run_id);
  if (events.length === 0) return null;

  const stepEvents = events.filter(e => e.type.startsWith('step.'));
  const completedSteps = stepEvents.filter(e => e.type === 'step.completed');
  const failedSteps = stepEvents.filter(e => e.type === 'step.failed');
  const retryEvents = stepEvents.filter(e => e.type === 'step.retrying');

  const runStarted = events.find(e => e.type === 'run.started');
  const runCompleted = events.find(e => e.type === 'run.completed' || e.type === 'run.failed');

  const duration = runStarted && runCompleted
    ? runCompleted.timestamp - runStarted.timestamp
    : 0;

  const totalCost = events
    .filter(e => e.type === 'run.completed')
    .reduce((sum, e) => sum + ((e as any).cost || 0), 0);

  const toolCalls = events.filter(e => e.type === 'tool.called');
  const cachedCalls = events.filter(e => e.type === 'tool.completed' && (e as any).cached);

  const cacheHitRate = toolCalls.length > 0
    ? cachedCalls.length / toolCalls.length
    : 0;

  return {
    run_id,
    total_steps: stepEvents.filter(e => e.type === 'step.started').length,
    completed_steps: completedSteps.length,
    failed_steps: failedSteps.length,
    total_duration: duration,
    total_cost: totalCost,
    retry_count: retryEvents.length,
    cache_hit_rate: cacheHitRate,
    events_emitted: events.length
  };
}

/**
 * Export for testing and debugging
 */
export { EventStore };
