package com.wellkorea.backend.quotation.domain;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.delivery.domain.*;
import com.wellkorea.backend.invoice.application.InvoiceNumberGenerator;
import com.wellkorea.backend.invoice.domain.*;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.shared.exception.BusinessException;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Quotation entity representing a sales quotation linked to a project.
 * Supports versioning, line items, and approval workflow.
 */
@Entity
@Table(name = "quotations")
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private QuotationStatus status = QuotationStatus.DRAFT;

    @Column(name = "quotation_date", nullable = false)
    private LocalDate quotationDate;

    @Column(name = "validity_days", nullable = false)
    private Integer validityDays = 30;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<QuotationLineItem> lineItems = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (quotationDate == null) {
            quotationDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Business methods
    public void addLineItem(QuotationLineItem lineItem) {
        lineItems.add(lineItem);
        lineItem.setQuotation(this);
        recalculateTotalAmount();
    }

    public void removeLineItem(QuotationLineItem lineItem) {
        lineItems.remove(lineItem);
        lineItem.setQuotation(null);
        recalculateTotalAmount();
    }

    public void clearLineItems() {
        lineItems.forEach(item -> item.setQuotation(null));
        lineItems.clear();
        totalAmount = BigDecimal.ZERO;
    }

    public void recalculateTotalAmount() {
        totalAmount = lineItems.stream()
                .map(QuotationLineItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public LocalDate getExpiryDate() {
        return quotationDate.plusDays(validityDays);
    }

    public boolean isExpired() {
        return LocalDate.now().isAfter(getExpiryDate());
    }

    public boolean canBeEdited() {
        return status == QuotationStatus.DRAFT;
    }

    public boolean canBeSubmitted() {
        return status == QuotationStatus.DRAFT && !lineItems.isEmpty();
    }

    public boolean canGeneratePdf() {
        return status != QuotationStatus.DRAFT;
    }

    public boolean canCreateNewVersion() {
        return status == QuotationStatus.APPROVED ||
                status == QuotationStatus.REJECTED ||
                status == QuotationStatus.SENT ||
                status == QuotationStatus.ACCEPTED;
    }

    /**
     * Check if quotation is in an approved state.
     * Approved states are: APPROVED, SENT, ACCEPTED
     * (i.e., quotation has been approved and can be used for deliveries)
     *
     * @return true if quotation is approved
     */
    public boolean isApproved() {
        return status == QuotationStatus.APPROVED ||
                status == QuotationStatus.SENT ||
                status == QuotationStatus.ACCEPTED;
    }

    // ========== Factory Methods ==========

    /**
     * Factory method to create a Delivery for this quotation.
     * <p>
     * This method uses the Double Dispatch pattern: the guard is passed in
     * as a parameter, allowing the domain entity to delegate validation to
     * infrastructure without having direct repository dependencies.
     * <p>
     * Similar pattern: {@link com.wellkorea.backend.approval.domain.ApprovalChainTemplate#createLevelDecisions()}
     *
     * @param quotationDeliveryGuard Guard that validates delivery against quotation limits
     * @param deliveryDate           Date of the delivery
     * @param notes                  Optional notes for the delivery
     * @param lineItems              Line items to deliver
     * @param deliveredById          User ID of who is recording the delivery
     * @return New Delivery entity with all line items added
     * @throws BusinessException if quotation is not approved or validation fails
     */
    public Delivery createDelivery(QuotationDeliveryGuard quotationDeliveryGuard,
                                   LocalDate deliveryDate,
                                   String notes,
                                   List<DeliveryLineItemInput> lineItems,
                                   Long deliveredById) {
        // Quotation must be approved to create deliveries
        if (!isApproved()) {
            throw new BusinessException(
                    "Cannot create delivery: quotation is not approved (current status: " + status + ")");
        }

        // Delegate validation to the guard (which has repository access)
        quotationDeliveryGuard.validateAndThrow(this, lineItems);

        // Build the delivery entity
        Delivery delivery = Delivery.builder()
                .projectId(project.getId())
                .quotationId(id)
                .deliveryDate(deliveryDate)
                .status(DeliveryStatus.PENDING)
                .deliveredById(deliveredById)
                .notes(notes)
                .build();

        // Add all line items
        for (DeliveryLineItemInput input : lineItems) {
            DeliveryLineItem lineItem = DeliveryLineItem.builder()
                    .productId(input.productId())
                    .quantityDelivered(input.quantityDelivered())
                    .build();
            delivery.addLineItem(lineItem);
        }

        return delivery;
    }

    /**
     * Factory method to create a TaxInvoice for this quotation.
     * <p>
     * This method uses the Double Dispatch pattern: the guard and number generator
     * are passed in as parameters, allowing the domain entity to delegate validation
     * and number generation to infrastructure without having direct dependencies.
     * <p>
     * Similar pattern: {@link #createDelivery}
     *
     * @param quotationInvoiceGuard  Guard that validates invoice against delivered/invoiced limits
     * @param invoiceNumberGenerator Generator for unique invoice numbers
     * @param issueDate              Invoice issue date
     * @param dueDate                Payment due date
     * @param taxRate                Tax rate (nullable, defaults to 10%)
     * @param notes                  Optional notes for the invoice
     * @param deliveryId             Optional delivery ID to link
     * @param lineItems              Line items to invoice
     * @param createdById            User ID of who is creating the invoice
     * @return New TaxInvoice entity with all line items added
     * @throws BusinessException        if quotation is not approved or validation fails
     * @throws IllegalArgumentException if due date is before issue date
     */
    public TaxInvoice createInvoice(QuotationInvoiceGuard quotationInvoiceGuard,
                                    InvoiceNumberGenerator invoiceNumberGenerator,
                                    LocalDate issueDate,
                                    LocalDate dueDate,
                                    BigDecimal taxRate,
                                    String notes,
                                    Long deliveryId,
                                    List<InvoiceLineItemInput> lineItems,
                                    Long createdById) {
        // Quotation must be approved to create invoices
        if (!isApproved()) {
            throw new BusinessException(
                    "Cannot create invoice: quotation is not approved (current status: " + status + ")");
        }

        // Delegate validation to the guard (which has repository access)
        quotationInvoiceGuard.validateAndThrow(this, lineItems);

        // Validate dates
        if (dueDate.isBefore(issueDate)) {
            throw new IllegalArgumentException("Due date must be on or after issue date");
        }

        // Generate unique invoice number
        String invoiceNumber = invoiceNumberGenerator.generate();

        // Build the invoice entity
        TaxInvoice invoice = TaxInvoice.builder()
                .projectId(project.getId())
                .deliveryId(deliveryId)
                .invoiceNumber(invoiceNumber)
                .issueDate(issueDate)
                .dueDate(dueDate)
                .taxRate(taxRate)
                .notes(notes)
                .createdById(createdById)
                .build();

        // Add all line items
        for (InvoiceLineItemInput input : lineItems) {
            InvoiceLineItem lineItem = InvoiceLineItem.builder()
                    .productId(input.productId())
                    .productName(input.productName())
                    .productSku(input.productSku())
                    .quantityInvoiced(input.quantityInvoiced())
                    .unitPrice(input.unitPrice())
                    .build();
            invoice.addLineItem(lineItem);
        }

        return invoice;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public QuotationStatus getStatus() {
        return status;
    }

    public void setStatus(QuotationStatus status) {
        this.status = status;
    }

    public LocalDate getQuotationDate() {
        return quotationDate;
    }

    public void setQuotationDate(LocalDate quotationDate) {
        this.quotationDate = quotationDate;
    }

    public Integer getValidityDays() {
        return validityDays;
    }

    public void setValidityDays(Integer validityDays) {
        this.validityDays = validityDays;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public List<QuotationLineItem> getLineItems() {
        if (lineItems == null) {
            return List.of();
        }
        return new ArrayList<>(lineItems);
    }

    public void setLineItems(List<QuotationLineItem> lineItems) {
        if (lineItems == null) {
            this.lineItems = null;
        } else {
            this.lineItems = new ArrayList<>(lineItems);
        }
    }
}
