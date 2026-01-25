package com.wellkorea.backend.purchasing.domain.event;

import com.wellkorea.backend.shared.event.DomainEvent;

import java.math.BigDecimal;

/**
 * Domain event published when a purchase order is confirmed by the vendor.
 * This event is handled by AccountsPayableEventHandler to create an
 * AccountsPayable entry for tracking payment obligations.
 *
 * <p>When a PO is confirmed:
 * <ul>
 *   <li>PurchaseOrder: SENT → CONFIRMED</li>
 *   <li>AccountsPayable: new → PENDING (created)</li>
 * </ul>
 */
public record PurchaseOrderConfirmedEvent(
        Long purchaseOrderId,
        Long vendorId,
        String poNumber,
        BigDecimal totalAmount,
        String currency
) implements DomainEvent {
}
