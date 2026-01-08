package com.wellkorea.backend.invoice.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Payment entity - records customer payments toward invoices.
 * <p>
 * Supports partial/installment payments with full audit trail.
 * <p>
 * US6 Requirements:
 * - Track payment amount, method, and reference number
 * - Validate total payments don't exceed invoice total
 * - Support partial payments for AR tracking
 */
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private TaxInvoice invoice;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    private PaymentMethod paymentMethod;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "recorded_by_id", nullable = false)
    private Long recordedById;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Payment() {
        // JPA requires default constructor
    }

    private Payment(Builder builder) {
        this.id = builder.id;
        this.paymentDate = builder.paymentDate;
        this.amount = builder.amount;
        this.paymentMethod = builder.paymentMethod;
        this.referenceNumber = builder.referenceNumber;
        this.notes = builder.notes;
        this.recordedById = builder.recordedById;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public TaxInvoice getInvoice() {
        return invoice;
    }

    public Long getInvoiceId() {
        return invoice != null ? invoice.getId() : null;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public String getNotes() {
        return notes;
    }

    public Long getRecordedById() {
        return recordedById;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    // ========== Package-Private Setters for Relationship ==========

    void setInvoice(TaxInvoice invoice) {
        this.invoice = invoice;
    }

    // ========== Domain Methods ==========

    /**
     * Check if this is a partial payment (less than invoice total).
     *
     * @return true if payment is less than invoice total
     */
    public boolean isPartialPayment() {
        if (invoice == null) return false;
        return amount.compareTo(invoice.getTotalAmount()) < 0;
    }

    /**
     * Check if this payment completes the invoice payment.
     *
     * @return true if this payment covers remaining balance
     */
    public boolean completesPayment() {
        if (invoice == null) return false;
        BigDecimal remainingBeforeThis = invoice.getTotalAmount()
                .subtract(invoice.getTotalPaid())
                .add(amount); // Add this payment back since it's already included
        return amount.compareTo(remainingBeforeThis.subtract(amount)) >= 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Payment payment = (Payment) o;
        return Objects.equals(id, payment.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Payment{" +
                "id=" + id +
                ", paymentDate=" + paymentDate +
                ", amount=" + amount +
                ", paymentMethod=" + paymentMethod +
                ", referenceNumber='" + referenceNumber + '\'' +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private LocalDate paymentDate;
        private BigDecimal amount;
        private PaymentMethod paymentMethod;
        private String referenceNumber;
        private String notes;
        private Long recordedById;
        private Instant createdAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder paymentDate(LocalDate paymentDate) {
            this.paymentDate = paymentDate;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder paymentMethod(PaymentMethod paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public Builder referenceNumber(String referenceNumber) {
            this.referenceNumber = referenceNumber;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder recordedById(Long recordedById) {
            this.recordedById = recordedById;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Payment build() {
            return new Payment(this);
        }
    }
}
