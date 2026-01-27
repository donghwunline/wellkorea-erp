package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.purchasing.domain.vo.PurchaseOrderStatus;
import com.wellkorea.backend.purchasing.domain.vo.RfqItem;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * PurchaseOrder entity representing an official order to a vendor
 * based on a selected RFQ response.
 * <p>
 * References the RfqItem via purchaseRequest + rfqItemId (composite reference)
 * since RfqItem is now an @Embeddable within PurchaseRequest.
 */
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the parent purchase request.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest;

    /**
     * UUID reference to the selected RFQ item within the purchase request.
     * Used with purchaseRequest to identify the specific RfqItem.
     */
    @Column(name = "rfq_item_id", nullable = false, length = 36)
    private String rfqItemId;

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

    // ========== Constructors ==========

    /**
     * Creates a new PurchaseOrder with all required fields.
     *
     * @param purchaseRequest      the parent purchase request (required)
     * @param rfqItemId            the RFQ item ID within the purchase request (required)
     * @param vendor               the vendor company (required)
     * @param poNumber             the unique PO number (required)
     * @param orderDate            the order date (required)
     * @param expectedDeliveryDate the expected delivery date (required)
     * @param totalAmount          the total amount (required)
     * @param createdBy            the user creating this order (required)
     * @param notes                optional notes (nullable)
     */
    public PurchaseOrder(
            PurchaseRequest purchaseRequest,
            String rfqItemId,
            Company vendor,
            String poNumber,
            LocalDate orderDate,
            LocalDate expectedDeliveryDate,
            BigDecimal totalAmount,
            User createdBy,
            String notes
    ) {
        Objects.requireNonNull(purchaseRequest, "purchaseRequest must not be null");
        Objects.requireNonNull(rfqItemId, "rfqItemId must not be null");
        Objects.requireNonNull(vendor, "vendor must not be null");
        Objects.requireNonNull(poNumber, "poNumber must not be null");
        Objects.requireNonNull(orderDate, "orderDate must not be null");
        Objects.requireNonNull(expectedDeliveryDate, "expectedDeliveryDate must not be null");
        Objects.requireNonNull(totalAmount, "totalAmount must not be null");
        Objects.requireNonNull(createdBy, "createdBy must not be null");

        this.purchaseRequest = purchaseRequest;
        this.rfqItemId = rfqItemId;
        this.project = purchaseRequest.getProject(); // Derived from purchase request
        this.vendor = vendor;
        this.poNumber = poNumber;
        this.orderDate = orderDate;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.totalAmount = totalAmount;
        this.currency = "KRW";
        this.status = PurchaseOrderStatus.DRAFT;
        this.notes = notes;
        this.createdBy = createdBy;
    }

    /**
     * Default constructor for JPA.
     */
    protected PurchaseOrder() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ========== Domain Update Method ==========

    /**
     * Update the purchase order fields that can be modified.
     * Can only be called when in DRAFT status.
     *
     * @param expectedDeliveryDate the new expected delivery date (required)
     * @param notes                the updated notes (nullable)
     * @throws IllegalStateException if not in DRAFT status
     */
    public void update(LocalDate expectedDeliveryDate, String notes) {
        if (!canUpdate()) {
            throw new IllegalStateException("Cannot update purchase order in " + status + " status");
        }
        Objects.requireNonNull(expectedDeliveryDate, "expectedDeliveryDate must not be null");

        if (expectedDeliveryDate.isBefore(this.orderDate)) {
            throw new IllegalArgumentException("Expected delivery date cannot be before order date");
        }

        this.expectedDeliveryDate = expectedDeliveryDate;
        this.notes = notes;
    }

    // Domain methods

    /**
     * Get the RfqItem from the parent purchase request.
     * Convenience method to access the embedded RfqItem.
     *
     * @return the RfqItem referenced by rfqItemId
     */
    public RfqItem getRfqItem() {
        if (purchaseRequest == null) {
            return null;
        }
        return purchaseRequest.findRfqItemById(rfqItemId).orElse(null);
    }

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

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public PurchaseRequest getPurchaseRequest() {
        return purchaseRequest;
    }

    public String getRfqItemId() {
        return rfqItemId;
    }

    public Project getProject() {
        return project;
    }

    public Company getVendor() {
        return vendor;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public LocalDate getExpectedDeliveryDate() {
        return expectedDeliveryDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public PurchaseOrderStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
