package com.wellkorea.backend.product.infrastructure.repository;

import com.wellkorea.backend.product.domain.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for ProductType entity write operations (CQRS Command side).
 *
 * <p>For read operations, use {@code ProductMapper} (MyBatis) via {@code ProductQueryService}.
 *
 * <p>This repository provides:
 * <ul>
 *   <li>Save/update operations (inherited from JpaRepository)</li>
 *   <li>Entity lookup for FK validation (inherited findById)</li>
 * </ul>
 *
 * <p>Note: ProductType is a simple lookup entity with minimal write operations.
 * The inherited {@code findById()} method is used for FK validation during product creation/update.
 */
@Repository
public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {
    // Only inherited methods are used: findById() for FK validation
}
