package com.wellkorea.backend.company.api.dto.query;

import com.wellkorea.backend.company.domain.CompanyRole;
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
    /**
     * Create from entity.
     */
    public static CompanyRoleView from(CompanyRole role) {
        return new CompanyRoleView(
                role.getId(),
                role.getRoleType(),
                role.getCreditLimit(),
                role.getDefaultPaymentDays(),
                role.getNotes(),
                role.getCreatedAt()
        );
    }
}
