package com.wellkorea.backend.company.api.dto.command;

import com.wellkorea.backend.company.application.UpdateCompanyCommand;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating a company.
 */
public record UpdateCompanyRequest(
        @Size(max = 255, message = "Company name must be at most 255 characters")
        String name,

        @Size(max = 20, message = "Registration number must be at most 20 characters")
        String registrationNumber,

        @Size(max = 100, message = "Representative name must be at most 100 characters")
        String representative,

        @Size(max = 100, message = "Business type must be at most 100 characters")
        String businessType,

        @Size(max = 100, message = "Business category must be at most 100 characters")
        String businessCategory,

        @Size(max = 100, message = "Contact person name must be at most 100 characters")
        String contactPerson,

        @Size(max = 20, message = "Phone must be at most 20 characters")
        String phone,

        @Size(max = 255, message = "Email must be at most 255 characters")
        String email,

        String address,

        @Size(max = 100, message = "Bank account must be at most 100 characters")
        String bankAccount,

        @Size(max = 50, message = "Payment terms must be at most 50 characters")
        String paymentTerms
) {
    /**
     * Convert to command object.
     */
    public UpdateCompanyCommand toCommand() {
        return new UpdateCompanyCommand(
                name,
                registrationNumber,
                representative,
                businessType,
                businessCategory,
                contactPerson,
                phone,
                email,
                address,
                bankAccount,
                paymentTerms
        );
    }
}
