package com.wellkorea.backend.company.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.api.dto.query.CompanySummaryView;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRoleRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Query service for company read operations.
 * Part of CQRS pattern - handles all read/query operations.
 * All methods are read-only and return view DTOs optimized for specific use cases.
 */
@Service
@Transactional(readOnly = true)
public class CompanyQueryService {

    private final CompanyRepository companyRepository;
    private final CompanyRoleRepository companyRoleRepository;

    public CompanyQueryService(CompanyRepository companyRepository, CompanyRoleRepository companyRoleRepository) {
        this.companyRepository = companyRepository;
        this.companyRoleRepository = companyRoleRepository;
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
        Company company = companyRepository.findByIdWithRoles(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));
        return CompanyDetailView.from(company);
    }

    /**
     * List all companies (paginated).
     * Returns summary views optimized for list display.
     *
     * @param pageable Pagination parameters
     * @return Page of company summary views
     */
    public Page<CompanySummaryView> listCompanies(Pageable pageable) {
        Page<Company> companies = companyRepository.findByIsActiveTrue(pageable);
        return companies.map(CompanySummaryView::from);
    }

    /**
     * Find companies by name search.
     *
     * @param search   Search term
     * @param pageable Pagination parameters
     * @return Page of matching company summary views
     */
    public Page<CompanySummaryView> findBySearch(String search, Pageable pageable) {
        if (search == null || search.isBlank()) {
            return listCompanies(pageable);
        }
        Page<Company> companies = companyRepository.findByNameContainingIgnoreCase(search, pageable);
        return companies.map(CompanySummaryView::from);
    }

    /**
     * Find companies by role type.
     *
     * @param roleType The role type to filter by
     * @param pageable Pagination parameters
     * @return Page of company summary views with the specified role
     */
    public Page<CompanySummaryView> findByRoleType(RoleType roleType, Pageable pageable) {
        Page<Company> companies = companyRepository.findByRoleType(roleType, pageable);
        return companies.map(CompanySummaryView::from);
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
        if (search == null || search.isBlank()) {
            return findByRoleType(roleType, pageable);
        }
        Page<Company> companies = companyRepository.findByRoleTypeAndNameContaining(roleType, search, pageable);
        return companies.map(CompanySummaryView::from);
    }

    /**
     * Check if a company exists and is active.
     *
     * @param companyId The company ID
     * @return true if the company exists and is active
     */
    public boolean existsAndActive(Long companyId) {
        return companyRepository.existsByIdAndIsActiveTrue(companyId);
    }
}
