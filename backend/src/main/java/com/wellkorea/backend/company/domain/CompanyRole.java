package com.wellkorea.backend.company.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * CompanyRole value object - represents a business relationship type with a company.
 * <p>
 * A company can have multiple roles (e.g., both CUSTOMER and VENDOR).
 * Each role can have role-specific attributes like credit limit.
 * <p>
 * As a value object (embeddable), CompanyRole:
 * <ul>
 *   <li>Has no independent identity - identified by roleType within a company</li>
 *   <li>Is owned by Company aggregate - lifecycle managed through Company</li>
 *   <li>Is compared by value (roleType) not by reference</li>
 * </ul>
 */
@Embeddable
public class CompanyRole {

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false, length = 20)
    private RoleType roleType;

    @Column(name = "credit_limit", precision = 15, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "default_payment_days")
    private Integer defaultPaymentDays;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CompanyRole() {
        // JPA requires default constructor
    }

    private CompanyRole(Builder builder) {
        this.roleType = Objects.requireNonNull(builder.roleType, "roleType is required");
        this.creditLimit = builder.creditLimit;
        this.defaultPaymentDays = builder.defaultPaymentDays;
        this.notes = builder.notes;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

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

    // ========== Domain Methods ==========

    /**
     * Update role attributes.
     * Returns a new CompanyRole with updated values (immutable-style).
     */
    public CompanyRole withUpdates(BigDecimal creditLimit, Integer defaultPaymentDays, String notes) {
        return CompanyRole.builder()
                .roleType(this.roleType)
                .creditLimit(creditLimit != null ? creditLimit : this.creditLimit)
                .defaultPaymentDays(defaultPaymentDays != null ? defaultPaymentDays : this.defaultPaymentDays)
                .notes(notes != null ? notes : this.notes)
                .createdAt(this.createdAt)
                .build();
    }

    /**
     * Equals based on roleType (natural key for value object).
     * Two roles are equal if they have the same roleType.
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CompanyRole that = (CompanyRole) o;
        return roleType == that.roleType;
    }

    @Override
    public int hashCode() {
        return Objects.hash(roleType);
    }

    @Override
    public String toString() {
        return "CompanyRole{" +
                "roleType=" + roleType +
                ", creditLimit=" + creditLimit +
                ", defaultPaymentDays=" + defaultPaymentDays +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private RoleType roleType;
        private BigDecimal creditLimit;
        private Integer defaultPaymentDays;
        private String notes;
        private Instant createdAt;

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
