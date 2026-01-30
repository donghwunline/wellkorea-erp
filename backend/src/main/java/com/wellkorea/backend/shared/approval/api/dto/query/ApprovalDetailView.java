package com.wellkorea.backend.shared.approval.api.dto.query;

import com.wellkorea.backend.shared.approval.domain.vo.ApprovalStatus;
import com.wellkorea.backend.shared.approval.domain.vo.EntityType;

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
}
