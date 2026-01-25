package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.project.domain.Project;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

/**
 * ServicePurchaseRequest - Purchase request for outsourcing services.
 * Examples: CNC machining, laser cutting, painting, etching.
 * Links to ServiceCategory for the type of service being purchased.
 */
@Entity
@DiscriminatorValue("SERVICE")
public class ServicePurchaseRequest extends PurchaseRequest {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_category_id", nullable = false)
    private ServiceCategory serviceCategory;

    // ========== Constructors ==========

    /**
     * Default constructor for JPA.
     */
    protected ServicePurchaseRequest() {
    }

    /**
     * Creates a new ServicePurchaseRequest with all required fields.
     *
     * @param project         the associated project (nullable)
     * @param serviceCategory the service category being purchased (required)
     * @param requestNumber   the unique request number (required)
     * @param description     the request description (required)
     * @param quantity        the requested quantity (required)
     * @param uom             the unit of measure (nullable)
     * @param requiredDate    the required delivery date (required)
     * @param createdBy       the user creating this request (required)
     */
    public ServicePurchaseRequest(
            Project project,
            ServiceCategory serviceCategory,
            String requestNumber,
            String description,
            BigDecimal quantity,
            String uom,
            LocalDate requiredDate,
            User createdBy
    ) {
        super(project, requestNumber, description, quantity, uom, requiredDate, createdBy);
        Objects.requireNonNull(serviceCategory, "serviceCategory must not be null");
        this.serviceCategory = serviceCategory;
    }

    // ========== Domain Methods ==========

    /**
     * Get the item name for display (service category name).
     */
    @Override
    public String getItemName() {
        return serviceCategory != null ? serviceCategory.getName() : null;
    }
}
