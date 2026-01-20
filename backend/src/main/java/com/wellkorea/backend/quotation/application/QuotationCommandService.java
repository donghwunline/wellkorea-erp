package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.product.infrastructure.repository.ProductRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.domain.event.QuotationAcceptedEvent;
import com.wellkorea.backend.quotation.domain.event.QuotationSubmittedEvent;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.event.DomainEventPublisher;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Command service for quotation write operations.
 * Part of CQRS pattern - handles all create/update/delete operations.
 * Returns only entity IDs - clients should fetch fresh data via QuotationQueryService.
 */
@Service
@Transactional
public class QuotationCommandService {

    private final QuotationRepository quotationRepository;
    private final ProjectRepository projectRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;

    public QuotationCommandService(QuotationRepository quotationRepository,
                                   ProjectRepository projectRepository,
                                   ProductRepository productRepository,
                                   UserRepository userRepository,
                                   DomainEventPublisher eventPublisher) {
        this.quotationRepository = quotationRepository;
        this.projectRepository = projectRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create a new quotation with line items.
     * Input validation (lineItems presence, quantity/price) handled by DTO annotations.
     *
     * @return ID of the created quotation
     */
    public Long createQuotation(CreateQuotationCommand command, Long createdByUserId) {
        Project project = projectRepository.findById(command.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", command.projectId()));

        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", createdByUserId));

        // Determine version number
        int version = quotationRepository.findLatestVersionByProjectId(command.projectId())
                .map(v -> v + 1)
                .orElse(1);

        Quotation quotation = new Quotation();
        quotation.setProject(project);
        quotation.setVersion(version);
        quotation.setStatus(QuotationStatus.DRAFT);
        quotation.setValidityDays(command.validityDays() != null ? command.validityDays() : 30);
        quotation.setNotes(command.notes());
        quotation.setCreatedBy(createdBy);

        // Add line items
        addLineItemsFromCommands(quotation, command.lineItems());
        quotation.recalculateTotalAmount();

        Quotation saved = quotationRepository.save(quotation);
        return saved.getId();
    }

    /**
     * Update an existing quotation (only allowed for DRAFT status).
     *
     * @return ID of the updated quotation
     */
    public Long updateQuotation(Long quotationId, UpdateQuotationCommand command) {
        Quotation quotation = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        if (!quotation.canBeEdited()) {
            throw new BusinessException("Quotation can only be edited in DRAFT status");
        }

        if (command.validityDays() != null) {
            quotation.setValidityDays(command.validityDays());
        }
        if (command.notes() != null) {
            quotation.setNotes(command.notes());
        }

        // Update line items if provided
        if (command.lineItems() != null && !command.lineItems().isEmpty()) {
            // Clear existing line items - orphanRemoval=true will handle deletion
            // We need to flush after clearing to ensure deletes are executed before inserts
            // This avoids unique constraint violation on (quotation_id, sequence)
            quotation.clearLineItems();
            quotationRepository.flush();

            addLineItemsFromCommands(quotation, command.lineItems());
            quotation.recalculateTotalAmount();
        }

        Quotation saved = quotationRepository.save(quotation);
        return saved.getId();
    }

    /**
     * Submit quotation for approval.
     * Publishes QuotationSubmittedEvent which is handled by ApprovalEventHandler
     * within the same transaction (BEFORE_COMMIT phase).
     *
     * @return ID of the submitted quotation
     */
    public Long submitForApproval(Long quotationId, Long submittedByUserId) {
        Quotation quotation = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        if (!quotation.canBeSubmitted()) {
            throw new BusinessException("Quotation must be in DRAFT status with line items to submit for approval");
        }

        quotation.setStatus(QuotationStatus.PENDING);
        quotation.setSubmittedAt(LocalDateTime.now());
        Quotation savedQuotation = quotationRepository.save(quotation);

        // Publish event - handled by ApprovalEventHandler within same transaction
        eventPublisher.publish(new QuotationSubmittedEvent(
                savedQuotation.getId(),
                savedQuotation.getVersion(),
                savedQuotation.getProject().getJobCode(),
                submittedByUserId
        ));

        return savedQuotation.getId();
    }

    /**
     * Create a new version from an existing quotation.
     *
     * @return ID of the new quotation version
     */
    public Long createNewVersion(Long quotationId, Long createdByUserId) {
        Quotation original = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        if (!original.canCreateNewVersion()) {
            throw new BusinessException("Can only create new version from APPROVED, REJECTED, SENT, or ACCEPTED quotation");
        }

        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", createdByUserId));

        int newVersion = quotationRepository.findLatestVersionByProjectId(original.getProject().getId())
                .map(v -> v + 1)
                .orElse(1);

        Quotation newQuotation = new Quotation();
        newQuotation.setProject(original.getProject());
        newQuotation.setVersion(newVersion);
        newQuotation.setStatus(QuotationStatus.DRAFT);
        newQuotation.setValidityDays(original.getValidityDays());
        newQuotation.setNotes(original.getNotes());
        newQuotation.setCreatedBy(createdBy);

        // Copy line items
        int sequence = 1;
        for (QuotationLineItem originalItem : original.getLineItems()) {
            QuotationLineItem newItem = new QuotationLineItem();
            newItem.setProduct(originalItem.getProduct());
            newItem.setSequence(sequence++);
            newItem.setQuantity(originalItem.getQuantity());
            newItem.setUnitPrice(originalItem.getUnitPrice());
            newItem.calculateLineTotal();
            newItem.setNotes(originalItem.getNotes());

            newQuotation.addLineItem(newItem);
        }

        newQuotation.recalculateTotalAmount();
        Quotation saved = quotationRepository.save(newQuotation);
        return saved.getId();
    }

    /**
     * Approve quotation (called by approval workflow via event).
     * Only quotations in PENDING status can be approved.
     *
     * @return ID of the approved quotation
     */
    public Long approveQuotation(Long quotationId, Long approvedByUserId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        if (quotation.getStatus() != QuotationStatus.PENDING) {
            throw new BusinessException("Only PENDING quotations can be approved");
        }

        User approvedBy = userRepository.findById(approvedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", approvedByUserId));

        quotation.setStatus(QuotationStatus.APPROVED);
        quotation.setApprovedAt(LocalDateTime.now());
        quotation.setApprovedBy(approvedBy);

        Quotation saved = quotationRepository.save(quotation);
        return saved.getId();
    }

    /**
     * Reject quotation (called by approval workflow via event).
     * Only quotations in PENDING status can be rejected.
     *
     * @return ID of the rejected quotation
     */
    public Long rejectQuotation(Long quotationId, String rejectionReason) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        if (quotation.getStatus() != QuotationStatus.PENDING) {
            throw new BusinessException("Only PENDING quotations can be rejected");
        }

        quotation.setStatus(QuotationStatus.REJECTED);
        quotation.setRejectionReason(rejectionReason);

        Quotation saved = quotationRepository.save(quotation);
        return saved.getId();
    }

    /**
     * Mark quotation as sending (email in progress).
     * Only quotations in APPROVED or SENT status can be marked as sending.
     *
     * @return ID of the quotation being sent
     */
    public Long markAsSending(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        QuotationStatus currentStatus = quotation.getStatus();
        if (currentStatus != QuotationStatus.APPROVED && currentStatus != QuotationStatus.SENT) {
            throw new BusinessException("Only APPROVED or SENT quotations can be marked as sending");
        }

        quotation.setStatus(QuotationStatus.SENDING);

        Quotation saved = quotationRepository.save(quotation);
        return saved.getId();
    }

    /**
     * Mark quotation as sent to customer.
     * Only quotations in SENDING status can be marked as sent.
     *
     * @return ID of the sent quotation
     */
    public Long markAsSent(Long quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        if (quotation.getStatus() != QuotationStatus.SENDING) {
            throw new BusinessException("Only SENDING quotations can be marked as sent");
        }

        quotation.setStatus(QuotationStatus.SENT);

        Quotation saved = quotationRepository.save(quotation);
        return saved.getId();
    }

    /**
     * Mark quotation as accepted by customer.
     * Only quotations in APPROVED or SENT status can be accepted.
     * Publishes QuotationAcceptedEvent to trigger project status update.
     *
     * @return ID of the accepted quotation
     */
    public Long markAsAccepted(Long quotationId, Long acceptedByUserId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        QuotationStatus currentStatus = quotation.getStatus();
        if (currentStatus != QuotationStatus.APPROVED && currentStatus != QuotationStatus.SENT) {
            throw new BusinessException("Only APPROVED or SENT quotations can be accepted");
        }

        quotation.setStatus(QuotationStatus.ACCEPTED);

        Quotation saved = quotationRepository.save(quotation);

        // Publish event for project status update
        eventPublisher.publish(new QuotationAcceptedEvent(
                saved.getId(),
                saved.getProject().getId(),
                acceptedByUserId
        ));

        return saved.getId();
    }

    /**
     * Add line items from commands to a quotation.
     * Common logic extracted from create, update, and version creation methods.
     */
    private void addLineItemsFromCommands(Quotation quotation, List<LineItemCommand> commands) {
        int sequence = 1;
        for (LineItemCommand itemCmd : commands) {
            Product product = productRepository.findById(itemCmd.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with ID: " + itemCmd.productId()));

            QuotationLineItem lineItem = new QuotationLineItem();
            lineItem.setProduct(product);
            lineItem.setSequence(sequence++);
            lineItem.setQuantity(itemCmd.quantity());
            lineItem.setUnitPrice(itemCmd.unitPrice());
            lineItem.calculateLineTotal();
            lineItem.setNotes(itemCmd.notes());

            quotation.addLineItem(lineItem);
        }
    }
}
