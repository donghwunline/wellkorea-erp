package com.wellkorea.backend.product.infrastructure.mapper;

import com.wellkorea.backend.product.api.dto.query.ProductDetailView;
import com.wellkorea.backend.product.api.dto.query.ProductSummaryView;
import com.wellkorea.backend.product.api.dto.query.ProductTypeView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for product queries.
 * Eliminates N+1 queries by using explicit JOINs for ProductType.
 */
@Mapper
public interface ProductMapper {

    /**
     * Find product detail by ID with product type name resolved.
     */
    Optional<ProductDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find products with filters for pagination.
     */
    List<ProductSummaryView> findWithFilters(
            @Param("productTypeId") Long productTypeId,
            @Param("search") String search,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count products with filters for pagination.
     */
    long countWithFilters(
            @Param("productTypeId") Long productTypeId,
            @Param("search") String search);

    /**
     * Check if product exists and is active.
     */
    boolean existsByIdAndActiveTrue(@Param("id") Long id);

    /**
     * Find all product types.
     */
    List<ProductTypeView> findAllProductTypes();

    /**
     * Find product type by ID.
     */
    Optional<ProductTypeView> findProductTypeById(@Param("id") Long id);
}
