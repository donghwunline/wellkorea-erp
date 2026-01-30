package com.wellkorea.backend.shared.approval.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.LocalDateTime;

/**
 * Embeddable value object for tracking approval state within entities that implement Approvable.
 * Provides a consistent way to embed approval workflow state in any entity, including full audit trail.
 *
 * <p>Usage:
 * <pre>
 * &#64;Entity
 * public class PurchaseRequest implements Approvable {
 *     &#64;Embedded
 *     private ApprovalState approvalState = new ApprovalState();
 *
 *     // ... Approvable implementation
 * }
 * </pre>
 *
 * <p>Note: We don't store approvalRequestId because we can query ApprovalRequest
 * by (entity_type, entity_id) when needed. This matches Quotation's pattern.
 */
@Embeddable
public class ApprovalState {

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    private ApprovalStateStatus status = ApprovalStateStatus.NONE;

    /**
     * Context identifier for the approval workflow.
     * E.g., "VENDOR_SELECTION" - helps distinguish different approval types for the same entity.
     */
    @Column(name = "approval_context", length = 50)
    private String context;

    /**
     * User ID who submitted this entity for approval.
     */
    @Column(name = "approval_submitted_by_id")
    private Long submittedByUserId;

    /**
     * Timestamp when the entity was submitted for approval.
     */
    @Column(name = "approval_submitted_at")
    private LocalDateTime submittedAt;

    /**
     * Timestamp when the approval was completed (approved or rejected).
     */
    @Column(name = "approval_completed_at")
    private LocalDateTime completedAt;

    /**
     * User ID who completed the approval (approver or rejector).
     */
    @Column(name = "approval_completed_by_id")
    private Long completedByUserId;

    /**
     * Reason for rejection, if applicable.
     */
    @Column(name = "approval_rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /**
     * Default constructor for JPA and initial state.
     */
    public ApprovalState() {
    }

    // ========== State Transition Methods ==========

    /**
     * Submit this entity for approval with the given context.
     *
     * @param submitterUserId the ID of the user submitting for approval
     * @param context         the approval context identifier (e.g., "VENDOR_SELECTION")
     * @throws IllegalStateException if already pending approval
     */
    public void submitForApproval(Long submitterUserId, String context) {
        if (status == ApprovalStateStatus.PENDING) {
            throw new IllegalStateException("Already pending approval");
        }
        this.status = ApprovalStateStatus.PENDING;
        this.context = context;
        this.submittedByUserId = submitterUserId;
        this.submittedAt = LocalDateTime.now();
        // Clear any previous completion data
        this.completedAt = null;
        this.completedByUserId = null;
        this.rejectionReason = null;
    }

    /**
     * Mark the approval as granted.
     *
     * @param approverUserId the ID of the user who approved
     * @throws IllegalStateException if not in PENDING status
     */
    public void markApproved(Long approverUserId) {
        if (status != ApprovalStateStatus.PENDING) {
            throw new IllegalStateException("Cannot approve: not in PENDING status");
        }
        this.status = ApprovalStateStatus.APPROVED;
        this.completedAt = LocalDateTime.now();
        this.completedByUserId = approverUserId;
    }

    /**
     * Mark the approval as rejected.
     *
     * @param rejectorUserId the ID of the user who rejected
     * @param reason         the rejection reason
     * @throws IllegalStateException if not in PENDING status
     */
    public void markRejected(Long rejectorUserId, String reason) {
        if (status != ApprovalStateStatus.PENDING) {
            throw new IllegalStateException("Cannot reject: not in PENDING status");
        }
        this.status = ApprovalStateStatus.REJECTED;
        this.completedAt = LocalDateTime.now();
        this.completedByUserId = rejectorUserId;
        this.rejectionReason = reason;
    }

    /**
     * Reset the approval state back to NONE.
     * Useful when reverting a rejected approval to allow re-submission.
     */
    public void reset() {
        this.status = ApprovalStateStatus.NONE;
        this.context = null;
        this.submittedByUserId = null;
        this.submittedAt = null;
        this.completedAt = null;
        this.completedByUserId = null;
        this.rejectionReason = null;
    }

    // ========== Query Methods ==========

    /**
     * Check if approval is pending.
     */
    public boolean isPending() {
        return status == ApprovalStateStatus.PENDING;
    }

    /**
     * Check if approval is granted.
     */
    public boolean isApproved() {
        return status == ApprovalStateStatus.APPROVED;
    }

    /**
     * Check if approval is rejected.
     */
    public boolean isRejected() {
        return status == ApprovalStateStatus.REJECTED;
    }

    /**
     * Check if this entity has never been submitted for approval.
     */
    public boolean isNone() {
        return status == ApprovalStateStatus.NONE;
    }

    // ========== Getters ==========

    public ApprovalStateStatus getStatus() {
        return status;
    }

    public String getContext() {
        return context;
    }

    public Long getSubmittedByUserId() {
        return submittedByUserId;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public Long getCompletedByUserId() {
        return completedByUserId;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }
}
