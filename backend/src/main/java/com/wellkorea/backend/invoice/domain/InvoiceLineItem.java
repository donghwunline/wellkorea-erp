package com.wellkorea.backend.invoice.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * InvoiceLineItem entity - represents a product in an invoice.
 * <p>
 * Key Design: Granular invoicing - tracks exactly what has been invoiced
 * to prevent double-billing at the product-quantity level.
 * <p>
 * US6 Requirements:
 * - Track quantity_invoiced per product
 * - Preserve unit_price from quotation for historical accuracy
 * - Prevent over-invoicing (cumulative invoiced <= delivered quantity)
 */
@Entity
@Table(name = "invoice_line_items",
        uniqueConstraints = @UniqueConstraint(columnNames = {"invoice_id", "product_id"}))
public class InvoiceLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private TaxInvoice invoice;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "product_sku", length = 100)
    private String productSku;

    @Column(name = "quantity_invoiced", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityInvoiced;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal lineTotal;

    protected InvoiceLineItem() {
        // JPA requires default constructor
    }

    private InvoiceLineItem(Builder builder) {
        this.id = builder.id;
        this.productId = builder.productId;
        this.productName = builder.productName;
        this.productSku = builder.productSku;
        this.quantityInvoiced = builder.quantityInvoiced;
        this.unitPrice = builder.unitPrice;
        this.lineTotal = calculateLineTotal(builder.quantityInvoiced, builder.unitPrice);
    }

    public static Builder builder() {
        return new Builder();
    }

    /**
     * Calculate line total from quantity and unit price.
     */
    private static BigDecimal calculateLineTotal(BigDecimal quantity, BigDecimal price) {
        if (quantity == null || price == null) {
            return BigDecimal.ZERO;
        }
        return quantity.multiply(price);
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public TaxInvoice getInvoice() {
        return invoice;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public String getProductSku() {
        return productSku;
    }

    public BigDecimal getQuantityInvoiced() {
        return quantityInvoiced;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    // ========== Package-Private Setters for Relationship ==========

    void setInvoice(TaxInvoice invoice) {
        this.invoice = invoice;
    }

    // ========== Domain Methods ==========

    /**
     * Update quantity invoiced and recalculate line total.
     *
     * @param newQuantity New quantity
     */
    public void updateQuantity(BigDecimal newQuantity) {
        if (newQuantity == null || newQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        this.quantityInvoiced = newQuantity;
        this.lineTotal = calculateLineTotal(newQuantity, this.unitPrice);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        InvoiceLineItem that = (InvoiceLineItem) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "InvoiceLineItem{" +
                "id=" + id +
                ", productId=" + productId +
                ", productName='" + productName + '\'' +
                ", quantityInvoiced=" + quantityInvoiced +
                ", unitPrice=" + unitPrice +
                ", lineTotal=" + lineTotal +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private Long productId;
        private String productName;
        private String productSku;
        private BigDecimal quantityInvoiced;
        private BigDecimal unitPrice;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder productId(Long productId) {
            this.productId = productId;
            return this;
        }

        public Builder productName(String productName) {
            this.productName = productName;
            return this;
        }

        public Builder productSku(String productSku) {
            this.productSku = productSku;
            return this;
        }

        public Builder quantityInvoiced(BigDecimal quantityInvoiced) {
            this.quantityInvoiced = quantityInvoiced;
            return this;
        }

        public Builder unitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
            return this;
        }

        public InvoiceLineItem build() {
            return new InvoiceLineItem(this);
        }
    }
}
