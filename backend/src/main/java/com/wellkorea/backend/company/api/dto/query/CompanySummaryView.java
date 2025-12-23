package com.wellkorea.backend.company.api.dto.query;

import com.wellkorea.backend.company.domain.Company;

import java.util.List;

/**
 * View DTO for company summary in list views.
 */
public record CompanySummaryView(
        Long id,
        String name,
        String registrationNumber,
        String contactPerson,
        String phone,
        String email,
        List<CompanyRoleView> roles
) {
    /**
     * Create from entity with roles.
     */
    public static CompanySummaryView from(Company company) {
        List<CompanyRoleView> roleViews = company.getRoles().stream()
                .map(CompanyRoleView::from)
                .toList();

        return new CompanySummaryView(
                company.getId(),
                company.getName(),
                company.getRegistrationNumber(),
                company.getContactPerson(),
                company.getPhone(),
                company.getEmail(),
                roleViews
        );
    }
}
