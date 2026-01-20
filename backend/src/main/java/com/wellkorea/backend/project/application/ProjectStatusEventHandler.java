package com.wellkorea.backend.project.application;

import com.wellkorea.backend.quotation.domain.event.QuotationAcceptedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event handler that listens for quotation acceptance events and updates project status.
 * Uses @TransactionalEventListener with BEFORE_COMMIT phase to ensure
 * the project status update is within the same transaction as the quotation acceptance.
 */
@Component
public class ProjectStatusEventHandler {

    private static final Logger log = LoggerFactory.getLogger(ProjectStatusEventHandler.class);

    private final ProjectCommandService projectCommandService;

    public ProjectStatusEventHandler(ProjectCommandService projectCommandService) {
        this.projectCommandService = projectCommandService;
    }

    /**
     * Handle quotation accepted events.
     * Activates the associated project (DRAFT → ACTIVE).
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onQuotationAccepted(QuotationAcceptedEvent event) {
        log.debug("Handling quotation accepted event: quotationId={}, projectId={}",
                event.quotationId(), event.projectId());

        projectCommandService.activateProject(event.projectId());
        log.info("Project {} activated after quotation {} acceptance",
                event.projectId(), event.quotationId());
    }
}
