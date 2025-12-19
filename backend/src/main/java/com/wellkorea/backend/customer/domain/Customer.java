package com.wellkorea.backend.customer.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;

/**
 * Customer entity - external parties receiving quotations and invoices.
 * <p>
 * A Customer represents a business client with contact information
 * and payment terms. Used for project association and invoicing.
 */
@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "registration_number", unique = true, length = 20)
    private String registrationNumber;

    @Column(name = "tax_id", length = 20)
    private String taxId;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "payment_terms", length = 50)
    private String paymentTerms = "NET30";

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Customer() {
        // JPA requires default constructor
    }

    private Customer(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.registrationNumber = builder.registrationNumber;
        this.taxId = builder.taxId;
        this.contactPerson = builder.contactPerson;
        this.phone = builder.phone;
        this.email = builder.email;
        this.address = builder.address;
        this.paymentTerms = builder.paymentTerms != null ? builder.paymentTerms : "NET30";
        this.isDeleted = builder.isDeleted;
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

    public String getTaxId() {
        return taxId;
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

    public String getPaymentTerms() {
        return paymentTerms;
    }

    public boolean isDeleted() {
        return isDeleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    // ========== Domain Methods ==========

    /**
     * Soft delete the customer.
     *
     * @return New Customer instance with isDeleted = true
     */
    public Customer delete() {
        return builder()
                .id(this.id)
                .name(this.name)
                .registrationNumber(this.registrationNumber)
                .taxId(this.taxId)
                .contactPerson(this.contactPerson)
                .phone(this.phone)
                .email(this.email)
                .address(this.address)
                .paymentTerms(this.paymentTerms)
                .isDeleted(true)
                .createdAt(this.createdAt)
                .updatedAt(Instant.now())
                .build();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Customer customer = (Customer) o;
        return Objects.equals(id, customer.id) &&
                Objects.equals(registrationNumber, customer.registrationNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, registrationNumber);
    }

    @Override
    public String toString() {
        return "Customer{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", registrationNumber='" + registrationNumber + '\'' +
                ", contactPerson='" + contactPerson + '\'' +
                ", isDeleted=" + isDeleted +
                '}';
    }

    // ========== Builder ==========

    public static class Builder {
        private Long id;
        private String name;
        private String registrationNumber;
        private String taxId;
        private String contactPerson;
        private String phone;
        private String email;
        private String address;
        private String paymentTerms;
        private boolean isDeleted = false;
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

        public Builder taxId(String taxId) {
            this.taxId = taxId;
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

        public Builder paymentTerms(String paymentTerms) {
            this.paymentTerms = paymentTerms;
            return this;
        }

        public Builder isDeleted(boolean isDeleted) {
            this.isDeleted = isDeleted;
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

        public Customer build() {
            return new Customer(this);
        }
    }
}
