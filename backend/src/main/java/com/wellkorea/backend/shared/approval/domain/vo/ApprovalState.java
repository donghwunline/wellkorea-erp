package com.wellkorea.backend.shared.approval.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/**
 * Embeddable value object for tracking approval state within entities that implement Approvable.
 * Provides a consistent way to embed approval workflow state in any entity.
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
     * Default constructor for JPA and initial state.
     */
    public ApprovalState() {
    }

    // ========== State Transition Methods ==========

    /**
     * Submit this entity for approval with the given context.
     *
     * @param context the approval context identifier (e.g., "VENDOR_SELECTION")
     * @throws IllegalStateException if already pending approval
     */
    public void submitForApproval(String context) {
        if (status == ApprovalStateStatus.PENDING) {
            throw new IllegalStateException("Already pending approval");
        }
        this.status = ApprovalStateStatus.PENDING;
        this.context = context;
    }

    /**
     * Mark the approval as granted.
     *
     * @throws IllegalStateException if not in PENDING status
     */
    public void markApproved() {
        if (status != ApprovalStateStatus.PENDING) {
            throw new IllegalStateException("Cannot approve: not in PENDING status");
        }
        this.status = ApprovalStateStatus.APPROVED;
    }

    /**
     * Mark the approval as rejected.
     *
     * @throws IllegalStateException if not in PENDING status
     */
    public void markRejected() {
        if (status != ApprovalStateStatus.PENDING) {
            throw new IllegalStateException("Cannot reject: not in PENDING status");
        }
        this.status = ApprovalStateStatus.REJECTED;
    }

    /**
     * Reset the approval state back to NONE.
     * Useful when reverting a rejected approval to allow re-submission.
     */
    public void reset() {
        this.status = ApprovalStateStatus.NONE;
        this.context = null;
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
}
