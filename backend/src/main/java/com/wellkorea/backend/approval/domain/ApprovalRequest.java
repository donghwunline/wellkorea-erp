package com.wellkorea.backend.approval.domain;

import com.wellkorea.backend.approval.domain.vo.*;
import com.wellkorea.backend.auth.domain.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * ApprovalRequest is the aggregate root for approval workflow instances.
 * It tracks the multi-level sequential approval process for a specific entity.
 * <p>
 * This aggregate manages the lifecycle of:
 * - ApprovalLevelDecision collection (approval decisions at each level)
 * - ApprovalHistoryEntry collection (audit trail of actions)
 * - ApprovalCommentEntry collection (discussion comments and rejection reasons)
 * <p>
 * All approval workflow operations must go through this aggregate root.
 * External code should not modify embedded collections directly.
 */
@Entity
@Table(name = "approval_requests")
public class ApprovalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

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
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "approval_level_decisions",
            joinColumns = @JoinColumn(name = "approval_request_id")
    )
    @OrderBy("levelOrder ASC")
    private List<ApprovalLevelDecision> levelDecisions = new ArrayList<>();

    /**
     * History entries tracking all approval workflow actions.
     * Persisted to approval_history table via @ElementCollection.
     * JPA manages entry_index automatically for ordering.
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "approval_history",
            joinColumns = @JoinColumn(name = "approval_request_id")
    )
    @OrderColumn(name = "entry_index")
    private List<ApprovalHistoryEntry> historyEntries = new ArrayList<>();

    /**
     * Comments including discussion and rejection reasons.
     * Persisted to approval_comments table via @ElementCollection.
     * JPA manages entry_index automatically for ordering.
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "approval_comments",
            joinColumns = @JoinColumn(name = "approval_request_id")
    )
    @OrderColumn(name = "entry_index")
    private List<ApprovalCommentEntry> comments = new ArrayList<>();

    /**
     * Protected constructor for JPA.
     * Use the factory method {@link #create} for creating new instances.
     */
    protected ApprovalRequest() {
    }

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

    // ==================== FACTORY METHOD ====================

    /**
     * Create a new approval request.
     * This is the only way to create an ApprovalRequest instance.
     *
     * @param entityType        The type of entity being approved
     * @param entityId          The ID of the entity being approved
     * @param entityDescription A description of what is being approved
     * @param submittedBy       The user submitting the approval request
     * @param template          The approval chain template to use
     * @return A new ApprovalRequest instance
     */
    public static ApprovalRequest create(
            EntityType entityType,
            Long entityId,
            String entityDescription,
            User submittedBy,
            ApprovalChainTemplate template) {

        Objects.requireNonNull(entityType, "Entity type cannot be null");
        Objects.requireNonNull(entityId, "Entity ID cannot be null");
        Objects.requireNonNull(submittedBy, "Submitted by user cannot be null");
        Objects.requireNonNull(template, "Approval chain template cannot be null");

        if (!template.hasLevels()) {
            throw new IllegalArgumentException("Approval chain template has no levels configured");
        }

        ApprovalRequest request = new ApprovalRequest();
        request.entityType = entityType;
        request.entityId = entityId;
        request.entityDescription = entityDescription;
        request.submittedBy = submittedBy;
        request.status = ApprovalStatus.PENDING;
        request.currentLevel = 1;

        // Initialize level decisions from template
        List<ApprovalLevelDecision> decisions = template.createLevelDecisions();
        request.levelDecisions.addAll(decisions);
        request.totalLevels = decisions.size();

        // Record submission in history
        request.historyEntries.add(ApprovalHistoryEntry.submitted(submittedBy.getId()));

        return request;
    }

    // ==================== AGGREGATE BUSINESS METHODS ====================

    /**
     * Approve at the current level. The aggregate validates and manages all state.
     * <p>
     * This method:
     * - Validates the request is not already completed
     * - Validates the user is authorized to approve at the current level
     * - Records the decision on the level
     * - Records history
     * - Advances to next level or completes if at final level
     *
     * @param approverUserId The user ID performing the approval
     * @param comments       Optional comments
     * @throws IllegalStateException    if already completed
     * @throws IllegalArgumentException if user not authorized at current level
     */
    public void approve(Long approverUserId, String comments) {
        // Validation
        if (isCompleted()) {
            throw new IllegalStateException("Approval request is already completed");
        }
        if (!isExpectedApprover(approverUserId)) {
            if (isApproverAtAnyLevel(approverUserId)) {
                throw new IllegalArgumentException("Cannot approve out of order - not at current level");
            }
            throw new IllegalArgumentException("User is not authorized to approve this request");
        }

        // Record decision on level
        ApprovalLevelDecision decision = getCurrentLevelDecision()
                .orElseThrow(() -> new IllegalStateException("No decision found for current level"));
        decision.approve(approverUserId, comments);

        // Record history
        historyEntries.add(ApprovalHistoryEntry.approved(currentLevel, approverUserId, comments));

        // State transition
        if (isAtFinalLevel()) {
            complete(ApprovalStatus.APPROVED);
        } else {
            moveToNextLevel();
        }
    }

    /**
     * Reject at the current level. The aggregate validates and manages all state.
     * <p>
     * This method:
     * - Validates the request is not already completed
     * - Validates the user is authorized to approve at the current level
     * - Records the decision on the level
     * - Records history
     * - Saves rejection reason as a comment
     * - Completes the request as rejected (chain stops)
     *
     * @param approverUserId The user ID performing the rejection
     * @param reason         The reason for rejection (required)
     * @param comments       Optional additional comments
     * @throws IllegalStateException    if already completed
     * @throws IllegalArgumentException if user not authorized or reason is blank
     */
    public void reject(Long approverUserId, String reason, String comments) {
        // Validation
        if (isCompleted()) {
            throw new IllegalStateException("Approval request is already completed");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        if (!isExpectedApprover(approverUserId)) {
            if (isApproverAtAnyLevel(approverUserId)) {
                throw new IllegalArgumentException("Cannot reject out of order - not at current level");
            }
            throw new IllegalArgumentException("User is not authorized to reject this request");
        }

        // Record decision on level
        ApprovalLevelDecision decision = getCurrentLevelDecision()
                .orElseThrow(() -> new IllegalStateException("No decision found for current level"));
        decision.reject(approverUserId, comments);

        // Record history with reason
        historyEntries.add(ApprovalHistoryEntry.rejected(currentLevel, approverUserId, reason));

        // Save rejection reason as a comment
        this.comments.add(ApprovalCommentEntry.rejectionReason(approverUserId, reason));

        // Complete the request as rejected
        complete(ApprovalStatus.REJECTED);
    }

    /**
     * Add a discussion comment to the approval request.
     *
     * @param commenterUserId The user ID adding the comment
     * @param text            The comment text
     * @throws IllegalArgumentException if text is blank
     */
    public void addComment(Long commenterUserId, String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Comment text cannot be blank");
        }
        comments.add(ApprovalCommentEntry.discussion(commenterUserId, text));
    }

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
     * Get the decision for the current level.
     *
     * @return Optional containing the current level decision, or empty if not found
     */
    private Optional<ApprovalLevelDecision> getCurrentLevelDecision() {
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
    private boolean isExpectedApprover(Long userId) {
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
    private boolean isApproverAtAnyLevel(Long userId) {
        return levelDecisions.stream()
                .anyMatch(d -> d.getExpectedApproverUserId().equals(userId));
    }

    /**
     * Get unmodifiable view of level decisions.
     * Clients cannot modify the decisions directly - must use aggregate methods.
     */
    public List<ApprovalLevelDecision> getLevelDecisions() {
        return Collections.unmodifiableList(levelDecisions);
    }

    /**
     * Get unmodifiable view of history entries.
     */
    public List<ApprovalHistoryEntry> getHistoryEntries() {
        return Collections.unmodifiableList(historyEntries);
    }

    /**
     * Get unmodifiable view of comments.
     */
    public List<ApprovalCommentEntry> getComments() {
        return Collections.unmodifiableList(comments);
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Move to the next approval level.
     */
    private void moveToNextLevel() {
        if (currentLevel < totalLevels) {
            currentLevel++;
        }
    }

    /**
     * Complete the approval request with final status.
     *
     * @param finalStatus The final status (APPROVED or REJECTED)
     */
    private void complete(ApprovalStatus finalStatus) {
        this.status = finalStatus;
        this.completedAt = LocalDateTime.now();
    }

    // ==================== GETTERS ====================
    // No setters - JPA uses field access since @Id is on field
    // All state changes go through domain methods

    public Long getId() {
        return id;
    }

    public EntityType getEntityType() {
        return entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public Integer getCurrentLevel() {
        return currentLevel;
    }

    public Integer getTotalLevels() {
        return totalLevels;
    }

    public ApprovalStatus getStatus() {
        return status;
    }

    public User getSubmittedBy() {
        return submittedBy;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}
