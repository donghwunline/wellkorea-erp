package com.wellkorea.backend.approval.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * ApprovalHistoryEntry is an embedded value object that records an action
 * taken on an approval request. It is embedded within the ApprovalRequest aggregate.
 * <p>
 * This replaces the separate ApprovalHistory entity to enforce aggregate boundaries.
 * User references are stored as IDs since JPA @Embeddable cannot have @ManyToOne relationships.
 */
@Embeddable
public class ApprovalHistoryEntry {

    @Column(name = "level_order")
    private Integer levelOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private ApprovalAction action;

    @Column(name = "actor_id", nullable = false)
    private Long actorUserId;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * JPA requires a no-arg constructor.
     */
    protected ApprovalHistoryEntry() {
    }

    /**
     * Private constructor - use factory methods.
     */
    private ApprovalHistoryEntry(Integer levelOrder, ApprovalAction action, Long actorUserId, String comments) {
        this.levelOrder = levelOrder;
        this.action = Objects.requireNonNull(action, "Action cannot be null");
        this.actorUserId = Objects.requireNonNull(actorUserId, "Actor user ID cannot be null");
        this.comments = comments;
        this.createdAt = LocalDateTime.now();
    }

    // ==================== FACTORY METHODS ====================

    /**
     * Create a history entry for submission.
     */
    public static ApprovalHistoryEntry submitted(Long submitterUserId) {
        return new ApprovalHistoryEntry(null, ApprovalAction.SUBMITTED, submitterUserId, null);
    }

    /**
     * Create a history entry for approval at a level.
     */
    public static ApprovalHistoryEntry approved(Integer levelOrder, Long approverUserId, String comments) {
        return new ApprovalHistoryEntry(levelOrder, ApprovalAction.APPROVED, approverUserId, comments);
    }

    /**
     * Create a history entry for rejection at a level.
     */
    public static ApprovalHistoryEntry rejected(Integer levelOrder, Long approverUserId, String comments) {
        return new ApprovalHistoryEntry(levelOrder, ApprovalAction.REJECTED, approverUserId, comments);
    }

    // ==================== GETTERS ====================
    // No setters - value object is immutable after creation

    public Integer getLevelOrder() {
        return levelOrder;
    }

    public ApprovalAction getAction() {
        return action;
    }

    public Long getActorUserId() {
        return actorUserId;
    }

    public String getComments() {
        return comments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ApprovalHistoryEntry that)) return false;
        return Objects.equals(levelOrder, that.levelOrder)
                && action == that.action
                && Objects.equals(actorUserId, that.actorUserId)
                && Objects.equals(createdAt, that.createdAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(levelOrder, action, actorUserId, createdAt);
    }
}
