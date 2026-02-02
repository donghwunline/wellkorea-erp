package com.wellkorea.backend.supporting.approval.application;

import com.wellkorea.backend.supporting.approval.domain.Approvable;
import com.wellkorea.backend.supporting.approval.domain.event.ApprovalCompletedEvent;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Generic event handler for ApprovalCompletedEvent that delegates to Approvable entities.
 *
 * <p>When an approval workflow completes (approved or rejected), this handler:
 * <ol>
 *   <li>Checks if the entity type is registered in the ApprovableRegistry</li>
 *   <li>If not registered, returns silently (allows legacy handlers like QuotationApprovalEventHandler to work)</li>
 *   <li>If registered, resolves the entity and calls onApprovalGranted() or onApprovalRejected()</li>
 * </ol>
 *
 * <p>This enables adding new approvable entities without modifying this handler:
 * <ol>
 *   <li>Entity implements Approvable interface</li>
 *   <li>Entity embeds ApprovalState field</li>
 *   <li>Entity registers resolver in ApprovableRegistry</li>
 *   <li>Entity publishes ApprovalRequiredEvent when submitting for approval</li>
 * </ol>
 *
 * <p>The handler runs in BEFORE_COMMIT phase to ensure entity state changes are
 * within the same transaction as the approval completion.
 */
@Component
public class GenericApprovalCompletedHandler {

    private static final Logger log = LoggerFactory.getLogger(GenericApprovalCompletedHandler.class);

    private final ApprovableRegistry registry;

    public GenericApprovalCompletedHandler(ApprovableRegistry registry) {
        this.registry = registry;
    }

    /**
     * Handle approval completion events for registered Approvable entities.
     * For unregistered entity types, returns silently to allow legacy handlers to process.
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onApprovalCompleted(ApprovalCompletedEvent event) {
        // Check if registry has a resolver for this type
        if (!registry.supports(event.entityType())) {
            // Fall through to legacy handlers (e.g., QuotationApprovalEventHandler)
            log.debug("No Approvable resolver registered for type {}, skipping generic handler",
                    event.entityType());
            return;
        }

        log.debug("Processing approval completed event: entityType={}, entityId={}, status={}",
                event.entityType(), event.entityId(), event.finalStatus());

        Approvable entity = registry.resolve(event.entityType(), event.entityId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Approvable entity not found: type=" + event.entityType() + ", id=" + event.entityId()));

        if (event.isApproved()) {
            entity.onApprovalGranted(event.approverUserId());
            log.info("{} {} approved via generic handler by user {}",
                    event.entityType(), event.entityId(), event.approverUserId());
        } else if (event.isRejected()) {
            entity.onApprovalRejected(event.approverUserId(), event.rejectionReason());
            log.info("{} {} rejected via generic handler by user {}: {}",
                    event.entityType(), event.entityId(), event.approverUserId(), event.rejectionReason());
        }
    }
}
