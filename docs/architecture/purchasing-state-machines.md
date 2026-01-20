# Purchasing Domain State Machines

This document describes the finite state machines (FSM) for the purchasing domain entities: `RfqItem` and `PurchaseRequest`.

## Overview

The purchasing workflow follows this high-level flow:
1. Create a Purchase Request (DRAFT)
2. Send RFQs to multiple vendors (RFQ_SENT)
3. Vendors reply with quotes (RfqItem: SENT → REPLIED)
4. Select one vendor (VENDOR_SELECTED, RfqItem: SELECTED)
5. Create Purchase Order → PR transitions to ORDERED (via `PurchaseOrderCreatedEvent`)
6. If PO is canceled, revert to RFQ_SENT to allow re-selection (via `PurchaseOrderCanceledEvent`)
7. When PO is received, close the PR: ORDERED → CLOSED (via `PurchaseOrderReceivedEvent`)

---

## RfqItem State Machine

The `RfqItem` represents an individual RFQ sent to a specific vendor. Each RfqItem tracks its lifecycle from sending to vendor selection.

### States

| State | Description |
|-------|-------------|
| `SENT` | Initial state - RFQ sent to vendor, awaiting response |
| `REPLIED` | Vendor has replied with a quoted price |
| `NO_RESPONSE` | Vendor did not respond (terminal state) |
| `SELECTED` | This vendor's quote was chosen for PO |
| `REJECTED` | This vendor's quote was not selected |

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> SENT: new RfqItem()

    SENT --> REPLIED: recordReply()
    SENT --> NO_RESPONSE: markNoResponse()

    REPLIED --> SELECTED: select()
    REPLIED --> REJECTED: reject()

    SELECTED --> REPLIED: deselect()
    REJECTED --> REPLIED: unreject()

    NO_RESPONSE --> [*]: terminal

    note right of SENT
        Awaiting vendor response
        Can record reply or mark no response
    end note

    note right of REPLIED
        Quote received from vendor
        Can be selected or rejected
    end note

    note right of SELECTED
        Winner - PO will be created
        Can revert via deselect() on PO cancel
    end note

    note right of REJECTED
        Loser - not selected
        Can revert via unreject() on PO cancel
    end note
```

### Transition Methods

| Method | From State | To State | Trigger |
|--------|-----------|----------|---------|
| `recordReply(price, leadTime, notes)` | SENT | REPLIED | Vendor submits quote |
| `markNoResponse()` | SENT | NO_RESPONSE | Vendor deadline passed |
| `select()` | REPLIED | SELECTED | User selects this vendor |
| `reject()` | REPLIED | REJECTED | User rejects this vendor |
| `deselect()` | SELECTED | REPLIED | PO canceled - revert selection |
| `unreject()` | REJECTED | REPLIED | PO canceled - allow reconsideration |

### Invalid Transitions (throw IllegalStateException)

- Cannot `recordReply()` from any state except SENT
- Cannot `markNoResponse()` from any state except SENT
- Cannot `select()` from any state except REPLIED
- Cannot `reject()` from any state except REPLIED
- Cannot `deselect()` from any state except SELECTED
- Cannot `unreject()` from any state except REJECTED

---

## PurchaseRequest State Machine

The `PurchaseRequest` is the aggregate root that contains multiple `RfqItem` entities. It orchestrates the overall purchasing workflow.

### States

| State | Description |
|-------|-------------|
| `DRAFT` | Initial state - request created, can edit |
| `RFQ_SENT` | RFQs sent to vendors, awaiting quotes |
| `VENDOR_SELECTED` | A vendor has been selected, ready for PO creation |
| `ORDERED` | PO created, awaiting delivery |
| `CLOSED` | PO received, workflow complete (terminal) |
| `CANCELED` | Request canceled (terminal) |

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT: new PurchaseRequest()

    DRAFT --> RFQ_SENT: sendRfq()
    DRAFT --> CANCELED: cancel()

    RFQ_SENT --> RFQ_SENT: sendRfq() [add more vendors]
    RFQ_SENT --> VENDOR_SELECTED: markVendorSelected()
    RFQ_SENT --> CANCELED: cancel()

    VENDOR_SELECTED --> RFQ_SENT: revertVendorSelection()
    VENDOR_SELECTED --> ORDERED: markOrdered() [PO created]
    VENDOR_SELECTED --> CANCELED: cancel()

    ORDERED --> RFQ_SENT: revertVendorSelection() [PO canceled]
    ORDERED --> CLOSED: close() [PO received]
    ORDERED --> CANCELED: cancel()

    CLOSED --> [*]: terminal
    CANCELED --> [*]: terminal

    note right of DRAFT
        Initial state
        Can edit request details
        Can send RFQ to vendors
    end note

    note right of RFQ_SENT
        Waiting for vendor quotes
        Can add more vendors
        Can select a vendor
    end note

    note right of VENDOR_SELECTED
        Vendor chosen
        Awaiting PO creation
        Can revert selection
    end note

    note right of ORDERED
        PO created & active
        Awaiting delivery
        Can revert if PO canceled
    end note
```

