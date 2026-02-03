package com.wellkorea.backend.core.company.application;

import com.wellkorea.backend.core.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.core.company.api.dto.query.CompanySummaryView;
import com.wellkorea.backend.core.company.domain.vo.RoleType;
import com.wellkorea.backend.core.company.infrastructure.mapper.CompanyMapper;
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
 * <p>Uses single JOIN queries to load companies with roles efficiently.
 * Since companies have at most 5 roles, JOINs are more efficient than
 * batch loading (1 query vs 2 queries).
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
        return findCompanies((List<RoleType>) null, null, pageable);
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
        return findCompanies((List<RoleType>) null, searchTerm, pageable);
    }

    /**
     * Find companies by multiple role types.
     * Returns companies that have at least one of the specified roles.
     *
     * @param roleTypes List of role types to filter by
     * @param search    Optional search term
     * @param pageable  Pagination parameters
     * @return Page of company summary views with at least one of the specified roles
     */
    public Page<CompanySummaryView> findByRoleTypes(List<RoleType> roleTypes, String search, Pageable pageable) {
        String searchTerm = (search == null || search.isBlank()) ? null : search.trim();
        return findCompanies(roleTypes, searchTerm, pageable);
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

    /**
     * Find companies with filters using single JOIN query.
     * MyBatis handles the collection grouping automatically.
     */
    private Page<CompanySummaryView> findCompanies(List<RoleType> roleTypes, String search, Pageable pageable) {

        List<CompanySummaryView> content = companyMapper.findWithFilters(
                roleTypes, search, pageable.getPageSize(), pageable.getOffset());

        long total = companyMapper.countWithFilters(roleTypes, search);
        return new PageImpl<>(content, pageable, total);
    }
}
