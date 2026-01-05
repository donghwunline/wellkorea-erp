package com.wellkorea.backend.production.api.dto.query;

/**
 * View DTO for project production summary.
 * Provides aggregated production progress for all products in a project.
 */
public record ProjectProductionSummaryView(
        Long projectId,
        String jobCode,
        int totalSheets,
        int completedSheets,
        int inProgressSheets,
        int notStartedSheets,
        int overallProgressPercentage,
        int totalSteps,
        int completedSteps
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
