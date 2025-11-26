package com.wellkorea.erp.domain.customer;

import com.wellkorea.erp.domain.shared.AuditableEntity;
import jakarta.persistence.*;

import java.util.UUID;

/**
 * Customer entity with company and contact information
 */
@Entity
@Table(name = "customers", indexes = {
        @Index(name = "idx_customers_company_name", columnList = "company_name"),
        @Index(name = "idx_customers_active", columnList = "active")
})
public class Customer extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "site_location")
    private String siteLocation;

    @Column(name = "department")
    private String department;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "billing_address")
    private String billingAddress;

    @Column(name = "payment_terms", length = 100)
    private String paymentTerms;

    @Column(name = "active")
    private boolean active = true;

    @Column(name = "deleted_at")
    private java.time.Instant deletedAt;

    protected Customer() {
        // JPA requires default constructor
    }

    public Customer(String companyName) {
        this.companyName = companyName;
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
        this.deletedAt = java.time.Instant.now();
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getSiteLocation() {
        return siteLocation;
    }

    public void setSiteLocation(String siteLocation) {
        this.siteLocation = siteLocation;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getBillingAddress() {
        return billingAddress;
    }

    public void setBillingAddress(String billingAddress) {
        this.billingAddress = billingAddress;
    }

    public String getPaymentTerms() {
        return paymentTerms;
    }

    public void setPaymentTerms(String paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public java.time.Instant getDeletedAt() {
        return deletedAt;
    }
}
