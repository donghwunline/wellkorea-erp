package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * View DTO for purchase order details.
 */
public record PurchaseOrderDetailView(
        Long id,
        String poNumber,
        Long purchaseRequestId,
        String purchaseRequestNumber,
        String rfqItemId,
        Long projectId,
        String jobCode,
        String projectName,
        Long vendorId,
        String vendorName,
        String vendorEmail,
        LocalDate orderDate,
        LocalDate expectedDeliveryDate,
        BigDecimal totalAmount,
        String currency,
        String status,
        String notes,
        Long createdById,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
