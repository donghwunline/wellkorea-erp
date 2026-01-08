package com.wellkorea.backend.invoice.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * TaxInvoice entity - represents an official tax invoice (세금계산서).
 * <p>
 * A TaxInvoice contains multiple InvoiceLineItems and tracks payments
 * for AR (Accounts Receivable) management.
 * <p>
 * US6 Requirements:
 * - Auto-populate from delivery (FR-035)
 * - Track partial payments
 * - Calculate aging for AR reports (30/60/90+ days)
 * - Prevent double-invoicing at product-quantity level
 */
@Entity
@Table(name = "tax_invoices",
        uniqueConstraints = @UniqueConstraint(columnNames = "invoice_number"))
public class TaxInvoice {

    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("10.0"); // Korean VAT 10%

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "delivery_id")
    private Long deliveryId;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(name = "total_before_tax", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalBeforeTax = BigDecimal.ZERO;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate = DEFAULT_TAX_RATE;

    @Column(name = "total_tax", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalTax = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_id", nullable = false)
    private Long createdById;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "issued_to_customer_date")
    private LocalDate issuedToCustomerDate;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<InvoiceLineItem> lineItems = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Payment> payments = new ArrayList<>();

    protected TaxInvoice() {
        // JPA requires default constructor
    }

    private TaxInvoice(Builder builder) {
        this.id = builder.id;
        this.projectId = builder.projectId;
        this.deliveryId = builder.deliveryId;
        this.invoiceNumber = builder.invoiceNumber;
        this.issueDate = builder.issueDate;
        this.status = builder.status != null ? builder.status : InvoiceStatus.DRAFT;
        this.taxRate = builder.taxRate != null ? builder.taxRate : DEFAULT_TAX_RATE;
        this.dueDate = builder.dueDate;
        this.notes = builder.notes;
        this.createdById = builder.createdById;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
        this.updatedAt = builder.updatedAt != null ? builder.updatedAt : Instant.now();
        this.issuedToCustomerDate = builder.issuedToCustomerDate;
        if (builder.lineItems != null) {
            builder.lineItems.forEach(this::addLineItem);
        }
        recalculateTotals();
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public Long getDeliveryId() {
        return deliveryId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public InvoiceStatus getStatus() {
        return status;
    }

    public BigDecimal getTotalBeforeTax() {
        return totalBeforeTax;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public BigDecimal getTotalTax() {
        return totalTax;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public String getNotes() {
        return notes;
    }

    public Long getCreatedById() {
        return createdById;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public LocalDate getIssuedToCustomerDate() {
        return issuedToCustomerDate;
    }

    public List<InvoiceLineItem> getLineItems() {
        return Collections.unmodifiableList(lineItems);
    }

    public List<Payment> getPayments() {
        return Collections.unmodifiableList(payments);
    }

    // ========== Domain Methods ==========

    /**
     * Add a line item to this invoice.
     * Establishes bidirectional relationship and recalculates totals.
     *
     * @param lineItem Line item to add
     */
    public void addLineItem(InvoiceLineItem lineItem) {
        lineItems.add(lineItem);
        lineItem.setInvoice(this);
        recalculateTotals();
    }

    /**
     * Remove a line item from this invoice.
     *
     * @param lineItem Line item to remove
     */
    public void removeLineItem(InvoiceLineItem lineItem) {
        lineItems.remove(lineItem);
        lineItem.setInvoice(null);
        recalculateTotals();
    }

    /**
     * Add a payment to this invoice.
     *
     * @param payment Payment to add
     */
    public void addPayment(Payment payment) {
        payments.add(payment);
        payment.setInvoice(this);
        updateStatusAfterPayment();
    }

    /**
     * Recalculate totals from line items.
     */
    public void recalculateTotals() {
        this.totalBeforeTax = lineItems.stream()
                .map(InvoiceLineItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.totalTax = totalBeforeTax
                .multiply(taxRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        this.totalAmount = totalBeforeTax.add(totalTax);
        this.updatedAt = Instant.now();
    }

    /**
     * Calculate total payments received.
     *
     * @return Sum of all payment amounts
     */
    public BigDecimal getTotalPaid() {
        return payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calculate remaining balance (amount still owed).
     *
     * @return Total amount minus total paid
     */
    public BigDecimal getRemainingBalance() {
        return totalAmount.subtract(getTotalPaid());
    }

    /**
     * Check if invoice is fully paid.
     *
     * @return true if remaining balance is zero or less
     */
    public boolean isFullyPaid() {
        return getRemainingBalance().compareTo(BigDecimal.ZERO) <= 0;
    }

    /**
     * Issue the invoice (change status from DRAFT to ISSUED).
     */
    public void issue() {
        if (!status.canTransitionTo(InvoiceStatus.ISSUED)) {
            throw new IllegalStateException("Cannot issue invoice from status: " + status);
        }
        this.status = InvoiceStatus.ISSUED;
        this.issuedToCustomerDate = LocalDate.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Cancel the invoice.
     */
    public void cancel() {
        if (!status.canTransitionTo(InvoiceStatus.CANCELLED)) {
            throw new IllegalStateException("Cannot cancel invoice from status: " + status);
        }
        this.status = InvoiceStatus.CANCELLED;
        this.updatedAt = Instant.now();
    }

    /**
     * Mark invoice as overdue.
     */
    public void markOverdue() {
        if (status == InvoiceStatus.ISSUED || status == InvoiceStatus.PARTIALLY_PAID) {
            this.status = InvoiceStatus.OVERDUE;
            this.updatedAt = Instant.now();
        }
    }

    /**
     * Update status after a payment is recorded.
     */
    private void updateStatusAfterPayment() {
        if (isFullyPaid()) {
            this.status = InvoiceStatus.PAID;
        } else if (getTotalPaid().compareTo(BigDecimal.ZERO) > 0) {
            this.status = InvoiceStatus.PARTIALLY_PAID;
        }
        this.updatedAt = Instant.now();
    }

    /**
     * Check if invoice is overdue.
     *
     * @return true if due date has passed and not fully paid
     */
    public boolean isOverdue() {
        return !isFullyPaid() && dueDate.isBefore(LocalDate.now()) &&
                (status == InvoiceStatus.ISSUED || status == InvoiceStatus.PARTIALLY_PAID);
    }

    /**
     * Calculate days overdue.
     *
     * @return Number of days past due date, or 0 if not overdue
     */
    public long getDaysOverdue() {
        if (!isOverdue()) return 0;
        return java.time.temporal.ChronoUnit.DAYS.between(dueDate, LocalDate.now());
    }

    /**
     * Get aging bucket for AR reporting.
     *
     * @return Aging bucket: "Current", "30 Days", "60 Days", "90+ Days"
     */
    public String getAgingBucket() {
        if (isFullyPaid() || status == InvoiceStatus.CANCELLED) {
            return "N/A";
        }
        long daysOverdue = getDaysOverdue();
        if (daysOverdue <= 0) return "Current";
        if (daysOverdue <= 30) return "30 Days";
        if (daysOverdue <= 60) return "60 Days";
        return "90+ Days";
    }

    /**
     * Update notes.
     *
     * @param notes New notes
     */
    public void updateNotes(String notes) {
        this.notes = notes;
        this.updatedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TaxInvoice that = (TaxInvoice) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "TaxInvoice{" +
                "id=" + id +
                ", invoiceNumber='" + invoiceNumber + '\'' +
                ", projectId=" + projectId +
                ", status=" + status +
                ", totalAmount=" + totalAmount +
                ", dueDate=" + dueDate +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private Long projectId;
        private Long deliveryId;
        private String invoiceNumber;
        private LocalDate issueDate;
        private InvoiceStatus status;
        private BigDecimal taxRate;
        private LocalDate dueDate;
        private String notes;
        private Long createdById;
        private Instant createdAt;
        private Instant updatedAt;
        private LocalDate issuedToCustomerDate;
        private List<InvoiceLineItem> lineItems;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder projectId(Long projectId) {
            this.projectId = projectId;
            return this;
        }

        public Builder deliveryId(Long deliveryId) {
            this.deliveryId = deliveryId;
            return this;
        }

        public Builder invoiceNumber(String invoiceNumber) {
            this.invoiceNumber = invoiceNumber;
            return this;
        }

        public Builder issueDate(LocalDate issueDate) {
            this.issueDate = issueDate;
            return this;
        }

        public Builder status(InvoiceStatus status) {
            this.status = status;
            return this;
        }

        public Builder taxRate(BigDecimal taxRate) {
            this.taxRate = taxRate;
            return this;
        }

        public Builder dueDate(LocalDate dueDate) {
            this.dueDate = dueDate;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder createdById(Long createdById) {
            this.createdById = createdById;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder issuedToCustomerDate(LocalDate issuedToCustomerDate) {
            this.issuedToCustomerDate = issuedToCustomerDate;
            return this;
        }

        public Builder lineItems(List<InvoiceLineItem> lineItems) {
            this.lineItems = lineItems;
            return this;
        }

        public TaxInvoice build() {
            return new TaxInvoice(this);
        }
    }
}
