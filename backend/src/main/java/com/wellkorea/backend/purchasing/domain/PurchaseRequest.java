package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.purchasing.domain.vo.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.domain.vo.RfqItem;
import com.wellkorea.backend.purchasing.domain.vo.RfqItemStatus;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Abstract base class for purchase requests.
 * Uses JPA SINGLE_TABLE inheritance with dtype discriminator column.
 * <p>
 * Concrete subclasses:
 * - ServicePurchaseRequest: For outsourcing services (linked to ServiceCategory)
 * - MaterialPurchaseRequest: For physical materials (linked to Material)
 * <p>
 * Both types share the same workflow: DRAFT → RFQ_SENT → VENDOR_SELECTED → CLOSED
 * <p>
 * RfqItems are embedded as @ElementCollection (aggregate pattern).
 */
@Entity
@Table(name = "purchase_requests")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "dtype", discriminatorType = DiscriminatorType.STRING, length = 31)
public abstract class PurchaseRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "request_number", nullable = false, unique = true, length = 50)
    private String requestNumber;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "uom", length = 20)
    private String uom;

    @Column(name = "required_date", nullable = false)
    private LocalDate requiredDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PurchaseRequestStatus status = PurchaseRequestStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ElementCollection
    @CollectionTable(
            name = "rfq_items",
            joinColumns = @JoinColumn(name = "purchase_request_id")
    )
    private List<RfqItem> rfqItems = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Abstract method to get the item name for display
    public abstract String getItemName();

    // ========== State Check Methods ==========

    /**
     * Check if the purchase request can be sent to vendors (RFQ).
     * Allowed in DRAFT status (initial send) or RFQ_SENT status (adding more vendors).
     */
    public boolean canSendRfq() {
        return status == PurchaseRequestStatus.DRAFT || status == PurchaseRequestStatus.RFQ_SENT;
    }

    /**
     * Check if the purchase request can be canceled.
     */
    public boolean canCancel() {
        return status != PurchaseRequestStatus.CLOSED && status != PurchaseRequestStatus.CANCELED;
    }

    /**
     * Check if the purchase request can be updated.
     */
    public boolean canUpdate() {
        return status == PurchaseRequestStatus.DRAFT;
    }

    // ========== Status Transition Methods ==========

    /**
     * Send RFQ to vendors - transition to RFQ_SENT status.
     * This is idempotent when already in RFQ_SENT (allows adding more vendors).
     */
    public void sendRfq() {
        if (!canSendRfq()) {
            throw new IllegalStateException("Cannot send RFQ for purchase request in " + status + " status");
        }
        // Idempotent: no-op if already RFQ_SENT (adding more vendors)
        this.status = PurchaseRequestStatus.RFQ_SENT;
    }

    /**
     * Mark a vendor as selected - transition to VENDOR_SELECTED status.
     */
    public void markVendorSelected() {
        if (status != PurchaseRequestStatus.RFQ_SENT) {
            throw new IllegalStateException("Cannot select vendor for purchase request in " + status + " status");
        }
        this.status = PurchaseRequestStatus.VENDOR_SELECTED;
    }

    /**
     * Mark as ordered - transition to ORDERED status when PO is created.
     */
    public void markOrdered() {
        if (status != PurchaseRequestStatus.VENDOR_SELECTED) {
            throw new IllegalStateException("Cannot mark as ordered for purchase request in " + status + " status");
        }
        this.status = PurchaseRequestStatus.ORDERED;
    }

    /**
     * Close the purchase request after PO is received.
     */
    public void close() {
        if (status != PurchaseRequestStatus.ORDERED) {
            throw new IllegalStateException("Cannot close purchase request in " + status + " status");
        }
        this.status = PurchaseRequestStatus.CLOSED;
    }

    /**
     * Cancel the purchase request.
     */
    public void cancel() {
        if (!canCancel()) {
            throw new IllegalStateException("Cannot cancel purchase request in " + status + " status");
        }
        this.status = PurchaseRequestStatus.CANCELED;
    }

    // ========== RFQ Item Aggregate Methods ==========

    /**
     * Find an RFQ item by its itemId.
     *
     * @param itemId the UUID string identifier
     * @return Optional containing the RfqItem if found
     */
    public Optional<RfqItem> findRfqItemById(String itemId) {
        return rfqItems.stream()
                .filter(item -> item.getItemId().equals(itemId))
                .findFirst();
    }

    /**
     * Get an RFQ item by its itemId, throwing exception if not found.
     *
     * @param itemId the UUID string identifier
     * @return the RfqItem
     * @throws ResourceNotFoundException if not found
     */
    public RfqItem getRfqItemById(String itemId) {
        return findRfqItemById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RFQ item not found with ID: " + itemId + " in purchase request: " + id));
    }

    /**
     * Add an RFQ item for a vendor.
     *
     * @param vendorCompanyId  the vendor company ID
     * @param vendorOfferingId optional vendor offering ID (can be null)
     * @return the created RfqItem
     */
    public RfqItem addRfqItem(Long vendorCompanyId, Long vendorOfferingId) {
        RfqItem rfqItem = new RfqItem(vendorCompanyId, vendorOfferingId);
        rfqItems.add(rfqItem);
        return rfqItem;
    }

    /**
     * Record a vendor's reply to an RFQ.
     *
     * @param itemId         the RFQ item ID
     * @param quotedPrice    the quoted price
     * @param quotedLeadTime lead time in days
     * @param notes          optional notes
     */
    public void recordRfqReply(String itemId, BigDecimal quotedPrice, Integer quotedLeadTime, String notes) {
        if (status != PurchaseRequestStatus.RFQ_SENT) {
            throw new IllegalStateException("Cannot record RFQ reply for purchase request in " + status + " status");
        }
        RfqItem rfqItem = getRfqItemById(itemId);
        rfqItem.recordReply(quotedPrice, quotedLeadTime, notes);
    }

    /**
     * Mark an RFQ item as no response from vendor.
     *
     * @param itemId the RFQ item ID
     */
    public void markRfqNoResponse(String itemId) {
        if (status != PurchaseRequestStatus.RFQ_SENT) {
            throw new IllegalStateException("Cannot mark no response for purchase request in " + status + " status");
        }
        RfqItem rfqItem = getRfqItemById(itemId);
        rfqItem.markNoResponse();
    }

    /**
     * Select a vendor's quote. This transitions the purchase request to VENDOR_SELECTED status.
     * Only one vendor can be selected per purchase request.
     *
     * @param itemId the RFQ item ID to select
     */
    public void selectVendor(String itemId) {
        if (status != PurchaseRequestStatus.RFQ_SENT) {
            throw new IllegalStateException("Cannot select vendor for purchase request in " + status + " status");
        }

        // Check if a vendor is already selected
        boolean hasSelectedVendor = rfqItems.stream()
                .anyMatch(item -> item.getStatus() == RfqItemStatus.SELECTED);
        if (hasSelectedVendor) {
            throw new IllegalStateException("A vendor has already been selected for this purchase request");
        }

        RfqItem rfqItem = getRfqItemById(itemId);
        rfqItem.select();

        // Transition purchase request status
        markVendorSelected();
    }

    /**
     * Reject a vendor's quote.
     *
     * @param itemId the RFQ item ID to reject
     */
    public void rejectRfq(String itemId) {
        if (status != PurchaseRequestStatus.RFQ_SENT) {
            throw new IllegalStateException("Cannot reject RFQ for purchase request in " + status + " status");
        }
        RfqItem rfqItem = getRfqItemById(itemId);
        rfqItem.reject();
    }

    /**
     * Get the selected RFQ item, if any.
     *
     * @return Optional containing the selected RfqItem
     */
    public Optional<RfqItem> getSelectedRfqItem() {
        return rfqItems.stream()
                .filter(item -> item.getStatus() == RfqItemStatus.SELECTED)
                .findFirst();
    }

    /**
     * Revert vendor selection after a purchase order is canceled.
     * This transitions the purchase request back to RFQ_SENT status,
     * deselects the RFQ item, and unrejects all previously rejected vendors
     * so they can be re-evaluated and potentially selected.
     *
     * <p>This method is idempotent - multiple calls produce the same result.
     * <p>Works from both VENDOR_SELECTED and ORDERED statuses.
     *
     * @param itemId the RFQ item ID that was selected for the canceled PO
     */
    public void revertVendorSelection(String itemId) {
        if (status != PurchaseRequestStatus.VENDOR_SELECTED && status != PurchaseRequestStatus.ORDERED) {
            throw new IllegalStateException("Cannot revert vendor selection for purchase request in " + status + " status");
        }

        RfqItem rfqItem = getRfqItemById(itemId);

        // Only deselect if currently selected (idempotent)
        if (rfqItem.getStatus() == RfqItemStatus.SELECTED) {
            rfqItem.deselect();
        }

        // Revert all REJECTED items back to REPLIED so they can be reconsidered
        rfqItems.stream()
                .filter(item -> item.getStatus() == RfqItemStatus.REJECTED)
                .forEach(RfqItem::unreject);

        // Transition back to RFQ_SENT so user can select another vendor or add new vendors
        this.status = PurchaseRequestStatus.RFQ_SENT;
    }

    // ========== Getters and Setters ==========

    public Long getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getUom() {
        return uom;
    }

    public void setUom(String uom) {
        this.uom = uom;
    }

    public LocalDate getRequiredDate() {
        return requiredDate;
    }

    public void setRequiredDate(LocalDate requiredDate) {
        this.requiredDate = requiredDate;
    }

    public PurchaseRequestStatus getStatus() {
        return status;
    }

    public void setStatus(PurchaseRequestStatus status) {
        this.status = status;
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

    /**
     * Get read-only view of RFQ items.
     */
    public List<RfqItem> getRfqItems() {
        return Collections.unmodifiableList(rfqItems);
    }
}
