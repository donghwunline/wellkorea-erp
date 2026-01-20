package com.wellkorea.backend.company.api.dto.command;

import com.wellkorea.backend.company.application.AddRoleCommand;
import com.wellkorea.backend.company.domain.RoleType;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for adding a role to a company.
 */
public record AddRoleRequest(
        @NotNull(message = "Role type is required")
        RoleType roleType
) {
    /**
     * Convert to command object.
     */
    public AddRoleCommand toCommand() {
        return new AddRoleCommand(roleType);
    }
}
