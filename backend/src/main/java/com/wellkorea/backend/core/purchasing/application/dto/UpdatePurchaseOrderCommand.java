package com.wellkorea.backend.core.purchasing.application.dto;

import java.time.LocalDate;

/**
 * Internal command for updating a purchase order.
 */
public record UpdatePurchaseOrderCommand(
        LocalDate expectedDeliveryDate,
        String notes
) {
}
