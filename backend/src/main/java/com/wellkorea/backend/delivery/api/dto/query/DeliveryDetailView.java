package com.wellkorea.backend.delivery.api.dto.query;

import java.time.LocalDate;
import java.util.List;

/**
 * View DTO for delivery details.
 * Includes all delivery information with resolved references for display.
 * Used by query endpoints to return comprehensive delivery data.
 */
public record DeliveryDetailView(
        Long id,
        Long projectId,
        Long quotationId,
        String jobCode,
        LocalDate deliveryDate,
        String status,
        Long deliveredById,
        String deliveredByName,
        String notes,
        String createdAt,
        String updatedAt,
        List<DeliveryLineItemView> lineItems
) {
}
