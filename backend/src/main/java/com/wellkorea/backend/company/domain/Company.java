package com.wellkorea.backend.company.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Company entity - unified trading partner (customer, vendor, outsource).
 * <p>
 * Replaces separate Customer and Supplier entities.
 * A Company can have multiple roles (e.g., same company is both customer and vendor).
 */
@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "registration_number", length = 20)
    private String registrationNumber;

    @Column(length = 100)
    private String representative;

    @Column(name = "business_type", length = 100)
    private String businessType;

    @Column(name = "business_category", length = 100)
    private String businessCategory;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "bank_account", length = 100)
    private String bankAccount;

    @Column(name = "payment_terms", length = 50)
    private String paymentTerms = "NET30";

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "company_roles", joinColumns = @JoinColumn(name = "company_id"))
    private List<CompanyRole> roles = new ArrayList<>();

    protected Company() {
        // JPA requires default constructor
    }

    private Company(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.registrationNumber = builder.registrationNumber;
        this.representative = builder.representative;
        this.businessType = builder.businessType;
        this.businessCategory = builder.businessCategory;
        this.contactPerson = builder.contactPerson;
        this.phone = builder.phone;
        this.email = builder.email;
        this.address = builder.address;
        this.bankAccount = builder.bankAccount;
        this.paymentTerms = builder.paymentTerms != null ? builder.paymentTerms : "NET30";
        this.isActive = builder.isActive;
        this.createdAt = builder.createdAt != null ? builder.createdAt : Instant.now();
        this.updatedAt = builder.updatedAt != null ? builder.updatedAt : Instant.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    // ========== Getters ==========

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public String getRepresentative() {
        return representative;
    }

    public String getBusinessType() {
        return businessType;
    }

    public String getBusinessCategory() {
        return businessCategory;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getAddress() {
        return address;
    }

    public String getBankAccount() {
        return bankAccount;
    }

    public String getPaymentTerms() {
        return paymentTerms;
    }

    public boolean isActive() {
        return isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<CompanyRole> getRoles() {
        return Collections.unmodifiableList(roles);
    }

    // ========== Domain Methods ==========

    /**
     * Add a role to this company.
     *
     * @param role The role to add
     * @throws IllegalArgumentException if company already has this role type
     * @throws IllegalStateException    if company already has maximum roles (5)
     */
    public void addRole(CompanyRole role) {
        if (hasRole(role.getRoleType())) {
            throw new IllegalArgumentException("Company already has role: " + role.getRoleType());
        }
        if (roles.size() >= 5) {
            throw new IllegalStateException("Company cannot have more than 5 roles");
        }
        roles.add(role);
    }

    /**
     * Remove a role from this company by role type.
     *
     * @param roleType The role type to remove
     * @throws IllegalArgumentException if company doesn't have this role
     * @throws IllegalStateException    if this is the last role
     */
    public void removeRole(RoleType roleType) {
        // First check if company has the role
        if (!hasRole(roleType)) {
            throw new IllegalArgumentException("Company does not have role: " + roleType);
        }
        // Then check if it's the last role
        if (roles.size() <= 1) {
            throw new IllegalStateException("Cannot remove the last role from a company");
        }
        roles.removeIf(r -> r.getRoleType() == roleType);
    }

    /**
     * Check if this company has a specific role type.
     *
     * @param roleType The role type to check
     * @return true if the company has this role
     */
    public boolean hasRole(RoleType roleType) {
        return roles.stream().anyMatch(r -> r.getRoleType() == roleType);
    }

    /**
     * Update company information.
     */
    public void update(String name, String registrationNumber, String representative,
                       String businessType, String businessCategory, String contactPerson,
                       String phone, String email, String address, String bankAccount,
                       String paymentTerms) {
        if (name != null) this.name = name;
        if (registrationNumber != null) this.registrationNumber = registrationNumber;
        if (representative != null) this.representative = representative;
        if (businessType != null) this.businessType = businessType;
        if (businessCategory != null) this.businessCategory = businessCategory;
        if (contactPerson != null) this.contactPerson = contactPerson;
        if (phone != null) this.phone = phone;
        if (email != null) this.email = email;
        if (address != null) this.address = address;
        if (bankAccount != null) this.bankAccount = bankAccount;
        if (paymentTerms != null) this.paymentTerms = paymentTerms;
        this.updatedAt = Instant.now();
    }

    /**
     * Soft delete the company.
     */
    public void deactivate() {
        this.isActive = false;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Company company = (Company) o;
        return Objects.equals(id, company.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Company{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", registrationNumber='" + registrationNumber + '\'' +
                ", isActive=" + isActive +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private String name;
        private String registrationNumber;
        private String representative;
        private String businessType;
        private String businessCategory;
        private String contactPerson;
        private String phone;
        private String email;
        private String address;
        private String bankAccount;
        private String paymentTerms;
        private boolean isActive = true;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder registrationNumber(String registrationNumber) {
            this.registrationNumber = registrationNumber;
            return this;
        }

        public Builder representative(String representative) {
            this.representative = representative;
            return this;
        }

        public Builder businessType(String businessType) {
            this.businessType = businessType;
            return this;
        }

        public Builder businessCategory(String businessCategory) {
            this.businessCategory = businessCategory;
            return this;
        }

        public Builder contactPerson(String contactPerson) {
            this.contactPerson = contactPerson;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder address(String address) {
            this.address = address;
            return this;
        }

        public Builder bankAccount(String bankAccount) {
            this.bankAccount = bankAccount;
            return this;
        }

        public Builder paymentTerms(String paymentTerms) {
            this.paymentTerms = paymentTerms;
            return this;
        }

        public Builder isActive(boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Company build() {
            return new Company(this);
        }
    }
}
