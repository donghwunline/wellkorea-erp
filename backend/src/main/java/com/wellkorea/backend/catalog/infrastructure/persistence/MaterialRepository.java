package com.wellkorea.backend.catalog.infrastructure.persistence;

import com.wellkorea.backend.catalog.domain.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Material entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code MaterialMapper} (MyBatis) via {@code MaterialQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update/delete operations (inherited from JpaRepository)</li>
 *   <li>SKU uniqueness validation</li>
 * </ul>
 */
@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    /**
     * Check if material exists by SKU.
     * Used by CommandService for duplicate validation on create.
     *
     * @param sku SKU to check
     * @return true if SKU exists
     */
    boolean existsBySku(String sku);

    /**
     * Check if material exists by SKU excluding a specific ID.
     * Used by CommandService for duplicate validation on update.
     *
     * @param sku SKU to check
     * @param id  Material ID to exclude
     * @return true if SKU exists for another material
     */
    boolean existsBySkuAndIdNot(String sku, Long id);
}
