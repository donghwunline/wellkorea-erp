package com.wellkorea.backend.approval.domain;

/**
 * Decision status for approval level decisions.
 */
public enum DecisionStatus {
    /**
     * Decision is pending - waiting for approver action.
     */
    PENDING,

    /**
     * Approved by the approver.
     */
    APPROVED,

    /**
     * Rejected by the approver.
     */
    REJECTED
}
