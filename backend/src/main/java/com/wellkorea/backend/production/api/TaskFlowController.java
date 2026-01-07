package com.wellkorea.backend.production.api;

import com.wellkorea.backend.production.api.dto.command.SaveTaskFlowRequest;
import com.wellkorea.backend.production.api.dto.command.TaskFlowCommandResult;
import com.wellkorea.backend.production.api.dto.query.TaskFlowView;
import com.wellkorea.backend.production.application.TaskFlowCommandService;
import com.wellkorea.backend.production.application.TaskFlowQueryService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for task flow (DAG) management.
 * <p>
 * Provides endpoints for managing task flows with nodes and edges
 * for React Flow visualization.
 * <p>
 * RBAC Rules:
 * - All authenticated users can view task flows
 * - Admin, Finance, Production, Sales can modify task flows
 */
@RestController
@RequestMapping("/api/task-flows")
public class TaskFlowController {

    private static final Logger log = LoggerFactory.getLogger(TaskFlowController.class);

    private final TaskFlowCommandService commandService;
    private final TaskFlowQueryService queryService;

    public TaskFlowController(TaskFlowCommandService commandService,
                              TaskFlowQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * Get task flow for a project.
     * Creates a new empty flow if one doesn't exist yet.
     * <p>
     * Race condition handling: If concurrent requests both try to create a flow,
     * the database unique constraint prevents duplicates. The losing request
     * catches the constraint violation and retries the query.
     *
     * @param projectId Project ID (required query parameter)
     * @return Task flow with nodes and edges
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TaskFlowView>> getTaskFlow(
            @RequestParam Long projectId
    ) {
        TaskFlowView flow = queryService.getByProjectId(projectId);

        // If flow doesn't exist (id is null), create one
        if (flow.id() == null) {
            try {
                Long newFlowId = commandService.createTaskFlow(projectId);
                flow = queryService.getById(newFlowId);
            } catch (DataIntegrityViolationException e) {
                // Another request created the flow concurrently - retry query
                log.debug("Concurrent TaskFlow creation detected for project {}, retrying query", projectId);
                flow = queryService.getByProjectId(projectId);
                if (flow.id() == null) {
                    // Should not happen - re-throw if still null
                    throw e;
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.success(flow));
    }

    /**
     * Get task flow by ID.
     *
     * @param id Task flow ID
     * @return Task flow with nodes and edges
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TaskFlowView>> getTaskFlowById(@PathVariable Long id) {
        TaskFlowView flow = queryService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(flow));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Save task flow (full replacement of nodes and edges).
     *
     * @param id      Task flow ID
     * @param request Request with nodes and edges
     * @return Command result with flow ID
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<TaskFlowCommandResult>> saveTaskFlow(
            @PathVariable Long id,
            @Valid @RequestBody SaveTaskFlowRequest request
    ) {
        Long flowId = commandService.saveTaskFlow(id, request);
        return ResponseEntity.ok(ApiResponse.success(TaskFlowCommandResult.saved(flowId)));
    }
}
