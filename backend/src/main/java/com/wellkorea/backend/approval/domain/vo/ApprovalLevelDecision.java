package com.wellkorea.backend.approval.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * ApprovalLevelDecision is a value object that tracks the decision made at each level
 * of an approval request. It is embedded within the ApprovalRequest aggregate.
 * <p>
 * Identified by (approval_request_id, level_order) composite key - no independent identity.
 * User references are stored as IDs since JPA @Embeddable cannot have @ManyToOne relationships.
 */
@Embeddable
public class ApprovalLevelDecision {

    @Column(name = "level_order", nullable = false)
    private Integer levelOrder;

    @Column(name = "level_name", nullable = false, length = 100)
    private String levelName;

    @Column(name = "expected_approver_id", nullable = false)
    private Long expectedApproverUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 20)
    private DecisionStatus decision = DecisionStatus.PENDING;

    @Column(name = "decided_by_id")
    private Long decidedByUserId;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    /**
     * JPA requires a no-arg constructor.
     */
    protected ApprovalLevelDecision() {
    }

    /**
     * Create a new level decision for an approval chain level.
     *
     * @param levelOrder             The order of this level in the approval chain (1-based)
     * @param levelName              The display name of this level (e.g., "팀장", "부서장")
     * @param expectedApproverUserId The user ID who should approve at this level
     */
    public ApprovalLevelDecision(Integer levelOrder, String levelName, Long expectedApproverUserId) {
        this.levelOrder = Objects.requireNonNull(levelOrder, "Level order cannot be null");
        this.levelName = Objects.requireNonNull(levelName, "Level name cannot be null");
        this.expectedApproverUserId = Objects.requireNonNull(expectedApproverUserId, "Expected approver user ID cannot be null");
        this.decision = DecisionStatus.PENDING;
    }

    // ==================== BUSINESS METHODS ====================

    /**
     * Check if this decision is still pending.
     */
    public boolean isPending() {
        return decision == DecisionStatus.PENDING;
    }

    /**
     * Check if this decision was approved.
     */
    public boolean isApproved() {
        return decision == DecisionStatus.APPROVED;
    }

    /**
     * Check if this decision was rejected.
     */
    public boolean isRejected() {
        return decision == DecisionStatus.REJECTED;
    }

    /**
     * Approve this level decision.
     *
     * @param approverUserId The user ID who is approving
     * @param comments       Optional comments
     */
    public void approve(Long approverUserId, String comments) {
        this.decision = DecisionStatus.APPROVED;
        this.decidedByUserId = approverUserId;
        this.decidedAt = LocalDateTime.now();
        this.comments = comments;
    }

    /**
     * Reject this level decision.
     *
     * @param approverUserId The user ID who is rejecting
     * @param comments       Optional comments
     */
    public void reject(Long approverUserId, String comments) {
        this.decision = DecisionStatus.REJECTED;
        this.decidedByUserId = approverUserId;
        this.decidedAt = LocalDateTime.now();
        this.comments = comments;
    }

    // ==================== GETTERS ====================
    // No setters - value object should be immutable after creation
    // Mutations only through business methods (approve/reject)

    public Integer getLevelOrder() {
        return levelOrder;
    }

    public String getLevelName() {
        return levelName;
    }

    public Long getExpectedApproverUserId() {
        return expectedApproverUserId;
    }

    public DecisionStatus getDecision() {
        return decision;
    }

    public Long getDecidedByUserId() {
        return decidedByUserId;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public String getComments() {
        return comments;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ApprovalLevelDecision that)) return false;
        return Objects.equals(levelOrder, that.levelOrder);
    }

    @Override
    public int hashCode() {
        return Objects.hash(levelOrder);
    }
}
