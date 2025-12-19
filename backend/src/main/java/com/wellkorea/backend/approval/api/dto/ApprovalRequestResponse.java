package com.wellkorea.backend.approval.api.dto;

import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.EntityType;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for an approval request.
 */
public record ApprovalRequestResponse(
        Long id,
        EntityType entityType,
        Long entityId,
        String entityDescription,
        Integer currentLevel,
        Integer totalLevels,
        ApprovalStatus status,
        Long submittedById,
        String submittedByName,
        LocalDateTime submittedAt,
        LocalDateTime completedAt,
        LocalDateTime createdAt,
        List<LevelDecisionResponse> levels
) {
    public static ApprovalRequestResponse from(ApprovalRequest request) {
        return new ApprovalRequestResponse(
                request.getId(),
                request.getEntityType(),
                request.getEntityId(),
                request.getEntityDescription(),
                request.getCurrentLevel(),
                request.getTotalLevels(),
                request.getStatus(),
                request.getSubmittedBy().getId(),
                request.getSubmittedBy().getFullName(),
                request.getSubmittedAt(),
                request.getCompletedAt(),
                request.getCreatedAt(),
                request.getLevelDecisions().stream()
                        .map(LevelDecisionResponse::from)
                        .toList()
        );
    }

    public static ApprovalRequestResponse fromSummary(ApprovalRequest request) {
        return new ApprovalRequestResponse(
                request.getId(),
                request.getEntityType(),
                request.getEntityId(),
                request.getEntityDescription(),
                request.getCurrentLevel(),
                request.getTotalLevels(),
                request.getStatus(),
                request.getSubmittedBy().getId(),
                request.getSubmittedBy().getFullName(),
                request.getSubmittedAt(),
                request.getCompletedAt(),
                request.getCreatedAt(),
                null // No level details in summary
        );
    }
}
