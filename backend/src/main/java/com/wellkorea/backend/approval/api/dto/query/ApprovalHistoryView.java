package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.vo.ApprovalAction;

import java.time.LocalDateTime;

/**
 * Read model for approval history entry.
 * Used for displaying approval workflow history.
 */
public record ApprovalHistoryView(
        Long id,
        Integer levelOrder,
        ApprovalAction action,
        Long actorId,
        String actorName,
        String comments,
        LocalDateTime createdAt
) {
}
