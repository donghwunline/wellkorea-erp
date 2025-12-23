package com.wellkorea.backend.approval.api.dto.query;

import com.wellkorea.backend.approval.domain.DecisionStatus;
import com.wellkorea.backend.approval.domain.vo.ApprovalLevelDecision;
import com.wellkorea.backend.auth.domain.User;

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
    /**
     * Create a LevelDecisionView from an embeddable decision with resolved user information.
     * Level name is taken from the decision itself (denormalized at creation time).
     *
     * @param decision         The embeddable level decision
     * @param expectedApprover The resolved User entity for expected approver
     * @param decidedBy        The resolved User entity for who made the decision (nullable)
     */
    public static LevelDecisionView from(ApprovalLevelDecision decision,
                                         User expectedApprover,
                                         User decidedBy) {
        return new LevelDecisionView(
                decision.getLevelOrder(),
                decision.getLevelName(),
                decision.getExpectedApproverUserId(),
                expectedApprover != null ? expectedApprover.getFullName() : null,
                decision.getDecision(),
                decision.getDecidedByUserId(),
                decidedBy != null ? decidedBy.getFullName() : null,
                decision.getDecidedAt(),
                decision.getComments()
        );
    }

    /**
     * Create a LevelDecisionView from an embeddable decision without user name resolution.
     * User names will be null - use when user lookup is not needed.
     * Level name is taken from the decision itself.
     *
     * @param decision The embeddable level decision
     */
    public static LevelDecisionView from(ApprovalLevelDecision decision) {
        return new LevelDecisionView(
                decision.getLevelOrder(),
                decision.getLevelName(),
                decision.getExpectedApproverUserId(),
                null,
                decision.getDecision(),
                decision.getDecidedByUserId(),
                null,
                decision.getDecidedAt(),
                decision.getComments()
        );
    }
}
