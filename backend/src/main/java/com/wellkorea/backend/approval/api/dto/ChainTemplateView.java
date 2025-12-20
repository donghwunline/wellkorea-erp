package com.wellkorea.backend.approval.api.dto;

import com.wellkorea.backend.approval.domain.ApprovalChainTemplate;
import com.wellkorea.backend.approval.domain.EntityType;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for an approval chain template.
 */
public record ChainTemplateResponse(
        Long id,
        EntityType entityType,
        String name,
        String description,
        boolean active,
        LocalDateTime createdAt,
        List<ChainLevelResponse> levels
) {
    public static ChainTemplateResponse from(ApprovalChainTemplate template) {
        return new ChainTemplateResponse(
                template.getId(),
                template.getEntityType(),
                template.getName(),
                template.getDescription(),
                template.isActive(),
                template.getCreatedAt(),
                template.getLevels().stream()
                        .map(ChainLevelResponse::from)
                        .toList()
        );
    }
}
