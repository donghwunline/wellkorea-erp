package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.purchasing.domain.PurchaseRequest;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseRequestRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Command service for RFQ item operations within a PurchaseRequest aggregate.
 * <p>
 * All operations are performed through the aggregate root (PurchaseRequest)
 * since RfqItem is an embedded value object.
 */
@Service
@Transactional
public class RfqCommandService {

    private final PurchaseRequestRepository purchaseRequestRepository;

    public RfqCommandService(PurchaseRequestRepository purchaseRequestRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
    }

    /**
     * Record a vendor's reply to an RFQ item.
     *
     * @param purchaseRequestId the purchase request ID
     * @param command           the record reply command
     */
    public void recordReply(Long purchaseRequestId, RecordRfqReplyCommand command) {
        PurchaseRequest purchaseRequest = getPurchaseRequest(purchaseRequestId);

        purchaseRequest.recordRfqReply(
                command.itemId(),
                command.quotedPrice(),
                command.quotedLeadTime(),
                command.notes()
        );

        purchaseRequestRepository.save(purchaseRequest);
    }

    /**
     * Mark an RFQ item as no response from vendor.
     *
     * @param purchaseRequestId the purchase request ID
     * @param itemId            the RFQ item ID
     */
    public void markNoResponse(Long purchaseRequestId, String itemId) {
        PurchaseRequest purchaseRequest = getPurchaseRequest(purchaseRequestId);

        purchaseRequest.markRfqNoResponse(itemId);

        purchaseRequestRepository.save(purchaseRequest);
    }

    /**
     * Select a vendor's quote for the purchase request.
     * This transitions the purchase request to VENDOR_SELECTED status.
     *
     * @param purchaseRequestId the purchase request ID
     * @param itemId            the RFQ item ID to select
     */
    public void selectVendor(Long purchaseRequestId, String itemId) {
        PurchaseRequest purchaseRequest = getPurchaseRequest(purchaseRequestId);

        purchaseRequest.selectVendor(itemId);

        purchaseRequestRepository.save(purchaseRequest);
    }

    /**
     * Reject a vendor's quote.
     *
     * @param purchaseRequestId the purchase request ID
     * @param itemId            the RFQ item ID to reject
     */
    public void rejectRfq(Long purchaseRequestId, String itemId) {
        PurchaseRequest purchaseRequest = getPurchaseRequest(purchaseRequestId);

        purchaseRequest.rejectRfq(itemId);

        purchaseRequestRepository.save(purchaseRequest);
    }

    private PurchaseRequest getPurchaseRequest(Long id) {
        return purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request not found with ID: " + id));
    }

    // ========== Command Records ==========

    /**
     * Command for recording a vendor's RFQ reply.
     */
    public record RecordRfqReplyCommand(
            String itemId,
            BigDecimal quotedPrice,
            Integer quotedLeadTime,
            String notes
    ) {
    }
}
