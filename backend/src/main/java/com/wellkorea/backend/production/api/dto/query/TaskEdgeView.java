package com.wellkorea.backend.production.api.dto.query;

/**
 * View DTO for an edge (connection) in the task flow.
 */
public record TaskEdgeView(
        String id,
        String source,
        String target
) {
}
