package com.wellkorea.backend.company.api.dto.query;

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
}
