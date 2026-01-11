# Delivery Concurrency Control Strategy

## Overview

This document describes the distributed locking strategy implemented to prevent race conditions during concurrent
delivery creation. The solution uses Spring Integration's `JdbcLockRegistry` with a clean template pattern that
separates locking concerns from business logic.

## Problem Statement

### The Race Condition

When recording a delivery, the system calculates remaining deliverable quantities:

```
Remaining = Quotation Quantity - Already Delivered Quantity
```

Without proper synchronization, the following race condition can occur:

```
Time    Transaction A                    Transaction B
────────────────────────────────────────────────────────────────────
T1      Read remaining = 10
T2                                       Read remaining = 10
T3      Validate: 8 <= 10 ✓
T4                                       Validate: 8 <= 10 ✓
T5      Insert delivery (qty=8)
T6                                       Insert delivery (qty=8)
T7      Commit ✓                         Commit ✓
────────────────────────────────────────────────────────────────────
Result: Total delivered = 16, but quotation only allowed 10!
```

### Business Impact

- **Over-delivery**: Delivering more products than quoted
- **Financial discrepancy**: Invoicing issues when delivery exceeds quotation
- **Inventory problems**: Stock levels become inconsistent

## Solution: Spring Integration JdbcLockRegistry

### Architecture Decision

We chose Spring Integration's `JdbcLockRegistry` with a **Template Pattern** for the following reasons:

| Approach                        | Pros                                                | Cons                                            | Decision          |
|---------------------------------|-----------------------------------------------------|-------------------------------------------------|-------------------|
| **JdbcLockRegistry + Template** | Clean separation, battle-tested, pluggable backends | Slight additional dependency                    | **Chosen**        |
| JPA `@Lock` annotations         | No new dependencies                                 | Mixes concerns, hard to test, scattered locking | Previous approach |
| Redis/Redisson                  | Works across instances                              | Adds infrastructure complexity                  | Future option     |
| `@Version` (Optimistic)         | No blocking                                         | Only detects UPDATE conflicts, not INSERT       | Not suitable      |

### How It Works

```
Time    Transaction A                    Transaction B
────────────────────────────────────────────────────────────────────
T1      Acquire LOCK (project:123)
T2      Read quotation                   Try to acquire LOCK...
T3      Read delivered quantities        (BLOCKED - waiting)
T4      Validate: 8 <= 10 ✓              (BLOCKED)
T5      Insert delivery (qty=8)          (BLOCKED)
T6      Commit → Release LOCK            Acquire LOCK
T7                                       Read delivered = 8
T8                                       Validate: 8 <= 2 ✗ FAIL
────────────────────────────────────────────────────────────────────
Result: Transaction B correctly fails validation
```

## Implementation

### Key Components

```
shared/lock/
├── LockRegistryConfig.java      # Spring Integration JDBC configuration
├── ProjectLockService.java      # Template API for project-level locking
└── LockAcquisitionException.java  # Custom exception for lock failures
```

### 1. LockRegistry Configuration

**`LockRegistryConfig.java`**

```java

@Configuration
public class LockRegistryConfig {
    private static final int LOCK_TTL_MS = 30_000;  // 30 seconds
    public static final String PROJECT_LOCK_REGION = "PROJECT";

    @Bean
    public LockRepository lockRepository(DataSource dataSource) {
        DefaultLockRepository repository = new DefaultLockRepository(dataSource);
        repository.setRegion(PROJECT_LOCK_REGION);
        repository.setTimeToLive(LOCK_TTL_MS);
        return repository;
    }

    @Bean
    public JdbcLockRegistry lockRegistry(LockRepository lockRepository) {
        return new JdbcLockRegistry(lockRepository);
    }
}
```

### 2. ProjectLockService (Template Pattern)

**`ProjectLockService.java`**

```java

@Service
public class ProjectLockService {
    private static final String PROJECT_LOCK_PREFIX = "project:";
    private static final long DEFAULT_LOCK_TIMEOUT_SECONDS = 5;

    public <T> T executeWithLock(Long projectId, Supplier<T> action) {
        String lockKey = PROJECT_LOCK_PREFIX + projectId;
        Lock lock = lockRegistry.obtain(lockKey);

        boolean acquired = lock.tryLock(timeout, unit);
        if (!acquired) {
            throw new LockAcquisitionException(
                    "Another operation is in progress for project " + projectId);
        }

        try {
            return action.get();
        } finally {
            lock.unlock();
        }
    }
}
```

### 3. Clean Business Logic

**`DeliveryCommandService.java`** - Before (mixed concerns):

```java
public Long createDelivery(Long projectId, ...) {
    // Locking hidden in repository method names
    Quotation q = findApprovedQuotationForProjectWithLock(projectId);
    Map<Long, BigDecimal> delivered = buildDeliveredQuantityMapWithLock(projectId);
    // business logic mixed with locking decisions
}
```

**`DeliveryCommandService.java`** - After (separated concerns):

