package com.wellkorea.backend.company.api.dto.command;

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

    public static CompanyCommandResult roleAdded(Long roleId) {
        return new CompanyCommandResult(roleId, "Role added successfully");
    }

    public static CompanyCommandResult roleRemoved(Long roleId) {
        return new CompanyCommandResult(roleId, "Role removed successfully");
    }
}
