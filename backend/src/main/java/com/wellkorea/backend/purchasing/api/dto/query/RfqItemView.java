package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * View DTO for RFQ item.
 */
public record RfqItemView(
        Long id,
        Long purchaseRequestId,
        Long vendorId,
        String vendorName,
        Long vendorOfferingId,
        String status,
        BigDecimal quotedPrice,
        Integer quotedLeadTime,
        String notes,
        LocalDateTime sentAt,
        LocalDateTime repliedAt,
        LocalDateTime createdAt
) {
}
