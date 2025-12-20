package com.wellkorea.backend.approval.api.dto;

import com.wellkorea.backend.approval.domain.ApprovalChainLevel;

/**
 * Response DTO for an approval chain level.
 */
public record ChainLevelResponse(
        Long id,
        Integer levelOrder,
        String levelName,
        Long approverUserId,
        String approverUserName,
        boolean required
) {
    public static ChainLevelResponse from(ApprovalChainLevel level) {
        return new ChainLevelResponse(
                level.getId(),
                level.getLevelOrder(),
                level.getLevelName(),
                level.getApproverUser().getId(),
                level.getApproverUser().getFullName(),
                level.isRequired()
        );
    }
}
