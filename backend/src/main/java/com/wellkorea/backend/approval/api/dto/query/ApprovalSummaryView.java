package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;

import java.time.LocalDateTime;

/**
 * Read model for approval request list views.
 * Optimized for summary display - excludes level decisions for performance.
 */
public record ApprovalSummaryView(
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
        LocalDateTime createdAt
) {
    public static ApprovalSummaryView from(ApprovalRequest request) {
        return new ApprovalSummaryView(
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
                request.getCreatedAt()
        );
    }
}
