package com.wellkorea.backend.delivery.application;

import com.wellkorea.backend.delivery.api.dto.query.DeliveryDetailView;
import com.wellkorea.backend.delivery.api.dto.query.DeliverySummaryView;
import com.wellkorea.backend.delivery.domain.DeliveryStatus;
import com.wellkorea.backend.delivery.infrastructure.mapper.DeliveryMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.storage.api.dto.AttachmentView;
import com.wellkorea.backend.shared.storage.application.AttachmentService;
import com.wellkorea.backend.shared.storage.domain.AttachmentOwnerType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for delivery read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for all queries to avoid N+1 issues and optimize read performance.
 */
@Service
@Transactional(readOnly = true)
public class DeliveryQueryService {

    private final DeliveryMapper deliveryMapper;
    private final AttachmentService attachmentService;

    public DeliveryQueryService(DeliveryMapper deliveryMapper, AttachmentService attachmentService) {
        this.deliveryMapper = deliveryMapper;
        this.attachmentService = attachmentService;
    }

    /**
     * Get delivery detail by ID.
     * Returns full detail view including line items and photo (if available).
     *
     * @param deliveryId Delivery ID
     * @return DeliveryDetailView with all nested data including photo
     */
    public DeliveryDetailView getDeliveryDetail(Long deliveryId) {
        DeliveryDetailView base = deliveryMapper.findDetailById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        // Enrich with photo if available
        AttachmentView photo = attachmentService.getAttachment(
                AttachmentOwnerType.DELIVERY, deliveryId).orElse(null);

        return DeliveryDetailView.withPhoto(base, photo);
    }

    /**
     * List deliveries with optional project and status filters.
     * Returns summary views with line items for display.
     * <p>
     * Returns empty list if project doesn't exist (no validation for simplicity).
     *
     * @param projectId Optional project ID filter
     * @param status    Optional filter by delivery status
     * @param pageable  Pagination parameters
     * @return Page of DeliverySummaryView
     */
    public Page<DeliverySummaryView> listDeliveries(Long projectId, DeliveryStatus status, Pageable pageable) {
        List<DeliverySummaryView> content = deliveryMapper.findWithFilters(
                projectId, status, pageable.getPageSize(), pageable.getOffset());
        long total = deliveryMapper.countWithFilters(projectId, status);
        return new PageImpl<>(content, pageable, total);
    }
}
