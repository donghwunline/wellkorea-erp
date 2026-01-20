package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.purchasing.application.UpdatePurchaseRequestCommand;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for updating a purchase request.
 */
public record UpdatePurchaseRequestRequest(
        String description,

        @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
        BigDecimal quantity,

        String uom,

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
