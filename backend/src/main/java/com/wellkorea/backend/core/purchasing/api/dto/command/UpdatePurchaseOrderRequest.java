package com.wellkorea.backend.core.purchasing.api.dto.command;

import com.wellkorea.backend.core.purchasing.application.dto.UpdatePurchaseOrderCommand;

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
