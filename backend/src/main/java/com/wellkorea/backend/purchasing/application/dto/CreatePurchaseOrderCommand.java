package com.wellkorea.backend.purchasing.application.dto;

import java.time.LocalDate;

/**
 * Internal command for creating a purchase order.
 */
public record CreatePurchaseOrderCommand(
        Long purchaseRequestId,
        String rfqItemId,
        LocalDate orderDate,
        LocalDate expectedDeliveryDate,
        String notes
) {
}
