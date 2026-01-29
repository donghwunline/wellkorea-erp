package com.wellkorea.backend.purchasing.domain.vo;

/**
 * Status enum for PurchaseRequest lifecycle.
 * DRAFT → RFQ_SENT → VENDOR_SELECTED → ORDERED → CLOSED, or CANCELED at any point.
 * <p>
 * Contains state transition rules and guard methods for domain logic encapsulation.
 */
public enum PurchaseRequestStatus {
    /**
     * Request created, not yet sent to vendors.
     */
    DRAFT,

    /**
     * RFQs sent to vendors awaiting responses.
     */
    RFQ_SENT,

    /**
     * Vendor chosen, PO to be created.
     */
    VENDOR_SELECTED,

    /**
     * PO created and pending delivery.
     */
    ORDERED,

    /**
     * PO completed and received.
     */
    CLOSED,

    /**
     * Request canceled.
     */
    CANCELED;

    /**
     * Check if transition to target status is valid.
     * <p>
     * Note: RFQ_SENT → RFQ_SENT is allowed (idempotent for adding more vendors).
     *
     * @param target Target status
     * @return true if transition is allowed
     */
    public boolean canTransitionTo(PurchaseRequestStatus target) {
        if (target == null) {
            return false;
        }
        // Special case: RFQ_SENT → RFQ_SENT is allowed (idempotent)
        if (target == this && this != RFQ_SENT) {
            return false;
        }
        return switch (this) {
            case DRAFT -> target == RFQ_SENT || target == CANCELED;
            case RFQ_SENT -> target == RFQ_SENT || target == VENDOR_SELECTED || target == CANCELED;
            case VENDOR_SELECTED -> target == ORDERED || target == RFQ_SENT || target == CANCELED;
            case ORDERED -> target == CLOSED || target == RFQ_SENT || target == CANCELED;
            case CLOSED, CANCELED -> false;
        };
    }

    /**
     * Check if RFQ can be sent in this status.
     * Allowed in DRAFT (initial send) or RFQ_SENT (adding more vendors).
     *
     * @return true if RFQ can be sent
     */
    public boolean canSendRfq() {
        return this == DRAFT || this == RFQ_SENT;
    }

    /**
     * Check if purchase request can be updated in this status.
     * Only allowed in DRAFT status.
     *
     * @return true if editable
     */
    public boolean canUpdate() {
        return this == DRAFT;
    }

    /**
     * Check if purchase request can be canceled in this status.
     * Not allowed in terminal states (CLOSED, CANCELED).
     *
     * @return true if can be canceled
     */
    public boolean canCancel() {
        return this != CLOSED && this != CANCELED;
    }

    /**
     * Check if this status is a terminal state.
     *
     * @return true if no further transitions possible
     */
    public boolean isTerminal() {
        return this == CLOSED || this == CANCELED;
    }
}
