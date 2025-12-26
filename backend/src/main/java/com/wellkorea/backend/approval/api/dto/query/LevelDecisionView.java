package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.DecisionStatus;

import java.time.LocalDateTime;

/**
 * Read model for approval level decision.
 * Used in ApprovalDetailView for displaying level decision details.
 * No ID field - decisions are identified by levelOrder within the request.
 */
public record LevelDecisionView(
        Integer levelOrder,
        String levelName,
        Long expectedApproverUserId,
        String expectedApproverName,
        DecisionStatus decision,
        Long decidedByUserId,
        String decidedByName,
        LocalDateTime decidedAt,
        String comments
) {
}
