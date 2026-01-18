package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.purchasing.domain.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderCanceledEvent;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event handler that listens for purchase order events and updates purchase request status.
 * Uses @TransactionalEventListener with BEFORE_COMMIT phase to ensure
 * the purchase request update is within the same transaction as the PO operation.
 */
@Component
public class PurchaseRequestEventHandler {

    private static final Logger log = LoggerFactory.getLogger(PurchaseRequestEventHandler.class);

    private final PurchaseRequestRepository purchaseRequestRepository;

    public PurchaseRequestEventHandler(PurchaseRequestRepository purchaseRequestRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
    }

    /**
     * Handle purchase order canceled events.
     * Reverts the PurchaseRequest status from VENDOR_SELECTED to RFQ_SENT
     * and deselects the RfqItem so a different vendor can be selected.
     *
     * @param event the PO canceled event
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onPurchaseOrderCanceled(PurchaseOrderCanceledEvent event) {
        log.debug("Handling PO canceled event: poId={}, prId={}, rfqItemId={}",
                event.purchaseOrderId(), event.purchaseRequestId(), event.rfqItemId());

        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(event.purchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase request not found with ID: " + event.purchaseRequestId()));

        // Only revert if PR is in VENDOR_SELECTED status
        if (purchaseRequest.getStatus() != PurchaseRequestStatus.VENDOR_SELECTED) {
            log.info("Purchase request {} is not in VENDOR_SELECTED status (current: {}), skipping revert",
                    event.purchaseRequestId(), purchaseRequest.getStatus());
            return;
        }

        purchaseRequest.revertVendorSelection(event.rfqItemId());
        purchaseRequestRepository.save(purchaseRequest);

        log.info("Purchase request {} reverted to RFQ_SENT after PO {} was canceled",
                event.purchaseRequestId(), event.poNumber());
    }
}
