package com.wellkorea.backend.production.api.dto.command;

import com.wellkorea.backend.production.domain.StepStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for updating a work progress step status.
 */
public record UpdateStepStatusRequest(
        @NotNull(message = "Status is required")
        StepStatus status,

        BigDecimal actualHours,

        Boolean isOutsourced,

        Long outsourceVendorId,

        LocalDate outsourceEta,

        BigDecimal outsourceCost,

        String notes
) {
}
