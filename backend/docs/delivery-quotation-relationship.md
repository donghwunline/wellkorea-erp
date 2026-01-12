# Delivery-Quotation Relationship

This document explains how deliveries are linked to quotations and the workflow for managing deliveries when quotation
versions change.

## Overview

Each delivery is linked to a specific quotation version via `quotation_id`. This tracking enables:

- Audit trail of which quotation version each delivery was recorded against
- Manual reorganization when new quotation versions are approved
- Clear visibility into delivery history per quotation version

## Data Model

```mermaid
erDiagram
    PROJECT ||--o{ QUOTATION: has
    PROJECT ||--o{ DELIVERY: has
    QUOTATION ||--o{ QUOTATION_LINE_ITEM: contains
    QUOTATION ||--o{ DELIVERY: "tracked by"
    DELIVERY ||--o{ DELIVERY_LINE_ITEM: contains
    PRODUCT ||--o{ QUOTATION_LINE_ITEM: "priced in"
    PRODUCT ||--o{ DELIVERY_LINE_ITEM: "delivered"

    PROJECT {
        bigint id PK
        string job_code
        string name
    }

    QUOTATION {
        bigint id PK
        bigint project_id FK
        int version
        string status
        decimal total_amount
    }

    QUOTATION_LINE_ITEM {
        bigint id PK
        bigint quotation_id FK
        bigint product_id FK
        decimal quantity
        decimal unit_price
    }

    DELIVERY {
        bigint id PK
        bigint project_id FK
        bigint quotation_id FK "nullable"
        date delivery_date
        string status
    }

    DELIVERY_LINE_ITEM {
        bigint id PK
        bigint delivery_id FK
        bigint product_id FK
        decimal quantity_delivered
    }

    PRODUCT {
        bigint id PK
        string name
        string sku
    }
```

## Quotation Lifecycle and Delivery Impact

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Quotation
    DRAFT --> PENDING: Submit for Approval
    PENDING --> APPROVED: Approve
    PENDING --> REJECTED: Reject
    REJECTED --> DRAFT: Create New Version
    APPROVED --> SENT: Send to Customer
    SENT --> ACCEPTED: Customer Accepts
    APPROVED --> NewVersion: Create New Version
    SENT --> NewVersion: Create New Version
    ACCEPTED --> NewVersion: Create New Version
    NewVersion --> DRAFT: v2, v3, ...
    note right of APPROVED
        Deliveries can be recorded
        against approved quotations
    end note
    note right of NewVersion
        Existing deliveries remain linked
        to old quotation version.
        Finance must manually reassign.
    end note
```

## Delivery Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant API as DeliveryController
    participant Aspect as ProjectLockAspect
    participant Lock as ProjectLockService
    participant Service as DeliveryCommandService
    participant Quotation
    participant Validator as QuotationDeliveryGuard
    participant DB as Database
    User ->> API: POST /api/projects/{id}/deliveries
    API ->> Service: createDelivery(projectId, request, userId)
    Note over Aspect: @ProjectLock intercepts
    Aspect ->> Lock: executeWithLock(projectId)
    Lock ->> Aspect: Lock acquired
    Aspect ->> Service: proceed() - execute method
    Service ->> DB: Find approved quotation for project
    DB -->> Service: Quotation (latest approved)
    Service ->> Quotation: createDelivery(validator, date, notes, items, userId)
    Quotation ->> Quotation: Check isApproved()
    Quotation ->> Validator: validateAndThrow(quotation, lineItems)
    Validator ->> DB: Get delivered quantities
    DB -->> Validator: Existing deliveries
    Validator ->> Validator: Check remaining quantities

    alt Validation Passes
        Validator -->> Quotation: OK
        Quotation -->> Service: New Delivery entity
        Service ->> DB: Save delivery (with quotation_id)
        DB -->> Service: Saved delivery
        Service -->> Aspect: Return Delivery ID
        Aspect ->> Lock: Release lock
        Aspect -->> API: Delivery ID
        API -->> User: 201 Created
    else Validation Fails
        Validator -->> Quotation: BusinessException
        Quotation -->> Service: Exception propagated
        Service -->> Aspect: Exception
        Aspect ->> Lock: Release lock
        Aspect -->> API: Exception
        API -->> User: 400 Bad Request
    end
```

## Quotation Version Change Workflow

When a new quotation version is approved, existing deliveries are **not automatically reassigned**. Finance personnel
must manually decide how to handle them.

