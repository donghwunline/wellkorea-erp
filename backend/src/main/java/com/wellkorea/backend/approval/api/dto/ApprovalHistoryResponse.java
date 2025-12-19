package com.wellkorea.backend.approval.api.dto;

import com.wellkorea.backend.approval.domain.ApprovalAction;
import com.wellkorea.backend.approval.domain.ApprovalHistory;
import java.time.LocalDateTime;

/**
 * Response DTO for an approval history entry.
 */
public record ApprovalHistoryResponse(
        Long id,
        Integer levelOrder,
        ApprovalAction action,
        Long actorId,
        String actorName,
        String comments,
        LocalDateTime createdAt
) {
    public static ApprovalHistoryResponse from(ApprovalHistory history) {
        return new ApprovalHistoryResponse(
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
