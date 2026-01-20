package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.catalog.domain.ServiceCategory;
import jakarta.persistence.*;

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

    /**
     * Get the item name for display (service category name).
     */
    @Override
    public String getItemName() {
        return serviceCategory != null ? serviceCategory.getName() : null;
    }

    // Getters and Setters

    public ServiceCategory getServiceCategory() {
        return serviceCategory;
    }

    public void setServiceCategory(ServiceCategory serviceCategory) {
        this.serviceCategory = serviceCategory;
    }
}
