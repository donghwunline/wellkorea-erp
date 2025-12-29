package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.domain.RoleType;

import java.math.BigDecimal;

/**
 * Command object for adding a role to a company.
 */
public record AddRoleCommand(
        RoleType roleType,
        BigDecimal creditLimit,
        Integer defaultPaymentDays,
        String notes
) {
}
