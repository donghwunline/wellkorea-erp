package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.catalog.domain.Material;
import jakarta.persistence.*;

/**
 * MaterialPurchaseRequest - Purchase request for physical materials.
 * Examples: bolts, screws, raw materials, tools, consumables.
 * Links to Material entity for the item being purchased.
 */
@Entity
@DiscriminatorValue("MATERIAL")
public class MaterialPurchaseRequest extends PurchaseRequest {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    /**
     * Get the item name for display (material name).
     */
    @Override
    public String getItemName() {
        return material != null ? material.getName() : null;
    }

    // Getters and Setters

    public Material getMaterial() {
        return material;
    }

    public void setMaterial(Material material) {
        this.material = material;
    }
}
