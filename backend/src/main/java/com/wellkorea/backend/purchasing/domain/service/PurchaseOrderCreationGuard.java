package com.wellkorea.backend.purchasing.domain.service;

/**
 * Guard interface for PurchaseOrder creation validation.
 * <p>
 * Defined in domain layer; implementation in infrastructure with repository access.
 * Following the same pattern as QuotationDeliveryGuard and QuotationInvoiceGuard.
 * <p>
 * The PurchaseRequest aggregate receives this guard as a parameter to its factory method,
 * allowing the domain to delegate infrastructure-dependent validation while maintaining
 * a rich domain model.
 *
 * @see com.wellkorea.backend.delivery.domain.QuotationDeliveryGuard
 */
public interface PurchaseOrderCreationGuard {

    /**
     * Check if an active (non-canceled) PO already exists for this RFQ item.
     *
     * @param purchaseRequestId The purchase request ID
     * @param rfqItemId         The RFQ item ID
     * @throws com.wellkorea.backend.shared.exception.BusinessException if PO already exists
     */
    void validateNoDuplicatePurchaseOrder(Long purchaseRequestId, String rfqItemId);
}
