package com.wellkorea.backend.production.infrastructure.persistence;

import com.wellkorea.backend.production.domain.TaskFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Repository for TaskFlow aggregate root.
 * Element collections (nodes, edges) are loaded lazily by default.
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
     * Find task flow by project ID.
     * Note: Element collections are loaded lazily. Access them within transaction.
     */
    @Query("SELECT f FROM TaskFlow f WHERE f.project.id = :projectId")
    Optional<TaskFlow> findByProjectIdWithCollections(@Param("projectId") Long projectId);
}