### Transition Methods

| Method | From State | To State | Trigger |
|--------|-----------|----------|---------|
| `sendRfq()` | DRAFT | RFQ_SENT | Initial RFQ send |
| `sendRfq()` | RFQ_SENT | RFQ_SENT | Add more vendors (idempotent) |
| `markVendorSelected()` | RFQ_SENT | VENDOR_SELECTED | User selects vendor |
| `markOrdered()` | VENDOR_SELECTED | ORDERED | PO created (via event) |
| `close()` | ORDERED | CLOSED | PO received (via event) |
| `cancel()` | DRAFT, RFQ_SENT, VENDOR_SELECTED, ORDERED | CANCELED | User cancels |
| `revertVendorSelection()` | VENDOR_SELECTED, ORDERED | RFQ_SENT | PO canceled (via event) |

### Guard Conditions

| Method | Guard Condition |
|--------|-----------------|
| `canSendRfq()` | status == DRAFT \|\| status == RFQ_SENT |
| `canCancel()` | status != CLOSED && status != CANCELED |
| `canUpdate()` | status == DRAFT |

---

## Combined Workflow: PO Creation

When a Purchase Order is created, the PurchaseRequest automatically transitions to ORDERED via an event:

```mermaid
sequenceDiagram
    participant User
    participant PO as PurchaseOrder
    participant Event as DomainEvent
    participant PR as PurchaseRequest

    User->>PO: createPurchaseOrder()
    PO->>PO: new PurchaseOrder() [status = DRAFT]
    PO->>Event: publish(PurchaseOrderCreatedEvent)

    Event->>PR: onPurchaseOrderCreated()
    PR->>PR: markOrdered() [status → ORDERED]

    Note over PR: PR is now in ORDERED state<br/>Awaiting PO delivery
```

### State Changes Summary

| Entity | Before Create | After Create |
|--------|--------------|--------------|
| PurchaseOrder | (new) | DRAFT |
| PurchaseRequest | VENDOR_SELECTED | ORDERED |
| Selected RfqItem | SELECTED | SELECTED (unchanged) |

### Guard Conditions

The event handler includes an idempotency guard:
- Only marks PR as ordered if current status is `VENDOR_SELECTED`
- Skips if PR is already `ORDERED` or in another state
- This prevents errors on event replay or duplicate processing

---

## Combined Workflow: PO Cancellation Revert

When a Purchase Order is canceled, the following cascade occurs. Note that the PR can be in either VENDOR_SELECTED or ORDERED status when a PO is canceled:

```mermaid
sequenceDiagram
    participant User
    participant PO as PurchaseOrder
    participant Event as DomainEvent
    participant PR as PurchaseRequest
    participant RFQ as RfqItem

    User->>PO: cancelPurchaseOrder()
    PO->>PO: cancel() [status → CANCELED]
    PO->>Event: publish(PurchaseOrderCanceledEvent)

    Event->>PR: onPurchaseOrderCanceled()
    Note over PR: PR status: VENDOR_SELECTED or ORDERED
    PR->>PR: revertVendorSelection(rfqItemId)

    PR->>RFQ: deselect() [SELECTED → REPLIED]

    loop For each REJECTED RfqItem
        PR->>RFQ: unreject() [REJECTED → REPLIED]
    end

    PR->>PR: status → RFQ_SENT

    Note over PR,RFQ: User can now:<br/>1. Select a different vendor<br/>2. Add new vendors<br/>3. Reconsider rejected vendors
```

### State Changes Summary

| Entity | Before Cancel | After Cancel |
|--------|--------------|--------------|
| PurchaseOrder | DRAFT/SENT/CONFIRMED | CANCELED |
| PurchaseRequest | VENDOR_SELECTED or ORDERED | RFQ_SENT |
| Selected RfqItem | SELECTED | REPLIED |
| Rejected RfqItems | REJECTED | REPLIED |
| Other RfqItems | (unchanged) | (unchanged) |

---

## Combined Workflow: PO Receive Completion

When a Purchase Order is received, the PurchaseRequest is automatically closed via an event:

```mermaid
sequenceDiagram
    participant User
    participant PO as PurchaseOrder
    participant Event as DomainEvent
    participant PR as PurchaseRequest

    User->>PO: receivePurchaseOrder()
    PO->>PO: receive() [status → RECEIVED]
    PO->>Event: publish(PurchaseOrderReceivedEvent)

    Event->>PR: onPurchaseOrderReceived()
    PR->>PR: close() [status → CLOSED]

    Note over PR: Workflow complete<br/>PR is now in terminal CLOSED state
```

