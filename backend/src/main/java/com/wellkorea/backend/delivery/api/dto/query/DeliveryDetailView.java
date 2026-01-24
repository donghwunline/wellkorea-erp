package com.wellkorea.backend.delivery.api.dto.query;

import com.wellkorea.backend.shared.storage.api.dto.AttachmentView;

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
        List<DeliveryLineItemView> lineItems,
        AttachmentView photo
) {

    /**
     * Create a DeliveryDetailView with photo attached.
     * Used to enrich the base view from MyBatis with photo data.
     *
     * @param base  Base view from MyBatis (with null photo)
     * @param photo Photo attachment (may be null for legacy deliveries)
     * @return New view with photo included
     */
    public static DeliveryDetailView withPhoto(DeliveryDetailView base, AttachmentView photo) {
        return new DeliveryDetailView(
                base.id(),
                base.projectId(),
                base.quotationId(),
                base.jobCode(),
                base.deliveryDate(),
                base.status(),
                base.deliveredById(),
                base.deliveredByName(),
                base.notes(),
                base.createdAt(),
                base.updatedAt(),
                base.lineItems(),
                photo
        );
    }
}
