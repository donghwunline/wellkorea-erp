package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * View DTO for purchase request summary in list views.
 * Supports both SERVICE and MATERIAL types via dtype discriminator.
 */
public record PurchaseRequestSummaryView(
        Long id,
        String requestNumber,
        String dtype,  // 'SERVICE' or 'MATERIAL'
        Long projectId,
        String jobCode,
        // Service-specific fields (null for materials)
        Long serviceCategoryId,
        String serviceCategoryName,
        // Material-specific fields (null for services)
        Long materialId,
        String materialName,
        String materialSku,
        // Common fields
        String itemName,  // Computed: serviceCategoryName or materialName
        String description,
        BigDecimal quantity,
        String uom,
        LocalDate requiredDate,
        String status,
        String createdByName,
        LocalDateTime createdAt
) {
}
