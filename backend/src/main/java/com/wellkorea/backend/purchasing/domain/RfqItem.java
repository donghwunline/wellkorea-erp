package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.catalog.domain.VendorServiceOffering;
import com.wellkorea.backend.company.domain.Company;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * RfqItem entity representing an individual RFQ sent to a specific vendor
 * for a PurchaseRequest.
 */
@Entity
@Table(name = "rfq_items")
public class RfqItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_company_id", nullable = false)
    private Company vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_offering_id")
    private VendorServiceOffering vendorOffering;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RfqItemStatus status = RfqItemStatus.SENT;

    @Column(name = "quoted_price", precision = 15, scale = 2)
    private BigDecimal quotedPrice;

    @Column(name = "quoted_lead_time")
    private Integer quotedLeadTime;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == RfqItemStatus.SENT && sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Domain methods

    /**
     * Record vendor's response to the RFQ.
     */
    public void recordReply(BigDecimal quotedPrice, Integer quotedLeadTime, String notes) {
        if (status != RfqItemStatus.SENT) {
            throw new IllegalStateException("Cannot record reply for RFQ item in " + status + " status");
        }
        this.quotedPrice = quotedPrice;
        this.quotedLeadTime = quotedLeadTime;
        this.notes = notes;
        this.repliedAt = LocalDateTime.now();
        this.status = RfqItemStatus.REPLIED;
    }

    /**
     * Mark as no response from vendor.
     */
    public void markNoResponse() {
        if (status != RfqItemStatus.SENT) {
            throw new IllegalStateException("Cannot mark no response for RFQ item in " + status + " status");
        }
        this.status = RfqItemStatus.NO_RESPONSE;
    }

    /**
     * Select this vendor's quote.
     */
    public void select() {
        if (status != RfqItemStatus.REPLIED) {
            throw new IllegalStateException("Cannot select RFQ item in " + status + " status");
        }
        this.status = RfqItemStatus.SELECTED;
    }

    /**
     * Reject this vendor's quote.
     */
    public void reject() {
        if (status != RfqItemStatus.REPLIED) {
            throw new IllegalStateException("Cannot reject RFQ item in " + status + " status");
        }
        this.status = RfqItemStatus.REJECTED;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PurchaseRequest getPurchaseRequest() {
        return purchaseRequest;
    }

    public void setPurchaseRequest(PurchaseRequest purchaseRequest) {
        this.purchaseRequest = purchaseRequest;
    }

    public Company getVendor() {
        return vendor;
    }

    public void setVendor(Company vendor) {
        this.vendor = vendor;
    }

    public VendorServiceOffering getVendorOffering() {
        return vendorOffering;
    }

    public void setVendorOffering(VendorServiceOffering vendorOffering) {
        this.vendorOffering = vendorOffering;
    }

    public RfqItemStatus getStatus() {
        return status;
    }

    public void setStatus(RfqItemStatus status) {
        this.status = status;
    }

    public BigDecimal getQuotedPrice() {
        return quotedPrice;
    }

    public void setQuotedPrice(BigDecimal quotedPrice) {
        this.quotedPrice = quotedPrice;
    }

    public Integer getQuotedLeadTime() {
        return quotedLeadTime;
    }

    public void setQuotedLeadTime(Integer quotedLeadTime) {
        this.quotedLeadTime = quotedLeadTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getRepliedAt() {
        return repliedAt;
    }

    public void setRepliedAt(LocalDateTime repliedAt) {
        this.repliedAt = repliedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
