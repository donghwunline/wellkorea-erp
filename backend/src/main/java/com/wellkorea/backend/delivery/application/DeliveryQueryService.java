package com.wellkorea.backend.delivery.application;

import com.wellkorea.backend.delivery.api.dto.query.DeliveryDetailView;
import com.wellkorea.backend.delivery.api.dto.query.DeliverySummaryView;
import com.wellkorea.backend.delivery.domain.DeliveryStatus;
import com.wellkorea.backend.delivery.infrastructure.mapper.DeliveryMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
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

    public DeliveryQueryService(DeliveryMapper deliveryMapper) {
        this.deliveryMapper = deliveryMapper;
    }

    /**
     * Get delivery detail by ID.
     * Returns full detail view including line items.
     *
     * @param deliveryId Delivery ID
     * @return DeliveryDetailView with all nested data
     */
    public DeliveryDetailView getDeliveryDetail(Long deliveryId) {
        return deliveryMapper.findDetailById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));
    }

    /**
     * List deliveries with optional project and status filters.
     * Returns summary views with line items for display.
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
