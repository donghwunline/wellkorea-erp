package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.catalog.domain.Material;
import com.wellkorea.backend.project.domain.Project;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

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

    // ========== Constructors ==========

    /**
     * Default constructor for JPA.
     */
    protected MaterialPurchaseRequest() {
    }

    /**
     * Creates a new MaterialPurchaseRequest with all required fields.
     *
     * @param project       the associated project (nullable)
     * @param material      the material being purchased (required)
     * @param requestNumber the unique request number (required)
     * @param description   the request description (required)
     * @param quantity      the requested quantity (required)
     * @param uom           the unit of measure (nullable)
     * @param requiredDate  the required delivery date (required)
     * @param createdBy     the user creating this request (required)
     */
    public MaterialPurchaseRequest(
            Project project,
            Material material,
            String requestNumber,
            String description,
            BigDecimal quantity,
            String uom,
            LocalDate requiredDate,
            User createdBy
    ) {
        super(project, requestNumber, description, quantity, uom, requiredDate, createdBy);
        Objects.requireNonNull(material, "material must not be null");
        this.material = material;
    }

    // ========== Domain Methods ==========

    /**
     * Get the item name for display (material name).
     */
    @Override
    public String getItemName() {
        return material != null ? material.getName() : null;
    }
}
