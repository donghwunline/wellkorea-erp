package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * View DTO for purchase order summary in list views.
 */
public record PurchaseOrderSummaryView(
        Long id,
        String poNumber,
        Long rfqItemId,
        Long projectId,
        String jobCode,
        Long vendorId,
        String vendorName,
        LocalDate orderDate,
        LocalDate expectedDeliveryDate,
        BigDecimal totalAmount,
        String currency,
        String status,
        String createdByName,
        LocalDateTime createdAt
) {
}
