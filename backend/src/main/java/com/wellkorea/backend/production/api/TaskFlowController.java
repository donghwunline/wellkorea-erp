package com.wellkorea.backend.production.api;

import com.wellkorea.backend.production.api.dto.command.SaveTaskFlowRequest;
import com.wellkorea.backend.production.api.dto.command.TaskFlowCommandResult;
import com.wellkorea.backend.production.api.dto.query.TaskFlowView;
import com.wellkorea.backend.production.application.TaskFlowCommandService;
import com.wellkorea.backend.production.application.TaskFlowQueryService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
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
     * Returns empty flow structure if no flow exists yet.
     *
     * @param projectId Project ID (required query parameter)
     * @return Task flow with nodes and edges
     */
    // TODO: Potential race condition - concurrent requests may both try to create a TaskFlow.
    //       Database unique constraint on project_id prevents duplicates, but one request will fail.
    //       Consider: atomic getOrCreate in a dedicated service or database-level upsert.
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TaskFlowView>> getTaskFlow(
            @RequestParam Long projectId
    ) {
        TaskFlowView flow = queryService.getByProjectId(projectId);

        // If flow doesn't exist (id is null), create one
        if (flow.id() == null) {
            Long newFlowId = commandService.createTaskFlow(projectId);
            flow = queryService.getById(newFlowId);
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TaskFlowCommandResult>> saveTaskFlow(
            @PathVariable Long id,
            @Valid @RequestBody SaveTaskFlowRequest request
    ) {
        Long flowId = commandService.saveTaskFlow(id, request);
        return ResponseEntity.ok(ApiResponse.success(TaskFlowCommandResult.saved(flowId)));
    }
}
