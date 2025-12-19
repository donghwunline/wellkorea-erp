package com.wellkorea.backend.approval.application;

import com.wellkorea.backend.shared.event.ApprovalRequiredEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event handler that listens for domain events requiring approval workflow.
 * Uses @TransactionalEventListener with BEFORE_COMMIT phase to ensure
 * the approval request is created within the same transaction as the
 * entity submission.
 *
 * <p>Transaction behavior:
 * <ul>
 *   <li>Handler runs BEFORE the originating transaction commits</li>
 *   <li>If approval creation fails, the entire transaction rolls back</li>
 *   <li>This ensures atomicity: entity status and approval request are consistent</li>
 * </ul>
 */
@Component
public class ApprovalEventHandler {

    private static final Logger log = LoggerFactory.getLogger(ApprovalEventHandler.class);

    private final ApprovalService approvalService;

    public ApprovalEventHandler(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    /**
     * Handle any event that implements ApprovalRequiredEvent.
     * Creates an approval request for the submitted entity.
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onApprovalRequired(ApprovalRequiredEvent event) {
        log.debug("Handling approval required event: entityType={}, entityId={}, submittedBy={}",
                event.getEntityType(), event.getEntityId(), event.getSubmittedByUserId());

        approvalService.createApprovalRequest(
                event.getEntityType(),
                event.getEntityId(),
                event.getEntityDescription(),
                event.getSubmittedByUserId()
        );

        log.info("Created approval request for {} with ID {}",
                event.getEntityType(), event.getEntityId());
    }
}
