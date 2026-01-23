package com.wellkorea.backend.finance.domain;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.finance.domain.vo.AccountsPayableStatus;
import com.wellkorea.backend.purchasing.domain.PurchaseOrder;
import jakarta.persistence.*;

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
 * Created when a PurchaseOrder is confirmed. Supports partial payments
 * via VendorPayment child entities.
 */
@Entity
@Table(name = "accounts_payable")
public class AccountsPayable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false, unique = true)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_company_id", nullable = false)
    private Company vendor;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "KRW";

    @Column(name = "po_number", nullable = false, length = 50)
    private String poNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AccountsPayableStatus status = AccountsPayableStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "accountsPayable", cascade = CascadeType.ALL, orphanRemoval = true)
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
        this.purchaseOrder = builder.purchaseOrder;
        this.vendor = builder.vendor;
        this.totalAmount = builder.totalAmount;
        this.currency = builder.currency != null ? builder.currency : "KRW";
        this.poNumber = builder.poNumber;
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

    public PurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }

    public Long getPurchaseOrderId() {
        return purchaseOrder != null ? purchaseOrder.getId() : null;
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

    public String getPoNumber() {
        return poNumber;
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
     * @throws IllegalStateException    if AP cannot receive payments
     * @throws IllegalArgumentException if payment exceeds remaining balance
     */
    public void addPayment(VendorPayment payment) {
        if (!status.canReceivePayment()) {
            throw new IllegalStateException("Cannot add payment to AP in " + status + " status");
        }

        BigDecimal remaining = getRemainingBalance();
        if (payment.getAmount().compareTo(remaining) > 0) {
            throw new IllegalArgumentException(
                    "Payment amount " + payment.getAmount() + " exceeds remaining balance " + remaining);
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
                ", poNumber='" + poNumber + '\'' +
                ", totalAmount=" + totalAmount +
                ", status=" + status +
                ", dueDate=" + dueDate +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private PurchaseOrder purchaseOrder;
        private Company vendor;
        private BigDecimal totalAmount;
        private String currency;
        private String poNumber;
        private AccountsPayableStatus status;
        private LocalDate dueDate;
        private String notes;

        public Builder purchaseOrder(PurchaseOrder purchaseOrder) {
            this.purchaseOrder = purchaseOrder;
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

        public Builder poNumber(String poNumber) {
            this.poNumber = poNumber;
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
            return new AccountsPayable(this);
        }
    }
}
