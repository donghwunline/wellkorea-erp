package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.EntityType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Read model for approval request detail views.
 * Includes level decisions for full detail display.
 */
public record ApprovalDetailView(
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
        List<LevelDecisionView> levels
) {
    public static ApprovalDetailView from(ApprovalRequest request) {
        return new ApprovalDetailView(
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
                        .map(LevelDecisionView::from)
                        .toList()
        );
    }
}
