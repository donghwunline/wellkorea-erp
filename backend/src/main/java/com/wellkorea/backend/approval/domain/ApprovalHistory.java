package com.wellkorea.backend.approval.domain;

import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * ApprovalHistory provides an audit trail of all approval workflow actions.
 */
@Entity
@Table(name = "approval_history")
public class ApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approval_request_id", nullable = false)
    private ApprovalRequest approvalRequest;

    @Column(name = "level_order")
    private Integer levelOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private ApprovalAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Static factory methods
    public static ApprovalHistory submitted(ApprovalRequest request, User submitter) {
        ApprovalHistory history = new ApprovalHistory();
        history.approvalRequest = request;
        history.action = ApprovalAction.SUBMITTED;
        history.actor = submitter;
        return history;
    }

    public static ApprovalHistory approved(ApprovalRequest request, Integer levelOrder, User approver, String comments) {
        ApprovalHistory history = new ApprovalHistory();
        history.approvalRequest = request;
        history.levelOrder = levelOrder;
        history.action = ApprovalAction.APPROVED;
        history.actor = approver;
        history.comments = comments;
        return history;
    }

    public static ApprovalHistory rejected(ApprovalRequest request, Integer levelOrder, User approver, String comments) {
        ApprovalHistory history = new ApprovalHistory();
        history.approvalRequest = request;
        history.levelOrder = levelOrder;
        history.action = ApprovalAction.REJECTED;
        history.actor = approver;
        history.comments = comments;
        return history;
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

    public ApprovalAction getAction() {
        return action;
    }

    public void setAction(ApprovalAction action) {
        this.action = action;
    }

    public User getActor() {
        return actor;
    }

    public void setActor(User actor) {
        this.actor = actor;
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
}
