package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.approval.domain.EntityType;
import com.wellkorea.backend.approval.domain.event.ApprovalCompletedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event handler that listens for approval completion events and updates quotation status.
 * Uses @TransactionalEventListener with BEFORE_COMMIT phase to ensure
 * the quotation status update is within the same transaction as the approval completion.
 */
@Component
public class QuotationApprovalEventHandler {

    private static final Logger log = LoggerFactory.getLogger(QuotationApprovalEventHandler.class);

    private final QuotationService quotationService;

    public QuotationApprovalEventHandler(QuotationService quotationService) {
        this.quotationService = quotationService;
    }

    /**
     * Handle approval completion events for quotations.
     * Updates quotation status to APPROVED or REJECTED based on the event.
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onApprovalCompleted(ApprovalCompletedEvent event) {
        // Only handle QUOTATION entity type
        if (event.entityType() != EntityType.QUOTATION) {
            return;
        }

        log.debug("Handling approval completed event: quotationId={}, status={}",
                event.entityId(), event.finalStatus());

        if (event.isApproved()) {
            quotationService.approveQuotation(event.entityId(), event.approverUserId());
            log.info("Quotation {} approved", event.entityId());
        } else if (event.isRejected()) {
            quotationService.rejectQuotation(event.entityId(), event.rejectionReason());
            log.info("Quotation {} rejected: {}", event.entityId(), event.rejectionReason());
        }
    }
}
