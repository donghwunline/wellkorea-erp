package com.wellkorea.backend.production.api.dto.query;

/**
 * View DTO for project production summary.
 * Provides aggregated production progress for all products in a project.
 */
public record ProjectProductionSummaryView(
        Long projectId,
        String jobCode,
        Integer totalSheets,
        Integer completedSheets,
        Integer inProgressSheets,
        Integer notStartedSheets,
        Integer overallProgressPercentage,
        Integer totalSteps,
        Integer completedSteps
) {
    public static ProjectProductionSummaryView empty(Long projectId) {
        return new ProjectProductionSummaryView(
                projectId,
                null,
                0,
                0,
                0,
                0,
                0,
                0,
                0
        );
    }
}
