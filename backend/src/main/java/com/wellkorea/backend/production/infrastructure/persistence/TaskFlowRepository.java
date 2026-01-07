package com.wellkorea.backend.production.infrastructure.persistence;

import com.wellkorea.backend.production.domain.TaskFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Repository for TaskFlow entities.
 */
public interface TaskFlowRepository extends JpaRepository<TaskFlow, Long> {

    /**
     * Find task flow by project ID.
     */
    Optional<TaskFlow> findByProjectId(Long projectId);

    /**
     * Check if a task flow exists for a project.
     */
    boolean existsByProjectId(Long projectId);

    /**
     * Find task flow by project ID with nodes and edges eagerly loaded.
     */
    @Query("SELECT DISTINCT f FROM TaskFlow f " +
            "LEFT JOIN FETCH f.nodes " +
            "LEFT JOIN FETCH f.edges " +
            "WHERE f.project.id = :projectId")
    Optional<TaskFlow> findByProjectIdWithNodesAndEdges(@Param("projectId") Long projectId);

    /**
     * Find task flow by ID with nodes and edges eagerly loaded.
     */
    @Query("SELECT DISTINCT f FROM TaskFlow f " +
            "LEFT JOIN FETCH f.nodes " +
            "LEFT JOIN FETCH f.edges " +
            "WHERE f.id = :id")
    Optional<TaskFlow> findByIdWithNodesAndEdges(@Param("id") Long id);
}
