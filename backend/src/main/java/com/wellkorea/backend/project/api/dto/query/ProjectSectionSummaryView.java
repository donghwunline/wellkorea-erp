package com.wellkorea.backend.project.api.dto.query;

import java.time.Instant;

/**
 * Summary statistics for a single project section.
 * Used for tab badge counts in the project view page.
 *
 * @param section         Section identifier (quotation, process, purchase, outsource, documents, delivery, finance)
 * @param label           Display label for the section
 * @param totalCount      Total count of items in this section
 * @param pendingCount    Count of pending/in-progress items
 * @param progressPercent Optional progress percentage (0-100), null if not applicable
 * @param value           Optional monetary value (for quotation total, finance AR/AP), null if not applicable
 * @param lastUpdated     Last updated timestamp, null if no items exist
 */
public record ProjectSectionSummaryView(
        String section,
        String label,
        int totalCount,
        int pendingCount,
        Integer progressPercent,
        Long value,
        Instant lastUpdated
) {
    /**
     * Create a section summary with just counts.
     */
    public static ProjectSectionSummaryView of(String section, String label, int totalCount, int pendingCount) {
        return new ProjectSectionSummaryView(section, label, totalCount, pendingCount, null, null, null);
    }

    /**
     * Create a section summary with counts and last updated timestamp.
     */
    public static ProjectSectionSummaryView of(String section, String label, int totalCount, int pendingCount, Instant lastUpdated) {
        return new ProjectSectionSummaryView(section, label, totalCount, pendingCount, null, null, lastUpdated);
    }

    /**
     * Create a section summary with progress percentage.
     */
    public static ProjectSectionSummaryView withProgress(String section, String label, int totalCount, int pendingCount, int progressPercent, Instant lastUpdated) {
        return new ProjectSectionSummaryView(section, label, totalCount, pendingCount, progressPercent, null, lastUpdated);
    }

    /**
     * Create a section summary with monetary value.
     */
    public static ProjectSectionSummaryView withValue(String section, String label, int totalCount, int pendingCount, long value, Instant lastUpdated) {
        return new ProjectSectionSummaryView(section, label, totalCount, pendingCount, null, value, lastUpdated);
    }
}
