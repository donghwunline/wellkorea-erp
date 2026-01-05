package com.wellkorea.backend.production.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.production.api.dto.command.CreateWorkProgressSheetRequest;
import com.wellkorea.backend.production.api.dto.command.UpdateStepStatusRequest;
import com.wellkorea.backend.production.api.dto.command.WorkProgressCommandResult;
import com.wellkorea.backend.production.api.dto.query.ProjectProductionSummaryView;
import com.wellkorea.backend.production.api.dto.query.WorkProgressSheetView;
import com.wellkorea.backend.production.api.dto.query.WorkProgressStepView;
import com.wellkorea.backend.production.application.WorkProgressCommandService;
import com.wellkorea.backend.production.application.WorkProgressQueryService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for work progress management.
 * <p>
 * RBAC Rules:
 * - Production: Full CRUD access (primary users)
 * - Admin, Finance: Full read access, write access
 * - Sales: Read-only access (view production status)
 */
@RestController
@RequestMapping("/api/work-progress")
public class WorkProgressController {

    private final WorkProgressCommandService commandService;
    private final WorkProgressQueryService queryService;

    public WorkProgressController(WorkProgressCommandService commandService,
                                  WorkProgressQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * Get work progress sheets (paginated).
     * <p>
     * If projectId is provided, returns sheets for that project only.
     * If projectId is not provided, returns all sheets across all projects.
     *
     * @param projectId Optional project ID to filter by
     * @param pageable  Pagination parameters (page, size, sort)
     * @return Paginated list of work progress sheets
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION', 'SALES')")
    public ResponseEntity<ApiResponse<Page<WorkProgressSheetView>>> getSheets(@RequestParam(required = false) Long projectId,
                                                                              Pageable pageable) {
        Page<WorkProgressSheetView> sheets = queryService.getSheets(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.success(sheets));
    }

    /**
     * Get a work progress sheet by ID with all steps.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION', 'SALES')")
    public ResponseEntity<ApiResponse<WorkProgressSheetView>> getSheet(@PathVariable Long id) {
        WorkProgressSheetView sheet = queryService.getSheetById(id);
        return ResponseEntity.ok(ApiResponse.success(sheet));
    }

    /**
     * Get project production summary with aggregated progress.
     */
    @GetMapping("/project/{projectId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION', 'SALES')")
    public ResponseEntity<ApiResponse<ProjectProductionSummaryView>> getProjectSummary(
            @PathVariable Long projectId
    ) {
        ProjectProductionSummaryView summary = queryService.getProjectSummary(projectId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * Get all outsourced steps for a project.
     */
    @GetMapping("/project/{projectId}/outsourced")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<List<WorkProgressStepView>>> getOutsourcedSteps(
            @PathVariable Long projectId
    ) {
        List<WorkProgressStepView> steps = queryService.getOutsourcedSteps(projectId);
        return ResponseEntity.ok(ApiResponse.success(steps));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new work progress sheet.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<WorkProgressCommandResult>> createSheet(
            @Valid @RequestBody CreateWorkProgressSheetRequest request
    ) {
        Long sheetId = commandService.createSheet(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(WorkProgressCommandResult.created(sheetId)));
    }

    /**
     * Update a work progress step status.
     */
    @PutMapping("/{sheetId}/steps/{stepId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<WorkProgressCommandResult>> updateStepStatus(
            @PathVariable Long sheetId,
            @PathVariable Long stepId,
            @Valid @RequestBody UpdateStepStatusRequest request,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        Long userId = user.getUserId();
        commandService.updateStepStatus(sheetId, stepId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(WorkProgressCommandResult.updated(stepId)));
    }

    /**
     * Delete a work progress sheet.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<ApiResponse<WorkProgressCommandResult>> deleteSheet(@PathVariable Long id) {
        commandService.deleteSheet(id);
        return ResponseEntity.ok(ApiResponse.success(WorkProgressCommandResult.deleted(id)));
    }
}
