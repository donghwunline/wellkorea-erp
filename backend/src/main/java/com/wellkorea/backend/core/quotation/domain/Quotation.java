package com.wellkorea.backend.core.quotation.domain;

import com.wellkorea.backend.core.auth.domain.User;
import com.wellkorea.backend.core.delivery.domain.*;
import com.wellkorea.backend.core.invoice.application.InvoiceNumberGenerator;
import com.wellkorea.backend.core.invoice.domain.InvoiceLineItem;
import com.wellkorea.backend.core.invoice.domain.InvoiceLineItemInput;
import com.wellkorea.backend.core.invoice.domain.QuotationInvoiceGuard;
import com.wellkorea.backend.core.invoice.domain.TaxInvoice;
import com.wellkorea.backend.core.project.domain.Project;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.supporting.approval.domain.Approvable;
import com.wellkorea.backend.supporting.approval.domain.ApprovalChainTemplate;
import com.wellkorea.backend.supporting.approval.domain.vo.ApprovalState;
import com.wellkorea.backend.supporting.approval.domain.vo.EntityType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Quotation entity representing a sales quotation linked to a project.
 * Supports versioning, line items, and approval workflow via Approvable pattern.
 *
 * <p>Use the Builder pattern for construction:
 * <pre>
 * Quotation quotation = Quotation.builder()
 *     .project(project)
 *     .version(1)
 *     .createdBy(user)
 *     .build();
 * </pre>
 */
@Entity
@Table(name = "quotations")
public class Quotation implements Approvable {

    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("10.0");
    private static final int DEFAULT_VALIDITY_DAYS = 30;

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

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate = DEFAULT_TAX_RATE;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    // ========== Approvable Fields ==========

    @Embedded
    private ApprovalState approvalState = new ApprovalState();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    private List<QuotationLineItem> lineItems = new ArrayList<>();

    /**
     * Protected no-arg constructor for JPA.
     * Use {@link #builder()} for application code.
     */
    protected Quotation() {
        // Required by JPA
    }

    // ========== Builder ==========

    public static Builder builder() {
        return new Builder();
    }

    /**
     * Private constructor for Builder pattern.
     * Sets defaults for optional fields.
     */
    private Quotation(Builder builder) {
        this.id = builder.id;
        this.project = builder.project;
        this.version = builder.version;
        this.status = builder.status != null ? builder.status : QuotationStatus.DRAFT;
        this.validityDays = builder.validityDays != null ? builder.validityDays : DEFAULT_VALIDITY_DAYS;
        this.taxRate = builder.taxRate != null ? builder.taxRate : DEFAULT_TAX_RATE;
        this.discountAmount = builder.discountAmount != null ? builder.discountAmount : BigDecimal.ZERO;
        this.notes = builder.notes;
        this.createdBy = builder.createdBy;
        this.quotationDate = builder.quotationDate != null ? builder.quotationDate : LocalDate.now();
        this.totalAmount = builder.totalAmount != null ? builder.totalAmount : BigDecimal.ZERO;
    }

    /**
     * Builder for Quotation entity.
     * Follows the pattern established by Project.Builder.
     */
    public static class Builder {
        private Long id;
        private Project project;
        private Integer version;
        private QuotationStatus status;
        private Integer validityDays;
        private BigDecimal taxRate;
        private BigDecimal discountAmount;
        private String notes;
        private User createdBy;
        private LocalDate quotationDate;
        private BigDecimal totalAmount;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder project(Project project) {
            this.project = project;
            return this;
        }

        public Builder version(Integer version) {
            this.version = version;
            return this;
        }

        public Builder status(QuotationStatus status) {
            this.status = status;
            return this;
        }

        public Builder validityDays(Integer validityDays) {
            this.validityDays = validityDays;
            return this;
        }

        public Builder taxRate(BigDecimal taxRate) {
            this.taxRate = taxRate;
            return this;
        }

        public Builder discountAmount(BigDecimal discountAmount) {
            this.discountAmount = discountAmount;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder createdBy(User createdBy) {
            this.createdBy = createdBy;
            return this;
        }

        public Builder quotationDate(LocalDate quotationDate) {
            this.quotationDate = quotationDate;
            return this;
        }

        /**
         * Set total amount directly. For tests only - normally calculated via addLineItem().
         */
        public Builder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public Quotation build() {
            return new Quotation(this);
        }
    }

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

    // ========== State Transition Methods ==========

    /**
     * Mark quotation as pending approval. Only allowed from DRAFT status.
     *
     * @throws BusinessException if not in DRAFT status
     */
    public void markAsPending() {
        if (this.status != QuotationStatus.DRAFT) {
            throw new BusinessException("Can only submit DRAFT quotations for approval");
        }
        this.status = QuotationStatus.PENDING;
    }

