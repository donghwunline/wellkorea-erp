package com.wellkorea.backend.core.purchasing.domain.vo;

/**
 * Status enum for RFQ items sent to vendors.
 * <p>
 * State diagram:
 * <pre>
 *     [*] --> SENT
 *     SENT --> REPLIED (recordReply)
 *     SENT --> NO_RESPONSE (markNoResponse) [terminal]
 *     REPLIED --> SELECTED (select)
 *     REPLIED --> REJECTED (reject)
 *     SELECTED --> REPLIED (deselect - when PO canceled)
 *     REJECTED --> REPLIED (unreject - when PO canceled)
 * </pre>
 */
public enum RfqItemStatus {
    /**
     * RFQ sent to vendor, awaiting response.
     */
    SENT,

    /**
     * Vendor has replied with a quote.
     */
    REPLIED,

    /**
     * Vendor did not respond within deadline.
     */
    NO_RESPONSE,

    /**
     * This vendor's quote was selected for PO.
     */
    SELECTED,

    /**
     * This vendor's quote was not selected.
     */
    REJECTED;

    // ========== State Transition Rules ==========

    /**
     * Check if a transition from this status to the target status is valid.
     *
     * @param target the target status to transition to
     * @return true if the transition is allowed
     */
    public boolean canTransitionTo(RfqItemStatus target) {
        if (target == null) return false;
        return switch (this) {
            case SENT -> target == REPLIED || target == NO_RESPONSE;
            case REPLIED -> target == SELECTED || target == REJECTED;
            case SELECTED -> target == REPLIED;  // deselect when PO canceled
            case REJECTED -> target == REPLIED;  // unreject when PO canceled
            case NO_RESPONSE -> false;  // terminal state
        };
    }

    // ========== Guard Methods for Specific Operations ==========

    /**
     * Check if a vendor reply can be recorded (requires SENT status).
     */
    public boolean canRecordReply() {
        return this == SENT;
    }

    /**
     * Check if this RFQ item can be marked as no response (requires SENT status).
     */
    public boolean canMarkNoResponse() {
        return this == SENT;
    }

    /**
     * Check if this vendor's quote can be selected (requires REPLIED status).
     */
    public boolean canSelect() {
        return this == REPLIED;
    }

    /**
     * Check if this vendor's quote can be rejected (requires REPLIED status).
     */
    public boolean canReject() {
        return this == REPLIED;
    }

    /**
     * Check if this vendor's selection can be reverted (requires SELECTED status).
     */
    public boolean canDeselect() {
        return this == SELECTED;
    }

    /**
     * Check if this vendor's rejection can be reverted (requires REJECTED status).
     */
    public boolean canUnreject() {
        return this == REJECTED;
    }

    /**
     * Check if a PurchaseOrder can be created from this RFQ item.
     * Allowed from REPLIED (will auto-select) or SELECTED status.
     */
    public boolean canCreatePurchaseOrder() {
        return this == REPLIED || this == SELECTED;
    }

    /**
     * Check if this is a terminal state (no further transitions allowed).
     */
    public boolean isTerminal() {
        return this == NO_RESPONSE;
    }
}
