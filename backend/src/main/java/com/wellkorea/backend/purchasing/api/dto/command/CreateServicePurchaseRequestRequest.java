package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.purchasing.application.CreateServicePurchaseRequestCommand;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for creating a service purchase request (outsourcing).
 */
public record CreateServicePurchaseRequestRequest(
        Long projectId,

        @NotNull(message = "Service category ID is required")
        Long serviceCategoryId,

        @NotBlank(message = "Description is required")
        String description,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
        BigDecimal quantity,

        String uom,

        @NotNull(message = "Required date is required")
        LocalDate requiredDate
) {
    /**
     * Convert to internal command.
     */
    public CreateServicePurchaseRequestCommand toCommand() {
        return new CreateServicePurchaseRequestCommand(
                projectId,
                serviceCategoryId,
                description,
                quantity,
                uom,
                requiredDate
        );
    }
}
