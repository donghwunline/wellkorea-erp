package com.wellkorea.backend.company.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.Instant;
import java.util.Objects;

/**
 * CompanyRole value object - represents a business relationship type with a company.
 * <p>
 * A company can have multiple roles (e.g., both CUSTOMER and VENDOR).
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

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CompanyRole() {
        // JPA requires default constructor
    }

    private CompanyRole(Builder builder) {
        this.roleType = Objects.requireNonNull(builder.roleType, "roleType is required");
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public RoleType getRoleType() {
        return roleType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    // ========== Domain Methods ==========

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
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private RoleType roleType;
        private Instant createdAt;

        public Builder roleType(RoleType roleType) {
            this.roleType = roleType;
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
