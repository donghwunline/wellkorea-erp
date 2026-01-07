package com.wellkorea.backend.production.infrastructure.persistence;

import com.wellkorea.backend.production.domain.TaskFlow;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
