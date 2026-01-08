package com.wellkorea.backend.delivery.api.dto.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * View DTO for delivery summary in list views.
 * Contains essential information for display in tables/lists.
 * Line items are included as they're typically needed for delivery lists.
 */
public record DeliverySummaryView(
        Long id,
        Long projectId,
        LocalDate deliveryDate,
        String status,
        String deliveredByName,
        Integer lineItemCount,
        BigDecimal totalQuantityDelivered,
        String createdAt,
        List<DeliveryLineItemView> lineItems
) {
}
