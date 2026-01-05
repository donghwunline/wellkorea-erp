package com.wellkorea.backend.production.infrastructure.persistence;

import com.wellkorea.backend.production.domain.SheetStatus;
import com.wellkorea.backend.production.domain.WorkProgressSheet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository for WorkProgressSheet entities.
 */
public interface WorkProgressSheetRepository extends JpaRepository<WorkProgressSheet, Long> {

    /**
     * Find all sheets for a project, ordered by sequence.
     */
    @Query("SELECT s FROM WorkProgressSheet s WHERE s.project.id = :projectId ORDER BY s.sequence")
    List<WorkProgressSheet> findByProjectIdOrderBySequence(@Param("projectId") Long projectId);

    /**
     * Find sheets by project ID with pagination.
     */
    Page<WorkProgressSheet> findByProjectId(Long projectId, Pageable pageable);

    /**
     * Find a sheet by project ID and product ID.
     */
    Optional<WorkProgressSheet> findByProjectIdAndProductId(Long projectId, Long productId);

    /**
     * Check if a sheet exists for project-product combination.
     */
    boolean existsByProjectIdAndProductId(Long projectId, Long productId);

    /**
     * Count sheets by project ID.
     */
    long countByProjectId(Long projectId);

    /**
     * Count sheets by project ID and status.
     */
    long countByProjectIdAndStatus(Long projectId, SheetStatus status);

    /**
     * Find sheets by status.
     */
    List<WorkProgressSheet> findByStatus(SheetStatus status);

    /**
     * Find sheet with steps eagerly loaded.
     */
    @Query("SELECT DISTINCT s FROM WorkProgressSheet s " +
            "LEFT JOIN FETCH s.steps " +
            "WHERE s.id = :id")
    Optional<WorkProgressSheet> findByIdWithSteps(@Param("id") Long id);

    /**
     * Find all sheets for a project with steps eagerly loaded.
     */
    @Query("SELECT DISTINCT s FROM WorkProgressSheet s " +
            "LEFT JOIN FETCH s.steps " +
            "WHERE s.project.id = :projectId " +
            "ORDER BY s.sequence")
    List<WorkProgressSheet> findByProjectIdWithSteps(@Param("projectId") Long projectId);

    /**
     * Get next sequence number for a project.
     */
    @Query("SELECT COALESCE(MAX(s.sequence), 0) + 1 FROM WorkProgressSheet s WHERE s.project.id = :projectId")
    int getNextSequence(@Param("projectId") Long projectId);
}
