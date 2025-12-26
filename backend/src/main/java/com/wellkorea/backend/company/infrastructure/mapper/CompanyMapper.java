package com.wellkorea.backend.company.infrastructure.mapper;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.api.dto.query.CompanyRoleView;
import com.wellkorea.backend.company.api.dto.query.CompanySummaryView;
import com.wellkorea.backend.company.domain.RoleType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for company queries.
 * Eliminates N+1 queries by using explicit JOINs and batch loading for roles.
 */
@Mapper
public interface CompanyMapper {

    /**
     * Find company detail by ID with roles.
     */
    Optional<CompanyDetailView> findDetailById(@Param("id") Long id);

    /**
     * Find roles by company ID (nested select for detail view).
     */
    List<CompanyRoleView> findRolesByCompanyId(@Param("companyId") Long companyId);

    /**
     * Find companies with filters for pagination.
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
     * Batch load roles for multiple companies.
     */
    List<CompanyRoleView> findRolesByCompanyIds(@Param("companyIds") List<Long> companyIds);

    /**
     * Check if company exists and is active.
     */
    boolean existsByIdAndIsActiveTrue(@Param("id") Long id);
}
