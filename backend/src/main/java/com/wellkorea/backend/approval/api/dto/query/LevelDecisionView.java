package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.ApprovalLevelDecision;
import com.wellkorea.backend.approval.domain.DecisionStatus;
import java.time.LocalDateTime;

/**
 * Read model for approval level decision.
 * Used in ApprovalDetailView for displaying level decision details.
 */
public record LevelDecisionView(
        Long id,
        Integer levelOrder,
        String levelName,
        Long expectedApproverId,
        String expectedApproverName,
        DecisionStatus decision,
        Long decidedById,
        String decidedByName,
        LocalDateTime decidedAt,
        String comments
) {
    public static LevelDecisionView from(ApprovalLevelDecision decision) {
        // Get level name from the chain template via the request
        String levelName = decision.getApprovalRequest().getChainTemplate().getLevels().stream()
                .filter(l -> l.getLevelOrder().equals(decision.getLevelOrder()))
                .findFirst()
                .map(l -> l.getLevelName())
                .orElse("Level " + decision.getLevelOrder());

        return new LevelDecisionView(
                decision.getId(),
                decision.getLevelOrder(),
                levelName,
                decision.getExpectedApprover().getId(),
                decision.getExpectedApprover().getFullName(),
                decision.getDecision(),
                decision.getDecidedBy() != null ? decision.getDecidedBy().getId() : null,
                decision.getDecidedBy() != null ? decision.getDecidedBy().getFullName() : null,
                decision.getDecidedAt(),
                decision.getComments()
        );
    }
}
