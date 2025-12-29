package com.wellkorea.backend.approval.domain.event;

import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.shared.event.DomainEvent;

/**
 * Domain event published when an approval workflow is completed (approved or rejected).
 * Entity-specific handlers can listen for this event to update their status.
 */
public record ApprovalCompletedEvent(
        Long approvalRequestId,
        EntityType entityType,
        Long entityId,
        ApprovalStatus finalStatus,
        Long approverUserId,
        String rejectionReason
) implements DomainEvent {
    /**
     * Create an approved event.
     */
    public static ApprovalCompletedEvent approved(
            Long approvalRequestId,
            EntityType entityType,
            Long entityId,
            Long approverUserId) {
        return new ApprovalCompletedEvent(
                approvalRequestId,
                entityType,
                entityId,
                ApprovalStatus.APPROVED,
                approverUserId,
                null
        );
    }

    /**
     * Create a rejected event.
     */
    public static ApprovalCompletedEvent rejected(
            Long approvalRequestId,
            EntityType entityType,
            Long entityId,
            String rejectionReason) {
        return new ApprovalCompletedEvent(
                approvalRequestId,
                entityType,
                entityId,
                ApprovalStatus.REJECTED,
                null,
                rejectionReason
        );
    }

    public boolean isApproved() {
        return finalStatus == ApprovalStatus.APPROVED;
    }

    public boolean isRejected() {
        return finalStatus == ApprovalStatus.REJECTED;
    }
}
