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
import com.wellkorea.backend.quotation.domain.event.QuotationSubmittedEvent;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationLineItemRepository;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.event.DomainEventPublisher;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for quotation management.
 * Handles quotation creation, updates, submission, and version management.
 */
@Service
@Transactional
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final QuotationLineItemRepository lineItemRepository;
    private final ProjectRepository projectRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;

    public QuotationService(
            QuotationRepository quotationRepository,
            QuotationLineItemRepository lineItemRepository,
            ProjectRepository projectRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            DomainEventPublisher eventPublisher) {
        this.quotationRepository = quotationRepository;
        this.lineItemRepository = lineItemRepository;
        this.projectRepository = projectRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Create a new quotation with line items.
     */
    public Quotation createQuotation(CreateQuotationCommand command, Long createdByUserId) {
        validateCreateCommand(command);

        Project project = projectRepository.findById(command.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + command.projectId()));

        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdByUserId));

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
        return quotationRepository.save(quotation);
    }

    /**
     * Update an existing quotation (only allowed for DRAFT status).
     */
    public Quotation updateQuotation(Long quotationId, UpdateQuotationCommand command) {
        Quotation quotation = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));

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
            // Delete existing line items first to avoid unique constraint violation
            lineItemRepository.deleteAllByQuotationId(quotation.getId());
            lineItemRepository.flush();
            quotation.getLineItems().clear();

            addLineItemsFromCommands(quotation, command.lineItems());
            quotation.recalculateTotalAmount();
        }

        return quotationRepository.save(quotation);
    }

    /**
     * Get quotation by ID.
     */
    @Transactional(readOnly = true)
    public Quotation getQuotation(Long quotationId) {
        return quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));
    }

    /**
     * List quotations with filters.
     */
    @Transactional(readOnly = true)
    public Page<Quotation> listQuotations(QuotationStatus status, Long projectId, Pageable pageable) {
        return quotationRepository.findAllWithFilters(status, projectId, pageable);
    }

    /**
     * Submit quotation for approval.
     * Publishes QuotationSubmittedEvent which is handled by ApprovalEventHandler
     * within the same transaction (BEFORE_COMMIT phase).
     */
    public Quotation submitForApproval(Long quotationId, Long submittedByUserId) {
        Quotation quotation = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));

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

        return savedQuotation;
    }

    /**
     * Create a new version from an existing quotation.
     */
    public Quotation createNewVersion(Long quotationId, Long createdByUserId) {
        Quotation original = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));

        if (!original.canCreateNewVersion()) {
            throw new BusinessException("Can only create new version from APPROVED, REJECTED, SENT, or ACCEPTED quotation");
        }

        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + createdByUserId));

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
        return quotationRepository.save(newQuotation);
    }

    /**
     * Approve quotation (called by approval workflow via event).
     * Only quotations in PENDING status can be approved.
     */
    public Quotation approveQuotation(Long quotationId, Long approvedByUserId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));

        if (quotation.getStatus() != QuotationStatus.PENDING) {
            throw new BusinessException("Only PENDING quotations can be approved");
        }

        User approvedBy = userRepository.findById(approvedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + approvedByUserId));

        quotation.setStatus(QuotationStatus.APPROVED);
        quotation.setApprovedAt(LocalDateTime.now());
        quotation.setApprovedBy(approvedBy);
        return quotationRepository.save(quotation);
    }

    /**
     * Reject quotation (called by approval workflow via event).
     * Only quotations in PENDING status can be rejected.
     */
    public Quotation rejectQuotation(Long quotationId, String rejectionReason) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));

        if (quotation.getStatus() != QuotationStatus.PENDING) {
            throw new BusinessException("Only PENDING quotations can be rejected");
        }

        quotation.setStatus(QuotationStatus.REJECTED);
        quotation.setRejectionReason(rejectionReason);
        return quotationRepository.save(quotation);
    }

    /**
     * Generate PDF for quotation (placeholder - actual PDF generation would use a library).
     */
    @Transactional(readOnly = true)
    public byte[] generatePdf(Long quotationId) {
        Quotation quotation = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));

        if (!quotation.canGeneratePdf()) {
            throw new BusinessException("PDF can only be generated for non-DRAFT quotations");
        }

        // TODO: Implement actual PDF generation using iText or PDFBox
        // For now, return placeholder bytes
        return generatePlaceholderPdf(quotation);
    }

    private byte[] generatePlaceholderPdf(Quotation quotation) {
        // Placeholder PDF content
        String content = "Quotation PDF - ID: " + quotation.getId() + ", Version: " + quotation.getVersion();
        return content.getBytes();
    }

    private void validateCreateCommand(CreateQuotationCommand command) {
        if (command.lineItems() == null || command.lineItems().isEmpty()) {
            throw new BusinessException("Quotation must have at least one line item");
        }

        for (LineItemCommand item : command.lineItems()) {
            if (item.quantity() == null || item.quantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("Line item quantity must be positive");
            }
            if (item.unitPrice() == null || item.unitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("Line item unit price cannot be negative");
            }
        }
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