### State Changes Summary

| Entity | Before Receive | After Receive |
|--------|---------------|---------------|
| PurchaseOrder | CONFIRMED | RECEIVED |
| PurchaseRequest | ORDERED | CLOSED |
| Selected RfqItem | SELECTED | SELECTED (unchanged) |

### Guard Conditions

The event handler includes an idempotency guard:
- Only closes PR if current status is `ORDERED`
- Skips if PR is already `CLOSED` or in another state
- This prevents errors on event replay or duplicate processing

---

## Test Scenarios

### RfqItem Test Cases

1. **Happy Path: SENT → REPLIED → SELECTED**
   - Create RfqItem (SENT)
   - Record reply with quote (REPLIED)
   - Select vendor (SELECTED)

2. **Happy Path: SENT → REPLIED → REJECTED**
   - Create RfqItem (SENT)
   - Record reply with quote (REPLIED)
   - Reject vendor (REJECTED)

3. **Revert Path: SELECTED → REPLIED**
   - SELECTED item can be deselected
   - Returns to REPLIED for re-evaluation

4. **Revert Path: REJECTED → REPLIED**
   - REJECTED item can be unrejected
   - Returns to REPLIED for re-evaluation

5. **Terminal Path: SENT → NO_RESPONSE**
   - Vendor doesn't respond
   - NO_RESPONSE is terminal (no further transitions)

6. **Invalid Transitions**
   - Cannot select from SENT (must have quote first)
   - Cannot reject from SENT
   - Cannot record reply from REPLIED (already replied)
   - Cannot deselect from REPLIED
   - Cannot unreject from SELECTED

### PurchaseRequest Test Cases

1. **Happy Path: DRAFT → RFQ_SENT → VENDOR_SELECTED → ORDERED → CLOSED**
   - Create request (DRAFT)
   - Send RFQ (RFQ_SENT)
   - Select vendor (VENDOR_SELECTED)
   - Create PO (ORDERED via event)
   - Close when received (CLOSED via event)

2. **Add More Vendors: RFQ_SENT → RFQ_SENT**
   - Already in RFQ_SENT
   - Send RFQ again (idempotent, stays RFQ_SENT)

3. **Revert Path from VENDOR_SELECTED: VENDOR_SELECTED → RFQ_SENT**
   - PO canceled before transition to ORDERED
   - Revert vendor selection
   - Can select again or add vendors

4. **Revert Path from ORDERED: ORDERED → RFQ_SENT**
   - PO canceled after already in ORDERED
   - Revert vendor selection
   - Can select again or add vendors

5. **Add Vendors When All Items NO_RESPONSE/REJECTED**
   - All existing RfqItems are in NO_RESPONSE or REJECTED status
   - PR remains in RFQ_SENT (not terminal)
   - User can add new vendors via sendRfq()
   - New vendors can be quoted and selected

6. **Cancel from Any Non-Terminal State**
   - DRAFT → CANCELED
   - RFQ_SENT → CANCELED
   - VENDOR_SELECTED → CANCELED
   - ORDERED → CANCELED

7. **Invalid Transitions**
   - Cannot close from RFQ_SENT (must be in ORDERED)
   - Cannot close from VENDOR_SELECTED (must be in ORDERED)
   - Cannot mark ordered from RFQ_SENT (must be VENDOR_SELECTED)
   - Cannot revert from RFQ_SENT
   - Cannot cancel from CLOSED
   - Cannot send RFQ from VENDOR_SELECTED or ORDERED

---

## Implementation Files

| File | Description |
|------|-------------|
| `RfqItem.java` | RfqItem entity with state transitions |
| `RfqItemStatus.java` | Status enum |
| `PurchaseRequest.java` | Aggregate root with orchestration |
| `PurchaseRequestStatus.java` | Status enum (DRAFT, RFQ_SENT, VENDOR_SELECTED, ORDERED, CLOSED, CANCELED) |
| `PurchaseOrderCreatedEvent.java` | Domain event for PO creation (triggers VENDOR_SELECTED → ORDERED) |
| `PurchaseOrderCanceledEvent.java` | Domain event for PO cancellation (triggers ORDERED/VENDOR_SELECTED → RFQ_SENT) |
| `PurchaseOrderReceivedEvent.java` | Domain event for PO receive completion (triggers ORDERED → CLOSED) |
| `PurchaseRequestEventHandler.java` | Event handler for PR status updates (onPurchaseOrderCreated, onPurchaseOrderCanceled, onPurchaseOrderReceived) |
