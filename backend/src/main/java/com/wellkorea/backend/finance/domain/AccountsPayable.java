package com.wellkorea.backend.finance.domain;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.finance.domain.exception.PaymentExceedsBalanceException;
import com.wellkorea.backend.finance.domain.exception.PaymentNotAllowedException;
import com.wellkorea.backend.finance.domain.vo.AccountsPayableStatus;
import com.wellkorea.backend.finance.domain.vo.DisbursementCause;
import com.wellkorea.backend.finance.domain.vo.DisbursementCauseType;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * AccountsPayable entity - tracks payment obligations to vendors.
 * <p>
 * Created when a disbursement cause (e.g., PurchaseOrder) is confirmed.
 * Supports partial payments via VendorPayment child entities.
 * <p>
 * The {@link #disbursementCause} field abstracts the source of the payment obligation,
 * enabling support for multiple expenditure types (PO, expense reports, contracts, etc.).
 */
@Entity
@Table(name = "accounts_payable")
public class AccountsPayable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "version")
    private Long version;

    @Embedded
    private DisbursementCause disbursementCause;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_company_id", nullable = false)
    private Company vendor;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "KRW";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AccountsPayableStatus status = AccountsPayableStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "accountsPayable", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    private List<VendorPayment> payments = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    protected AccountsPayable() {
        // JPA requires default constructor
    }

    private AccountsPayable(Builder builder) {
        this.disbursementCause = builder.disbursementCause;
        this.vendor = builder.vendor;
        this.totalAmount = builder.totalAmount;
        this.currency = builder.currency != null ? builder.currency : "KRW";
        this.status = builder.status != null ? builder.status : AccountsPayableStatus.PENDING;
        this.dueDate = builder.dueDate;
        this.notes = builder.notes;
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public Long getVersion() {
        return version;
    }

    /**
     * Get the disbursement cause that created this payment obligation.
     *
     * @return the disbursement cause value object
     */
    public DisbursementCause getDisbursementCause() {
        return disbursementCause;
    }

    /**
     * Get the type of disbursement cause.
     *
     * @return the cause type (PURCHASE_ORDER, EXPENSE_REPORT, etc.)
     */
    public DisbursementCauseType getCauseType() {
        return disbursementCause != null ? disbursementCause.getCauseType() : null;
    }

    /**
     * Get the ID of the source entity that caused this payment obligation.
     *
     * @return the cause entity ID
     */
    public Long getCauseId() {
        return disbursementCause != null ? disbursementCause.getCauseId() : null;
    }

    /**
     * Get the reference number from the source document.
     *
     * @return the cause reference number (e.g., PO number)
     */
    public String getCauseReferenceNumber() {
        return disbursementCause != null ? disbursementCause.getCauseReferenceNumber() : null;
    }

    public Company getVendor() {
        return vendor;
    }

    public Long getVendorId() {
        return vendor != null ? vendor.getId() : null;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public AccountsPayableStatus getStatus() {
        return status;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public String getNotes() {
        return notes;
    }

    public List<VendorPayment> getPayments() {
        return Collections.unmodifiableList(payments);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    // ========== Setters ==========

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    // ========== Domain Methods ==========

    /**
     * Add a payment to this accounts payable.
     * Updates status based on remaining balance.
     *
     * @param payment the payment to add
     * @throws PaymentNotAllowedException   if AP cannot receive payments (status-based)
     * @throws PaymentExceedsBalanceException if payment exceeds remaining balance
     */
    public void addPayment(VendorPayment payment) {
        if (!status.canReceivePayment()) {
            throw new PaymentNotAllowedException(status);
        }

        BigDecimal remaining = getRemainingBalance();
        if (payment.getAmount().compareTo(remaining) > 0) {
            throw new PaymentExceedsBalanceException(payment.getAmount(), remaining);
        }

        payment.setAccountsPayable(this);
        payments.add(payment);

        // Update status based on new total paid
        updateStatusAfterPayment();
    }

    /**
     * Calculate total amount paid so far.
     *
     * @return sum of all payment amounts
     */
    public BigDecimal getTotalPaid() {
        return payments.stream()
                .map(VendorPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calculate remaining balance to be paid.
     *
     * @return total amount minus total paid
     */
    public BigDecimal getRemainingBalance() {
        return totalAmount.subtract(getTotalPaid());
    }

    /**
     * Check if the AP is fully paid.
     *
     * @return true if remaining balance is zero or negative
     */
    public boolean isFullyPaid() {
        return getRemainingBalance().compareTo(BigDecimal.ZERO) <= 0;
    }

    /**
     * Check if the AP is overdue (past due date and not fully paid).
     *
     * @return true if past due date and has remaining balance
     */
    public boolean isOverdue() {
        if (dueDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(dueDate) && !isFullyPaid();
    }

    /**
     * Get the aging bucket for this AP.
     *
     * @return aging category: "Current", "30 Days", "60 Days", "90+ Days"
     */
    public String getAgingBucket() {
        if (dueDate == null || !isOverdue()) {
            return "Current";
        }

        long daysOverdue = ChronoUnit.DAYS.between(dueDate, LocalDate.now());

        if (daysOverdue <= 30) {
            return "30 Days";
        } else if (daysOverdue <= 60) {
            return "60 Days";
        } else {
            return "90+ Days";
        }
    }

    /**
     * Cancel/void this accounts payable.
     *
     * @throws IllegalStateException if AP cannot be cancelled
     */
    public void cancel() {
        if (status == AccountsPayableStatus.PAID) {
            throw new IllegalStateException("Cannot cancel a fully paid AP");
        }
        if (status == AccountsPayableStatus.CANCELLED) {
            throw new IllegalStateException("AP is already cancelled");
        }
        if (!payments.isEmpty()) {
            throw new IllegalStateException("Cannot cancel AP with existing payments");
        }
        this.status = AccountsPayableStatus.CANCELLED;
    }

    /**
     * Update status after a payment is added.
     */
    private void updateStatusAfterPayment() {
        if (isFullyPaid()) {
            this.status = AccountsPayableStatus.PAID;
        } else if (getTotalPaid().compareTo(BigDecimal.ZERO) > 0) {
            this.status = AccountsPayableStatus.PARTIALLY_PAID;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AccountsPayable that = (AccountsPayable) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "AccountsPayable{" +
                "id=" + id +
                ", causeType=" + (disbursementCause != null ? disbursementCause.getCauseType() : null) +
                ", causeId=" + (disbursementCause != null ? disbursementCause.getCauseId() : null) +
                ", causeReferenceNumber='" + (disbursementCause != null ? disbursementCause.getCauseReferenceNumber() : null) + '\'' +
                ", totalAmount=" + totalAmount +
                ", status=" + status +
                ", dueDate=" + dueDate +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private DisbursementCause disbursementCause;
        private Company vendor;
        private BigDecimal totalAmount;
        private String currency;
        private AccountsPayableStatus status;
        private LocalDate dueDate;
        private String notes;

        /**
         * Set the disbursement cause for this AP.
         *
         * @param disbursementCause the cause of the payment obligation
         * @return this builder
         */
        public Builder disbursementCause(DisbursementCause disbursementCause) {
            this.disbursementCause = disbursementCause;
            return this;
        }

        public Builder vendor(Company vendor) {
            this.vendor = vendor;
            return this;
        }

        public Builder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public Builder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public Builder status(AccountsPayableStatus status) {
            this.status = status;
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

        public AccountsPayable build() {
            Objects.requireNonNull(disbursementCause, "Disbursement cause is required");
            Objects.requireNonNull(vendor, "Vendor is required");
            Objects.requireNonNull(totalAmount, "Total amount is required");
            if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Total amount must be positive");
            }
            return new AccountsPayable(this);
        }
    }
}
