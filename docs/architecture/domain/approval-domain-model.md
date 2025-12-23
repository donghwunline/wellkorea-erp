# Approval Domain Model

This document describes the domain model for the approval (결재) workflow system in WellKorea ERP.

## Overview

The approval system supports multi-level sequential approval workflows for business entities (e.g., Quotations, Purchase Orders). It follows Domain-Driven Design (DDD) principles with properly defined aggregate boundaries.

## Domain Diagram

```mermaid
classDiagram
    direction TB

    namespace ChainTemplateAggregate {
        class ApprovalChainTemplate {
            "<<Aggregate Root>>"
            -Long id
            -EntityType entityType
            -String name
            -String description
            -boolean isActive
            -LocalDateTime createdAt
            -LocalDateTime updatedAt
            +replaceAllLevels(levels)
            +getLevels() List~ApprovalChainLevel~
            +getApproverUserIdAt(levelOrder) Long
            +getTotalLevels() int
        }

        class ApprovalChainLevel {
            "<<@Embeddable Value Object>>"
            -Integer levelOrder
            -String levelName
            -Long approverUserId
            -boolean required
        }
    }

    namespace ApprovalRequestAggregate {
        class ApprovalRequest {
            "<<Aggregate Root>>"
            -Long id
            -EntityType entityType
            -Long entityId
            -String entityDescription
            -Integer currentLevel
            -Integer totalLevels
            -ApprovalStatus status
            -User submittedBy
            -LocalDateTime submittedAt
            -LocalDateTime completedAt
            +initializeLevelDecisions(decisions)
            +approveAtCurrentLevel(userId, comments)
            +rejectAtCurrentLevel(userId, comments)
            +getCurrentLevelDecision() Optional
            +isExpectedApprover(userId) boolean
            +moveToNextLevel()
            +complete(status)
        }

        class ApprovalLevelDecision {
            "<<@Embeddable Value Object>>"
            -Integer levelOrder
            -String levelName
            -Long expectedApproverUserId
            -DecisionStatus decision
            -Long decidedByUserId
            -LocalDateTime decidedAt
            -String comments
            +approve(userId, comments)
            +reject(userId, comments)
            +isPending() boolean
        }
    }

    namespace SupportingEntities {
        class ApprovalHistory {
            "<<Entity - Audit Trail>>"
            -Long id
            -Integer levelOrder
            -ApprovalAction action
            -User actor
            -String comments
            -LocalDateTime createdAt
            +submitted(request, submitter)$
            +approved(request, level, approver, comments)$
            +rejected(request, level, approver, comments)$
        }

        class ApprovalComment {
            "<<Entity - Discussion>>"
            -Long id
            -User commenter
            -String commentText
            -boolean isRejectionReason
            -LocalDateTime createdAt
            +rejectionReason(request, user, reason)$
            +discussion(request, user, text)$
        }
    }

    ApprovalChainTemplate "1" *-- "*" ApprovalChainLevel : @ElementCollection
    ApprovalChainTemplate ..> ApprovalLevelDecision : creates via factory
    ApprovalRequest "1" *-- "*" ApprovalLevelDecision : @ElementCollection
    ApprovalHistory "*" --> "1" ApprovalRequest : references
    ApprovalComment "*" --> "1" ApprovalRequest : references
```

## Enumerations

```mermaid
classDiagram
    class EntityType {
        <<enumeration>>
        QUOTATION
        PURCHASE_ORDER
    }

    class ApprovalStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
    }

    class DecisionStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
    }

    class ApprovalAction {
        <<enumeration>>
        SUBMITTED
        APPROVED
        REJECTED
    }
```

## Aggregates

### 1. ApprovalChainTemplate Aggregate (Configuration)

Defines the approval chain structure for an entity type. This is the **configuration** that determines how approval workflows should proceed.

| Component | Type | Description |
|-----------|------|-------------|
| `ApprovalChainTemplate` | Aggregate Root (@Entity) | Approval chain definition per entity type |
| `ApprovalChainLevel` | Value Object (@Embeddable) | Individual level in the chain (팀장, 부서장, 사장) |

