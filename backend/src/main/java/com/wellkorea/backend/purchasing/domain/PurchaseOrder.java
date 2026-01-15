package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.project.domain.Project;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * PurchaseOrder entity representing an official order to a vendor
 * based on a selected RFQ response.
 */
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_item_id", nullable = false)
    private RfqItem rfqItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_company_id", nullable = false)
    private Company vendor;

    @Column(name = "po_number", nullable = false, unique = true, length = 50)
    private String poNumber;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "expected_delivery_date", nullable = false)
    private LocalDate expectedDeliveryDate;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", length = 3)
    private String currency = "KRW";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PurchaseOrderStatus status = PurchaseOrderStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Domain methods

    /**
     * Check if the PO can be sent to vendor.
     */
    public boolean canSend() {
        return status == PurchaseOrderStatus.DRAFT;
    }

    /**
     * Check if the PO can be confirmed by vendor.
     */
    public boolean canConfirm() {
        return status == PurchaseOrderStatus.SENT;
    }

    /**
     * Check if the PO can be marked as received.
     */
    public boolean canReceive() {
        return status == PurchaseOrderStatus.CONFIRMED;
    }

    /**
     * Check if the PO can be canceled.
     */
    public boolean canCancel() {
        return status != PurchaseOrderStatus.RECEIVED && status != PurchaseOrderStatus.CANCELED;
    }

    /**
     * Check if the PO can be updated.
     */
    public boolean canUpdate() {
        return status == PurchaseOrderStatus.DRAFT;
    }

    /**
     * Send the PO to vendor.
     */
    public void send() {
        if (!canSend()) {
            throw new IllegalStateException("Cannot send purchase order in " + status + " status");
        }
        this.status = PurchaseOrderStatus.SENT;
    }

    /**
     * Vendor confirms the order.
     */
    public void confirm() {
        if (!canConfirm()) {
            throw new IllegalStateException("Cannot confirm purchase order in " + status + " status");
        }
        this.status = PurchaseOrderStatus.CONFIRMED;
    }

    /**
     * Mark goods/services as received.
     */
    public void receive() {
        if (!canReceive()) {
            throw new IllegalStateException("Cannot receive purchase order in " + status + " status");
        }
        this.status = PurchaseOrderStatus.RECEIVED;
    }

    /**
     * Cancel the purchase order.
     */
    public void cancel() {
        if (!canCancel()) {
            throw new IllegalStateException("Cannot cancel purchase order in " + status + " status");
        }
        this.status = PurchaseOrderStatus.CANCELED;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RfqItem getRfqItem() {
        return rfqItem;
    }

    public void setRfqItem(RfqItem rfqItem) {
        this.rfqItem = rfqItem;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Company getVendor() {
        return vendor;
    }

    public void setVendor(Company vendor) {
        this.vendor = vendor;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
        this.expectedDeliveryDate = expectedDeliveryDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PurchaseOrderStatus getStatus() {
        return status;
    }

    public void setStatus(PurchaseOrderStatus status) {
        this.status = status;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
