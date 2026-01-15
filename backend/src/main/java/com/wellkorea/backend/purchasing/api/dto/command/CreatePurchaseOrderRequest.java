package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.purchasing.application.CreatePurchaseOrderCommand;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request DTO for creating a purchase order from an RFQ item.
 */
public record CreatePurchaseOrderRequest(
        @NotNull(message = "RFQ item ID is required")
        Long rfqItemId,

        @NotNull(message = "Order date is required")
        LocalDate orderDate,

        @NotNull(message = "Expected delivery date is required")
        LocalDate expectedDeliveryDate,

        String notes
) {
    /**
     * Convert to internal command.
     */
    public CreatePurchaseOrderCommand toCommand() {
        return new CreatePurchaseOrderCommand(
                rfqItemId,
                orderDate,
                expectedDeliveryDate,
                notes
        );
    }
}
