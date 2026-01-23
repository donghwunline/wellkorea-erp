package com.wellkorea.backend.finance.domain;

import com.wellkorea.backend.finance.domain.vo.VendorPaymentMethod;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * VendorPayment entity - records payments made to vendors toward accounts payable.
 * <p>
 * Supports partial/installment payments with full audit trail.
 */
@Entity
@Table(name = "vendor_payments")
public class VendorPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accounts_payable_id", nullable = false)
    private AccountsPayable accountsPayable;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    private VendorPaymentMethod paymentMethod;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "recorded_by_id", nullable = false)
    private Long recordedById;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected VendorPayment() {
        // JPA requires default constructor
    }

    private VendorPayment(Builder builder) {
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

    public AccountsPayable getAccountsPayable() {
        return accountsPayable;
    }

    public Long getAccountsPayableId() {
        return accountsPayable != null ? accountsPayable.getId() : null;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public VendorPaymentMethod getPaymentMethod() {
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

    void setAccountsPayable(AccountsPayable accountsPayable) {
        this.accountsPayable = accountsPayable;
    }

    // ========== Domain Methods ==========

    /**
     * Check if this is a partial payment (less than total owed).
     *
     * @return true if payment is less than total amount owed
     */
    public boolean isPartialPayment() {
        if (accountsPayable == null) return false;
        return amount.compareTo(accountsPayable.getTotalAmount()) < 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VendorPayment that = (VendorPayment) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "VendorPayment{" +
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
        private VendorPaymentMethod paymentMethod;
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

        public Builder paymentMethod(VendorPaymentMethod paymentMethod) {
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

        public VendorPayment build() {
            return new VendorPayment(this);
        }
    }
}
