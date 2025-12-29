package com.wellkorea.backend.project.infrastructure.repository;

import com.wellkorea.backend.project.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Project entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ProjectMapper} (MyBatis) via {@code ProjectQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update/delete operations (inherited from JpaRepository)</li>
 *   <li>Entity lookup for modification</li>
 * </ul>
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /**
     * Find project by ID, excluding soft-deleted.
     * Used by CommandService to load entity for update/delete operations.
     *
     * @param id Project ID
     * @return Optional containing the project if found and not deleted
     */
    Optional<Project> findByIdAndIsDeletedFalse(Long id);
}
