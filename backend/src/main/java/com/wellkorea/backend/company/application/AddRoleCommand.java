package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.domain.vo.RoleType;

/**
 * Command object for adding a role to a company.
 */
public record AddRoleCommand(
        RoleType roleType
) {
}
