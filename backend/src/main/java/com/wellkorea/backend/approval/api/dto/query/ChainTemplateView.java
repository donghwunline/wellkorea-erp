package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.ApprovalChainTemplate;
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
    /**
     * Create view from template entity.
     * Note: This version does NOT include approver user names.
     * Use the ApprovalQueryService methods which resolve user names.
     */
    public static ChainTemplateView from(ApprovalChainTemplate template) {
        return new ChainTemplateView(
                template.getId(),
                template.getEntityType(),
                template.getName(),
                template.getDescription(),
                template.isActive(),
                template.getCreatedAt(),
                template.getLevels().stream()
                        .map(ChainLevelView::from)
                        .toList()
        );
    }

    /**
     * Create view from template with pre-built level views.
     * Use when level views have been constructed with user resolution.
     */
    public static ChainTemplateView from(ApprovalChainTemplate template, List<ChainLevelView> levelViews) {
        return new ChainTemplateView(
                template.getId(),
                template.getEntityType(),
                template.getName(),
                template.getDescription(),
                template.isActive(),
                template.getCreatedAt(),
                levelViews
        );
    }
}
