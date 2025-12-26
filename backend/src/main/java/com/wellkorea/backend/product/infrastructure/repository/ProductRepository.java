package com.wellkorea.backend.product.infrastructure.repository;

import com.wellkorea.backend.product.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Product entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ProductMapper} (MyBatis) via {@code ProductQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update/delete operations (inherited from JpaRepository)</li>
 *   <li>SKU uniqueness validation</li>
 * </ul>
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Check if SKU exists.
     * Used by CommandService for duplicate validation on create.
     *
     * @param sku SKU to check
     * @return true if SKU exists
     */
    boolean existsBySku(String sku);

    /**
     * Check if SKU exists excluding a specific product.
     * Used by CommandService for duplicate validation on update.
     *
     * @param sku SKU to check
     * @param id Product ID to exclude
     * @return true if SKU exists for another product
     */
    boolean existsBySkuAndIdNot(String sku, Long id);
}
