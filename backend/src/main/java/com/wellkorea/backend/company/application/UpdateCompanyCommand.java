package com.wellkorea.backend.company.application;

/**
 * Command object for updating a company.
 * Null values mean "don't update this field".
 */
public record UpdateCompanyCommand(
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
        String paymentTerms
) {
}
