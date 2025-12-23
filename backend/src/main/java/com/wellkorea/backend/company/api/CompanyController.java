package com.wellkorea.backend.company.api;

import com.wellkorea.backend.company.api.dto.command.AddRoleRequest;
import com.wellkorea.backend.company.api.dto.command.CreateCompanyRequest;
import com.wellkorea.backend.company.api.dto.command.UpdateCompanyRequest;
import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.api.dto.query.CompanyRoleView;
import com.wellkorea.backend.company.api.dto.query.CompanySummaryView;
import com.wellkorea.backend.company.application.CompanyService;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.domain.CompanyRole;
import com.wellkorea.backend.company.domain.RoleType;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST API controller for company management.
 * Provides endpoints for CRUD operations on companies and their roles.
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Sales: Full CRUD access
 * - Production: Read-only access
 */
@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List all companies (paginated).
     * <p>
     * GET /api/companies
     * <p>
     * Access: All authenticated users
     *
     * @param roleType Optional role type filter (CUSTOMER, VENDOR, OUTSOURCE)
     * @param search   Optional search term (company name)
     * @param pageable Pagination parameters
     * @return Paginated list of companies
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CompanySummaryView>>> listCompanies(
            @RequestParam(required = false) RoleType roleType,
            @RequestParam(required = false) String search,
            Pageable pageable) {

        Page<Company> companiesPage;

        if (roleType != null && search != null && !search.isBlank()) {
            companiesPage = companyService.findByRoleTypeAndSearch(roleType, search, pageable);
        } else if (roleType != null) {
            companiesPage = companyService.findByRoleType(roleType, pageable);
        } else if (search != null && !search.isBlank()) {
            companiesPage = companyService.findBySearch(search, pageable);
        } else {
            companiesPage = companyService.findAll(pageable);
        }

        Page<CompanySummaryView> responsePage = companiesPage.map(CompanySummaryView::from);
        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    /**
     * Get company by ID.
     * <p>
     * GET /api/companies/{id}
     * <p>
     * Access: All authenticated users
     *
     * @param id Company ID
     * @return Company details with roles
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyDetailView>> getCompany(@PathVariable Long id) {
        Company company = companyService.getById(id);
        CompanyDetailView response = CompanyDetailView.from(company);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new company with initial roles.
     * <p>
     * POST /api/companies
     * <p>
     * Access: ADMIN, FINANCE, SALES
     *
     * @param request Create company request
     * @return Created company with 201 status
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<CompanyDetailView>> createCompany(
            @Valid @RequestBody CreateCompanyRequest request) {

        Company company = companyService.createCompany(request.toCommand());
        // Reload to get roles
        Company reloaded = companyService.getById(company.getId());
        CompanyDetailView response = CompanyDetailView.from(reloaded);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * Update an existing company.
     * <p>
     * PUT /api/companies/{id}
     * <p>
     * Access: ADMIN, FINANCE, SALES
     *
     * @param id      Company ID
     * @param request Update request
     * @return Updated company
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<CompanyDetailView>> updateCompany(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCompanyRequest request) {

        Company company = companyService.updateCompany(id, request.toCommand());
        CompanyDetailView response = CompanyDetailView.from(company);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Delete a company (soft delete - deactivate).
     * <p>
     * DELETE /api/companies/{id}
     * <p>
     * Access: ADMIN only
     *
     * @param id Company ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCompany(@PathVariable Long id) {
        companyService.deactivateCompany(id);
        return ResponseEntity.noContent().build();
    }

    // ========== ROLE MANAGEMENT ENDPOINTS ==========

    /**
     * Add a role to a company.
     * <p>
     * POST /api/companies/{id}/roles
     * <p>
     * Access: ADMIN, FINANCE, SALES
     *
     * @param id      Company ID
     * @param request Add role request
     * @return Created role with 201 status
     */
    @PostMapping("/{id}/roles")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<CompanyRoleView>> addRole(
            @PathVariable Long id,
            @Valid @RequestBody AddRoleRequest request) {

        CompanyRole role = companyService.addRole(id, request.toCommand());
        CompanyRoleView response = CompanyRoleView.from(role);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * Remove a role from a company.
     * <p>
     * DELETE /api/companies/{id}/roles/{roleId}
     * <p>
     * Access: ADMIN, FINANCE, SALES
     *
     * @param id     Company ID
     * @param roleId Role ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}/roles/{roleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<Void> removeRole(
            @PathVariable Long id,
            @PathVariable Long roleId) {

        companyService.removeRole(id, roleId);
        return ResponseEntity.noContent().build();
    }
}