    /**
     * Mark quotation as sending (email in progress).
     * Only allowed from APPROVED or SENT status.
     *
     * @throws BusinessException if not in APPROVED or SENT status
     */
    public void markAsSending() {
        if (this.status != QuotationStatus.APPROVED && this.status != QuotationStatus.SENT) {
            throw new BusinessException("Only APPROVED or SENT quotations can be marked as sending");
        }
        this.status = QuotationStatus.SENDING;
    }

    /**
     * Mark quotation as sent to customer.
     * Only allowed from SENDING status.
     *
     * @throws BusinessException if not in SENDING status
     */
    public void markAsSent() {
        if (this.status != QuotationStatus.SENDING) {
            throw new BusinessException("Only SENDING quotations can be marked as sent");
        }
        this.status = QuotationStatus.SENT;
    }

    /**
     * Mark quotation as accepted by customer.
     * Only allowed from APPROVED or SENT status.
     *
     * @throws BusinessException if not in APPROVED or SENT status
     */
    public void markAsAccepted() {
        if (this.status != QuotationStatus.APPROVED && this.status != QuotationStatus.SENT) {
            throw new BusinessException("Only APPROVED or SENT quotations can be accepted");
        }
        this.status = QuotationStatus.ACCEPTED;
    }

    // ========== Update Methods ==========

    /**
     * Update the validity days. Only allowed in DRAFT status.
     *
     * @param validityDays Number of days the quotation is valid
     * @throws BusinessException        if not in DRAFT status
     * @throws IllegalArgumentException if validityDays is null or not positive
     */
    public void updateValidityDays(Integer validityDays) {
        if (!canBeEdited()) {
            throw new BusinessException("Validity days can only be updated in DRAFT status");
        }
        if (validityDays == null || validityDays <= 0) {
            throw new IllegalArgumentException("Validity days must be positive");
        }
        this.validityDays = validityDays;
    }

    /**
     * Update the notes. Only allowed in DRAFT status.
     *
     * @param notes Notes for the quotation (can be null)
     * @throws BusinessException if not in DRAFT status
     */
    public void updateNotes(String notes) {
        if (!canBeEdited()) {
            throw new BusinessException("Notes can only be updated in DRAFT status");
        }
        this.notes = notes;
    }

    /**
     * Update the tax rate. Only allowed in DRAFT status.
     *
     * @param taxRate Tax rate percentage (0-100)
     * @throws BusinessException        if not in DRAFT status
     * @throws IllegalArgumentException if tax rate is out of range
     */
    public void updateTaxRate(BigDecimal taxRate) {
        if (!canBeEdited()) {
            throw new BusinessException("Tax rate can only be updated in DRAFT status");
        }
        if (taxRate.compareTo(BigDecimal.ZERO) < 0 || taxRate.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("Tax rate must be between 0 and 100");
        }
        this.taxRate = taxRate;
    }

    /**
     * Update the discount amount. Only allowed in DRAFT status.
     * Discount cannot exceed (subtotal + tax).
     *
     * @param discountAmount Discount amount in KRW
     * @throws BusinessException        if not in DRAFT status or discount exceeds limit
     * @throws IllegalArgumentException if discount is negative
     */
    public void updateDiscountAmount(BigDecimal discountAmount) {
        if (!canBeEdited()) {
            throw new BusinessException("Discount can only be updated in DRAFT status");
        }
        if (discountAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Discount amount cannot be negative");
        }
        // Discount cannot exceed (subtotal + tax)
        BigDecimal maxDiscount = calculateAmountBeforeDiscount();
        if (discountAmount.compareTo(maxDiscount) > 0) {
            throw new BusinessException("Discount cannot exceed amount before discount (" + maxDiscount + ")");
        }
        this.discountAmount = discountAmount;
    }

