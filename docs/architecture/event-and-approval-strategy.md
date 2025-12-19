# Event & Approval Strategy

This document describes the event-driven architecture and multi-level approval workflow strategy used in the WellKorea
ERP system.

## Table of Contents

1. [Event Strategy](#event-strategy)
    - [Overview](#overview)
    - [Architecture](#event-architecture)
    - [Domain Events](#domain-events)
    - [Event Publishing](#event-publishing)
    - [Event Handling](#event-handling)
    - [Transaction Semantics](#transaction-semantics)
    - [Migration Path to Kafka](#migration-path-to-kafka)
2. [Approval Strategy](#approval-strategy)
    - [Overview](#approval-overview)
    - [Multi-Level Approval Flow](#multi-level-approval-flow)
    - [Domain Model](#approval-domain-model)
    - [Integration with Events](#integration-with-events)

---

## Event Strategy

### Overview

The system uses an event-driven architecture to decouple domains and enable loose coupling between components. Events
are published when significant domain actions occur, allowing other parts of the system to react without direct
dependencies.

**Key Benefits:**

- **Loose Coupling**: Domains don't directly depend on each other
- **Extensibility**: New handlers can be added without modifying publishers
- **Testability**: Easy to mock event publishers in unit tests
- **Migration Ready**: Abstraction layer enables future migration to message queues (Kafka, RabbitMQ)

### Event Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Application Layer                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────┐         ┌─────────────────┐                      │
│   │ QuotationService │         │ ApprovalService │                      │
│   └────────┬─────────┘         └────────┬────────┘                      │
│            │                            │                               │
│            │ publish()                  │ publish()                     │
│            ▼                            ▼                               │
│   ┌────────────────────────────────────────────────┐                    │
│   │           DomainEventPublisher                 │ ◄── Interface      │
│   │               (interface)                      │                    │
│   └────────────────────────────────────────────────┘                    │
│                          │                                              │
│                          │ implements                                   │
│                          ▼                                              │
│   ┌────────────────────────────────────────────────┐                    │
│   │        SpringDomainEventPublisher              │ ◄── Current Impl   │
│   │  (delegates to ApplicationEventPublisher)      │                    │
│   └────────────────────────────────────────────────┘                    │
│                          │                                              │
│                          │ publishes to                                 │
│                          ▼                                              │
│   ┌───────────────────────────────────────────────────────┐             │
│   │      @TransactionalEventListener Handlers             │             │
│   │  (ApprovalEventHandler, QuotationApprovalEventHandler)│             │
│   └───────────────────────────────────────────────────────┘             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Domain Events

All domain events implement the `DomainEvent` marker interface:

```java
public interface DomainEvent {
}
```

#### Current Events

| Event                     | Published By       | Consumed By                     | Purpose                                        |
|---------------------------|--------------------|---------------------------------|------------------------------------------------|
| `QuotationSubmittedEvent` | `QuotationService` | `ApprovalEventHandler`          | Triggers approval workflow creation            |
| `ApprovalCompletedEvent`  | `ApprovalService`  | `QuotationApprovalEventHandler` | Updates entity status after approval/rejection |

#### Event Hierarchy

```
DomainEvent (marker interface)
├── ApprovalRequiredEvent (interface for entities needing approval)
│   └── QuotationSubmittedEvent
└── ApprovalCompletedEvent
```

#### QuotationSubmittedEvent

Published when a quotation is submitted for approval:

```java
public record QuotationSubmittedEvent(
        Long quotationId,
        int version,
        String jobCode,
        Long submittedByUserId
) implements ApprovalRequiredEvent {
    // Implements ApprovalRequiredEvent methods
}
```

#### ApprovalCompletedEvent

Published when an approval workflow completes:

```java
public record ApprovalCompletedEvent(
        Long approvalRequestId,
        EntityType entityType,
        Long entityId,
        ApprovalStatus finalStatus,
        Long approverUserId,
        String rejectionReason
) implements DomainEvent {
    // Factory methods: approved(), rejected()
}
```

### Event Publishing

Services inject `DomainEventPublisher` and call `publish()`:

```java

@Service
public class QuotationService {
    private final DomainEventPublisher eventPublisher;

    public Quotation submitForApproval(Long quotationId, Long userId) {
        // ... business logic ...

        eventPublisher.publish(new QuotationSubmittedEvent(
                quotation.getId(),
                quotation.getVersion(),
                quotation.getProject().getJobCode(),
                userId
        ));

        return quotation;
    }
}
```

### Event Handling

Event handlers use `@TransactionalEventListener` with `BEFORE_COMMIT` phase:

```java

@Component
public class ApprovalEventHandler {

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onApprovalRequired(ApprovalRequiredEvent event) {
        approvalService.createApprovalRequest(
                event.getEntityType(),
                event.getEntityId(),
                event.getEntityDescription(),
                event.getSubmittedByUserId()
        );
    }
}
```

### Transaction Semantics

**BEFORE_COMMIT Phase:**

- Handler executes within the same transaction as the publisher
- If handler fails, entire transaction rolls back
- Guarantees atomicity: quotation status + approval request created together

```
┌─────────────────────────────────────────────────────────────────┐
│                     Single Transaction                          │
├─────────────────────────────────────────────────────────────────┤
│  1. QuotationService.submitForApproval()                        │
│     └── Sets quotation status to PENDING                        │
│     └── Publishes QuotationSubmittedEvent                       │
│                                                                 │
│  2. ApprovalEventHandler.onApprovalRequired() [BEFORE_COMMIT]   │
│     └── Creates ApprovalRequest with level decisions            │
│                                                                 │
│  3. Transaction commits (or rolls back if any step fails)       │
└─────────────────────────────────────────────────────────────────┘
```

### Migration Path to Kafka

The `DomainEventPublisher` interface enables seamless migration to external message queues:

#### Step 1: Create Kafka Implementation

```java

@Component
@Profile("kafka")
public class KafkaDomainEventPublisher implements DomainEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public void publish(DomainEvent event) {
        String topic = determineTopic(event);
        kafkaTemplate.send(topic, event);
    }

    private String determineTopic(DomainEvent event) {
        if (event instanceof ApprovalRequiredEvent) {
            return "approval-requests";
        } else if (event instanceof ApprovalCompletedEvent) {
            return "approval-completed";
        }
        return "domain-events";
    }
}
```

#### Step 2: Configure Profile

```yaml
# application-kafka.yml
spring:
  profiles: kafka
  kafka:
    bootstrap-servers: localhost:9092
```

#### Step 3: Replace Listeners with Kafka Consumers

```java

@Component
@Profile("kafka")
public class ApprovalRequestKafkaConsumer {

    @KafkaListener(topics = "approval-requests")
    public void onApprovalRequired(ApprovalRequiredEvent event) {
        approvalService.createApprovalRequest(...);
    }
}
```

---

## Approval Strategy

### Approval Overview

The system implements a **multi-level sequential approval workflow** (결재 라인) where documents must be approved by
multiple approvers in a defined order.

**Key Features:**

- Configurable approval chain templates per entity type
- Sequential approval (Level 1 → Level 2 → ... → Level N)
- Rejection at any level stops the entire chain
- Full audit trail with history and comments

### Multi-Level Approval Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      Approval Workflow Flow                              │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  DRAFT  │ ──── submitForApproval() ────┐
    └─────────┘                              │
                                             ▼
                                    ┌─────────────────┐
                                    │     PENDING     │
                                    │   (Level 1)     │
                                    └────────┬────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                    [APPROVE]           [REJECT]            [PENDING]
                         │                   │                   │
                         ▼                   ▼                   │
                ┌─────────────────┐  ┌─────────────┐             │
                │     PENDING     │  │  REJECTED   │◄────────────┘
                │    (Level 2)    │  │    (End)    │  (any level rejection)
                └────────┬────────┘  └─────────────┘
                         │
                    [APPROVE]
                         │
                         ▼
                ┌─────────────────┐
                │    APPROVED     │
                │  (Final Level)  │
                └─────────────────┘
```

### Approval Domain Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Approval Domain Model                             │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐       ┌───────────────────────┐
│ ApprovalChainTemplate │       │    ApprovalRequest    │
├───────────────────────┤       ├───────────────────────┤
│ id                    │       │ id                    │
│ entityType (QUOTATION)│◄──────│ chainTemplate         │
│ name                  │       │ entityType            │
│ description           │       │ entityId              │
│ levels: List<Level>   │       │ currentLevel          │
└───────────────────────┘       │ totalLevels           │
         │                      │ status (PENDING/...)  │
         │ 1:N                  │ submittedBy           │
         ▼                      │ levelDecisions: List  │
┌───────────────────────┐       └───────────────────────┘
│  ApprovalChainLevel   │                │
├───────────────────────┤                │ 1:N
│ id                    │                ▼
│ chainTemplate         │       ┌───────────────────────┐
│ levelOrder (1, 2, 3)  │       │ApprovalLevelDecision  │
│ levelName             │       ├───────────────────────┤
│ approverUser          │       │ id                    │
│ isRequired            │       │ approvalRequest       │
└───────────────────────┘       │ levelOrder            │
                                │ expectedApprover      │
                                │ actualApprover        │
                                │ decision (PENDING/...)│
                                │ decidedAt             │
                                │ comments              │
                                └───────────────────────┘
```

#### Entity Types

```java
public enum EntityType {
    QUOTATION,      // 견적서
    PURCHASE_ORDER  // 발주서 (future)
}
```

#### Approval Statuses

```java
public enum ApprovalStatus {
    PENDING,    // 대기중 - Waiting for current level approval
    APPROVED,   // 승인됨 - All levels approved
    REJECTED,   // 반려됨 - Rejected at some level
    CANCELLED   // 취소됨 - Cancelled by submitter
}
```

#### Decision Statuses

```java
public enum DecisionStatus {
    PENDING,   // 대기 - Not yet decided
    APPROVED,  // 승인 - Approved at this level
    REJECTED,  // 반려 - Rejected at this level
    SKIPPED    // 건너뜀 - Skipped (optional level)
}
```

### Approval Service Operations

| Operation                 | Description                                           | Access                 |
|---------------------------|-------------------------------------------------------|------------------------|
| `createApprovalRequest()` | Creates new approval with level decisions             | Internal (via event)   |
| `approve()`               | Approves at current level, moves to next or completes | Current level approver |
| `reject()`                | Rejects with mandatory reason, stops chain            | Current level approver |
| `listPendingApprovals()`  | Lists approvals pending for a user                    | Approvers              |
| `getApprovalDetails()`    | Gets approval with all level decisions                | All authenticated      |
| `getApprovalHistory()`    | Gets audit trail of actions                           | All authenticated      |

### Integration with Events

The approval workflow integrates with the event system in two directions:

#### 1. Entity → Approval (Submission)

```
QuotationService                  ApprovalEventHandler
     │                                    │
     │ submitForApproval()                │
     │ ──────────────────────────────────▶│
     │   QuotationSubmittedEvent          │
     │                                    │ createApprovalRequest()
     │                                    │
```

#### 2. Approval → Entity (Completion)

```
ApprovalService               QuotationApprovalEventHandler
     │                                    │
     │ approve() / reject()               │
     │ ──────────────────────────────────▶│
     │   ApprovalCompletedEvent           │
     │                                    │ approveQuotation()
     │                                    │ rejectQuotation()
```

### Approval Chain Configuration

Approval chains are configured via database migration and can be updated by admins:

```sql
-- V7 Migration: Default QUOTATION approval chain
INSERT INTO approval_chain_templates (entity_type, name, description)
VALUES ('QUOTATION', '견적서 기본 결재', 'Default quotation approval chain');

INSERT INTO approval_chain_levels (chain_template_id, level_order, level_name, approver_user_id, is_required)
VALUES (1, 1, '팀장 승인', 2, true),
       (1, 2, '이사 승인', 1, true);
```

#### Admin API for Chain Management

```
GET    /api/admin/approval-chains          # List all chain templates
GET    /api/admin/approval-chains/{id}     # Get chain template details
PUT    /api/admin/approval-chains/{id}/levels  # Update chain levels
```

---

## Best Practices

### Event Design

1. **Immutability**: Use Java records for events
2. **Self-contained**: Include all necessary data in the event
3. **Versioning**: Consider event versioning for Kafka migration
4. **Naming**: Use past tense (Submitted, Completed, Rejected)

### Approval Design

1. **Validation**: Always validate user authorization before approval actions
2. **Audit Trail**: Record all actions in ApprovalHistory
3. **Rejection Reason**: Make rejection reason mandatory
4. **Status Checks**: Validate entity status before approval operations

---

## Future Considerations

1. **Parallel Approvals**: Allow multiple approvers at same level
2. **Delegation**: Allow approvers to delegate to others
3. **Escalation**: Auto-escalate after timeout
4. **Notifications**: Email/push notifications for pending approvals
5. **Batch Operations**: Bulk approve/reject for efficiency
