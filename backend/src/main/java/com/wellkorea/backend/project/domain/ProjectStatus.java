package com.wellkorea.backend.project.domain;

/**
 * Project lifecycle status.
 * Represents the current state of a project from creation to completion.
 * <p>
 * Status transitions:
 * - DRAFT: Initial state when project is created
 * - ACTIVE: Project is in progress (quotation approved, work started)
 * - COMPLETED: All deliveries made, invoices generated
 * - ARCHIVED: Project closed and archived for historical records
 */
public enum ProjectStatus {
    /**
     * Initial draft state.
     * Project created but not yet active.
     */
    DRAFT("Draft"),

    /**
     * Active project state.
     * Quotation approved, production/delivery in progress.
     */
    ACTIVE("Active"),

    /**
     * Completed project state.
     * All work done, deliveries made, invoices generated.
     */
    COMPLETED("Completed"),

    /**
     * Archived project state.
     * Project closed and archived for historical records.
     */
    ARCHIVED("Archived");

    private final String displayName;

    ProjectStatus(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Get the human-readable display name.
     *
     * @return Display name for UI
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Parse status from string (case-insensitive).
     *
     * @param value Status string
     * @return ProjectStatus enum, or null if not found
     */
    public static ProjectStatus fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Check if this status allows editing project details.
     * Only DRAFT and ACTIVE projects can be edited.
     *
     * @return true if editing is allowed
     */
    public boolean isEditable() {
        return this == DRAFT || this == ACTIVE;
    }

    /**
     * Check if transition to the target status is allowed.
     *
     * @param target Target status
     * @return true if transition is allowed
     */
    public boolean canTransitionTo(ProjectStatus target) {
        if (target == null || target == this) {
            return false;
        }

        return switch (this) {
            case DRAFT -> target == ACTIVE || target == ARCHIVED;
            case ACTIVE -> target == COMPLETED || target == ARCHIVED;
            case COMPLETED -> target == ARCHIVED;
            case ARCHIVED -> false; // No transitions from ARCHIVED
        };
    }
}
