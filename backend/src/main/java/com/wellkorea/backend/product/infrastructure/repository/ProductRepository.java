package com.wellkorea.backend.product.infrastructure.repository;

import com.wellkorea.backend.product.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Product entity.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Find all active products.
     */
    List<Product> findByActiveTrue();

    /**
     * Find active products with pagination.
     */
    Page<Product> findByActiveTrue(Pageable pageable);

    /**
     * Find product by SKU.
     */
    Optional<Product> findBySkuAndActiveTrue(String sku);

    /**
     * Find products by product type.
     */
    @Query("SELECT p FROM Product p WHERE p.productType.id = :productTypeId AND p.active = true")
    List<Product> findByProductTypeId(@Param("productTypeId") Long productTypeId);

    /**
     * Search products by name or SKU.
     */
    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);
}
