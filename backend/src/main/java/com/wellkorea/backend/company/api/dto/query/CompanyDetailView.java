package com.wellkorea.backend.company.api.dto.query;

import com.wellkorea.backend.company.domain.Company;

import java.time.Instant;
import java.util.List;

/**
 * View DTO for detailed company information including roles.
 */
public record CompanyDetailView(
        Long id,
        String name,
        String registrationNumber,
        String representative,
        String businessType,
        String businessCategory,
        String contactPerson,
        String phone,
        String email,
        String address,
        String bankAccount,
        String paymentTerms,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        List<CompanyRoleView> roles
) {
    /**
     * Create from entity with roles.
     */
    public static CompanyDetailView from(Company company) {
        List<CompanyRoleView> roleViews = company.getRoles().stream()
                .map(CompanyRoleView::from)
                .toList();

        return new CompanyDetailView(
                company.getId(),
                company.getName(),
                company.getRegistrationNumber(),
                company.getRepresentative(),
                company.getBusinessType(),
                company.getBusinessCategory(),
                company.getContactPerson(),
                company.getPhone(),
                company.getEmail(),
                company.getAddress(),
                company.getBankAccount(),
                company.getPaymentTerms(),
                company.isActive(),
                company.getCreatedAt(),
                company.getUpdatedAt(),
                roleViews
        );
    }
}
