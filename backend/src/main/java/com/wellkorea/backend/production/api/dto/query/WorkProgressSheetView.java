package com.wellkorea.backend.production.api.dto.query;

import com.wellkorea.backend.production.domain.SheetStatus;

import java.time.Instant;
import java.util.List;

/**
 * View DTO for work progress sheet (CQRS pattern - query response).
 */
public record WorkProgressSheetView(
        Long id,
        Long projectId,
        String jobCode,
        Long productId,
        String productName,
        String productSku,
        Integer quantity,
        Integer sequence,
        SheetStatus status,
        Instant startedAt,
        Instant completedAt,
        String notes,
        Integer progressPercentage,
        Integer totalSteps,
        Integer completedSteps,
        List<WorkProgressStepView> steps,
        Instant createdAt,
        Instant updatedAt
) {
}
