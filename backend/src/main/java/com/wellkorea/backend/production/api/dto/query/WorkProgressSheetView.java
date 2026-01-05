package com.wellkorea.backend.production.api.dto.query;

import com.wellkorea.backend.production.domain.SheetStatus;
import com.wellkorea.backend.production.domain.WorkProgressSheet;

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
        int progressPercentage,
        int totalSteps,
        int completedSteps,
        List<WorkProgressStepView> steps,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Create view from entity without steps.
     */
    public static WorkProgressSheetView fromEntity(WorkProgressSheet sheet) {
        return new WorkProgressSheetView(
                sheet.getId(),
                sheet.getProject().getId(),
                sheet.getProject().getJobCode(),
                sheet.getProduct().getId(),
                sheet.getProduct().getName(),
                sheet.getProduct().getSku(),
                sheet.getQuantity(),
                sheet.getSequence(),
                sheet.getStatus(),
                sheet.getStartedAt(),
                sheet.getCompletedAt(),
                sheet.getNotes(),
                sheet.calculateProgressPercentage(),
                sheet.getSteps() != null ? sheet.getSteps().size() : 0,
                sheet.getSteps() != null ? (int) sheet.getSteps().stream()
                        .filter(s -> s.getStatus() == com.wellkorea.backend.production.domain.StepStatus.COMPLETED)
                        .count() : 0,
                null,
                sheet.getCreatedAt(),
                sheet.getUpdatedAt()
        );
    }

    /**
     * Create view from entity with steps.
     */
    public static WorkProgressSheetView fromEntityWithSteps(WorkProgressSheet sheet) {
        List<WorkProgressStepView> stepViews = sheet.getSteps() != null
                ? sheet.getSteps().stream().map(WorkProgressStepView::fromEntity).toList()
                : List.of();

        return new WorkProgressSheetView(
                sheet.getId(),
                sheet.getProject().getId(),
                sheet.getProject().getJobCode(),
                sheet.getProduct().getId(),
                sheet.getProduct().getName(),
                sheet.getProduct().getSku(),
                sheet.getQuantity(),
                sheet.getSequence(),
                sheet.getStatus(),
                sheet.getStartedAt(),
                sheet.getCompletedAt(),
                sheet.getNotes(),
                sheet.calculateProgressPercentage(),
                stepViews.size(),
                (int) stepViews.stream()
                        .filter(s -> s.status() == com.wellkorea.backend.production.domain.StepStatus.COMPLETED)
                        .count(),
                stepViews,
                sheet.getCreatedAt(),
                sheet.getUpdatedAt()
        );
    }
}
