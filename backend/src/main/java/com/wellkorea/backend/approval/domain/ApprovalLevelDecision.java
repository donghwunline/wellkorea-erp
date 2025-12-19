package com.wellkorea.backend.approval.domain;

import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ApprovalLevelDecision tracks the decision made at each level of an approval request.
 */
@Entity
@Table(name = "approval_level_decisions")
public class ApprovalLevelDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approval_request_id", nullable = false)
    private ApprovalRequest approvalRequest;

    @Column(name = "level_order", nullable = false)
    private Integer levelOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expected_approver_id", nullable = false)
    private User expectedApprover;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 20)
    private DecisionStatus decision = DecisionStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by_id")
    private User decidedBy;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean isPending() {
        return decision == DecisionStatus.PENDING;
    }

    public boolean isApproved() {
        return decision == DecisionStatus.APPROVED;
    }

    public boolean isRejected() {
        return decision == DecisionStatus.REJECTED;
    }

    public void approve(User approver, String comments) {
        this.decision = DecisionStatus.APPROVED;
        this.decidedBy = approver;
        this.decidedAt = LocalDateTime.now();
        this.comments = comments;
    }

    public void reject(User approver, String comments) {
        this.decision = DecisionStatus.REJECTED;
        this.decidedBy = approver;
        this.decidedAt = LocalDateTime.now();
        this.comments = comments;
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

    public Integer getLevelOrder() {
        return levelOrder;
    }

    public void setLevelOrder(Integer levelOrder) {
        this.levelOrder = levelOrder;
    }

    public User getExpectedApprover() {
        return expectedApprover;
    }

    public void setExpectedApprover(User expectedApprover) {
        this.expectedApprover = expectedApprover;
    }

    public DecisionStatus getDecision() {
        return decision;
    }

    public void setDecision(DecisionStatus decision) {
        this.decision = decision;
    }

    public User getDecidedBy() {
        return decidedBy;
    }

    public void setDecidedBy(User decidedBy) {
        this.decidedBy = decidedBy;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
