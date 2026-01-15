package com.wellkorea.backend.purchasing.application;

import java.time.LocalDate;

/**
 * Internal command for creating a purchase order.
 */
public record CreatePurchaseOrderCommand(
        Long rfqItemId,
        LocalDate orderDate,
        LocalDate expectedDeliveryDate,
        String notes
) {
}