    /**
     * Calculate the amount before discount (subtotal + tax).
     *
     * @return subtotal + taxAmount
     */
    public BigDecimal calculateAmountBeforeDiscount() {
        BigDecimal taxAmount = totalAmount.multiply(taxRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        return totalAmount.add(taxAmount);
    }

    /**
     * Calculate the tax amount.
     *
     * @return taxAmount = subtotal × taxRate / 100
     */
    public BigDecimal calculateTaxAmount() {
        return totalAmount.multiply(taxRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate the final amount after discount.
     *
     * @return finalAmount = amountBeforeDiscount - discountAmount
     */
    public BigDecimal calculateFinalAmount() {
        return calculateAmountBeforeDiscount().subtract(discountAmount);
    }

    /**
     * Check if quotation is in a customer-accepted state.
     * Accepted states are: SENT, ACCEPTED
     * (i.e., quotation has been sent to customer and can be used for deliveries/invoices)
     * <p>
     * Note: APPROVED status is internal approval only. Customer must accept (via ACCEPTED status)
     * or at minimum receive the quotation (SENT status) before deliveries/invoices can be created.
     *
     * @return true if quotation is accepted by customer
     */
    public boolean isApproved() {
        return status == QuotationStatus.SENT || status == QuotationStatus.ACCEPTED;
    }

    // ========== Factory Methods ==========

    /**
     * Factory method to create a Delivery for this quotation.
     * <p>
     * This method uses the Double Dispatch pattern: the guard is passed in
     * as a parameter, allowing the domain entity to delegate validation to
     * infrastructure without having direct repository dependencies.
     * <p>
     * Similar pattern: {@link ApprovalChainTemplate#createLevelDecisions()}
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
     * Tax rate is inherited from this quotation.
     * Discount amount is set manually by the caller (financial personnel).
     * <p>
     * Similar pattern: {@link #createDelivery}
     *
     * @param quotationInvoiceGuard  Guard that validates invoice against delivered/invoiced limits
     * @param invoiceNumberGenerator Generator for unique invoice numbers
     * @param issueDate              Invoice issue date
     * @param dueDate                Payment due date
     * @param notes                  Optional notes for the invoice
     * @param discountAmount         Manual discount amount (null defaults to ZERO, must be non-negative)
     * @param lineItems              Line items to invoice
     * @param createdById            User ID of who is creating the invoice
     * @return New TaxInvoice entity with all line items added
     * @throws BusinessException        if quotation is not approved or validation fails
     * @throws IllegalArgumentException if due date is before issue date or discount is negative
     */
    public TaxInvoice createInvoice(QuotationInvoiceGuard quotationInvoiceGuard,
                                    InvoiceNumberGenerator invoiceNumberGenerator,
                                    LocalDate issueDate,
                                    LocalDate dueDate,
                                    String notes,
                                    BigDecimal discountAmount,
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

        // Validate discount amount
        BigDecimal invoiceDiscount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
        if (invoiceDiscount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Discount amount must not be negative");
        }

        // Generate unique invoice number
        String invoiceNumber = invoiceNumberGenerator.generate();

        // Build the invoice entity - taxRate inherited from quotation, discount set manually
        TaxInvoice invoice = TaxInvoice.builder()
                .projectId(project.getId())
                .quotationId(this.id)
                .invoiceNumber(invoiceNumber)
                .issueDate(issueDate)
                .dueDate(dueDate)
                .taxRate(this.taxRate)
                .discountAmount(invoiceDiscount)
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

    // ========== Approvable Interface Implementation ==========

    @Override
    public EntityType getApprovalEntityType() {
        return EntityType.QUOTATION;
    }

    @Override
    public ApprovalState getApprovalState() {
        return approvalState;
    }

    @Override
    public String getApprovalDescription() {
        return String.format("견적서: %s v%d", project.getJobCode(), version);
    }

    @Override
    public void onApprovalGranted(Long approverUserId) {
        if (!approvalState.isPending()) {
            throw new IllegalStateException("Not pending approval");
        }
        this.status = QuotationStatus.APPROVED;
        this.approvalState.markApproved(approverUserId);
    }

    @Override
    public void onApprovalRejected(Long rejectorUserId, String reason) {
        if (!approvalState.isPending()) {
            throw new IllegalStateException("Not pending approval");
        }
        this.status = QuotationStatus.REJECTED;
        this.approvalState.markRejected(rejectorUserId, reason);
    }

    // ========== Getters ==========

    @Override
    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public Integer getVersion() {
        return version;
    }

    public QuotationStatus getStatus() {
        return status;
    }

    public LocalDate getQuotationDate() {
        return quotationDate;
    }

    public Integer getValidityDays() {
        return validityDays;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public String getNotes() {
        return notes;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    // ========== Convenience Getters (delegating to ApprovalState) ==========

    /**
     * Get the user ID who submitted this quotation for approval.
     */
    public Long getSubmittedByUserId() {
        return approvalState.getSubmittedByUserId();
    }

    /**
     * Get the timestamp when this quotation was submitted for approval.
     */
    public LocalDateTime getSubmittedAt() {
        return approvalState.getSubmittedAt();
    }

    /**
     * Get the timestamp when this quotation was approved.
     * Returns null if not in APPROVED status.
     */
    public LocalDateTime getApprovedAt() {
        return approvalState.isApproved() ? approvalState.getCompletedAt() : null;
    }

    /**
     * Get the user ID who approved this quotation.
     * Returns null if not in APPROVED status.
     */
    public Long getApprovedByUserId() {
        return approvalState.isApproved() ? approvalState.getCompletedByUserId() : null;
    }

    /**
     * Get the rejection reason.
     */
    public String getRejectionReason() {
        return approvalState.getRejectionReason();
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
}
