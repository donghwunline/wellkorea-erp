package com.wellkorea.backend.project.api.dto.query;

import java.util.List;

/**
 * Full project sections summary with all section statistics.
 * Returns summary data for all tabs in the project view page.
 *
 * @param projectId Project ID
 * @param sections  List of section summaries
 */
public record ProjectSectionsSummaryView(
        Long projectId,
        List<ProjectSectionSummaryView> sections
) {
    /**
     * Create a project sections summary.
     */
    public static ProjectSectionsSummaryView of(Long projectId, List<ProjectSectionSummaryView> sections) {
        return new ProjectSectionsSummaryView(projectId, sections);
    }
}
