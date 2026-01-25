package com.wellkorea.backend.approval.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * ApprovalCommentEntry is an embedded value object that stores discussion comments
 * and rejection reasons on an approval request. It is embedded within the ApprovalRequest aggregate.
 * <p>
 * This replaces the separate ApprovalComment entity to enforce aggregate boundaries.
 * User references are stored as IDs since JPA @Embeddable cannot have @ManyToOne relationships.
 */
@Embeddable
public class ApprovalCommentEntry {

    @Column(name = "commenter_id", nullable = false)
    private Long commenterUserId;

    @Column(name = "comment_text", nullable = false, columnDefinition = "TEXT")
    private String commentText;

    @Column(name = "is_rejection_reason", nullable = false)
    private boolean rejectionReason = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * JPA requires a no-arg constructor.
     */
    protected ApprovalCommentEntry() {
    }

    /**
     * Private constructor - use factory methods.
     */
    private ApprovalCommentEntry(Long commenterUserId, String commentText, boolean isRejectionReason) {
        this.commenterUserId = Objects.requireNonNull(commenterUserId, "Commenter user ID cannot be null");
        this.commentText = Objects.requireNonNull(commentText, "Comment text cannot be null");
        this.rejectionReason = isRejectionReason;
        this.createdAt = LocalDateTime.now();
    }

    // ==================== FACTORY METHODS ====================

    /**
     * Create a comment entry for rejection reason.
     */
    public static ApprovalCommentEntry rejectionReason(Long commenterUserId, String reason) {
        return new ApprovalCommentEntry(commenterUserId, reason, true);
    }

    /**
     * Create a comment entry for general discussion.
     */
    public static ApprovalCommentEntry discussion(Long commenterUserId, String text) {
        return new ApprovalCommentEntry(commenterUserId, text, false);
    }

    // ==================== GETTERS ====================
    // No setters - value object is immutable after creation

    public Long getCommenterUserId() {
        return commenterUserId;
    }

    public String getCommentText() {
        return commentText;
    }

    public boolean isRejectionReason() {
        return rejectionReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ApprovalCommentEntry that)) return false;
        return rejectionReason == that.rejectionReason
                && Objects.equals(commenterUserId, that.commenterUserId)
                && Objects.equals(commentText, that.commentText)
                && Objects.equals(createdAt, that.createdAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(commenterUserId, commentText, rejectionReason, createdAt);
    }
}
