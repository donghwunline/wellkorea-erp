package com.wellkorea.erp.security.rbac;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * Role-Based Access Control authority resolver
 * Provides utility methods for checking user roles and permissions
 */
@Component("roleResolver")
public class RoleAuthorityResolver {

    /**
     * Check if user has specific role
     */
    public boolean hasRole(Authentication authentication, String role) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(roleWithPrefix));
    }

    /**
     * Check if user has any of the specified roles
     */
    public boolean hasAnyRole(Authentication authentication, String... roles) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        for (String role : roles) {
            String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            if (authorities.stream().anyMatch(auth -> auth.getAuthority().equals(roleWithPrefix))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the specified roles
     */
    public boolean hasAllRoles(Authentication authentication, String... roles) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        for (String role : roles) {
            String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            if (authorities.stream().noneMatch(auth -> auth.getAuthority().equals(roleWithPrefix))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if user is Admin
     */
    public boolean isAdmin(Authentication authentication) {
        return hasRole(authentication, "ADMIN");
    }

    /**
     * Check if user is Finance
     */
    public boolean isFinance(Authentication authentication) {
        return hasRole(authentication, "FINANCE");
    }

    /**
     * Check if user is Sales
     */
    public boolean isSales(Authentication authentication) {
        return hasRole(authentication, "SALES");
    }

    /**
     * Check if user is Production
     */
    public boolean isProduction(Authentication authentication) {
        return hasRole(authentication, "PRODUCTION");
    }

    /**
     * Check if user can access financial data (Admin or Finance)
     */
    public boolean canAccessFinancialData(Authentication authentication) {
        return hasAnyRole(authentication, "ADMIN", "FINANCE");
    }

    /**
     * Check if user can edit quotations (Admin or Finance only)
     */
    public boolean canEditQuotations(Authentication authentication) {
        return hasAnyRole(authentication, "ADMIN", "FINANCE");
    }

    /**
     * Check if user can view production data (Admin, Finance, or Production)
     */
    public boolean canViewProductionData(Authentication authentication) {
        return hasAnyRole(authentication, "ADMIN", "FINANCE", "PRODUCTION");
    }

    /**
     * Check if user can manage users (Admin only)
     */
    public boolean canManageUsers(Authentication authentication) {
        return hasRole(authentication, "ADMIN");
    }
}
