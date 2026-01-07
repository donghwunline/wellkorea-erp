package com.wellkorea.backend.production.api.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for saving a task flow (nodes + edges).
 * Performs full replacement of all nodes and edges.
 */
public record SaveTaskFlowRequest(
        @Valid
        List<NodeData> nodes,

        @Valid
        List<EdgeData> edges
) {
    /**
     * Node data within the save request.
     */
    public record NodeData(
            @NotBlank(message = "Node ID is required")
            @Size(max = 36, message = "Node ID must be at most 36 characters")
            String id,

            @NotBlank(message = "Title is required")
            @Size(max = 255, message = "Title must be at most 255 characters")
            String title,

            @Size(max = 100, message = "Assignee must be at most 100 characters")
            String assignee,

            LocalDate deadline,

            Integer progress,

            Double positionX,

            Double positionY
    ) {
    }

    /**
     * Edge data within the save request.
     */
    public record EdgeData(
            @NotBlank(message = "Edge ID is required")
            @Size(max = 36, message = "Edge ID must be at most 36 characters")
            String id,

            @NotBlank(message = "Source node ID is required")
            @Size(max = 36, message = "Source node ID must be at most 36 characters")
            String source,

            @NotBlank(message = "Target node ID is required")
            @Size(max = 36, message = "Target node ID must be at most 36 characters")
            String target
    ) {
    }
}