```java
public Long createDelivery(Long projectId, ...) {
    if (!projectRepository.existsById(projectId)) {
        throw new ResourceNotFoundException("Project", projectId);
    }

    // Lock acquisition is explicit and separated
    return projectLockService.executeWithLock(projectId, () ->
            doCreateDelivery(projectId, request, deliveredById)  // Pure business logic
    );
}

private Long doCreateDelivery(Long projectId, ...) {
    // Pure business logic - no locking awareness
    Quotation quotation = findApprovedQuotation(projectId);
    validateDeliveryQuantities(quotation, request);
    return saveDelivery(projectId, request, deliveredById);
}

private Quotation findApprovedQuotation(Long projectId) {
    var quotations = quotationRepository.findLatestApprovedForProject(projectId);
    return quotations.isEmpty() ? null : quotations.getFirst();  // Java 21
}
```

### 4. Database Schema

**Flyway Migration: `V15__create_distributed_lock_table.sql`**

```sql
CREATE TABLE IF NOT EXISTS INT_LOCK
(
    LOCK_KEY     VARCHAR(255) NOT NULL,
    REGION       VARCHAR(100) NOT NULL,
    CLIENT_ID    VARCHAR(255) NOT NULL,
    CREATED_DATE TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT INT_LOCK_PK PRIMARY KEY (LOCK_KEY, REGION)
);
```

### 5. Exception Handling

**`GlobalExceptionHandler.java`**

```java

@ExceptionHandler(LockAcquisitionException.class)
public ResponseEntity<ErrorResponse> handleLockAcquisitionFailure(
        LockAcquisitionException ex, WebRequest request) {

    ErrorResponse errorResponse = ErrorResponse.of(
            ErrorCode.CONCURRENT_MODIFICATION,
            ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
    );

    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
}
```

## Configuration

### Lock Parameters

| Parameter       | Value          | Description                         |
|-----------------|----------------|-------------------------------------|
| Lock TTL        | 30 seconds     | Maximum time a lock can be held     |
| Acquire Timeout | 5 seconds      | Maximum time to wait for lock       |
| Region          | `PROJECT`      | Namespace for project-related locks |
| Lock Key Format | `project:{id}` | Per-project granularity             |

### Why These Values?

- **TTL (30s)**: Long enough for complex validation, short enough to recover from crashes
- **Timeout (5s)**: Good UX balance - not too long to wait, fast-fail behavior
- **Per-project**: Correct granularity - delivery validation involves quotation + existing deliveries

## Error Response

When lock acquisition fails, clients receive:

```json
{
  "timestamp": "2024-01-11T10:30:00",
  "status": 409,
  "code": "BUS_004",
  "message": "Another operation is in progress for project 123. Please try again.",
  "path": "/api/deliveries"
}
```

**Frontend handling:**

```typescript
if (error.status === 409 && error.code === 'BUS_004') {
    toast.warning('Another user is updating this project. Please try again.');
}
```

## Benefits of This Approach

### 1. Clean Separation of Concerns

- Business logic (`doCreateDelivery`) has no locking awareness
- Locking is explicit at the API boundary

### 2. Testability

- Can mock `ProjectLockService` in unit tests
- Business logic testable without database locks

### 3. Pluggable Backends

- Currently: `JdbcLockRegistry` (PostgreSQL)
- Future: Swap to `RedisLockRegistry` without code changes

### 4. Consistency with Codebase Patterns

- Similar to `AuditLogger` - dedicated service for cross-cutting concern
- No AOP magic - explicit template pattern

### 5. Reusability

- `ProjectLockService` can be used by other services (e.g., InvoiceCommandService)
- Consistent locking strategy across the application

## Files Modified/Created

| File                                     | Change                                     |
|------------------------------------------|--------------------------------------------|
| `build.gradle`                           | Added `spring-integration-jdbc` dependency |
| `V15__create_distributed_lock_table.sql` | New: Lock table migration                  |
| `LockRegistryConfig.java`                | New: Spring Integration configuration      |
| `ProjectLockService.java`                | New: Template API for locking              |
| `LockAcquisitionException.java`          | New: Custom exception                      |
| `DeliveryCommandService.java`            | Refactored to use ProjectLockService       |
| `QuotationRepository.java`               | Removed `*WithLock` method                 |
| `DeliveryRepository.java`                | Removed `*WithLock` method                 |
| `GlobalExceptionHandler.java`            | Updated to handle LockAcquisitionException |
| `application.yml`                        | Removed old JPA lock timeout config        |

## Future Considerations

### 1. Redis Backend

To switch to Redis for multi-instance deployment:

```java

@Bean
@Profile("redis")
public RedisLockRegistry redisLockRegistry(RedisConnectionFactory factory) {
    return new RedisLockRegistry(factory, PROJECT_LOCK_REGION);
}
```

### 2. Additional Lock Scopes

Add more lock services for other resources:

```java

@Service
public class QuotationLockService { ...
}

@Service
public class InvoiceLockService { ...
}
```

### 3. Monitoring

Consider adding metrics:

- Lock wait time histogram
- Lock acquisition failure rate
- Concurrent lock contention

## References

- [Spring Integration Distributed Locks](https://docs.spring.io/spring-integration/reference/distributed-locks.html)
- [Spring Integration JDBC Lock Registry](https://docs.spring.io/spring-integration/reference/jdbc.html#jdbc-lock-registry)
- [PostgreSQL Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
