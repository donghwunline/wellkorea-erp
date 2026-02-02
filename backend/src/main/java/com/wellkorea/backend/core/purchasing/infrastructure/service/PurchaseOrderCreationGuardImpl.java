package com.wellkorea.backend.core.purchasing.infrastructure.service;

import com.wellkorea.backend.core.delivery.infrastructure.validation.DatabaseQuotationDeliveryGuard;
import com.wellkorea.backend.core.purchasing.domain.service.PurchaseOrderCreationGuard;
import com.wellkorea.backend.core.purchasing.domain.vo.PurchaseOrderStatus;
import com.wellkorea.backend.core.purchasing.infrastructure.persistence.PurchaseOrderRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import org.springframework.stereotype.Service;

/**
 * Infrastructure implementation of {@link PurchaseOrderCreationGuard}.
 * <p>
 * Validates PurchaseOrder creation by checking:
 * - No duplicate active PO exists for the same RFQ item
 * <p>
 * Similar pattern: {@link DatabaseQuotationDeliveryGuard}
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
