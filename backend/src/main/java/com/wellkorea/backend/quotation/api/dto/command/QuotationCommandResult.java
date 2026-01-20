package com.wellkorea.backend.quotation.api.dto.command;

/**
 * Result of a quotation command operation.
 * Returns only the entity ID - clients should fetch fresh data via query endpoints.
 * This follows CQRS principle of keeping commands and queries separate.
 */
public record QuotationCommandResult(
        Long id,
        String message
) {
    public static QuotationCommandResult created(Long id) {
        return new QuotationCommandResult(id, "Quotation created successfully");
    }

    public static QuotationCommandResult updated(Long id) {
        return new QuotationCommandResult(id, "Quotation updated successfully");
    }

    public static QuotationCommandResult submitted(Long id) {
        return new QuotationCommandResult(id, "Quotation submitted for approval");
    }

    public static QuotationCommandResult versionCreated(Long id) {
        return new QuotationCommandResult(id, "New quotation version created");
    }

    public static QuotationCommandResult accepted(Long id) {
        return new QuotationCommandResult(id, "Quotation accepted by customer");
    }
}
