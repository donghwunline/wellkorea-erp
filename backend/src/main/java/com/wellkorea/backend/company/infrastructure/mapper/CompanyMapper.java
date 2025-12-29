package com.wellkorea.backend.company.infrastructure.mapper;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.api.dto.query.CompanySummaryView;
import com.wellkorea.backend.company.domain.RoleType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for company queries.
 * Uses JOIN queries to load companies with their roles in a single query.
 *
 * <p>All role loading is done via LEFT JOIN - no nested selects or batch loading needed
 * since companies have at most 5 roles (minimal row duplication).
 */
@Mapper
public interface CompanyMapper {

    /**
     * Find company detail by ID with roles.
     * Uses single JOIN query (no nested selects).
     */
    Optional<CompanyDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find companies with filters for pagination.
     * Uses single JOIN query to include roles.
     *
     * <p>When filtering by roleType, only companies with that role are returned,
     * but ALL roles for those companies are included in the result.
     *
     * @param roleType Optional role type filter
     * @param search   Optional search term for name
     * @param limit    Page size
     * @param offset   Page offset
     * @return List of company summaries with roles
     */
    List<CompanySummaryView> findWithFilters(
            @Param("roleType") RoleType roleType,
            @Param("search") String search,
            @Param("limit") int limit,
            @Param("offset") long offset);

    /**
     * Count companies with filters for pagination.
     */
    long countWithFilters(
            @Param("roleType") RoleType roleType,
            @Param("search") String search);

    /**
     * Check if company exists and is active.
     */
    boolean existsByIdAndIsActiveTrue(@Param("id") Long id);
}
