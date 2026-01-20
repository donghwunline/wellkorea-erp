package com.wellkorea.backend.purchasing.domain.event;

import com.wellkorea.backend.shared.event.DomainEvent;

/**
 * Domain event published when a purchase order is created.
 * This event is handled by PurchaseRequestEventHandler to transition
 * the associated PurchaseRequest from VENDOR_SELECTED to ORDERED.
 *
 * <p>When a PO is created:
 * <ul>
 *   <li>PurchaseOrder: new → DRAFT</li>
 *   <li>PurchaseRequest: VENDOR_SELECTED → ORDERED</li>
 * </ul>
 */
public record PurchaseOrderCreatedEvent(
        Long purchaseOrderId,
        Long purchaseRequestId,
        String poNumber
) implements DomainEvent {
}
