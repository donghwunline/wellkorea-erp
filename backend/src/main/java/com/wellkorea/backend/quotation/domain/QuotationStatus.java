package com.wellkorea.backend.quotation.domain;

/**
 * Quotation lifecycle status.
 * Follows the workflow: DRAFT → PENDING → APPROVED/REJECTED → SENDING → SENT → ACCEPTED
 */
public enum QuotationStatus {
    /**
     * Initial state - quotation is being created/edited.
     */
    DRAFT,

    /**
     * Submitted for approval - waiting for approval workflow to complete.
     */
    PENDING,

    /**
     * Approved by all required approvers.
     */
    APPROVED,

    /**
     * Rejected by an approver during the approval workflow.
     */
    REJECTED,

    /**
     * Email is being sent to the customer. Transient state.
     */
    SENDING,

    /**
     * Sent to the customer.
     */
    SENT,

    /**
     * Accepted by the customer.
     */
    ACCEPTED
}
