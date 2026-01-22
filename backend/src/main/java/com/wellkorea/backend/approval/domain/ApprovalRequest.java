package com.wellkorea.backend.approval.domain;

import com.wellkorea.backend.approval.domain.vo.ApprovalLevelDecision;
import com.wellkorea.backend.approval.domain.vo.ApprovalStatus;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * ApprovalRequest is the aggregate root for approval workflow instances.
 * It tracks the multi-level sequential approval process for a specific entity.
 * <p>
 * This aggregate manages the lifecycle of its ApprovalLevelDecision collection elements.
 * Decisions cannot exist independently and are always accessed through the request.
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

    /**
     * Ordered list of level decisions in this approval request.
     * Persisted to approval_level_decisions table via @ElementCollection.
     * JPA automatically manages the collection table for CRUD operations.
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "approval_level_decisions",
            joinColumns = @JoinColumn(name = "approval_request_id")
    )
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

    // ==================== AGGREGATE BUSINESS METHODS ====================

    /**
     * Check if the request is pending approval.
     */
    public boolean isPending() {
        return status == ApprovalStatus.PENDING;
    }

    /**
     * Check if the request is completed (approved or rejected).
     */
    public boolean isCompleted() {
        return status == ApprovalStatus.APPROVED || status == ApprovalStatus.REJECTED;
    }

    /**
     * Check if the request is at the final approval level.
     */
    public boolean isAtFinalLevel() {
        return currentLevel.equals(totalLevels);
    }

    /**
     * Move to the next approval level.
     */
    public void moveToNextLevel() {
        if (currentLevel < totalLevels) {
            currentLevel++;
        }
    }

    /**
     * Complete the approval request with final status.
     *
     * @param finalStatus The final status (APPROVED or REJECTED)
     */
    public void complete(ApprovalStatus finalStatus) {
        this.status = finalStatus;
        this.completedAt = LocalDateTime.now();
    }

    /**
     * Get the decision for the current level.
     *
     * @return Optional containing the current level decision, or empty if not found
     */
    public Optional<ApprovalLevelDecision> getCurrentLevelDecision() {
        return levelDecisions.stream()
                .filter(d -> d.getLevelOrder().equals(currentLevel))
                .findFirst();
    }

    /**
     * Get the decision for a specific level.
     *
     * @param levelOrder The level order (1-based)
     * @return Optional containing the level decision, or empty if not found
     */
    public Optional<ApprovalLevelDecision> getLevelDecision(int levelOrder) {
        return levelDecisions.stream()
                .filter(d -> d.getLevelOrder().equals(levelOrder))
                .findFirst();
    }

    /**
     * Check if a user is the expected approver at the current level.
     *
     * @param userId The user ID to check
     * @return true if the user is the expected approver at current level
     */
    public boolean isExpectedApprover(Long userId) {
        return getCurrentLevelDecision()
                .map(d -> d.getExpectedApproverUserId().equals(userId))
                .orElse(false);
    }

    /**
     * Check if a user is an approver at any level.
     *
     * @param userId The user ID to check
     * @return true if the user is an approver at any level
     */
    public boolean isApproverAtAnyLevel(Long userId) {
        return levelDecisions.stream()
                .anyMatch(d -> d.getExpectedApproverUserId().equals(userId));
    }

    /**
     * Initialize level decisions from pre-built decisions (created by ApprovalChainTemplate factory).
     * This is the only way to add decisions - enforcing aggregate boundary.
     *
     * @param decisions List of level decisions created by ApprovalChainTemplate.createLevelDecisions()
     * @throws IllegalArgumentException if decisions is null or empty
     */
    public void initializeLevelDecisions(List<ApprovalLevelDecision> decisions) {
        Objects.requireNonNull(decisions, "Level decisions cannot be null");
        if (decisions.isEmpty()) {
            throw new IllegalArgumentException("At least one level decision is required");
        }

        this.levelDecisions.clear();
        this.levelDecisions.addAll(decisions);
        this.totalLevels = decisions.size();
    }

    /**
     * Approve at the current level.
     *
     * @param approverUserId The user ID performing the approval
     * @param comments       Optional comments
     * @throws IllegalStateException if current level decision is not found
     */
    public void approveAtCurrentLevel(Long approverUserId, String comments) {
        ApprovalLevelDecision decision = getCurrentLevelDecision()
                .orElseThrow(() -> new IllegalStateException("No decision found for current level"));
        decision.approve(approverUserId, comments);
    }

    /**
     * Reject at the current level.
     *
     * @param approverUserId The user ID performing the rejection
     * @param comments       Optional comments
     * @throws IllegalStateException if current level decision is not found
     */
    public void rejectAtCurrentLevel(Long approverUserId, String comments) {
        ApprovalLevelDecision decision = getCurrentLevelDecision()
                .orElseThrow(() -> new IllegalStateException("No decision found for current level"));
        decision.reject(approverUserId, comments);
    }

    /**
     * Get unmodifiable view of level decisions.
     * Clients cannot modify the decisions directly - must use aggregate methods.
     */
    public List<ApprovalLevelDecision> getLevelDecisions() {
        return Collections.unmodifiableList(levelDecisions);
    }

    // ==================== GETTERS AND SETTERS ====================

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
}
