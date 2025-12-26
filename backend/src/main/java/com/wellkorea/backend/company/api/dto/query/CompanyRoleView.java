package com.wellkorea.backend.company.api.dto.query;

import com.wellkorea.backend.company.domain.RoleType;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * View DTO for company role information.
 */
public record CompanyRoleView(
        Long id,
        RoleType roleType,
        BigDecimal creditLimit,
        Integer defaultPaymentDays,
        String notes,
        Instant createdAt
) {
}
