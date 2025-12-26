package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.api.dto.query.CompanySummaryView;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for company read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 *
 * <p>Uses MyBatis for all queries with nested selects for roles.
 */
@Service
@Transactional(readOnly = true)
public class CompanyQueryService {

    private final CompanyMapper companyMapper;

    public CompanyQueryService(CompanyMapper companyMapper) {
        this.companyMapper = companyMapper;
    }

    /**
     * Get company detail by ID.
     * Returns full detail view including roles.
     *
     * @param companyId The company ID
     * @return Company detail view with roles
     * @throws ResourceNotFoundException if company not found
     */
    public CompanyDetailView getCompanyDetail(Long companyId) {
        return companyMapper.findDetailById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));
    }

    /**
     * List all companies (paginated).
     * Returns summary views optimized for list display.
     *
     * @param pageable Pagination parameters
     * @return Page of company summary views
     */
    public Page<CompanySummaryView> listCompanies(Pageable pageable) {
        List<CompanySummaryView> content = companyMapper.findWithFilters(
                null, null, pageable.getPageSize(), pageable.getOffset());
        long total = companyMapper.countWithFilters(null, null);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Find companies by name search.
     *
     * @param search   Search term
     * @param pageable Pagination parameters
     * @return Page of matching company summary views
     */
    public Page<CompanySummaryView> findBySearch(String search, Pageable pageable) {
        String searchTerm = (search == null || search.isBlank()) ? null : search.trim();
        List<CompanySummaryView> content = companyMapper.findWithFilters(
                null, searchTerm, pageable.getPageSize(), pageable.getOffset());
        long total = companyMapper.countWithFilters(null, searchTerm);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Find companies by role type.
     *
     * @param roleType The role type to filter by
     * @param pageable Pagination parameters
     * @return Page of company summary views with the specified role
     */
    public Page<CompanySummaryView> findByRoleType(RoleType roleType, Pageable pageable) {
        List<CompanySummaryView> content = companyMapper.findWithFilters(
                roleType, null, pageable.getPageSize(), pageable.getOffset());
        long total = companyMapper.countWithFilters(roleType, null);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Find companies by role type with search.
     *
     * @param roleType The role type to filter by
     * @param search   Search term
     * @param pageable Pagination parameters
     * @return Page of matching company summary views
     */
    public Page<CompanySummaryView> findByRoleTypeAndSearch(RoleType roleType, String search, Pageable pageable) {
        String searchTerm = (search == null || search.isBlank()) ? null : search.trim();
        List<CompanySummaryView> content = companyMapper.findWithFilters(
                roleType, searchTerm, pageable.getPageSize(), pageable.getOffset());
        long total = companyMapper.countWithFilters(roleType, searchTerm);
        return new PageImpl<>(content, pageable, total);
    }

    /**
     * Check if a company exists and is active.
     *
     * @param companyId The company ID
     * @return true if the company exists and is active
     */
    public boolean existsAndActive(Long companyId) {
        return companyMapper.existsByIdAndIsActiveTrue(companyId);
    }
}
