package com.wellkorea.backend.production.domain;

import com.wellkorea.backend.product.domain.ProductType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Template for manufacturing steps per product type.
 * Defines the standard work steps (e.g., "Cut", "Weld", "Paint", "QC") for each product category.
 * When a WorkProgressSheet is created, steps are instantiated from these templates.
 */
@Entity
@Table(name = "work_progress_step_templates")
public class WorkProgressStepTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_type_id", nullable = false)
    private ProductType productType;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "step_name", nullable = false, length = 100)
    private String stepName;

    @Column(name = "estimated_hours", precision = 5, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "is_outsourceable", nullable = false)
    private boolean outsourceable = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ProductType getProductType() {
        return productType;
    }

    public void setProductType(ProductType productType) {
        this.productType = productType;
    }

    public Integer getStepNumber() {
        return stepNumber;
    }

    public void setStepNumber(Integer stepNumber) {
        this.stepNumber = stepNumber;
    }

    public String getStepName() {
        return stepName;
    }

    public void setStepName(String stepName) {
        this.stepName = stepName;
    }

    public BigDecimal getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(BigDecimal estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public boolean isOutsourceable() {
        return outsourceable;
    }

    public void setOutsourceable(boolean outsourceable) {
        this.outsourceable = outsourceable;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
