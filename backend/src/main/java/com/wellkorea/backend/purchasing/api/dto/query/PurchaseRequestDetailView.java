package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * View DTO for purchase request details including RFQ items.
 */
public record PurchaseRequestDetailView(
        Long id,
        String requestNumber,
        Long projectId,
        String jobCode,
        String projectName,
        Long serviceCategoryId,
        String serviceCategoryName,
        String description,
        BigDecimal quantity,
        String uom,
        LocalDate requiredDate,
        String status,
        Long createdById,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<RfqItemView> rfqItems
) {
}