```mermaid
flowchart TD
    A[New Quotation Version Created] --> B[Quotation v2 Submitted]
    B --> C[Quotation v2 Approved]
    C --> D{Existing Deliveries?}
    D -->|No| E[Done - No action needed]
    D -->|Yes| F[Finance Reviews Deliveries]
    F --> G{Delivery still valid<br/>for new quotation?}
    G -->|Yes - Product exists<br/>with same/higher qty| H[Reassign to v2]
    G -->|No - Product removed<br/>or qty reduced| I[Keep on v1<br/>or Delete]
    H --> J["POST /api/deliveries/{id}/reassign/{quotationId}"]
    I --> K[Manual Decision]
    K --> L[Leave as historical record]
    K --> M[Mark as RETURNED if refunded]
    J --> N[Delivery now linked to v2]

```

## API Endpoints for Delivery Management

### Query Deliveries

| Endpoint                               | Method | Description                                   |
|----------------------------------------|--------|-----------------------------------------------|
| `/api/projects/{projectId}/deliveries` | GET    | List all deliveries for a project             |
| `/api/deliveries/{id}`                 | GET    | Get delivery details including `quotation_id` |

### Delivery Status Transitions

| Endpoint                       | Method | Description                |
|--------------------------------|--------|----------------------------|
| `/api/deliveries/{id}/deliver` | POST   | Mark delivery as DELIVERED |
| `/api/deliveries/{id}/return`  | POST   | Mark delivery as RETURNED  |

### Reassignment Endpoints

| Endpoint                                      | Method | Description                                             |
|-----------------------------------------------|--------|---------------------------------------------------------|
| `/api/deliveries/{id}/reassign?quotationId=X` | POST   | Reassign single delivery to different quotation version |

## Business Rules

### Delivery Creation

1. A delivery can only be created against an **approved** quotation (status: APPROVED, SENT, or ACCEPTED)
2. The delivery quantity cannot exceed the remaining deliverable quantity (quotation qty - already delivered qty)
3. Only products in the approved quotation can be delivered
4. Distributed lock prevents race conditions during concurrent delivery creation

### Delivery Reassignment

1. Target quotation must be **approved**
2. Target quotation must belong to the **same project**
3. No quantity validation is performed during reassignment (manual decision)
4. Reassignment updates only the `quotation_id` reference

### Quotation Approval

1. New quotation versions are approved **without** validating against existing deliveries
2. This allows flexibility when quotation terms change after partial delivery
3. Finance personnel are responsible for reviewing and organizing deliveries manually

## Example Scenarios

### Scenario 1: Simple Delivery Recording

```
Project: WK2024-001
Quotation v1 (APPROVED): 100 units of Product A

Action: Record delivery of 30 units
Result: Delivery created with quotation_id = v1.id
        Remaining deliverable: 70 units
```

### Scenario 2: Quotation Update After Partial Delivery

```
Initial State:
- Quotation v1 (APPROVED): 100 units of Product A
- Delivery #1: 30 units (linked to v1)

Action: Customer requests change, new quotation v2 created with 80 units

After v2 Approved:
- Quotation v1: Still has Delivery #1 linked
- Quotation v2: No deliveries linked yet

Finance Decision:
- Delivery #1 (30 units) is still valid for v2 (30 < 80)
- POST /api/deliveries/1/reassign/v2.id
- Now v2 has 50 units remaining deliverable
```

### Scenario 3: Product Removed in New Version

```
Initial State:
- Quotation v1: Product A (100 units), Product B (50 units)
- Delivery #1: Product A (30 units), Product B (20 units)

Action: Customer removes Product B, new quotation v2 created

After v2 Approved:
- v2 only contains Product A (100 units)
- Delivery #1 contains Product B which is no longer in v2

Finance Decision Options:
1. Keep Delivery #1 on v1 as historical record
2. Partially reassign (if supported in future)
3. Mark Product B delivery as RETURNED if refunded
```

## Database View for Aggregated Quantities

The `v_delivered_quantities` view provides aggregated delivery data:

```sql
SELECT d.project_id,
       d.quotation_id,
       dli.product_id,
       SUM(dli.quantity_delivered) AS total_delivered
FROM deliveries d
         JOIN delivery_line_items dli ON d.id = dli.delivery_id
WHERE d.status != 'RETURNED'
GROUP BY d.project_id, d.quotation_id, dli.product_id;
```

This view is used by:

- `QuotationDeliveryGuard` to check remaining deliverable quantities
- Query services for delivery summary reports

## Summary

| Aspect                   | Behavior                                                                                      |
|--------------------------|-----------------------------------------------------------------------------------------------|
| Delivery-Quotation Link  | Each delivery stores `quotation_id` referencing the quotation version it was recorded against |
| New Quotation Approval   | No automatic validation against existing deliveries                                           |
| Delivery Reassignment    | Manual process via API endpoints                                                              |
| Over-delivery Prevention | Enforced at delivery creation time, not at quotation approval                                 |
| Historical Tracking      | Deliveries retain their original `quotation_id` unless explicitly reassigned                  |
