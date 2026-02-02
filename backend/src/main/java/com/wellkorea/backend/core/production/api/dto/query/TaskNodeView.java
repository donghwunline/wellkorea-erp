package com.wellkorea.backend.core.production.api.dto.query;

import java.time.LocalDate;

/**
 * View DTO for a task node in the task flow.
 */
public record TaskNodeView(
        String id,
        String title,
        String assignee,
        LocalDate deadline,
        Integer progress,
        Double positionX,
        Double positionY
) {
}
