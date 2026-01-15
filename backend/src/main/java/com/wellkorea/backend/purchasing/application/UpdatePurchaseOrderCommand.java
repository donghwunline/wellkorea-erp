package com.wellkorea.backend.purchasing.application;

import java.time.LocalDate;

/**
 * Internal command for updating a purchase order.
 */
public record UpdatePurchaseOrderCommand(
        LocalDate expectedDeliveryDate,
        String notes
) {
}