**Key Characteristics:**
- One template per entity type (QUOTATION, PURCHASE_ORDER)
- Levels are ordered (1 → 2 → 3)
- Admin configures approvers for each level
- Changes affect future approval requests only

**Aggregate Methods:**
```java
// Replace all levels atomically
template.replaceAllLevels(List<ApprovalChainLevel> newLevels);

// Access levels (unmodifiable)
List<ApprovalChainLevel> levels = template.getLevels();

// Query specific level
Long approverId = template.getApproverUserIdAt(levelOrder);

// Factory method - creates level decisions for ApprovalRequest (snapshots level names)
List<ApprovalLevelDecision> decisions = template.createLevelDecisions();
```

### 2. ApprovalRequest Aggregate (Runtime Instance)

Tracks the approval workflow for a specific entity (e.g., Quotation #123). This is the **runtime instance** created when approval is initiated.

| Component | Type | Description |
|-----------|------|-------------|
| `ApprovalRequest` | Aggregate Root (@Entity) | Approval workflow instance |
| `ApprovalLevelDecision` | Value Object (@Embeddable) | Decision record at each level |

**Key Characteristics:**
- One active request per entity (unique constraint on entity_type + entity_id)
- Level decisions are immutable once made
- Status progresses: PENDING → APPROVED or REJECTED
- All operations go through the aggregate root
- **No FK to ApprovalChainTemplate** - completely decoupled after creation

**Aggregate Methods:**
```java
// Initialize decisions from factory-created list (snapshots level names from template)
request.initializeLevelDecisions(template.createLevelDecisions());

// Approve/reject at current level
request.approveAtCurrentLevel(userId, comments);
request.rejectAtCurrentLevel(userId, comments);

// Query methods
boolean canApprove = request.isExpectedApprover(userId);
Optional<ApprovalLevelDecision> decision = request.getCurrentLevelDecision();

// State transitions
request.moveToNextLevel();
request.complete(ApprovalStatus.APPROVED);
```

### 3. Supporting Entities (Separate Aggregates)

These entities reference ApprovalRequest but are managed independently:

| Entity | Purpose | Lifecycle |
|--------|---------|-----------|
| `ApprovalHistory` | Audit trail of actions | Created on each action (SUBMITTED, APPROVED, REJECTED) |
| `ApprovalComment` | Discussion/rejection reasons | Created by users during review |

## Value Objects (Embeddables)

### ApprovalChainLevel

```java
@Embeddable
public class ApprovalChainLevel {
    private Integer levelOrder;      // 1, 2, 3...
    private String levelName;        // "팀장", "부서장", "사장"
    private Long approverUserId;     // User ID (not @ManyToOne)
    private boolean required;        // Can this level be skipped?
}
```

**Table:** `approval_chain_levels`
- Composite PK: `(chain_template_id, level_order)`
- No separate ID column (part of aggregate)

### ApprovalLevelDecision

```java
@Embeddable
public class ApprovalLevelDecision {
    private Integer levelOrder;           // 1, 2, 3...
    private String levelName;             // "팀장", "부서장" (snapshot from template)
    private Long expectedApproverUserId;  // Who should approve
    private DecisionStatus decision;      // PENDING, APPROVED, REJECTED
    private Long decidedByUserId;         // Who actually decided
    private LocalDateTime decidedAt;      // When decision was made
    private String comments;              // Optional comments
}
```

**Table:** `approval_level_decisions`
- Composite PK: `(approval_request_id, level_order)`
- No separate ID column (part of aggregate)
- `level_name` is denormalized from chain template at creation time

## Database Schema

```mermaid
erDiagram
    approval_chain_templates ||--o{ approval_chain_levels : "has levels"
    approval_chain_templates {
        bigint id PK
        varchar entity_type UK
        varchar name
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    approval_chain_levels {
        bigint chain_template_id PK,FK
        int level_order PK
        varchar level_name
        bigint approver_user_id FK
        boolean is_required
    }

    approval_requests ||--o{ approval_level_decisions : "has decisions"
    approval_requests {
        bigint id PK
        varchar entity_type
        bigint entity_id
        varchar entity_description
        int current_level
        int total_levels
        varchar status
        bigint submitted_by_id FK
        timestamp submitted_at
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    approval_level_decisions {
        bigint approval_request_id PK,FK
        int level_order PK
        varchar level_name
        bigint expected_approver_id FK
        varchar decision
        bigint decided_by_id FK
        timestamp decided_at
        text comments
    }

    approval_requests ||--o{ approval_history : "has history"
    approval_history {
        bigint id PK
        bigint approval_request_id FK
        int level_order
        varchar action
        bigint actor_id FK
        text comments
        timestamp created_at
    }

    approval_requests ||--o{ approval_comments : "has comments"
    approval_comments {
        bigint id PK
        bigint approval_request_id FK
        bigint commenter_id FK
        text comment_text
        boolean is_rejection_reason
        timestamp created_at
    }

    users ||--o{ approval_chain_levels : "approves"
    users ||--o{ approval_requests : "submits"
    users ||--o{ approval_level_decisions : "decides"
    users ||--o{ approval_history : "acts"
    users ||--o{ approval_comments : "comments"
    users {
        bigint id PK
        varchar username
        varchar full_name
    }
```

## Workflow Lifecycle

```mermaid
stateDiagram-v2
    direction TB

    [*] --> EntityCreated: Entity created (Quotation, PO)

    EntityCreated --> Submitted: Submit for approval

    state Submitted {
        [*] --> FindTemplate: 1. Find ApprovalChainTemplate
        FindTemplate --> CreateRequest: 2. Create ApprovalRequest
        CreateRequest --> InitDecisions: 3. Initialize LevelDecisions
        InitDecisions --> RecordHistory: 4. Create History(SUBMITTED)
        RecordHistory --> [*]
    }

    Submitted --> Level1Review: currentLevel = 1

    state Level1Review {
        [*] --> AwaitingDecision
        AwaitingDecision --> Approved: Approver approves
        AwaitingDecision --> Rejected: Approver rejects
    }

    Level1Review --> CheckLevel: On approval
    Level1Review --> RequestRejected: On rejection

    state CheckLevel <<choice>>
    CheckLevel --> NextLevel: More levels remain
    CheckLevel --> RequestApproved: Final level completed

    NextLevel --> Level1Review: currentLevel++

    state RequestApproved {
        [*] --> MarkApproved: status = APPROVED
        MarkApproved --> SetCompleted: completedAt = now()
        SetCompleted --> PublishEvent: Publish ApprovalCompletedEvent
        PublishEvent --> [*]
    }

    state RequestRejected {
        [*] --> MarkRejected: status = REJECTED
        MarkRejected --> SetRejectedAt: completedAt = now()
        SetRejectedAt --> PublishRejectedEvent: Publish ApprovalCompletedEvent
        PublishRejectedEvent --> [*]
    }

    RequestApproved --> [*]
    RequestRejected --> [*]
```

### Approval Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as Controller
    participant CS as CommandService
    participant AR as ApprovalRequest
    participant Repo as Repository
    participant Hist as ApprovalHistory
    participant Event as DomainEventPublisher

    Note over U,Event: Submit for Approval
    U->>C: POST /approvals/submit
    C->>CS: submitForApproval(entityType, entityId)
    CS->>Repo: findTemplate(entityType)
    CS->>AR: new ApprovalRequest()
    AR->>AR: initializeLevelDecisions(approverIds)
    CS->>Repo: save(request)
    CS->>Hist: save(History.submitted())
    CS-->>U: ApprovalCommandResult

    Note over U,Event: Approve at Level
    U->>C: POST /approvals/{id}/approve
    C->>CS: approve(id, userId, comments)
    CS->>Repo: findById(id)
    CS->>AR: approveAtCurrentLevel(userId, comments)

    alt Final Level
        AR->>AR: complete(APPROVED)
        CS->>Event: publish(ApprovalCompletedEvent)
    else More Levels
        AR->>AR: moveToNextLevel()
    end

    CS->>Repo: save(request)
    CS->>Hist: save(History.approved())
    CS-->>U: ApprovalCommandResult
```

## JPA Mapping Strategy

### Why @Embeddable Instead of @Entity?

| Aspect | @Entity | @Embeddable (Chosen) |
|--------|---------|---------------------|
| Identity | Has own ID | Identified by parent + levelOrder |
| Lifecycle | Independent | Managed by aggregate root |
| Repository | Needs own repository | Uses parent repository |
| DDD Alignment | Separate aggregate | Value object in aggregate |
| Querying | Direct queries | Query through parent |

### Handling User References in @Embeddable

JPA `@Embeddable` cannot have `@ManyToOne` relationships. Solution:
- Store `userId` as `Long` in the embeddable
- Resolve User entities in QueryService with batch fetch

```java
// In QueryService - batch user resolution
List<Long> userIds = decisions.stream()
    .flatMap(d -> Stream.of(d.getExpectedApproverUserId(), d.getDecidedByUserId()))
    .filter(Objects::nonNull)
    .distinct()
    .toList();

Map<Long, User> usersById = userRepository.findAllById(userIds)
    .stream()
    .collect(Collectors.toMap(User::getId, Function.identity()));
```

## Package Structure

```
com/wellkorea/backend/approval/
├── api/
│   ├── ApprovalController.java
│   ├── AdminApprovalChainController.java
│   └── dto/
│       ├── command/     # Request DTOs
│       └── query/       # View DTOs
├── application/
│   ├── ApprovalCommandService.java    # Write operations
│   ├── ApprovalQueryService.java      # Read operations
│   └── ApprovalEventHandler.java      # Domain event handling
├── domain/
│   ├── ApprovalRequest.java           # Aggregate Root
│   ├── ApprovalChainTemplate.java     # Aggregate Root
│   ├── ApprovalHistory.java           # Entity
│   ├── ApprovalComment.java           # Entity
│   ├── ApprovalStatus.java            # Enum
│   ├── DecisionStatus.java            # Enum
│   ├── ApprovalAction.java            # Enum
│   ├── event/
│   │   └── ApprovalCompletedEvent.java
│   └── vo/
│       ├── ApprovalChainLevel.java    # @Embeddable
│       ├── ApprovalLevelDecision.java # @Embeddable
│       └── EntityType.java            # Enum
└── infrastructure/
    └── repository/
        ├── ApprovalRequestRepository.java
        ├── ApprovalChainTemplateRepository.java
        ├── ApprovalHistoryRepository.java
        └── ApprovalCommentRepository.java
```

## Design Decisions

### 1. Separate Configuration and Runtime Aggregates

**Decision:** ApprovalChainTemplate and ApprovalRequest are separate aggregates.

**Rationale:**
- Template changes should not affect in-progress approvals
- Different lifecycles: templates are long-lived, requests are transactional
- Clear separation of concerns

### 2. Level Decisions as @Embeddable

**Decision:** ApprovalLevelDecision is @Embeddable, not @Entity.

**Rationale:**
- Decisions have no identity outside their request
- Decisions are created and managed only through the aggregate root
- Simpler persistence (no separate repository needed)
- Enforces aggregate boundary

### 3. History and Comments as Separate Entities

**Decision:** ApprovalHistory and ApprovalComment are @Entity, not @Embeddable.

**Rationale:**
- They can grow unbounded (many comments per request)
- They have their own identity (audit trail)
- Querying history/comments independently is useful
- They reference ApprovalRequest but are not "part of" its core invariants

### 4. Denormalized Level Names (Factory Pattern)

**Decision:** `ApprovalLevelDecision` stores `levelName` directly, copied from template at creation time via factory method.

**Rationale:**
- ApprovalRequest becomes completely decoupled from ApprovalChainTemplate
- No cross-aggregate reference at runtime (proper DDD aggregate boundary)
- Level names are snapshot data - if template changes, existing requests keep original names
- Factory method `createLevelDecisions()` encapsulates the snapshot logic in the template

**Implementation:**
```java
// In ApprovalChainTemplate
public List<ApprovalLevelDecision> createLevelDecisions() {
    return levels.stream()
        .map(level -> new ApprovalLevelDecision(
            level.getLevelOrder(),
            level.getLevelName(),     // Snapshot!
            level.getApproverUserId()
        ))
        .toList();
}

// In CommandService
List<ApprovalLevelDecision> decisions = chainTemplate.createLevelDecisions();
request.initializeLevelDecisions(decisions);
```
