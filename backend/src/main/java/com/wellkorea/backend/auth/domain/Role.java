package com.wellkorea.backend.auth.domain;

/**
 * User roles for role-based access control (RBAC).
 * Defines all available roles in the WellKorea ERP system.
 * <p>
 * Each role has a Spring Security authority string and description.
 * Roles are stored in JWT tokens and used for authorization decisions.
 */
public enum Role {
    /**
     * Administrator - Full system access.
     * Can manage all modules, users, and system configuration.
     */
    ADMIN("ROLE_ADMIN", "Administrator"),

    /**
     * Finance - Quotations, invoices, and financial reports.
     * Can create/approve quotations, generate invoices, view financial data.
     */
    FINANCE("ROLE_FINANCE", "Finance Manager"),

    /**
     * Production - Work progress tracking and manufacturing.
     * Can update production status, manage work orders, track manufacturing steps.
     */
    PRODUCTION("ROLE_PRODUCTION", "Production Manager"),

    /**
     * Sales - Customer quotations and order management.
     * Can view customer-specific quotations, create orders, track deliveries.
     */
    SALES("ROLE_SALES", "Sales Representative");

    private final String authority;
    private final String displayName;

    Role(String authority, String displayName) {
        this.authority = authority;
        this.displayName = displayName;
    }

    /**
     * Get the Spring Security authority string.
     * Used in SecurityContext and @PreAuthorize annotations.
     *
     * @return Authority string (e.g., "ROLE_ADMIN")
     */
    public String getAuthority() {
        return authority;
    }

    /**
     * Get the human-readable role name.
     * Used for UI display.
     *
     * @return Display name (e.g., "Administrator")
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Parse role from authority string.
     * Used when deserializing JWT tokens.
     *
     * @param authority Spring Security authority string (e.g., "ROLE_ADMIN")
     * @return Role enum, or null if not found
     */
    public static Role fromAuthority(String authority) {
        if (authority == null || authority.isBlank()) {
            return null;
        }

        for (Role role : values()) {
            if (authority.equals(role.authority)) {
                return role;
            }
        }

        return null;
    }

    /**
     * Parse role from name (case-insensitive).
     * Used for configuration and test fixtures.
     *
     * @param name Role name (e.g., "ADMIN", "admin")
     * @return Role enum, or null if not found
     */
    public static Role fromName(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }

        try {
            return valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Override
    public String toString() {
        return authority;
    }
}
