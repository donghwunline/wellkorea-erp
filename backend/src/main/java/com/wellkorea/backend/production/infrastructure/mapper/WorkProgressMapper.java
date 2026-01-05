package com.wellkorea.backend.production.infrastructure.mapper;

import com.wellkorea.backend.production.api.dto.query.ProjectProductionSummaryView;
import com.wellkorea.backend.production.api.dto.query.WorkProgressSheetView;
import com.wellkorea.backend.production.api.dto.query.WorkProgressStepView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for work progress queries.
 * Handles all read operations for work progress sheets and steps with optimized JOINs.
 *
 * <p>This mapper eliminates N+1 queries by using explicit JOINs and nested result mapping.
 */
@Mapper
public interface WorkProgressMapper {

    /**
     * Find all work progress sheets across all projects (paginated).
     *
     * @param limit  Maximum number of results
     * @param offset Starting offset
     * @return List of WorkProgressSheetView with aggregated progress
     */
    List<WorkProgressSheetView> findAllSheets(@Param("limit") int limit, @Param("offset") long offset);

    /**
     * Count total work progress sheets across all projects.
     *
     * @return Total count
     */
    long countAllSheets();

    /**
     * Find all work progress sheets for a project (paginated).
     * Returns sheets with progress stats (without individual step details).
     *
     * @param projectId The project ID
     * @param limit     Maximum number of results
     * @param offset    Starting offset
     * @return List of WorkProgressSheetView with aggregated progress
     */
    List<WorkProgressSheetView> findSheetsByProjectId(
            @Param("projectId") Long projectId,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count total work progress sheets for a project.
     *
     * @param projectId The project ID
     * @return Total count
     */
    long countSheetsByProjectId(@Param("projectId") Long projectId);

    /**
     * Find work progress sheet by ID (without steps).
     *
     * @param id The sheet ID
     * @return WorkProgressSheetView without step details
     */
    Optional<WorkProgressSheetView> findSheetById(@Param("id") Long id);

    /**
     * Find all steps for a sheet.
     *
     * @param sheetId The sheet ID
     * @return List of WorkProgressStepView
     */
    List<WorkProgressStepView> findStepsBySheetId(@Param("id") Long sheetId);

    /**
     * Find a specific step by sheet ID and step ID.
     *
     * @param sheetId The sheet ID
     * @param stepId  The step ID
     * @return WorkProgressStepView
     */
    Optional<WorkProgressStepView> findStepBySheetIdAndId(
            @Param("sheetId") Long sheetId,
            @Param("stepId") Long stepId);

    /**
     * Get project production summary with aggregated progress.
     *
     * @param projectId The project ID
     * @return ProjectProductionSummaryView with aggregated stats
     */
    Optional<ProjectProductionSummaryView> findProjectSummary(@Param("projectId") Long projectId);

    /**
     * Find all outsourced steps for a project.
     *
     * @param projectId The project ID
     * @return List of outsourced WorkProgressStepView
     */
    List<WorkProgressStepView> findOutsourcedStepsByProjectId(@Param("projectId") Long projectId);
}
