package com.wellkorea.backend.project.infrastructure.repository;

import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Project entity persistence.
 * Provides CRUD operations and custom queries for projects.
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /**
     * Find project by JobCode.
     *
     * @param jobCode Unique business identifier
     * @return Optional containing the project if found
     */
    Optional<Project> findByJobCode(String jobCode);

    /**
     * Find project by ID, excluding soft-deleted.
     *
     * @param id Project ID
     * @return Optional containing the project if found and not deleted
     */
    Optional<Project> findByIdAndIsDeletedFalse(Long id);

    /**
     * Find all projects, excluding soft-deleted (paginated).
     *
     * @param pageable Pagination parameters
     * @return Page of projects
     */
    Page<Project> findByIsDeletedFalse(Pageable pageable);

    /**
     * Find projects by status, excluding soft-deleted (paginated).
     *
     * @param status Project status filter
     * @param pageable Pagination parameters
     * @return Page of projects matching the status
     */
    Page<Project> findByStatusAndIsDeletedFalse(ProjectStatus status, Pageable pageable);

    /**
     * Find projects by customer ID, excluding soft-deleted (paginated).
     *
     * @param customerId Customer ID
     * @param pageable Pagination parameters
     * @return Page of projects for the customer
     */
    Page<Project> findByCustomerIdAndIsDeletedFalse(Long customerId, Pageable pageable);

    /**
     * Find projects by internal owner ID, excluding soft-deleted (paginated).
     *
     * @param internalOwnerId Internal owner (user) ID
     * @param pageable Pagination parameters
     * @return Page of projects assigned to the owner
     */
    Page<Project> findByInternalOwnerIdAndIsDeletedFalse(Long internalOwnerId, Pageable pageable);

    /**
     * Find projects by customer IDs (for Sales role filtering).
     *
     * @param customerIds List of customer IDs
     * @param pageable Pagination parameters
     * @return Page of projects for the specified customers
     */
    Page<Project> findByCustomerIdInAndIsDeletedFalse(List<Long> customerIds, Pageable pageable);

    /**
     * Find projects by customer IDs and status (for Sales role filtering with status).
     *
     * @param customerIds List of customer IDs
     * @param status Project status filter
     * @param pageable Pagination parameters
     * @return Page of projects matching filters
     */
    Page<Project> findByCustomerIdInAndStatusAndIsDeletedFalse(
            List<Long> customerIds, ProjectStatus status, Pageable pageable);

    /**
     * Search projects by JobCode or project name (case-insensitive).
     *
     * @param searchTerm Search term for JobCode or project name
     * @param pageable Pagination parameters
     * @return Page of projects matching the search term
     */
    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND " +
           "(LOWER(p.jobCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.projectName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Project> searchByJobCodeOrProjectName(
            @Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Check if JobCode already exists.
     *
     * @param jobCode JobCode to check
     * @return true if JobCode exists
     */
    boolean existsByJobCode(String jobCode);

    /**
     * Count active projects by customer.
     *
     * @param customerId Customer ID
     * @return Count of active projects
     */
    @Query("SELECT COUNT(p) FROM Project p WHERE p.customerId = :customerId " +
           "AND p.status IN ('DRAFT', 'ACTIVE') AND p.isDeleted = false")
    long countActiveProjectsByCustomer(@Param("customerId") Long customerId);
}
