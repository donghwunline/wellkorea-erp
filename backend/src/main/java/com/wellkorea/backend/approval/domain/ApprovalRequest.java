package com.wellkorea.backend.approval.domain;

import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * ApprovalRequest tracks the approval workflow for a specific entity.
 * Manages the multi-level sequential approval process.
 */
@Entity
@Table(name = "approval_requests")
public class ApprovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 50)
    private EntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "entity_description", length = 500)
    private String entityDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chain_template_id", nullable = false)
    private ApprovalChainTemplate chainTemplate;

    @Column(name = "current_level", nullable = false)
    private Integer currentLevel = 1;

    @Column(name = "total_levels", nullable = false)
    private Integer totalLevels;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id", nullable = false)
    private User submittedBy;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "approvalRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("levelOrder ASC")
    private List<ApprovalLevelDecision> levelDecisions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean isPending() {
        return status == ApprovalStatus.PENDING;
    }

    public boolean isCompleted() {
        return status == ApprovalStatus.APPROVED || status == ApprovalStatus.REJECTED;
    }

    public boolean isAtFinalLevel() {
        return currentLevel.equals(totalLevels);
    }

    public void moveToNextLevel() {
        if (currentLevel < totalLevels) {
            currentLevel++;
        }
    }

    public void complete(ApprovalStatus finalStatus) {
        this.status = finalStatus;
        this.completedAt = LocalDateTime.now();
    }

    public Optional<ApprovalLevelDecision> getCurrentLevelDecision() {
        return levelDecisions.stream()
                .filter(d -> d.getLevelOrder().equals(currentLevel))
                .findFirst();
    }

    public Optional<ApprovalLevelDecision> getLevelDecision(int levelOrder) {
        return levelDecisions.stream()
                .filter(d -> d.getLevelOrder().equals(levelOrder))
                .findFirst();
    }

    public boolean isExpectedApprover(Long userId) {
        return getCurrentLevelDecision()
                .map(d -> d.getExpectedApprover().getId().equals(userId))
                .orElse(false);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(EntityType entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getEntityDescription() {
        return entityDescription;
    }

    public void setEntityDescription(String entityDescription) {
        this.entityDescription = entityDescription;
    }

    public ApprovalChainTemplate getChainTemplate() {
        return chainTemplate;
    }

    public void setChainTemplate(ApprovalChainTemplate chainTemplate) {
        this.chainTemplate = chainTemplate;
    }

    public Integer getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(Integer currentLevel) {
        this.currentLevel = currentLevel;
    }

    public Integer getTotalLevels() {
        return totalLevels;
    }

    public void setTotalLevels(Integer totalLevels) {
        this.totalLevels = totalLevels;
    }

    public ApprovalStatus getStatus() {
        return status;
    }

    public void setStatus(ApprovalStatus status) {
        this.status = status;
    }

    public User getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(User submittedBy) {
        this.submittedBy = submittedBy;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<ApprovalLevelDecision> getLevelDecisions() {
        return levelDecisions;
    }

    public void setLevelDecisions(List<ApprovalLevelDecision> levelDecisions) {
        this.levelDecisions = levelDecisions;
    }
}
