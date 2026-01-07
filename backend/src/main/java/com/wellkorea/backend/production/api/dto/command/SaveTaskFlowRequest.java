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
     *
     * @param id        Client-side node ID (required, max 36 chars)
     * @param title     Task title (required, max 255 chars)
     * @param assignee  Person assigned to task (optional, max 100 chars)
     * @param deadline  Task deadline (optional)
     * @param progress  Progress percentage 0-100 (optional, defaults to 0, clamped to 0-100)
     * @param positionX X coordinate on canvas (optional, defaults to 0.0)
     * @param positionY Y coordinate on canvas (optional, defaults to 0.0)
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
