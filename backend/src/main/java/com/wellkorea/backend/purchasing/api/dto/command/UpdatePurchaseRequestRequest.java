package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.purchasing.application.UpdatePurchaseRequestCommand;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for updating a purchase request.
 */
public record UpdatePurchaseRequestRequest(
        @NotBlank(message = "Description is required")
        String description,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
        BigDecimal quantity,

        String uom,  // nullable - optional field

        @NotNull(message = "Required date is required")
        LocalDate requiredDate
) {
    /**
     * Convert to internal command.
     */
    public UpdatePurchaseRequestCommand toCommand() {
        return new UpdatePurchaseRequestCommand(
                description,
                quantity,
                uom,
                requiredDate
        );
    }
}
