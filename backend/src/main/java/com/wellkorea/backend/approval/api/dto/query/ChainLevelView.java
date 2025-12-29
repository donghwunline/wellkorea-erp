package com.wellkorea.backend.approval.api.dto.query;

/**
 * Response DTO for an approval chain level.
 * Identified by levelOrder within a template (no database ID since it's an embeddable).
 */
public record ChainLevelView(
        Integer levelOrder,
        String levelName,
        Long approverUserId,
        String approverUserName,
        boolean required
) {
}
