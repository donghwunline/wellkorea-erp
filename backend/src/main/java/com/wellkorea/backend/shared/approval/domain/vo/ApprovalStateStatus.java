package com.wellkorea.backend.shared.approval.domain.vo;

/**
 * Status enum for embedded ApprovalState in entities that implement Approvable.
 * Tracks the approval workflow state within the entity itself.
 */
public enum ApprovalStateStatus {
    /**
     * Not submitted for approval (default state).
     */
    NONE,

    /**
     * Awaiting approval decision.
     */
    PENDING,

    /**
     * Approved by all required approvers.
     */
    APPROVED,

    /**
     * Rejected by an approver.
     */
    REJECTED
}
