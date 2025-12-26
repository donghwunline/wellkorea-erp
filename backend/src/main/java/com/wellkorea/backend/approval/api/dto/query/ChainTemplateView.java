package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.vo.EntityType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for an approval chain template.
 */
public record ChainTemplateView(
        Long id,
        EntityType entityType,
        String name,
        String description,
        boolean active,
        LocalDateTime createdAt,
        List<ChainLevelView> levels
) {
}
