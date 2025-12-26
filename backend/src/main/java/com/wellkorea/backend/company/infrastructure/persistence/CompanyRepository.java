package com.wellkorea.backend.company.infrastructure.persistence;

import com.wellkorea.backend.company.domain.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Company entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code CompanyMapper} (MyBatis) via {@code CompanyQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update/delete operations (inherited from JpaRepository)</li>
 *   <li>Entity lookup for modification</li>
 *   <li>Registration number uniqueness validation</li>
 *   <li>Existence checks for FK validation</li>
 * </ul>
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    /**
     * Find active company by ID.
     * Used by CommandService to load entity for update/deactivate operations.
     *
     * @param id Company ID
     * @return Optional containing the company if found and active
     */
    Optional<Company> findByIdAndIsActiveTrue(Long id);

    /**
     * Check if a registration number already exists.
     * Used by CommandService for duplicate validation on create.
     *
     * @param registrationNumber Registration number to check
     * @return true if registration number exists
     */
    boolean existsByRegistrationNumber(String registrationNumber);

    /**
     * Check if a registration number exists excluding a specific company.
     * Used by CommandService for duplicate validation on update.
     *
     * @param registrationNumber Registration number to check
     * @param id                 Company ID to exclude
     * @return true if registration number exists for another company
     */
    boolean existsByRegistrationNumberAndIdNot(String registrationNumber, Long id);

    /**
     * Check if an active company exists by ID.
     * Used by ProjectCommandService for customer FK validation.
     *
     * @param id Company ID
     * @return true if active company exists
     */
    boolean existsByIdAndIsActiveTrue(Long id);
}
