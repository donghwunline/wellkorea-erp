package com.wellkorea.backend.core.company.application;

import com.wellkorea.backend.core.company.domain.vo.RoleType;

/**
 * Command object for adding a role to a company.
 */
public record AddRoleCommand(
        RoleType roleType
) {
}
