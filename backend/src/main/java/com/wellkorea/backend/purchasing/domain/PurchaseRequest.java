package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.purchasing.domain.service.PurchaseOrderCreationGuard;
import com.wellkorea.backend.purchasing.domain.service.RfqItemFactory;
import com.wellkorea.backend.purchasing.domain.vo.AttachmentReference;
import com.wellkorea.backend.purchasing.domain.vo.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.domain.vo.RfqItem;
import com.wellkorea.backend.purchasing.domain.vo.RfqItemStatus;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

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

    @Column(name = "project_id")
    private Long projectId;

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

    @Column(name = "created_by_id", nullable = false)
    private Long createdById;

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

    // ========== Constructors ==========

    /**
     * Protected constructor for creating a new PurchaseRequest.
     * Used by concrete subclasses to initialize common fields.
     *
     * @param projectId     the associated project ID (nullable)
     * @param requestNumber the unique request number (required)
     * @param description   the request description (required)
     * @param quantity      the requested quantity (required)
     * @param uom           the unit of measure (nullable)
     * @param requiredDate  the required delivery date (required)
     * @param createdById   the user ID creating this request (required)
     */
    protected PurchaseRequest(
            Long projectId,
            String requestNumber,
            String description,
            BigDecimal quantity,
            String uom,
            LocalDate requiredDate,
            Long createdById
    ) {
        Objects.requireNonNull(requestNumber, "requestNumber must not be null");
        Objects.requireNonNull(description, "description must not be null");
        Objects.requireNonNull(quantity, "quantity must not be null");
        Objects.requireNonNull(requiredDate, "requiredDate must not be null");
        Objects.requireNonNull(createdById, "createdById must not be null");

        this.projectId = projectId;
        this.requestNumber = requestNumber;
        this.description = description;
        this.quantity = quantity;
        this.uom = uom;
        this.requiredDate = requiredDate;
        this.createdById = createdById;
        this.status = PurchaseRequestStatus.DRAFT;
    }

    /**
     * Default constructor for JPA.
     */
    protected PurchaseRequest() {
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

    // Abstract method to get the item name for display
    public abstract String getItemName();

    /**
     * Get attachments linked to this purchase request.
     * <p>
     * ServicePurchaseRequest: Returns list of linked attachment references (blueprints/drawings)
     * MaterialPurchaseRequest: Returns empty list (no attachment support)
     * <p>
     * This enables polymorphic access in RfqEmailService without type checking.
     *
     * @return Unmodifiable list of attachment references
     */
    public abstract List<AttachmentReference> getAttachments();

    /**
     * Update the purchase request fields.
     * Can only be called when in DRAFT status.
     *
     * @param description  the updated description (required)
     * @param quantity     the updated quantity (required)
     * @param uom          the updated unit of measure (nullable)
     * @param requiredDate the updated required date (required)
     * @throws IllegalStateException if not in DRAFT status
     */
    public void update(String description, BigDecimal quantity, String uom, LocalDate requiredDate) {
        if (!status.canUpdate()) {
            throw new IllegalStateException("Cannot update purchase request in " + status + " status");
        }
        Objects.requireNonNull(description, "description must not be null");
        Objects.requireNonNull(quantity, "quantity must not be null");
        Objects.requireNonNull(requiredDate, "requiredDate must not be null");

        this.description = description;
        this.quantity = quantity;
        this.uom = uom;
        this.requiredDate = requiredDate;
    }

    // ========== Status Transition Methods ==========

    /**
     * Send RFQ to vendors - validates via domain service, adds RfqItems, transitions status.
     * Idempotent when already RFQ_SENT (allows adding more vendors).
     *
     * @param vendorIds      Raw vendor IDs from the request
     * @param rfqItemFactory Domain service to validate vendors and create RfqItems
     * @return Created RfqItem IDs for correlation with email sending
     * @throws IllegalArgumentException if vendorIds is null or empty
     * @throws IllegalStateException    if not in a state that allows sending RFQ
     */
    public List<String> sendRfq(List<Long> vendorIds, RfqItemFactory rfqItemFactory) {
        Objects.requireNonNull(vendorIds, "vendorIds must not be null");
        Objects.requireNonNull(rfqItemFactory, "rfqItemFactory must not be null");
        if (vendorIds.isEmpty()) {
            throw new IllegalArgumentException("vendorIds list must not be empty");
        }
        if (!status.canSendRfq()) {
            throw new IllegalStateException("Cannot send RFQ for purchase request in " + status + " status");
        }

        // Factory validates vendors and creates RfqItems (with UUID, sentAt initialized)
        List<RfqItem> newItems = rfqItemFactory.createRfqItems(vendorIds);

        // Add to aggregate and collect IDs
        List<String> itemIds = new ArrayList<>();
        for (RfqItem item : newItems) {
            rfqItems.add(item);
            itemIds.add(item.getItemId());
        }

        this.status = PurchaseRequestStatus.RFQ_SENT;
        return Collections.unmodifiableList(itemIds);
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
        if (!status.canCancel()) {
            throw new IllegalStateException("Cannot cancel purchase request in " + status + " status");
        }
        this.status = PurchaseRequestStatus.CANCELED;
    }

    // ========== RFQ Item Aggregate Methods ==========

    /**
     * Find an RFQ item by its itemId.
     * <p>
     * Use this when absence is expected/acceptable (caller handles Optional).
     * For cases where item MUST exist, use {@link #getRfqItemById(String)} instead.
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
     * <p>
     * Use this when item MUST exist (e.g., processing a reply for existing RFQ).
     * For optional lookups, use {@link #findRfqItemById(String)} instead.
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

    // ========== Factory Methods ==========

    /**
     * Create a PurchaseOrder from a selected RfqItem.
     * <p>
     * Validates RfqItem status, selects vendor if needed, and creates the PO.
     * Uses Guard pattern for infrastructure-dependent validation (like Quotation.createDelivery).
     *
     * @param rfqItemId            The RFQ item ID to create PO from
     * @param guard                Guard for duplicate check
     * @param poNumber             Generated PO number
     * @param orderDate            Order date
     * @param expectedDeliveryDate Expected delivery date
     * @param createdById          User ID creating the PO
     * @param notes                Optional notes
     * @return Created PurchaseOrder (not yet persisted)
     * @throws ResourceNotFoundException                                if rfqItemId not found
     * @throws IllegalStateException                                    if RfqItem not in valid status for PO creation
     * @throws com.wellkorea.backend.shared.exception.BusinessException if PO already exists for this RFQ item
     */
    public PurchaseOrder createPurchaseOrder(
            String rfqItemId,
            PurchaseOrderCreationGuard guard,
            String poNumber,
            LocalDate orderDate,
            LocalDate expectedDeliveryDate,
            Long createdById,
            String notes
    ) {
        Objects.requireNonNull(rfqItemId, "rfqItemId must not be null");
        Objects.requireNonNull(guard, "guard must not be null");
        Objects.requireNonNull(poNumber, "poNumber must not be null");
        Objects.requireNonNull(orderDate, "orderDate must not be null");
        Objects.requireNonNull(expectedDeliveryDate, "expectedDeliveryDate must not be null");
        Objects.requireNonNull(createdById, "createdById must not be null");

        // Validate no duplicate PO (via guard - requires repository)
        guard.validateNoDuplicatePurchaseOrder(this.id, rfqItemId);

        // Validate RfqItem exists and is in valid status
        RfqItem rfqItem = getRfqItemById(rfqItemId);
        if (!rfqItem.getStatus().canCreatePurchaseOrder()) {
            throw new IllegalStateException(
                    "RFQ item must be in REPLIED or SELECTED status to create PO, current: " + rfqItem.getStatus());
        }

        // If REPLIED, select the vendor (transitions this PR to VENDOR_SELECTED)
        if (rfqItem.getStatus() == RfqItemStatus.REPLIED) {
            selectVendor(rfqItemId);
        }

        return new PurchaseOrder(
                this,
                rfqItemId,
                rfqItem.getVendorCompanyId(),
                poNumber,
                orderDate,
                expectedDeliveryDate,
                rfqItem.getQuotedPrice(),
                createdById,
                notes
        );
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public PurchaseRequestStatus getStatus() {
        return status;
    }

    /**
     * Get read-only view of RFQ items.
     */
    public List<RfqItem> getRfqItems() {
        return Collections.unmodifiableList(rfqItems);
    }
}
