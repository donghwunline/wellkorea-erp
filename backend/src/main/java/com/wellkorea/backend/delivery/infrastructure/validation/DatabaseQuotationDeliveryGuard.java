package com.wellkorea.backend.delivery.infrastructure.validation;

import com.wellkorea.backend.delivery.domain.DeliveryLineItemInput;
import com.wellkorea.backend.delivery.domain.QuotationDeliveryGuard;
import com.wellkorea.backend.delivery.infrastructure.mapper.DeliveryMapper;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import com.wellkorea.backend.shared.dto.ProductQuantitySum;
import com.wellkorea.backend.shared.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Database-backed implementation of {@link QuotationDeliveryGuard}.
 * <p>
 * Validates delivery line items against quotation limits by querying the database
 * for already-delivered quantities.
 * <p>
 * Uses MyBatis mapper for typed query results instead of JPA Object[] arrays.
 * <p>
 * Similar pattern: {@link com.wellkorea.backend.project.infrastructure.sequence.DatabaseJobCodeSequenceProvider}
 */
@Component
public class DatabaseQuotationDeliveryGuard implements QuotationDeliveryGuard {

    private final DeliveryMapper deliveryMapper;

    public DatabaseQuotationDeliveryGuard(DeliveryMapper deliveryMapper) {
        this.deliveryMapper = deliveryMapper;
    }

    @Override
    public void validateAndThrow(Quotation quotation, List<DeliveryLineItemInput> lineItems) {
        validateNotEmpty(lineItems);
        validateNoDuplicateProducts(lineItems);

        Map<Long, BigDecimal> quotationQuantities = buildQuotationQuantityMap(quotation);
        Map<Long, BigDecimal> deliveredQuantities = buildDeliveredQuantityMap(quotation.getProject().getId());

        for (DeliveryLineItemInput item : lineItems) {
            validatePositiveQuantity(item);
            validateProductInQuotation(item, quotationQuantities);
            validateNotExceedingQuota(item, quotationQuantities, deliveredQuantities);
        }
    }

    // ========== Validation Methods ==========

    private void validateNotEmpty(List<DeliveryLineItemInput> lineItems) {
        if (lineItems == null || lineItems.isEmpty()) {
            throw new BusinessException("At least one line item is required");
        }
    }

    private void validateNoDuplicateProducts(List<DeliveryLineItemInput> lineItems) {
        Set<Long> seenProductIds = new HashSet<>();
        for (DeliveryLineItemInput item : lineItems) {
            if (!seenProductIds.add(item.productId())) {
                throw new BusinessException(
                        "Duplicate product ID " + item.productId() + " in delivery line items. " +
                                "Combine quantities into a single line item.");
            }
        }
    }

    private void validatePositiveQuantity(DeliveryLineItemInput item) {
        if (item.quantityDelivered().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                    "Quantity must be greater than 0 for product ID " + item.productId());
        }
    }

    private void validateProductInQuotation(DeliveryLineItemInput item,
                                            Map<Long, BigDecimal> quotationQuantities) {
        if (!quotationQuantities.containsKey(item.productId())) {
            throw new BusinessException(
                    "Product ID " + item.productId() + " is not in the approved quotation. " +
                            "Only products listed in the quotation can be delivered.");
        }
    }

    private void validateNotExceedingQuota(DeliveryLineItemInput item,
                                           Map<Long, BigDecimal> quotationQuantities,
                                           Map<Long, BigDecimal> deliveredQuantities) {
        Long productId = item.productId();
        BigDecimal requestedQty = item.quantityDelivered();
        BigDecimal quotationQty = quotationQuantities.get(productId);
        BigDecimal alreadyDelivered = deliveredQuantities.getOrDefault(productId, BigDecimal.ZERO);
        BigDecimal remaining = quotationQty.subtract(alreadyDelivered);

        if (requestedQty.compareTo(remaining) > 0) {
            throw new BusinessException(
                    String.format("Delivery quantity (%s) exceeds remaining deliverable quantity (%s) " +
                                    "for product ID %d. Quotation quantity: %s, Already delivered: %s",
                            requestedQty.toPlainString(),
                            remaining.toPlainString(),
                            productId,
                            quotationQty.toPlainString(),
                            alreadyDelivered.toPlainString()));
        }
    }

    // ========== Helper Methods ==========

    /**
     * Build a map of product ID to quotation quantity.
     * Aggregates quantities if a product appears multiple times in the quotation.
     */
    private Map<Long, BigDecimal> buildQuotationQuantityMap(Quotation quotation) {
        Map<Long, BigDecimal> map = new HashMap<>();
        for (QuotationLineItem item : quotation.getLineItems()) {
            map.merge(
                    item.getProduct().getId(),
                    item.getQuantity(),
                    BigDecimal::add
            );
        }
        return map;
    }

    /**
     * Build a map of product ID to already-delivered quantity for the project.
     * <p>
     * Uses MyBatis mapper for typed results (no manual Object[] conversion needed).
     */
    private Map<Long, BigDecimal> buildDeliveredQuantityMap(Long projectId) {
        return deliveryMapper.getDeliveredQuantitiesByProject(projectId).stream()
                .collect(Collectors.toMap(
                        ProductQuantitySum::productId,
                        ProductQuantitySum::quantity
                ));
    }
}
