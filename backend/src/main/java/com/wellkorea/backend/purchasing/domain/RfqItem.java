package com.wellkorea.backend.purchasing.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * RfqItem embeddable representing an individual RFQ sent to a specific vendor
 * for a PurchaseRequest. Part of the PurchaseRequest aggregate.
 */
@Embeddable
public class RfqItem {

    /**
     * UUID identifier for this RFQ item within the purchase request.
     */
    @Column(name = "item_id", nullable = false, length = 36)
    private String itemId;

    /**
     * Reference to vendor company (Long ID instead of @ManyToOne for embeddable).
     */
    @Column(name = "vendor_company_id", nullable = false)
    private Long vendorCompanyId;

    /**
     * Reference to vendor offering (optional, Long ID instead of @ManyToOne for embeddable).
     */
    @Column(name = "vendor_offering_id")
    private Long vendorOfferingId;

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

    // Default constructor for JPA
    public RfqItem() {
    }

    /**
     * Constructor for creating new RFQ item.
     */
    public RfqItem(Long vendorCompanyId, Long vendorOfferingId) {
        this.itemId = UUID.randomUUID().toString();
        this.vendorCompanyId = vendorCompanyId;
        this.vendorOfferingId = vendorOfferingId;
        this.status = RfqItemStatus.SENT;
        this.sentAt = LocalDateTime.now();
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

    public String getItemId() {
        return itemId;
    }

    public void setItemId(String itemId) {
        this.itemId = itemId;
    }

    public Long getVendorCompanyId() {
        return vendorCompanyId;
    }

    public void setVendorCompanyId(Long vendorCompanyId) {
        this.vendorCompanyId = vendorCompanyId;
    }

    public Long getVendorOfferingId() {
        return vendorOfferingId;
    }

    public void setVendorOfferingId(Long vendorOfferingId) {
        this.vendorOfferingId = vendorOfferingId;
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

    // ========== Equals and HashCode (value-based on itemId) ==========

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RfqItem rfqItem = (RfqItem) o;
        return Objects.equals(itemId, rfqItem.itemId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(itemId);
    }
}
