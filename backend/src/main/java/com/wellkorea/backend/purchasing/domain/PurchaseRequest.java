package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.project.domain.Project;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * PurchaseRequest entity representing an internal request for purchasing
 * materials or outsourcing services.
 * Can be tied to a specific Project or be a general purchase (project is null).
 */
@Entity
@Table(name = "purchase_requests")
public class PurchaseRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_category_id", nullable = false)
    private ServiceCategory serviceCategory;

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

    @OneToMany(mappedBy = "purchaseRequest", cascade = CascadeType.ALL, orphanRemoval = true)
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

    // Domain methods

    /**
     * Check if the purchase request can be sent to vendors (RFQ).
     */
    public boolean canSendRfq() {
        return status == PurchaseRequestStatus.DRAFT;
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

    /**
     * Send RFQ to vendors - transition to RFQ_SENT status.
     */
    public void sendRfq() {
        if (!canSendRfq()) {
            throw new IllegalStateException("Cannot send RFQ for purchase request in " + status + " status");
        }
        this.status = PurchaseRequestStatus.RFQ_SENT;
    }

    /**
     * Mark a vendor as selected - transition to VENDOR_SELECTED status.
     */
    public void selectVendor() {
        if (status != PurchaseRequestStatus.RFQ_SENT) {
            throw new IllegalStateException("Cannot select vendor for purchase request in " + status + " status");
        }
        this.status = PurchaseRequestStatus.VENDOR_SELECTED;
    }

    /**
     * Close the purchase request after PO is received.
     */
    public void close() {
        if (status != PurchaseRequestStatus.VENDOR_SELECTED) {
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

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public ServiceCategory getServiceCategory() {
        return serviceCategory;
    }

    public void setServiceCategory(ServiceCategory serviceCategory) {
        this.serviceCategory = serviceCategory;
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

    public List<RfqItem> getRfqItems() {
        return rfqItems;
    }

    public void setRfqItems(List<RfqItem> rfqItems) {
        this.rfqItems = rfqItems;
    }

    public void addRfqItem(RfqItem rfqItem) {
        rfqItems.add(rfqItem);
        rfqItem.setPurchaseRequest(this);
    }

    public void removeRfqItem(RfqItem rfqItem) {
        rfqItems.remove(rfqItem);
        rfqItem.setPurchaseRequest(null);
    }
}
