package com.wellkorea.backend.shared.approval.domain.vo;

/**
 * Actions in approval history.
 */
public enum ApprovalAction {
    /**
     * Request was submitted for approval.
     */
    SUBMITTED,

    /**
     * Approved by an approver.
     */
    APPROVED,

    /**
     * Rejected by an approver.
     */
    REJECTED
}
