package com.wellkorea.backend.approval.domain;

import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * ApprovalComment stores discussion comments and rejection reasons.
 */
@Entity
@Table(name = "approval_comments")
public class ApprovalComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approval_request_id", nullable = false)
    private ApprovalRequest approvalRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commenter_id", nullable = false)
    private User commenter;

    @Column(name = "comment_text", nullable = false, columnDefinition = "TEXT")
    private String commentText;

    @Column(name = "is_rejection_reason", nullable = false)
    private boolean rejectionReason = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Static factory methods
    public static ApprovalComment rejectionReason(ApprovalRequest request, User commenter, String reason) {
        ApprovalComment comment = new ApprovalComment();
        comment.approvalRequest = request;
        comment.commenter = commenter;
        comment.commentText = reason;
        comment.rejectionReason = true;
        return comment;
    }

    public static ApprovalComment discussion(ApprovalRequest request, User commenter, String text) {
        ApprovalComment comment = new ApprovalComment();
        comment.approvalRequest = request;
        comment.commenter = commenter;
        comment.commentText = text;
        comment.rejectionReason = false;
        return comment;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ApprovalRequest getApprovalRequest() {
        return approvalRequest;
    }

    public void setApprovalRequest(ApprovalRequest approvalRequest) {
        this.approvalRequest = approvalRequest;
    }

    public User getCommenter() {
        return commenter;
    }

    public void setCommenter(User commenter) {
        this.commenter = commenter;
    }

    public String getCommentText() {
        return commentText;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }

    public boolean isRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(boolean rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
