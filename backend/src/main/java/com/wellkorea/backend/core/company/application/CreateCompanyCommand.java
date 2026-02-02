package com.wellkorea.backend.core.company.application;

import com.wellkorea.backend.core.company.domain.vo.RoleType;

import java.util.Set;

/**
 * Command object for creating a new company.
 */
public record CreateCompanyCommand(
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
        Set<RoleType> roles
) {
}
