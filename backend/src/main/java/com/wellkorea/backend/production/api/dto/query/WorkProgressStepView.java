package com.wellkorea.backend.production.api.dto.query;

import com.wellkorea.backend.production.domain.StepStatus;
import com.wellkorea.backend.production.domain.WorkProgressStep;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * View DTO for work progress step (CQRS pattern - query response).
 */
public record WorkProgressStepView(
        Long id,
        Long sheetId,
        Integer stepNumber,
        String stepName,
        StepStatus status,
        Instant startedAt,
        Instant completedAt,
        Long completedById,
        String completedByName,
        BigDecimal estimatedHours,
        BigDecimal actualHours,
        boolean isOutsourced,
        Long outsourceVendorId,
        String outsourceVendorName,
        LocalDate outsourceEta,
        BigDecimal outsourceCost,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Create view from entity.
     */
    public static WorkProgressStepView fromEntity(WorkProgressStep step) {
        return new WorkProgressStepView(
                step.getId(),
                step.getSheet().getId(),
                step.getStepNumber(),
                step.getStepName(),
                step.getStatus(),
                step.getStartedAt(),
                step.getCompletedAt(),
                step.getCompletedById(),
                null, // completedByName - populated by query service if needed
                step.getEstimatedHours(),
                step.getActualHours(),
                step.isOutsourced(),
                step.getOutsourceVendorId(),
                null, // outsourceVendorName - populated by query service if needed
                step.getOutsourceEta(),
                step.getOutsourceCost(),
                step.getNotes(),
                step.getCreatedAt(),
                step.getUpdatedAt()
        );
    }

    /**
     * Create view with user and vendor names.
     */
    public static WorkProgressStepView fromEntityWithNames(
            WorkProgressStep step,
            String completedByName,
            String outsourceVendorName
    ) {
        return new WorkProgressStepView(
                step.getId(),
                step.getSheet().getId(),
                step.getStepNumber(),
                step.getStepName(),
                step.getStatus(),
                step.getStartedAt(),
                step.getCompletedAt(),
                step.getCompletedById(),
                completedByName,
                step.getEstimatedHours(),
                step.getActualHours(),
                step.isOutsourced(),
                step.getOutsourceVendorId(),
                outsourceVendorName,
                step.getOutsourceEta(),
                step.getOutsourceCost(),
                step.getNotes(),
                step.getCreatedAt(),
                step.getUpdatedAt()
        );
    }
}
