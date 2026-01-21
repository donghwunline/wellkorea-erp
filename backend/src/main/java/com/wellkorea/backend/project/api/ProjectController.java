package com.wellkorea.backend.project.api;

import com.wellkorea.backend.auth.application.CustomerAssignmentService;
import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.project.api.dto.CreateProjectRequest;
import com.wellkorea.backend.project.api.dto.UpdateProjectRequest;
import com.wellkorea.backend.project.api.dto.command.ProjectCommandResult;
import com.wellkorea.backend.project.api.dto.query.ProjectDetailView;
import com.wellkorea.backend.project.api.dto.query.ProjectKPIView;
import com.wellkorea.backend.project.api.dto.query.ProjectSectionsSummaryView;
import com.wellkorea.backend.project.api.dto.query.ProjectSummaryView;
import com.wellkorea.backend.project.application.ProjectCommandService;
import com.wellkorea.backend.project.application.ProjectCommandService.CreateProjectResult;
import com.wellkorea.backend.project.application.ProjectQueryService;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API controller for project management.
 * Follows CQRS pattern with separate query and command services.
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Sales: Full CRUD access
 * - Production: Read-only access
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectQueryService queryService;
    private final ProjectCommandService commandService;
    private final CustomerAssignmentService customerAssignmentService;

    public ProjectController(
            ProjectQueryService queryService,
            ProjectCommandService commandService,
            CustomerAssignmentService customerAssignmentService
    ) {
        this.queryService = queryService;
        this.commandService = commandService;
        this.customerAssignmentService = customerAssignmentService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * Get project by ID.
     * <p>
     * GET /api/projects/{id}
     * <p>
     * Access: All authenticated users
     *
     * @param id Project ID
     * @return Project detail view with resolved names
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDetailView>> getProject(@PathVariable Long id) {
        ProjectDetailView detail = queryService.getProjectDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    /**
     * List all projects (paginated).
     * <p>
     * GET /api/projects
     * <p>
     * Access: All authenticated users
     * - Sales users only see projects for their assigned customers (FR-062)
     * - Other roles see all projects
     *
     * @param status      Optional status filter
     * @param search      Optional search term (JobCode or project name)
     * @param pageable    Pagination parameters
     * @param currentUser Authenticated user from Spring Security
     * @return Paginated list of project summary views
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectSummaryView>>> listProjects(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        Page<ProjectSummaryView> projectsPage;

        // Check if user is Sales role (needs customer filtering)
        boolean isSalesOnly = isSalesRoleOnly(currentUser);

        if (isSalesOnly) {
            Long userId = currentUser.getUserId();
            List<Long> customerIds = customerAssignmentService.getAssignedCustomerIds(userId);

            if (status != null && !status.isBlank()) {
                ProjectStatus projectStatus = ProjectStatus.fromString(status);
                if (projectStatus != null) {
                    projectsPage = queryService.listProjectsByCustomersAndStatus(
                            customerIds, projectStatus, pageable);
                } else {
                    projectsPage = queryService.listProjectsByCustomers(customerIds, pageable);
                }
            } else {
                projectsPage = queryService.listProjectsByCustomers(customerIds, pageable);
            }
        } else if (search != null && !search.isBlank()) {
            projectsPage = queryService.searchProjects(search, pageable);
        } else if (status != null && !status.isBlank()) {
            ProjectStatus projectStatus = ProjectStatus.fromString(status);
            if (projectStatus != null) {
                projectsPage = queryService.listProjectsByStatus(projectStatus, pageable);
            } else {
                projectsPage = queryService.listProjects(pageable);
            }
        } else {
            projectsPage = queryService.listProjects(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(projectsPage));
    }

    /**
     * Get project sections summary for tab badge counts.
     * <p>
     * GET /api/projects/{id}/summary
     * <p>
     * Access: All authenticated users
     *
     * @param id Project ID
     * @return Project sections summary with counts for each tab
     */
    @GetMapping("/{id}/summary")
    public ResponseEntity<ApiResponse<ProjectSectionsSummaryView>> getProjectSummary(@PathVariable Long id) {
        ProjectSectionsSummaryView summary = queryService.getProjectSummary(id);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * Get project KPIs for the dashboard strip.
     * <p>
     * GET /api/projects/{id}/kpi
     * <p>
     * Access: All authenticated users
     *
     * @param id Project ID
     * @return Project KPIs (progress, pending approvals, accounts receivable, invoiced amount)
     */
    @GetMapping("/{id}/kpi")
    public ResponseEntity<ApiResponse<ProjectKPIView>> getProjectKPI(@PathVariable Long id) {
        ProjectKPIView kpi = queryService.getProjectKPI(id);
        return ResponseEntity.ok(ApiResponse.success(kpi));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new project with auto-generated JobCode.
     * <p>
     * POST /api/projects
     * <p>
     * Access: ADMIN, FINANCE, SALES
     *
     * @param request     Create project request
     * @param currentUser Authenticated user from Spring Security
     * @return Command result with created project ID
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ProjectCommandResult>> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        Long currentUserId = currentUser.getUserId();
        CreateProjectResult createResult = commandService.createProject(request, currentUserId);
        ProjectCommandResult result = ProjectCommandResult.created(createResult.id(), createResult.jobCode());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
    }

    /**
     * Update an existing project.
     * <p>
     * PUT /api/projects/{id}
     * <p>
     * Access: ADMIN, FINANCE, SALES
     * - Sales users can only update projects for their assigned customers (FR-062)
     * Note: JobCode cannot be changed
     *
     * @param id          Project ID
     * @param request     Update request
     * @param currentUser Authenticated user from Spring Security
     * @return Command result with updated project ID
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ProjectCommandResult>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        // Check if Sales user can access this project's customer (FR-062)
        if (isSalesRoleOnly(currentUser)) {
            Long userId = currentUser.getUserId();
            ProjectDetailView existingProject = queryService.getProjectDetail(id);
            List<Long> assignedCustomerIds = customerAssignmentService.getAssignedCustomerIds(userId);

            if (!assignedCustomerIds.contains(existingProject.customerId())) {
                throw new AccessDeniedException("You are not authorized to update this project");
            }
        }

        Long projectId = commandService.updateProject(id, request);
        ProjectCommandResult result = ProjectCommandResult.updated(projectId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Delete a project (soft delete).
     * <p>
     * DELETE /api/projects/{id}
     * <p>
     * Access: ADMIN only
     *
     * @param id Project ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        commandService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // ========== HELPER METHODS ==========

    /**
     * Check if user has only Sales role (not Admin or Finance).
     * These users need customer assignment filtering (FR-062).
     *
     * @param currentUser Authenticated user
     * @return true if user has only Sales role
     */
    private boolean isSalesRoleOnly(AuthenticatedUser currentUser) {
        var authorities = currentUser.getAuthorities();
        boolean hasSales = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals(Role.SALES.getAuthority()));
        boolean hasAdmin = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN.getAuthority()));
        boolean hasFinance = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals(Role.FINANCE.getAuthority()));

        return hasSales && !hasAdmin && !hasFinance;
    }
}
