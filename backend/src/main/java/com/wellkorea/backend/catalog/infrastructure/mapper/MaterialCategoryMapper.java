package com.wellkorea.backend.catalog.infrastructure.mapper;

import com.wellkorea.backend.catalog.api.dto.query.MaterialCategorySummaryView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for material category queries.
 */
@Mapper
public interface MaterialCategoryMapper {

    /**
     * Find material categories with optional search.
     */
    List<MaterialCategorySummaryView> findWithFilters(@Param("search") String search,
                                                       @Param("activeOnly") boolean activeOnly,
                                                       @Param("limit") int limit,
                                                       @Param("offset") long offset);

    /**
     * Count material categories with optional search.
     */
    long countWithFilters(@Param("search") String search,
                          @Param("activeOnly") boolean activeOnly);

    /**
     * Find all active categories (for dropdown).
     */
    List<MaterialCategorySummaryView> findAllActive();

    /**
     * Find category by ID.
     */
    Optional<MaterialCategorySummaryView> findById(@Param("id") Long id);
}
