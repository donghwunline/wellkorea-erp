package com.wellkorea.backend.purchasing.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * View DTO for RFQ item.
 * Includes purchaseOrderId to indicate if a PO has been created for this RFQ item.
 */
public record RfqItemView(
        String itemId,
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
        Long purchaseOrderId  // null if no PO created yet
) {
}
