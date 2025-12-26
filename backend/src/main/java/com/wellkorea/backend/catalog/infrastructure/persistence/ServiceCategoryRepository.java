package com.wellkorea.backend.catalog.infrastructure.persistence;

import com.wellkorea.backend.catalog.domain.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for ServiceCategory entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ServiceCategoryMapper} (MyBatis) via {@code ServiceCategoryQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update/delete operations (inherited from JpaRepository)</li>
 *   <li>Name uniqueness validation</li>
 * </ul>
 */
@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    /**
     * Check if service category exists by name.
     * Used by CommandService for duplicate validation on create.
     *
     * @param name Name to check
     * @return true if name exists
     */
    boolean existsByName(String name);

    /**
     * Check if service category exists by name excluding a specific ID.
     * Used by CommandService for duplicate validation on update.
     *
     * @param name Name to check
     * @param id ServiceCategory ID to exclude
     * @return true if name exists for another category
     */
    boolean existsByNameAndIdNot(String name, Long id);
}
