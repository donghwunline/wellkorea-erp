package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.vo.ApprovalChainLevel;
import com.wellkorea.backend.auth.domain.User;

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
    /**
     * Create view from embeddable level with user lookup.
     * Since ApprovalChainLevel only stores userId, the User must be provided separately.
     *
     * @param level        The embeddable level
     * @param approverUser The resolved User entity
     */
    public static ChainLevelView from(ApprovalChainLevel level, User approverUser) {
        return new ChainLevelView(
                level.getLevelOrder(),
                level.getLevelName(),
                level.getApproverUserId(),
                approverUser != null ? approverUser.getFullName() : null,
                level.isRequired()
        );
    }

    /**
     * Create view from embeddable level without user name.
     * Use when user lookup is not needed or user name will be set separately.
     */
    public static ChainLevelView from(ApprovalChainLevel level) {
        return new ChainLevelView(
                level.getLevelOrder(),
                level.getLevelName(),
                level.getApproverUserId(),
                null,
                level.isRequired()
        );
    }
}
