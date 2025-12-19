package com.wellkorea.backend.approval.domain;

import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ApprovalChainLevel represents a level in an approval chain.
 * Each level has a specific approver user (e.g., 팀장, 부서장, 사장).
 */
@Entity
@Table(name = "approval_chain_levels")
public class ApprovalChainLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chain_template_id", nullable = false)
    private ApprovalChainTemplate chainTemplate;

    @Column(name = "level_order", nullable = false)
    private Integer levelOrder;

    @Column(name = "level_name", nullable = false, length = 100)
    private String levelName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_user_id", nullable = false)
    private User approverUser;

    @Column(name = "is_required", nullable = false)
    private boolean required = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ApprovalChainTemplate getChainTemplate() {
        return chainTemplate;
    }

    public void setChainTemplate(ApprovalChainTemplate chainTemplate) {
        this.chainTemplate = chainTemplate;
    }

    public Integer getLevelOrder() {
        return levelOrder;
    }

    public void setLevelOrder(Integer levelOrder) {
        this.levelOrder = levelOrder;
    }

    public String getLevelName() {
        return levelName;
    }

    public void setLevelName(String levelName) {
        this.levelName = levelName;
    }

    public User getApproverUser() {
        return approverUser;
    }

    public void setApproverUser(User approverUser) {
        this.approverUser = approverUser;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
