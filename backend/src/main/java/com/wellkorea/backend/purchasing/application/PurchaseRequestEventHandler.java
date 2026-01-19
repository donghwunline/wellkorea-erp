package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.purchasing.domain.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderCanceledEvent;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderCreatedEvent;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderReceivedEvent;
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
     * Handle purchase order created events.
     * Transitions the PurchaseRequest status from VENDOR_SELECTED to ORDERED.
     *
     * @param event the PO created event
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onPurchaseOrderCreated(PurchaseOrderCreatedEvent event) {
        log.debug("Handling PO created event: poId={}, prId={}",
                event.purchaseOrderId(), event.purchaseRequestId());

        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(event.purchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase request not found with ID: " + event.purchaseRequestId()));

        // Only mark as ordered if PR is in VENDOR_SELECTED status
        if (purchaseRequest.getStatus() != PurchaseRequestStatus.VENDOR_SELECTED) {
            log.info("Purchase request {} is not in VENDOR_SELECTED status (current: {}), skipping transition to ORDERED",
                    event.purchaseRequestId(), purchaseRequest.getStatus());
            return;
        }

        purchaseRequest.markOrdered();
        purchaseRequestRepository.save(purchaseRequest);

        log.info("Purchase request {} transitioned to ORDERED after PO {} was created",
                event.purchaseRequestId(), event.poNumber());
    }

    /**
     * Handle purchase order canceled events.
     * Reverts the PurchaseRequest status from VENDOR_SELECTED or ORDERED to RFQ_SENT
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

        // Only revert if PR is in VENDOR_SELECTED or ORDERED status
        if (purchaseRequest.getStatus() != PurchaseRequestStatus.VENDOR_SELECTED
                && purchaseRequest.getStatus() != PurchaseRequestStatus.ORDERED) {
            log.info("Purchase request {} is not in VENDOR_SELECTED or ORDERED status (current: {}), skipping revert",
                    event.purchaseRequestId(), purchaseRequest.getStatus());
            return;
        }

        purchaseRequest.revertVendorSelection(event.rfqItemId());
        purchaseRequestRepository.save(purchaseRequest);

        log.info("Purchase request {} reverted to RFQ_SENT after PO {} was canceled",
                event.purchaseRequestId(), event.poNumber());
    }

    /**
     * Handle purchase order received events.
     * Closes the PurchaseRequest when the associated PO is received,
     * completing the purchasing workflow.
     *
     * @param event the PO received event
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onPurchaseOrderReceived(PurchaseOrderReceivedEvent event) {
        log.debug("Handling PO received event: poId={}, prId={}",
                event.purchaseOrderId(), event.purchaseRequestId());

        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(event.purchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase request not found with ID: " + event.purchaseRequestId()));

        // Only close if PR is in ORDERED status
        if (purchaseRequest.getStatus() != PurchaseRequestStatus.ORDERED) {
            log.info("Purchase request {} is not in ORDERED status (current: {}), skipping close",
                    event.purchaseRequestId(), purchaseRequest.getStatus());
            return;
        }

        purchaseRequest.close();
        purchaseRequestRepository.save(purchaseRequest);

        log.info("Purchase request {} closed after PO {} was received",
                event.purchaseRequestId(), event.poNumber());
    }
}
