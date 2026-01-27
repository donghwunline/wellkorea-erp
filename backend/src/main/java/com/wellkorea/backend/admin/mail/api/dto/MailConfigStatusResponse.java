package com.wellkorea.backend.admin.mail.api.dto;

import java.time.Instant;

/**
 * Response DTO for mail OAuth2 configuration status.
 */
public record MailConfigStatusResponse(
        boolean connected,
        String senderEmail,
        Instant connectedAt,
        Long connectedById,
        boolean microsoftConfigured
) {}
