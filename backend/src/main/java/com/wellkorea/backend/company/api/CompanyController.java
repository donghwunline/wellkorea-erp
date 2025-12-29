package com.wellkorea.backend.company.api;

import com.wellkorea.backend.company.api.dto.command.AddRoleRequest;
import com.wellkorea.backend.company.api.dto.command.CompanyCommandResult;
import com.wellkorea.backend.company.api.dto.command.CreateCompanyRequest;
import com.wellkorea.backend.company.api.dto.command.UpdateCompanyRequest;
import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.api.dto.query.CompanySummaryView;
import com.wellkorea.backend.company.application.CompanyCommandService;
import com.wellkorea.backend.company.application.CompanyQueryService;
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
 * Follows CQRS pattern - uses separate Command and Query services.
 * Command endpoints return only IDs; clients fetch fresh data via query endpoints.
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Sales: Full CRUD access
 * - Production: Read-only access
 */
@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyCommandService commandService;
    private final CompanyQueryService queryService;

    public CompanyController(CompanyCommandService commandService, CompanyQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
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

        Page<CompanySummaryView> companiesPage;

        if (roleType != null && search != null && !search.isBlank()) {
            companiesPage = queryService.findByRoleTypeAndSearch(roleType, search, pageable);
        } else if (roleType != null) {
            companiesPage = queryService.findByRoleType(roleType, pageable);
        } else if (search != null && !search.isBlank()) {
            companiesPage = queryService.findBySearch(search, pageable);
        } else {
            companiesPage = queryService.listCompanies(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(companiesPage));
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
        CompanyDetailView company = queryService.getCompanyDetail(id);
        return ResponseEntity.ok(ApiResponse.success(company));
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
     * @return Created company ID with 201 status
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<CompanyCommandResult>> createCompany(
            @Valid @RequestBody CreateCompanyRequest request) {

        Long companyId = commandService.createCompany(request.toCommand());
        CompanyCommandResult result = CompanyCommandResult.created(companyId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
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
     * @return Updated company ID
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<CompanyCommandResult>> updateCompany(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCompanyRequest request) {

        Long companyId = commandService.updateCompany(id, request.toCommand());
        CompanyCommandResult result = CompanyCommandResult.updated(companyId);

        return ResponseEntity.ok(ApiResponse.success(result));
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
        commandService.deactivateCompany(id);
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
     * @return Success message with 201 status
     */
    @PostMapping("/{id}/roles")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<CompanyCommandResult>> addRole(
            @PathVariable Long id,
            @Valid @RequestBody AddRoleRequest request) {

        commandService.addRole(id, request.toCommand());
        CompanyCommandResult result = CompanyCommandResult.roleAdded(id, request.roleType());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
    }

    /**
     * Remove a role from a company.
     * <p>
     * DELETE /api/companies/{id}/roles/{roleType}
     * <p>
     * Access: ADMIN, FINANCE, SALES
     *
     * @param id       Company ID
     * @param roleType Role type to remove (CUSTOMER, VENDOR, OUTSOURCE)
     * @return 204 No Content
     */
    @DeleteMapping("/{id}/roles/{roleType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<Void> removeRole(
            @PathVariable Long id,
            @PathVariable RoleType roleType) {

        commandService.removeRole(id, roleType);
        return ResponseEntity.noContent().build();
    }
}
