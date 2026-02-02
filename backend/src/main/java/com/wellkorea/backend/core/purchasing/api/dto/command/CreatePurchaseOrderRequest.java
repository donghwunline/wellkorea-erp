package com.wellkorea.backend.core.purchasing.api.dto.command;

import com.wellkorea.backend.core.purchasing.application.dto.CreatePurchaseOrderCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request DTO for creating a purchase order from an RFQ item.
 */
public record CreatePurchaseOrderRequest(
        @NotNull(message = "Purchase request ID is required")
        Long purchaseRequestId,

        @NotBlank(message = "RFQ item ID is required")
        String rfqItemId,

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
                purchaseRequestId,
                rfqItemId,
                orderDate,
                expectedDeliveryDate,
                notes
        );
    }
}
