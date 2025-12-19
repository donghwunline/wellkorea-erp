package com.wellkorea.backend.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Company information configuration properties.
 * Used for quotation PDFs, emails, and other documents.
 */
@Component
@ConfigurationProperties(prefix = "company")
public class CompanyProperties {

    private String name;
    private String nameEn;
    private String registrationNumber;
    private String address;
    private String phone;
    private String fax;
    private String designDeptPhone;
    private String email;
    private String logoPath;
    private String sealPath;

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFax() {
        return fax;
    }

    public void setFax(String fax) {
        this.fax = fax;
    }

    public String getDesignDeptPhone() {
        return designDeptPhone;
    }

    public void setDesignDeptPhone(String designDeptPhone) {
        this.designDeptPhone = designDeptPhone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLogoPath() {
        return logoPath;
    }

    public void setLogoPath(String logoPath) {
        this.logoPath = logoPath;
    }

    public String getSealPath() {
        return sealPath;
    }

    public void setSealPath(String sealPath) {
        this.sealPath = sealPath;
    }
}
