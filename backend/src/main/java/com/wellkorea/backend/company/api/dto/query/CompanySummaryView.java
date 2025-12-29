package com.wellkorea.backend.company.api.dto.query;

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
}
