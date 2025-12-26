# Runtime Implementation Notes

## Browser Compatibility Fixes

### Issue: Node.js `crypto` Module in Browser
**Date:** December 25, 2025
**Error:** `Module "crypto" has been externalized for browser compatibility`

**Problem:**
The idempotency service initially used Node.js's `crypto.createHash()` for SHA-256 hashing, which isn't available in browser environments.

**Solution:**
Replaced SHA-256 with FNV-1a hash algorithm (browser-compatible):

```typescript
// Before (Node.js only):
import { createHash } from 'crypto';
const hash = createHash('sha256').update(jsonString).digest('hex');

// After (browser-compatible):
let hash = 2166136261; // FNV offset basis
for (let i = 0; i < jsonString.length; i++) {
  hash ^= jsonString.charCodeAt(i);
  hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
}
const hashHex = (hash >>> 0).toString(16).padStart(8, '0');
```

**Trade-offs:**
- ✅ Works in browser without polyfills
- ✅ Deterministic (same input = same hash)
- ✅ Fast (~0.1ms for typical params)
- ⚠️ Less collision-resistant than SHA-256 (acceptable for idempotency keys with 24h TTL)
- ⚠️ Added string length to hash to reduce collisions

**Hash Format:**
- 8 hex chars from FNV-1a hash
- 4 hex chars from string length
- Total: 12 characters (e.g., `a3f4b2c10145`)

**Status:** ✅ Fixed and deployed

---

## Performance Considerations

### In-Memory Storage (Week 1)

**Current Implementation:**
- Event Store: `Map<string, Event[]>`
- Memory Service: `Map<string, Memory>`
- Idempotency: `Map<string, IdempotencyKey>`

**Why In-Memory?**
1. Zero infrastructure setup
2. Fast iteration during development
3. Sub-millisecond access times
4. Easy migration path to Postgres

**Migration Path (Week 2+):**
```typescript
// Week 1: In-memory
const events = new Map<string, Event[]>();

// Week 2: Postgres with same API
class PostgresEventStore implements EventStore {
  async append(event: Event) {
    await db.query('INSERT INTO events ...');
  }
}
```

**Limits:**
- Max events per run: ~10,000 (before memory pressure)
- Max concurrent runs: ~100
- Data lost on server restart (acceptable for Week 1 demo)

---

## Event Store Design

### Append-Only Pattern

**Why Append-Only?**
1. **Immutability:** Events never change (easier to reason about)
2. **Audit Trail:** Complete history of what happened
3. **Replay:** Reconstruct any Run state from events
4. **Debugging:** Time-travel debugging capabilities

**Event Indexing:**
```typescript
private events: Map<string, Event[]>;        // By run_id
private eventsByType: Map<string, Event[]>;  // By event type
```

**Query Performance:**
- By run_id: O(1) lookup + O(n) filter
- By type: O(1) lookup + O(n) filter
- By time range: O(n) scan (will add B-tree index in Postgres)

---

## Memory Service Design

### 4-Layer Scoping

**Hierarchy:**
1. **User Scope** (forever)
   - Preferences: PM style, template choices
   - Learning: Successful patterns

2. **Org Scope** (forever)
   - Team conventions
   - Shared policies

3. **Project Scope** (project lifetime)
   - Feature context
   - Tech stack
   - Stakeholders

4. **Run Scope** (24h TTL)
   - Execution state
   - Intermediate results
   - Session data

**Relevance Scoring:**
```typescript
score = scopeWeight + recencyScore + frequencyScore + queryMatch
```

**Weights:**
- User: 1.0 (highest priority)
- Org: 0.9
- Project: 0.8
- Run: 0.7 (lowest priority, most specific)

---

## Retry Strategy

### Exponential Backoff

**Formula:**
```
delay = min(initial_delay × multiplier^(attempt-1), max_delay)
```

