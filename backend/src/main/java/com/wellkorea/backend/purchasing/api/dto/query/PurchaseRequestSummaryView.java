package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * View DTO for purchase request summary in list views.
 */
public record PurchaseRequestSummaryView(
        Long id,
        String requestNumber,
        Long projectId,
        String jobCode,
        Long serviceCategoryId,
        String serviceCategoryName,
        String description,
        BigDecimal quantity,
        String uom,
        LocalDate requiredDate,
        String status,
        String createdByName,
        LocalDateTime createdAt
) {
}
