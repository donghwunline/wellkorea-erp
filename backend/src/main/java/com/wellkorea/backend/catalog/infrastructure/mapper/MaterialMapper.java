package com.wellkorea.backend.catalog.infrastructure.mapper;

import com.wellkorea.backend.catalog.api.dto.query.MaterialDetailView;
import com.wellkorea.backend.catalog.api.dto.query.MaterialSummaryView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for material queries.
 */
@Mapper
public interface MaterialMapper {

    /**
     * Find materials with optional filters.
     *
     * @param categoryId Optional category filter
     * @param search     Optional search term for name/sku
     * @param activeOnly Only include active materials
     * @param limit      Page size
     * @param offset     Starting offset
     * @return List of material summaries
     */
    List<MaterialSummaryView> findWithFilters(@Param("categoryId") Long categoryId,
                                               @Param("search") String search,
                                               @Param("activeOnly") boolean activeOnly,
                                               @Param("limit") int limit,
                                               @Param("offset") long offset);

    /**
     * Count materials with optional filters.
     */
    long countWithFilters(@Param("categoryId") Long categoryId,
                          @Param("search") String search,
                          @Param("activeOnly") boolean activeOnly);

    /**
     * Find all active materials (for dropdown).
     */
    List<MaterialSummaryView> findAllActive();

    /**
     * Find material by ID.
     */
    Optional<MaterialDetailView> findById(@Param("id") Long id);
}
