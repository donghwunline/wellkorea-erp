package com.wellkorea.backend.delivery.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * Delivery Line Item entity - individual products delivered in a shipment.
 * <p>
 * Each line item tracks:
 * - Which product was delivered
 * - How many units were delivered
 * <p>
 * Validation rules:
 * - quantity_delivered > 0
 * - quantity_delivered <= remaining deliverable quantity (enforced by service layer)
 */
@Entity
@Table(name = "delivery_line_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_delivery_line_items_delivery_product",
                columnNames = {"delivery_id", "product_id"}))
public class DeliveryLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id", nullable = false)
    private Delivery delivery;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "quantity_delivered", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityDelivered;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected DeliveryLineItem() {
        // JPA requires default constructor
    }

    private DeliveryLineItem(Builder builder) {
        this.id = builder.id;
        this.productId = builder.productId;
        this.quantityDelivered = builder.quantityDelivered;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
        // Note: delivery is set via setDelivery() when added to Delivery
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public Delivery getDelivery() {
        return delivery;
    }

    public Long getProductId() {
        return productId;
    }

    public BigDecimal getQuantityDelivered() {
        return quantityDelivered;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    // ========== Package-private Setter for bidirectional relationship ==========

    void setDelivery(Delivery delivery) {
        this.delivery = delivery;
    }

    // ========== Domain Methods ==========

    /**
     * Get the quantity as a double for calculations.
     *
     * @return quantity as double
     */
    public double getQuantityDeliveredAsDouble() {
        return quantityDelivered != null ? quantityDelivered.doubleValue() : 0.0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DeliveryLineItem that = (DeliveryLineItem) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "DeliveryLineItem{" +
                "id=" + id +
                ", productId=" + productId +
                ", quantityDelivered=" + quantityDelivered +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private Long productId;
        private BigDecimal quantityDelivered;
        private Instant createdAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder productId(Long productId) {
            this.productId = productId;
            return this;
        }

        public Builder quantityDelivered(BigDecimal quantityDelivered) {
            this.quantityDelivered = quantityDelivered;
            return this;
        }

        public Builder quantityDelivered(double quantityDelivered) {
            this.quantityDelivered = BigDecimal.valueOf(quantityDelivered);
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public DeliveryLineItem build() {
            if (quantityDelivered == null || quantityDelivered.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Quantity delivered must be greater than 0");
            }
            return new DeliveryLineItem(this);
        }
    }
}
