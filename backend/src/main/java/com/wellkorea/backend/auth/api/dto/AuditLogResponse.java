package com.wellkorea.backend.auth.api.dto;

import java.time.Instant;

/**
 * Response DTO for audit log entries.
 * Used by AuditService for read operations.
 */
public record AuditLogResponse(
        Long id,
        String entityType,
        Long entityId,
        String action,
        Long userId,
        String username,
        String ipAddress,
        String changes,
        String metadata,
        Instant createdAt
) {
}
