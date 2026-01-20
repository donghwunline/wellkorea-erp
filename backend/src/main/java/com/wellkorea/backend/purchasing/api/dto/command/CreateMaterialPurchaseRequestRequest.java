package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.purchasing.application.CreateMaterialPurchaseRequestCommand;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for creating a material purchase request (physical items).
 */
public record CreateMaterialPurchaseRequestRequest(
        Long projectId,

        @NotNull(message = "Material ID is required")
        Long materialId,

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
    public CreateMaterialPurchaseRequestCommand toCommand() {
        return new CreateMaterialPurchaseRequestCommand(
                projectId,
                materialId,
                description,
                quantity,
                uom,
                requiredDate
        );
    }
}
