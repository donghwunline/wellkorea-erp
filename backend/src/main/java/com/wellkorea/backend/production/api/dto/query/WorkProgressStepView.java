package com.wellkorea.backend.production.api.dto.query;

import com.wellkorea.backend.production.domain.StepStatus;

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
        Boolean isOutsourced,
        Long outsourceVendorId,
        String outsourceVendorName,
        LocalDate outsourceEta,
        BigDecimal outsourceCost,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
