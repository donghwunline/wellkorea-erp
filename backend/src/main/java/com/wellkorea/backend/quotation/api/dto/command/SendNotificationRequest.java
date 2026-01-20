package com.wellkorea.backend.quotation.api.dto.command;

import jakarta.validation.constraints.Email;

import java.util.List;

/**
 * Request DTO for sending quotation notification with optional recipient overrides.
 */
public record SendNotificationRequest(
        @Email(message = "Invalid email format for TO recipient")
        String to,

        List<@Email(message = "Invalid email format in CC list") String> ccEmails
) {
    public SendNotificationRequest {
        // Defensive copy and null safety for CC list
        ccEmails = ccEmails != null
                ? ccEmails.stream()
                        .filter(e -> e != null && !e.isBlank())
                        .toList()
                : List.of();
    }
}
