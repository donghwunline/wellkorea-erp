package com.wellkorea.backend.project.api;

import com.wellkorea.backend.auth.application.CustomerAssignmentService;
import com.wellkorea.backend.auth.application.UserService;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.project.api.dto.CreateProjectRequest;
import com.wellkorea.backend.project.api.dto.ProjectResponse;
import com.wellkorea.backend.project.api.dto.UpdateProjectRequest;
import com.wellkorea.backend.project.application.ProjectService;
import com.wellkorea.backend.project.domain.Project;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API controller for project management.
 * Provides endpoints for CRUD operations on projects and job codes.
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Sales: Full CRUD access
 * - Production: Read-only access
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final CustomerAssignmentService customerAssignmentService;
    private final UserService userService;

    public ProjectController(
            ProjectService projectService,
            CustomerAssignmentService customerAssignmentService,
            UserService userService) {
        this.projectService = projectService;
        this.customerAssignmentService = customerAssignmentService;
        this.userService = userService;
    }

    /**
     * Create a new project with auto-generated JobCode.
     * <p>
     * POST /api/projects
     * <p>
     * Access: ADMIN, FINANCE, SALES
     *
     * @param request Create project request
     * @param currentUser Authenticated user from Spring Security
     * @return Created project with 201 status
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {

        Long currentUserId = getUserId(currentUser);
        Project project = projectService.createProject(request, currentUserId);
        ProjectResponse response = ProjectResponse.from(project);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * Get project by ID.
     * <p>
     * GET /api/projects/{id}
     * <p>
     * Access: All authenticated users
     *
     * @param id Project ID
     * @return Project details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable Long id) {
        Project project = projectService.getProject(id);
        ProjectResponse response = ProjectResponse.from(project);
        return ResponseEntity.ok(ApiResponse.success(response));
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
     * @param status Optional status filter
     * @param search Optional search term (JobCode or project name)
     * @param pageable Pagination parameters
     * @param currentUser Authenticated user from Spring Security
     * @return Paginated list of projects
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectResponse>>> listProjects(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable,
            @AuthenticationPrincipal UserDetails currentUser) {

        Page<Project> projectsPage;

        // Check if user is Sales role (needs customer filtering)
        boolean isSalesOnly = isSalesRoleOnly(currentUser);

        if (isSalesOnly) {
            Long userId = getUserId(currentUser);
            List<Long> customerIds = customerAssignmentService.getAssignedCustomerIds(userId);

            if (status != null && !status.isBlank()) {
                ProjectStatus projectStatus = ProjectStatus.fromString(status);
                if (projectStatus != null) {
                    projectsPage = projectService.listProjectsByCustomersAndStatus(
                            customerIds, projectStatus, pageable);
                } else {
                    projectsPage = projectService.listProjectsByCustomers(customerIds, pageable);
                }
            } else {
                projectsPage = projectService.listProjectsByCustomers(customerIds, pageable);
            }
        } else if (search != null && !search.isBlank()) {
            projectsPage = projectService.searchProjects(search, pageable);
        } else if (status != null && !status.isBlank()) {
            ProjectStatus projectStatus = ProjectStatus.fromString(status);
            if (projectStatus != null) {
                projectsPage = projectService.listProjectsByStatus(projectStatus, pageable);
            } else {
                projectsPage = projectService.listProjects(pageable);
            }
        } else {
            projectsPage = projectService.listProjects(pageable);
        }

        Page<ProjectResponse> responsePage = projectsPage.map(ProjectResponse::from);
        return ResponseEntity.ok(ApiResponse.success(responsePage));
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
     * @param id Project ID
     * @param request Update request
     * @param currentUser Authenticated user from Spring Security
     * @return Updated project
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {

        // Check if Sales user can access this project's customer (FR-062)
        if (isSalesRoleOnly(currentUser)) {
            Long userId = getUserId(currentUser);
            Project existingProject = projectService.getProject(id);
            List<Long> assignedCustomerIds = customerAssignmentService.getAssignedCustomerIds(userId);

            if (!assignedCustomerIds.contains(existingProject.getCustomerId())) {
                throw new AccessDeniedException("You are not authorized to update this project");
            }
        }

        Project project = projectService.updateProject(id, request);
        ProjectResponse response = ProjectResponse.from(project);
        return ResponseEntity.ok(ApiResponse.success(response));
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
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get user ID from Spring Security principal.
     * Looks up the user by username from the authenticated principal.
     *
     * @param userDetails Authenticated user details
     * @return User ID
     */
    private Long getUserId(UserDetails userDetails) {
        return userService.findByUsername(userDetails.getUsername())
                .map(user -> user.getId())
                .orElse(null);
    }

    /**
     * Check if user has only Sales role (not Admin or Finance).
     * These users need customer assignment filtering (FR-062).
     *
     * @param userDetails Authenticated user details
     * @return true if user has only Sales role
     */
    private boolean isSalesRoleOnly(UserDetails userDetails) {
        var authorities = userDetails.getAuthorities();
        boolean hasSales = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals(Role.SALES.getAuthority()));
        boolean hasAdmin = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN.getAuthority()));
        boolean hasFinance = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals(Role.FINANCE.getAuthority()));

        return hasSales && !hasAdmin && !hasFinance;
    }
}
