package com.wellkorea.backend.company.api.dto.command;

import com.wellkorea.backend.company.domain.vo.RoleType;

/**
 * Result of a company command operation.
 * Returns only the entity ID - clients should fetch fresh data via query endpoints.
 * This follows CQRS principle of keeping commands and queries separate.
 */
public record CompanyCommandResult(
        Long id,
        String message
) {
    public static CompanyCommandResult created(Long id) {
        return new CompanyCommandResult(id, "Company created successfully");
    }

    public static CompanyCommandResult updated(Long id) {
        return new CompanyCommandResult(id, "Company updated successfully");
    }

    public static CompanyCommandResult roleAdded(Long id, RoleType roleType) {
        return new CompanyCommandResult(id, "Role " + roleType + " added successfully");
    }

    public static CompanyCommandResult roleRemoved(Long id, RoleType roleType) {
        return new CompanyCommandResult(id, "Role " + roleType + " removed successfully");
    }
}
