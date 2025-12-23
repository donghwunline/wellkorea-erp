package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.ApprovalRequest;
import com.wellkorea.backend.approval.domain.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;

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
    /**
     * Create an ApprovalDetailView from ApprovalRequest with pre-built level views.
     * Level views should be built by the query service with user names resolved.
     *
     * @param request    The approval request entity
     * @param levelViews The pre-built level decision views with user names
     */
    public static ApprovalDetailView from(ApprovalRequest request, List<LevelDecisionView> levelViews) {
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
                levelViews
        );
    }
}
