package com.wellkorea.backend.project.api;

import com.wellkorea.backend.auth.application.CustomerAssignmentService;
import com.wellkorea.backend.auth.application.UserService;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.project.api.dto.CreateProjectRequest;
import com.wellkorea.backend.project.api.dto.ProjectResponse;
import com.wellkorea.backend.project.api.dto.UpdateProjectRequest;
import com.wellkorea.backend.project.application.ProjectService;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final JwtTokenProvider jwtTokenProvider;

    public ProjectController(
            ProjectService projectService,
            CustomerAssignmentService customerAssignmentService,
            UserService userService,
            JwtTokenProvider jwtTokenProvider) {
        this.projectService = projectService;
        this.customerAssignmentService = customerAssignmentService;
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Create a new project with auto-generated JobCode.
     * <p>
     * POST /api/projects
     * <p>
     * Access: ADMIN, FINANCE, SALES
     *
     * @param request Create project request
     * @return Created project with 201 status
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            HttpServletRequest httpRequest) {

        Long currentUserId = getCurrentUserId(httpRequest);
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
     * @return Paginated list of projects
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectResponse>>> listProjects(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable,
            HttpServletRequest httpRequest) {

        Page<Project> projectsPage;

        // Check if user is Sales role (needs customer filtering)
        String roles = getCurrentUserRoles(httpRequest);
        boolean isSalesOnly = roles != null && roles.contains(Role.SALES.getAuthority())
                && !roles.contains(Role.ADMIN.getAuthority())
                && !roles.contains(Role.FINANCE.getAuthority());

        if (isSalesOnly) {
            Long userId = getCurrentUserId(httpRequest);
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
     * Note: JobCode cannot be changed
     *
     * @param id Project ID
     * @param request Update request
     * @return Updated project
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request) {

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
     * Extract current user ID from JWT token.
     */
    private Long getCurrentUserId(HttpServletRequest request) {
        String token = extractToken(request);
        if (token != null) {
            String username = jwtTokenProvider.getUsername(token);
            return userService.findByUsername(username)
                    .map(user -> user.getId())
                    .orElse(null);
        }
        return null;
    }

    /**
     * Extract current user roles from JWT token.
     */
    private String getCurrentUserRoles(HttpServletRequest request) {
        String token = extractToken(request);
        if (token != null) {
            return jwtTokenProvider.getRoles(token);
        }
        return null;
    }

    /**
     * Extract JWT token from Authorization header.
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
