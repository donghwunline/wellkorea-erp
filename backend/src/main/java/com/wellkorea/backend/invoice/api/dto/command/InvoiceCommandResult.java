package com.wellkorea.backend.invoice.api.dto.command;

/**
 * Result DTO for invoice command operations.
 * Returns only ID + message, clients should fetch fresh data via query endpoints.
 */
public record InvoiceCommandResult(
        Long id,
        String message
) {
    public static InvoiceCommandResult created(Long id) {
        return new InvoiceCommandResult(id, "Invoice created successfully");
    }

    public static InvoiceCommandResult issued(Long id) {
        return new InvoiceCommandResult(id, "Invoice issued successfully");
    }

    public static InvoiceCommandResult cancelled(Long id) {
        return new InvoiceCommandResult(id, "Invoice cancelled successfully");
    }

    public static InvoiceCommandResult updated(Long id) {
        return new InvoiceCommandResult(id, "Invoice updated successfully");
    }
}
