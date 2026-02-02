package com.wellkorea.backend.core.purchasing.domain;

import com.wellkorea.backend.core.catalog.domain.Material;
import com.wellkorea.backend.core.purchasing.domain.vo.AttachmentReference;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
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
     * @param projectId     the associated project ID (nullable)
     * @param material      the material being purchased (required)
     * @param requestNumber the unique request number (required)
     * @param description   the request description (required)
     * @param quantity      the requested quantity (required)
     * @param uom           the unit of measure (nullable)
     * @param requiredDate  the required delivery date (required)
     * @param createdById   the user ID creating this request (required)
     */
    public MaterialPurchaseRequest(
            Long projectId,
            Material material,
            String requestNumber,
            String description,
            BigDecimal quantity,
            String uom,
            LocalDate requiredDate,
            Long createdById
    ) {
        super(projectId, requestNumber, description, quantity, uom, requiredDate, createdById);
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

    /**
     * Material purchase requests do not support attachments.
     * Returns empty list for polymorphic compatibility.
     *
     * @return Empty list
     */
    @Override
    public List<AttachmentReference> getAttachments() {
        return Collections.emptyList();
    }
}
