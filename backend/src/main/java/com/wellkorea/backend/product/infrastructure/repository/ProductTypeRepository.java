package com.wellkorea.backend.product.infrastructure.repository;

import com.wellkorea.backend.product.domain.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for ProductType entity.
 */
@Repository
public interface ProductTypeRepository extends JpaRepository<ProductType, Long> {

    /**
     * Find product type by name.
     */
    Optional<ProductType> findByName(String name);

    /**
     * Check if product type exists by name.
     */
    boolean existsByName(String name);

    /**
     * Check if product type exists by name excluding a specific ID.
     */
    boolean existsByNameAndIdNot(String name, Long id);
}
