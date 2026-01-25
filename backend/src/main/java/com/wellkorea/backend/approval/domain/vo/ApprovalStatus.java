package com.wellkorea.backend.approval.domain.vo;

/**
 * Approval request status.
 */
public enum ApprovalStatus {
    /**
     * Approval is in progress - waiting for approvers.
     */
    PENDING,

    /**
     * All required levels have approved.
     */
    APPROVED,

    /**
     * Rejected by an approver at any level.
     */
    REJECTED
}
