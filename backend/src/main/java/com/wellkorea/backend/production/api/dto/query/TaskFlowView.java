package com.wellkorea.backend.production.api.dto.query;

import java.time.Instant;
import java.util.List;

/**
 * View DTO for a task flow with all nodes and edges.
 */
public record TaskFlowView(
        Long id,
        Long projectId,
        List<TaskNodeView> nodes,
        List<TaskEdgeView> edges,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Create an empty task flow view for a project that doesn't have a flow yet.
     */
    public static TaskFlowView empty(Long projectId) {
        return new TaskFlowView(
                null,
                projectId,
                List.of(),
                List.of(),
                null,
                null
        );
    }
}
