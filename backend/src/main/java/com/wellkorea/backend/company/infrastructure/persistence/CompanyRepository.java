package com.wellkorea.backend.company.infrastructure.persistence;

import com.wellkorea.backend.company.domain.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Company entity persistence.
 * Provides query methods for company management.
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    /**
     * Find active company by ID.
     */
    Optional<Company> findByIdAndIsActiveTrue(Long id);

    /**
     * Find active company by ID with roles eagerly loaded.
     */
    @Query("SELECT c FROM Company c LEFT JOIN FETCH c.roles WHERE c.id = :id AND c.isActive = true")
    Optional<Company> findByIdWithRoles(@Param("id") Long id);

    /**
     * Check if a registration number already exists for active companies.
     */
    boolean existsByRegistrationNumber(String registrationNumber);

    /**
     * Check if a registration number exists for active companies excluding a specific company.
     */
    boolean existsByRegistrationNumberAndIdNot(String registrationNumber, Long id);

    /**
     * Find all active companies with pagination.
     */
    Page<Company> findByIsActiveTrue(Pageable pageable);

    /**
     * Find all active companies with name containing search term.
     */
    @Query("SELECT c FROM Company c WHERE c.isActive = true AND LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Company> findByNameContainingIgnoreCase(@Param("search") String search, Pageable pageable);

    /**
     * Find companies by role type.
     */
    @Query("SELECT DISTINCT c FROM Company c JOIN c.roles r WHERE c.isActive = true AND r.roleType = :roleType")
    Page<Company> findByRoleType(@Param("roleType") com.wellkorea.backend.company.domain.RoleType roleType, Pageable pageable);

    /**
     * Find companies by role type with search.
     */
    @Query("SELECT DISTINCT c FROM Company c JOIN c.roles r " +
            "WHERE c.isActive = true AND r.roleType = :roleType " +
            "AND LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Company> findByRoleTypeAndNameContaining(
            @Param("roleType") com.wellkorea.backend.company.domain.RoleType roleType,
            @Param("search") String search,
            Pageable pageable);

    /**
     * Check if a non-deleted company exists by ID.
     */
    boolean existsByIdAndIsActiveTrue(Long id);
}
