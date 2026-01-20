package com.wellkorea.backend.purchasing.domain.event;

import com.wellkorea.backend.shared.event.DomainEvent;

/**
 * Domain event published when a purchase order is canceled.
 * This event is handled by PurchaseRequestEventHandler to revert
 * the PurchaseRequest status and RfqItem selection.
 *
 * <p>When a PO is canceled:
 * <ul>
 *   <li>PurchaseRequest: VENDOR_SELECTED → RFQ_SENT</li>
 *   <li>RfqItem: SELECTED → REPLIED</li>
 * </ul>
 *
 * <p>This allows users to select a different vendor or send new RFQs.
 */
public record PurchaseOrderCanceledEvent(
        Long purchaseOrderId,
        Long purchaseRequestId,
        String rfqItemId,
        String poNumber
) implements DomainEvent {
}
