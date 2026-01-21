package com.wellkorea.backend.purchasing.api.dto.command;

import jakarta.validation.constraints.Email;

import java.util.List;

/**
 * Request DTO for sending purchase order to vendor.
 * All fields are optional - if not provided, defaults will be used.
 */
public record SendPurchaseOrderRequest(
        @Email(message = "Invalid email format")
        String to,           // Optional - vendor email override

        List<@Email(message = "Invalid CC email format") String> ccEmails // Optional - CC recipients
) {
    /**
     * Create an empty request (use vendor's default email).
     */
    public static SendPurchaseOrderRequest empty() {
        return new SendPurchaseOrderRequest(null, null);
    }
}
