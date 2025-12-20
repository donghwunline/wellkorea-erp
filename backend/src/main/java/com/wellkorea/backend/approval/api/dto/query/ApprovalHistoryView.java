package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.ApprovalAction;
import com.wellkorea.backend.approval.domain.ApprovalHistory;

import java.time.LocalDateTime;

/**
 * Read model for approval history entry.
 * Used for displaying approval workflow history.
 */
public record ApprovalHistoryView(
        Long id,
        Integer levelOrder,
        ApprovalAction action,
        Long actorId,
        String actorName,
        String comments,
        LocalDateTime createdAt
) {
    public static ApprovalHistoryView from(ApprovalHistory history) {
        return new ApprovalHistoryView(
                history.getId(),
                history.getLevelOrder(),
                history.getAction(),
                history.getActor().getId(),
                history.getActor().getFullName(),
                history.getComments(),
                history.getCreatedAt()
        );
    }
}
