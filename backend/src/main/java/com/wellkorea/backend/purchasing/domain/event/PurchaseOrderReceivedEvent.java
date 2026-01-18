package com.wellkorea.backend.purchasing.domain.event;

import com.wellkorea.backend.shared.event.DomainEvent;

/**
 * Domain event published when a purchase order is received.
 * This event is handled by PurchaseRequestEventHandler to close
 * the associated PurchaseRequest.
 *
 * <p>When a PO is received:
 * <ul>
 *   <li>PurchaseOrder: CONFIRMED → RECEIVED</li>
 *   <li>PurchaseRequest: VENDOR_SELECTED → CLOSED</li>
 * </ul>
 *
 * <p>This completes the purchasing workflow for this request.
 */
public record PurchaseOrderReceivedEvent(
        Long purchaseOrderId,
        Long purchaseRequestId,
        String poNumber
) implements DomainEvent {
}
