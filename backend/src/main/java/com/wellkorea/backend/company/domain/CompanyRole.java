package com.wellkorea.backend.company.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * CompanyRole entity - represents a business relationship type with a company.
 * <p>
 * A company can have multiple roles (e.g., both CUSTOMER and VENDOR).
 * Each role can have role-specific attributes like credit limit.
 */
@Entity
@Table(name = "company_roles",
        uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "role_type"}))
public class CompanyRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false, length = 20)
    private RoleType roleType;

    @Column(name = "credit_limit", precision = 15, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "default_payment_days")
    private Integer defaultPaymentDays;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected CompanyRole() {
        // JPA requires default constructor
    }

    private CompanyRole(Builder builder) {
        this.id = builder.id;
        this.company = builder.company;
        this.roleType = builder.roleType;
        this.creditLimit = builder.creditLimit;
        this.defaultPaymentDays = builder.defaultPaymentDays;
        this.notes = builder.notes;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public Company getCompany() {
        return company;
    }

    public Long getCompanyId() {
        return company != null ? company.getId() : null;
    }

    public RoleType getRoleType() {
        return roleType;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public Integer getDefaultPaymentDays() {
        return defaultPaymentDays;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    // ========== Setters (for JPA relationship management) ==========

    void setCompany(Company company) {
        this.company = company;
    }

    // ========== Domain Methods ==========

    /**
     * Update role attributes.
     */
    public void update(BigDecimal creditLimit, Integer defaultPaymentDays, String notes) {
        if (creditLimit != null) this.creditLimit = creditLimit;
        if (defaultPaymentDays != null) this.defaultPaymentDays = defaultPaymentDays;
        if (notes != null) this.notes = notes;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CompanyRole that = (CompanyRole) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "CompanyRole{" +
                "id=" + id +
                ", companyId=" + getCompanyId() +
                ", roleType=" + roleType +
                ", creditLimit=" + creditLimit +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private Company company;
        private Long companyId;
        private RoleType roleType;
        private BigDecimal creditLimit;
        private Integer defaultPaymentDays;
        private String notes;
        private Instant createdAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder company(Company company) {
            this.company = company;
            return this;
        }

        public Builder companyId(Long companyId) {
            this.companyId = companyId;
            return this;
        }

        public Builder roleType(RoleType roleType) {
            this.roleType = roleType;
            return this;
        }

        public Builder creditLimit(BigDecimal creditLimit) {
            this.creditLimit = creditLimit;
            return this;
        }

        public Builder defaultPaymentDays(Integer defaultPaymentDays) {
            this.defaultPaymentDays = defaultPaymentDays;
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

        public CompanyRole build() {
            return new CompanyRole(this);
        }
    }
}
