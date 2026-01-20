package com.wellkorea.backend.catalog.domain;

import com.wellkorea.backend.company.domain.Company;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Material entity representing physical materials/items purchased from vendors.
 * Examples: bolts, screws, raw materials, tools, consumables.
 * Used in MaterialPurchaseRequest for purchasing workflow.
 */
@Entity
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private MaterialCategory category;

    @Column(name = "unit", nullable = false, length = 20)
    private String unit = "EA";

    @Column(name = "standard_price", precision = 15, scale = 2)
    private BigDecimal standardPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_vendor_id")
    private Company preferredVendor;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

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
     * Check if material can be edited.
     */
    public boolean canEdit() {
        return active;
    }

    /**
     * Check if material has a standard price.
     */
    public boolean hasPrice() {
        return standardPrice != null && standardPrice.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Check if material has a preferred vendor.
     */
    public boolean hasPreferredVendor() {
        return preferredVendor != null;
    }

    /**
     * Deactivate the material (soft delete).
     */
    public void deactivate() {
        this.active = false;
    }

    /**
     * Activate the material.
     */
    public void activate() {
        this.active = true;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public MaterialCategory getCategory() {
        return category;
    }

    public void setCategory(MaterialCategory category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getStandardPrice() {
        return standardPrice;
    }

    public void setStandardPrice(BigDecimal standardPrice) {
        this.standardPrice = standardPrice;
    }

    public Company getPreferredVendor() {
        return preferredVendor;
    }

    public void setPreferredVendor(Company preferredVendor) {
        this.preferredVendor = preferredVendor;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
