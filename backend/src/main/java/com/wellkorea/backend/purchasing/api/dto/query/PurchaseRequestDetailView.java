package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * View DTO for purchase request details including RFQ items.
 * Supports both SERVICE and MATERIAL types via dtype discriminator.
 */
public record PurchaseRequestDetailView(
        Long id,
        String requestNumber,
        String dtype,  // 'SERVICE' or 'MATERIAL'
        Long projectId,
        String jobCode,
        String projectName,
        // Service-specific fields (null for materials)
        Long serviceCategoryId,
        String serviceCategoryName,
        // Material-specific fields (null for services)
        Long materialId,
        String materialName,
        String materialSku,
        Long materialCategoryId,
        String materialCategoryName,
        BigDecimal materialStandardPrice,
        // Common fields
        String itemName,  // Computed: serviceCategoryName or materialName
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
