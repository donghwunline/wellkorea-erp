package com.wellkorea.backend.company.api.dto.query;

import com.wellkorea.backend.company.domain.RoleType;

import java.time.Instant;

/**
 * View DTO for company role information.
 *
 * <p>Roles are identified by {@code roleType} (natural key) rather than a synthetic ID.
 * This aligns with the value object semantics where roles are defined by their type.
 */
public record CompanyRoleView(
        RoleType roleType,
        Instant createdAt
) {
}
