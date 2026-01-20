package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.purchasing.application.UpdatePurchaseOrderCommand;

import java.time.LocalDate;

/**
 * Request DTO for updating a purchase order.
 */
public record UpdatePurchaseOrderRequest(
        LocalDate expectedDeliveryDate,
        String notes
) {
    /**
     * Convert to internal command.
     */
    public UpdatePurchaseOrderCommand toCommand() {
        return new UpdatePurchaseOrderCommand(
                expectedDeliveryDate,
                notes
        );
    }
}
