package com.wellkorea.backend.invoice.infrastructure.validation;

import com.wellkorea.backend.delivery.infrastructure.mapper.DeliveryMapper;
import com.wellkorea.backend.invoice.domain.InvoiceLineItemInput;
import com.wellkorea.backend.invoice.domain.QuotationInvoiceGuard;
import com.wellkorea.backend.invoice.infrastructure.mapper.InvoiceMapper;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import com.wellkorea.backend.shared.dto.ProductQuantitySum;
import com.wellkorea.backend.shared.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Database-backed implementation of {@link QuotationInvoiceGuard}.
 * <p>
 * Validates invoice line items against quotation limits by querying the database
 * for already-delivered and already-invoiced quantities.
 * <p>
 * Key validation: invoiceQty <= deliveredQty - alreadyInvoicedQty
 * (Cannot invoice more than what has been delivered minus what's already invoiced)
 * <p>
 * Uses MyBatis mappers for typed query results instead of JPA Object[] arrays.
 * <p>
 * Similar pattern: {@link com.wellkorea.backend.delivery.infrastructure.validation.DatabaseQuotationDeliveryGuard}
 */
@Component
public class DatabaseQuotationInvoiceGuard implements QuotationInvoiceGuard {

    private final DeliveryMapper deliveryMapper;
    private final InvoiceMapper invoiceMapper;

    public DatabaseQuotationInvoiceGuard(DeliveryMapper deliveryMapper,
                                         InvoiceMapper invoiceMapper) {
        this.deliveryMapper = deliveryMapper;
        this.invoiceMapper = invoiceMapper;
    }

    @Override
    public void validateAndThrow(Quotation quotation, List<InvoiceLineItemInput> lineItems) {
        validateNotEmpty(lineItems);
        validateNoDuplicateProducts(lineItems);

        Long quotationId = quotation.getId();
        Map<Long, BigDecimal> quotationQuantities = buildQuotationQuantityMap(quotation);
        Map<Long, BigDecimal> deliveredQuantities = buildDeliveredQuantityMap(quotationId);
        Map<Long, BigDecimal> invoicedQuantities = buildInvoicedQuantityMap(quotationId);

        for (InvoiceLineItemInput item : lineItems) {
            validatePositiveQuantity(item);
            validateProductInQuotation(item, quotationQuantities);
            validateNotExceedingInvoiceable(item, deliveredQuantities, invoicedQuantities);
        }
    }

    // ========== Validation Methods ==========

    private void validateNotEmpty(List<InvoiceLineItemInput> lineItems) {
        if (lineItems == null || lineItems.isEmpty()) {
            throw new BusinessException("At least one line item is required");
        }
    }

    private void validateNoDuplicateProducts(List<InvoiceLineItemInput> lineItems) {
        Set<Long> seenProductIds = new HashSet<>();
        for (InvoiceLineItemInput item : lineItems) {
            if (!seenProductIds.add(item.productId())) {
                throw new BusinessException(
                        "Duplicate product ID " + item.productId() + " in invoice line items. " +
                                "Combine quantities into a single line item.");
            }
        }
    }

    private void validatePositiveQuantity(InvoiceLineItemInput item) {
        if (item.quantityInvoiced().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                    "Quantity must be greater than 0 for product ID " + item.productId());
        }
    }

    private void validateProductInQuotation(InvoiceLineItemInput item,
                                            Map<Long, BigDecimal> quotationQuantities) {
        if (!quotationQuantities.containsKey(item.productId())) {
            throw new BusinessException(
                    "Product ID " + item.productId() + " is not in the approved quotation. " +
                            "Only products listed in the quotation can be invoiced.");
        }
    }

    /**
     * Validates that the invoice quantity does not exceed the invoiceable amount.
     * Invoiceable = delivered - already invoiced
     */
    private void validateNotExceedingInvoiceable(InvoiceLineItemInput item,
                                                 Map<Long, BigDecimal> deliveredQuantities,
                                                 Map<Long, BigDecimal> invoicedQuantities) {
        Long productId = item.productId();
        BigDecimal requestedQty = item.quantityInvoiced();
        BigDecimal deliveredQty = deliveredQuantities.getOrDefault(productId, BigDecimal.ZERO);
        BigDecimal alreadyInvoiced = invoicedQuantities.getOrDefault(productId, BigDecimal.ZERO);
        BigDecimal invoiceable = deliveredQty.subtract(alreadyInvoiced);

        if (requestedQty.compareTo(invoiceable) > 0) {
            throw new BusinessException(
                    String.format("Invoice quantity (%s) exceeds invoiceable quantity (%s) " +
                                    "for product ID %d. Delivered: %s, Already invoiced: %s",
                            requestedQty.toPlainString(),
                            invoiceable.toPlainString(),
                            productId,
                            deliveredQty.toPlainString(),
                            alreadyInvoiced.toPlainString()));
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
     * Build a map of product ID to already-delivered quantity for the quotation.
     * Excludes RETURNED deliveries.
     * <p>
     * Queries deliveries linked to the specific quotation (not project-wide),
     * as each quotation tracks its own delivery progress independently.
     * <p>
     * Uses MyBatis mapper for typed results (no manual Object[] conversion needed).
     */
    private Map<Long, BigDecimal> buildDeliveredQuantityMap(Long quotationId) {
        return deliveryMapper.getDeliveredQuantitiesByQuotation(quotationId, null).stream()
                .collect(Collectors.toMap(
                        ProductQuantitySum::productId,
                        ProductQuantitySum::quantity
                ));
    }

    /**
     * Build a map of product ID to already-invoiced quantity for the quotation.
     * Excludes CANCELLED invoices.
     * <p>
     * Queries invoices linked to the specific quotation (not project-wide),
     * as each quotation tracks its own invoice progress independently.
     * <p>
     * Uses MyBatis mapper for typed results (no manual Object[] conversion needed).
     */
    private Map<Long, BigDecimal> buildInvoicedQuantityMap(Long quotationId) {
        return invoiceMapper.getInvoicedQuantitiesByQuotation(quotationId).stream()
                .collect(Collectors.toMap(
                        ProductQuantitySum::productId,
                        ProductQuantitySum::quantity
                ));
    }
}
