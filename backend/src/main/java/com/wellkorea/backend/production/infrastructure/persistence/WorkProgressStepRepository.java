package com.wellkorea.backend.production.infrastructure.persistence;

import com.wellkorea.backend.production.domain.WorkProgressStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository for WorkProgressStep entities.
 */
public interface WorkProgressStepRepository extends JpaRepository<WorkProgressStep, Long> {

    /**
     * Find all steps for a sheet, ordered by step number.
     */
    @Query("SELECT s FROM WorkProgressStep s WHERE s.sheet.id = :sheetId ORDER BY s.stepNumber")
    List<WorkProgressStep> findBySheetIdOrderByStepNumber(@Param("sheetId") Long sheetId);

    /**
     * Find a specific step by sheet ID and step ID.
     */
    @Query("SELECT s FROM WorkProgressStep s WHERE s.sheet.id = :sheetId AND s.id = :stepId")
    Optional<WorkProgressStep> findBySheetIdAndId(@Param("sheetId") Long sheetId, @Param("stepId") Long stepId);

    /**
     * Find all outsourced steps for a project.
     */
    @Query("SELECT s FROM WorkProgressStep s WHERE s.sheet.project.id = :projectId AND s.outsourced = true")
    List<WorkProgressStep> findOutsourcedStepsByProjectId(@Param("projectId") Long projectId);

    /**
     * Count completed steps for a sheet.
     */
    @Query("SELECT COUNT(s) FROM WorkProgressStep s WHERE s.sheet.id = :sheetId AND s.status = 'COMPLETED'")
    long countCompletedBySheetId(@Param("sheetId") Long sheetId);

    /**
     * Count total steps for a sheet.
     */
    long countBySheetId(Long sheetId);
}
