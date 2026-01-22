package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.vo.ApprovalStatus;
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
}
