package com.wellkorea.backend.delivery.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Delivery entity - records when products are shipped to customer.
 * <p>
 * A Delivery contains multiple DeliveryLineItems, each specifying
 * which products and quantities were shipped.
 * <p>
 * US5 Requirements:
 * - Track partial deliveries (any product/quantity combination)
 * - Prevent over-delivery (cumulative delivered <= quotation quantity)
 * - Generate transaction statement PDF
 */
@Entity
@Table(name = "deliveries")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    /**
     * References the quotation version this delivery was recorded against.
     * Used for:
     * - Tracking which quotation version was valid when delivery was made
     * - Detecting conflicts when approving new quotation versions
     * - Allowing reassignment of deliveries to new quotation versions
     */
    @Column(name = "quotation_id")
    private Long quotationId;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DeliveryStatus status = DeliveryStatus.PENDING;

    @Column(name = "delivered_by_id", nullable = false)
    private Long deliveredById;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "delivery", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DeliveryLineItem> lineItems = new ArrayList<>();

    protected Delivery() {
        // JPA requires default constructor
    }

    private Delivery(Builder builder) {
        this.id = builder.id;
        this.projectId = builder.projectId;
        this.quotationId = builder.quotationId;
        this.deliveryDate = builder.deliveryDate;
        this.status = builder.status != null ? builder.status : DeliveryStatus.PENDING;
        this.deliveredById = builder.deliveredById;
        this.notes = builder.notes;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
        this.updatedAt = builder.updatedAt != null ? builder.updatedAt : Instant.now();
        if (builder.lineItems != null) {
            builder.lineItems.forEach(this::addLineItem);
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public Long getQuotationId() {
        return quotationId;
    }

    public LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public Long getDeliveredById() {
        return deliveredById;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<DeliveryLineItem> getLineItems() {
        return Collections.unmodifiableList(lineItems);
    }

    // ========== Domain Methods ==========

    /**
     * Reassign this delivery to a different quotation version.
     * Used when a new quotation is approved and existing deliveries
     * need to be linked to the new version.
     *
     * @param quotationId ID of the quotation to assign
     */
    public void reassignToQuotation(Long quotationId) {
        this.quotationId = quotationId;
        this.updatedAt = Instant.now();
    }

    /**
     * Add a line item to this delivery.
     * Establishes bidirectional relationship.
     *
     * @param lineItem Line item to add
     */
    public void addLineItem(DeliveryLineItem lineItem) {
        lineItems.add(lineItem);
        lineItem.setDelivery(this);
    }

    /**
     * Remove a line item from this delivery.
     *
     * @param lineItem Line item to remove
     */
    public void removeLineItem(DeliveryLineItem lineItem) {
        lineItems.remove(lineItem);
        lineItem.setDelivery(null);
    }

    /**
     * Mark the delivery as delivered.
     */
    public void markDelivered() {
        if (!status.canTransitionTo(DeliveryStatus.DELIVERED)) {
            throw new IllegalStateException(
                    "Cannot mark delivery as delivered from status: " + status);
        }
        this.status = DeliveryStatus.DELIVERED;
        this.updatedAt = Instant.now();
    }

    /**
     * Mark the delivery as returned.
     */
    public void markReturned() {
        if (!status.canTransitionTo(DeliveryStatus.RETURNED)) {
            throw new IllegalStateException(
                    "Cannot mark delivery as returned from status: " + status);
        }
        this.status = DeliveryStatus.RETURNED;
        this.updatedAt = Instant.now();
    }

    /**
     * Check if this delivery counts toward delivered quantities.
     * Returned deliveries don't count.
     *
     * @return true if delivery counts
     */
    public boolean countsTowardDeliveredQuantity() {
        return status != DeliveryStatus.RETURNED;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Delivery delivery = (Delivery) o;
        return Objects.equals(id, delivery.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Delivery{" +
                "id=" + id +
                ", projectId=" + projectId +
                ", deliveryDate=" + deliveryDate +
                ", status=" + status +
                ", lineItemCount=" + lineItems.size() +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private Long projectId;
        private Long quotationId;
        private LocalDate deliveryDate;
        private DeliveryStatus status;
        private Long deliveredById;
        private String notes;
        private Instant createdAt;
        private Instant updatedAt;
        private List<DeliveryLineItem> lineItems;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder projectId(Long projectId) {
            this.projectId = projectId;
            return this;
        }

        public Builder quotationId(Long quotationId) {
            this.quotationId = quotationId;
            return this;
        }

        public Builder deliveryDate(LocalDate deliveryDate) {
            this.deliveryDate = deliveryDate;
            return this;
        }

        public Builder status(DeliveryStatus status) {
            this.status = status;
            return this;
        }

        public Builder deliveredById(Long deliveredById) {
            this.deliveredById = deliveredById;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder lineItems(List<DeliveryLineItem> lineItems) {
            this.lineItems = lineItems;
            return this;
        }

        public Delivery build() {
            return new Delivery(this);
        }
    }
}
