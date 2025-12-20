package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.ApprovalChainLevel;

/**
 * Response DTO for an approval chain level.
 */
public record ChainLevelView(
        Long id,
        Integer levelOrder,
        String levelName,
        Long approverUserId,
        String approverUserName,
        boolean required
) {
    public static ChainLevelView from(ApprovalChainLevel level) {
        return new ChainLevelView(
                level.getId(),
                level.getLevelOrder(),
                level.getLevelName(),
                level.getApproverUser().getId(),
                level.getApproverUser().getFullName(),
                level.isRequired()
        );
    }
}
