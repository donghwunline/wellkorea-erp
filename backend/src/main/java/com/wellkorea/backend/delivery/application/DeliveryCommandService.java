package com.wellkorea.backend.delivery.application;

import com.wellkorea.backend.delivery.api.dto.command.CreateDeliveryRequest;
import com.wellkorea.backend.delivery.api.dto.command.DeliveryLineItemRequest;
import com.wellkorea.backend.delivery.domain.Delivery;
import com.wellkorea.backend.delivery.domain.DeliveryLineItem;
import com.wellkorea.backend.delivery.domain.DeliveryStatus;
import com.wellkorea.backend.delivery.infrastructure.persistence.DeliveryRepository;
import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.product.infrastructure.repository.ProductRepository;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Command service for delivery write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via DeliveryQueryService.
 */
@Service
@Transactional
public class DeliveryCommandService {

    private final DeliveryRepository deliveryRepository;
    private final ProductRepository productRepository;
    private final QuotationRepository quotationRepository;

    public DeliveryCommandService(DeliveryRepository deliveryRepository,
                                  ProductRepository productRepository,
                                  QuotationRepository quotationRepository) {
        this.deliveryRepository = deliveryRepository;
        this.productRepository = productRepository;
        this.quotationRepository = quotationRepository;
    }

    /**
     * Create a new delivery with line items.
     * Validates that:
     * - Project exists and has an approved quotation
     * - All products are in the quotation
     * - Quantities don't exceed remaining deliverable amounts
     *
     * @param projectId     Project ID
     * @param request       Create delivery request
     * @param deliveredById User ID of who is recording the delivery
     * @return ID of the created delivery
     */
    public Long createDelivery(Long projectId, CreateDeliveryRequest request, Long deliveredById) {
        // Get approved quotation for the project (needed to validate quantities)
        Quotation quotation = findApprovedQuotationForProject(projectId);
        if (quotation == null) {
            throw new BusinessException("No approved quotation found for project. Quotation must be approved before recording deliveries.");
        }

        // Build quotation quantity map for validation
        Map<Long, BigDecimal> quotationQuantities = buildQuotationQuantityMap(quotation);

        // Get already delivered quantities for this project
        Map<Long, BigDecimal> deliveredQuantities = buildDeliveredQuantityMap(projectId);

        // Validate each line item
        for (DeliveryLineItemRequest item : request.lineItems()) {
            validateLineItem(item, quotationQuantities, deliveredQuantities);
        }

        // Build delivery entity
        Delivery delivery = Delivery.builder()
                .projectId(projectId)
                .deliveryDate(request.deliveryDate())
                .status(DeliveryStatus.PENDING)
                .deliveredById(deliveredById)
                .notes(request.notes())
                .build();

        // Add line items
        for (DeliveryLineItemRequest item : request.lineItems()) {
            DeliveryLineItem lineItem = DeliveryLineItem.builder()
                    .productId(item.productId())
                    .quantityDelivered(item.quantityDelivered())
                    .build();
            delivery.addLineItem(lineItem);
        }

        Delivery saved = deliveryRepository.save(delivery);
        return saved.getId();
    }

    /**
     * Mark a delivery as delivered (status change from PENDING).
     *
     * @param deliveryId Delivery ID
     * @return ID of the updated delivery
     */
    public Long markAsDelivered(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        delivery.markDelivered();
        deliveryRepository.save(delivery);
        return deliveryId;
    }

    /**
     * Mark a delivery as returned (e.g., for refunds/corrections).
     *
     * @param deliveryId Delivery ID
     * @return ID of the updated delivery
     */
    public Long markAsReturned(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        delivery.markReturned();
        deliveryRepository.save(delivery);
        return deliveryId;
    }

    private Quotation findApprovedQuotationForProject(Long projectId) {
        // Find the latest approved/sent/accepted quotation for the project
        // We check APPROVED, SENT, and ACCEPTED statuses as these represent valid quotations
        // for delivery tracking (newer versions supersede older ones)
        return quotationRepository.findAll().stream()
                .filter(q -> q.getProject().getId().equals(projectId))
                .filter(q -> q.getStatus() == QuotationStatus.APPROVED ||
                        q.getStatus() == QuotationStatus.SENT ||
                        q.getStatus() == QuotationStatus.ACCEPTED)
                .filter(q -> !q.isDeleted())
                .max((q1, q2) -> Integer.compare(q1.getVersion(), q2.getVersion()))
                .orElse(null);
    }

    private Map<Long, BigDecimal> buildQuotationQuantityMap(Quotation quotation) {
        Map<Long, BigDecimal> map = new HashMap<>();
        for (QuotationLineItem item : quotation.getLineItems()) {
            map.put(item.getProduct().getId(), item.getQuantity());
        }
        return map;
    }

    private Map<Long, BigDecimal> buildDeliveredQuantityMap(Long projectId) {
        Map<Long, BigDecimal> map = new HashMap<>();
        List<Object[]> results = deliveryRepository.getDeliveredQuantitiesByProject(projectId);
        for (Object[] row : results) {
            Long productId = (Long) row[0];
            BigDecimal quantity = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            map.put(productId, quantity);
        }
        return map;
    }

    private void validateLineItem(DeliveryLineItemRequest item,
                                  Map<Long, BigDecimal> quotationQuantities,
                                  Map<Long, BigDecimal> deliveredQuantities) {
        Long productId = item.productId();
        BigDecimal requestedQty = item.quantityDelivered();

        // Check if product is in the quotation
        BigDecimal quotationQty = quotationQuantities.get(productId);
        if (quotationQty == null) {
            // Validate product exists
            Optional<Product> product = productRepository.findById(productId);
            if (product.isEmpty()) {
                throw new BusinessException("Product with ID " + productId + " does not exist");
            }
            throw new BusinessException("Product '" + product.get().getName() + "' (ID: " + productId + ") is not in the approved quotation");
        }

        // Calculate remaining deliverable quantity
        BigDecimal alreadyDelivered = deliveredQuantities.getOrDefault(productId, BigDecimal.ZERO);
        BigDecimal remaining = quotationQty.subtract(alreadyDelivered);

        // Check if requested quantity exceeds remaining
        if (requestedQty.compareTo(remaining) > 0) {
            throw new BusinessException(
                    String.format("Delivery quantity (%.2f) exceeds remaining deliverable quantity (%.2f) for product ID %d. Quotation quantity: %.2f, Already delivered: %.2f",
                            requestedQty.doubleValue(),
                            remaining.doubleValue(),
                            productId,
                            quotationQty.doubleValue(),
                            alreadyDelivered.doubleValue()));
        }
    }
}