**Default Config:**
```typescript
{
  max_attempts: 3,
  initial_delay: 2000,      // 2s
  max_delay: 16000,         // 16s
  backoff_multiplier: 2.0   // Exponential
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: Wait 2s
- Attempt 3: Wait 4s
- Attempt 4: Wait 8s (if max_attempts = 4)

**Retryable Errors:**
- `RATE_LIMIT` - API rate limits
- `TIMEOUT` - Request timeouts
- `NETWORK_ERROR` - Network failures
- `SERVICE_UNAVAILABLE` - 503 errors
- `TEMPORARY_FAILURE` - Transient errors

**Non-Retryable Errors:**
- `AUTHENTICATION_FAILED` - Bad credentials
- `PERMISSION_DENIED` - Authorization issues
- `INVALID_INPUT` - Bad request data
- `NOT_FOUND` - Resource doesn't exist

---

## Testing Strategy

### Unit Tests (Week 2)

**Coverage Goals:**
- Event Store: 90%+
- Memory Service: 90%+
- Idempotency: 95%+
- Executor: 85%+

**Test Structure:**
```typescript
describe('EventStore', () => {
  beforeEach(() => {
    eventStore.clear();
  });

  it('should append events with sub-10ms latency', async () => {
    const event = createMockEvent();
    const start = performance.now();
    await eventStore.append(event);
    const latency = performance.now() - start;
    expect(latency).toBeLessThan(10);
  });
});
```

### Integration Tests (Week 2)

**E2E Scenarios:**
1. Full PRD generation flow
2. Retry on rate limit
3. Idempotency on duplicate calls
4. Memory context retrieval

---

## Known Issues & Future Work

### Current Limitations

1. **No Persistence**
   - Events lost on restart
   - Fix: Postgres persistence (Week 2)

2. **No Parallel Execution**
   - Only linear DAG traversal
   - Fix: Parallel step execution (Week 5)

3. **Mock Tools**
   - Tool registry not implemented
   - Fix: Real tool integrations (Week 2+)

4. **No Verification**
   - Verification nodes are placeholders
   - Fix: Verification engine (Week 3)

5. **Simple Hash Function**
   - FNV-1a less robust than SHA-256
   - Acceptable for 24h TTL idempotency
   - Could upgrade to Web Crypto API if needed

### Future Enhancements

**Week 2:**
- Postgres event store
- Real Jira integration
- Basic verification (schema + LLM)

**Week 3:**
- Evidence layer
- Variance controls
- Comprehensive verification

**Week 4:**
- Plan visualization
- Replay UI
- Intent parser

**Week 5:**
- Parallel execution
- Self-healing
- Cost tracking

**Week 6:**
- E2E PRD autopilot
- Approval gates
- Polish + launch

---

## Metrics Instrumented

### Event Store
- `events_written` - Total events appended
- `events_queried` - Total query operations
- `avg_write_latency_ms` - Average write time
- `p95_write_latency_ms` - 95th percentile latency
- `total_events` - Current event count

### Memory Service
- `total_memories` - All memories stored
- `by_scope` - Count per scope (user/org/project/run)
- `by_type` - Count per type (preference/context/cache/etc)
- `total_size_bytes` - Total memory footprint

### Idempotency
- `total_keys` - Cached idempotency keys
- `by_tool` - Keys per tool type
- `cache_size_bytes` - Total cache size

### Run Metrics
- `total_steps` - Steps in run
- `completed_steps` - Successfully completed
- `failed_steps` - Failed steps
- `total_duration` - End-to-end time
- `total_cost` - Token cost
- `retry_count` - Total retries
- `cache_hit_rate` - Idempotency cache hits
- `events_emitted` - Events generated

---

## Architecture Decisions

### Why Event Sourcing?

**Pros:**
- ✅ Complete audit trail
- ✅ Time-travel debugging
- ✅ Easy to add new event consumers
- ✅ Natural fit for async workflows

**Cons:**
- ⚠️ More complex than CRUD
- ⚠️ Event schema evolution needs care
- ⚠️ Storage grows with time

**Decision:** Worth it for PM workflows that need full provenance

### Why In-Memory First?

**Pros:**
- ✅ Zero setup time
- ✅ Fast iteration
- ✅ Simple to understand
- ✅ Easy migration to DB

**Cons:**
- ⚠️ Not production-ready
- ⚠️ Data loss on restart
- ⚠️ Limited scale

**Decision:** Perfect for Week 1, will upgrade Week 2

### Why FNV-1a Over SHA-256?

**Pros:**
- ✅ Browser-compatible
- ✅ No dependencies
- ✅ Fast (<0.1ms)
- ✅ Deterministic

**Cons:**
- ⚠️ Less collision-resistant
- ⚠️ Not cryptographically secure

**Decision:** Good enough for 24h TTL idempotency keys. Can upgrade to Web Crypto API if needed.

---

## API Design Principles

### 1. Simple Defaults, Powerful Options

```typescript
// Simple: Just append
await eventStore.append(event);

// Powerful: Query with filters
const events = await eventStore.query({
  run_id: 'run_123',
  event_types: ['step.failed', 'tool.failed'],
  start_time: Date.now() - 3600000,
  limit: 100
});
```

### 2. Real-Time First

```typescript
// Subscribe to updates
const unsubscribe = eventStore.subscribe('run_123', (event) => {
  console.log('New event:', event);
});
```

### 3. Type-Safe Events

```typescript
// Discriminated unions for type safety
type Event = RunStartedEvent | StepCompletedEvent | ...;

if (event.type === 'run.started') {
  // TypeScript knows event.plan exists
  console.log(event.plan);
}
```

### 4. Explicit Error Handling

```typescript
// Errors are first-class data
interface StepError {
  code: string;
  message: string;
  retryable: boolean;
  timestamp: number;
}
```

---

**Last Updated:** December 25, 2025
**Status:** Week 1 Complete, Ready for Week 2
