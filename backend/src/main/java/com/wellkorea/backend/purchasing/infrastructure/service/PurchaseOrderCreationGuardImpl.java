package com.wellkorea.backend.purchasing.infrastructure.service;

import com.wellkorea.backend.purchasing.domain.service.PurchaseOrderCreationGuard;
import com.wellkorea.backend.purchasing.domain.vo.PurchaseOrderStatus;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseOrderRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import org.springframework.stereotype.Service;

/**
 * Infrastructure implementation of {@link PurchaseOrderCreationGuard}.
 * <p>
 * Validates PurchaseOrder creation by checking:
 * - No duplicate active PO exists for the same RFQ item
 * <p>
 * Similar pattern: {@link com.wellkorea.backend.delivery.infrastructure.validation.DatabaseQuotationDeliveryGuard}
 */
@Service
public class PurchaseOrderCreationGuardImpl implements PurchaseOrderCreationGuard {

    private final PurchaseOrderRepository purchaseOrderRepository;

    public PurchaseOrderCreationGuardImpl(PurchaseOrderRepository purchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Override
    public void validateNoDuplicatePurchaseOrder(Long purchaseRequestId, String rfqItemId) {
        if (purchaseOrderRepository.existsByPurchaseRequestIdAndRfqItemIdAndStatusNot(
                purchaseRequestId, rfqItemId, PurchaseOrderStatus.CANCELED)) {
            throw new BusinessException("Purchase order already exists for this RFQ item");
        }
    }
}
