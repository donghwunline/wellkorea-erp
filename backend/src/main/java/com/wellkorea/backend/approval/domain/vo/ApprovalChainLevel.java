package com.wellkorea.backend.approval.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.util.Objects;

/**
 * Embeddable value object representing a level in an approval chain.
 * Each level specifies the approver user (e.g., 팀장, 부서장, 사장).
 * <p>
 * This class is part of the ApprovalChainTemplate aggregate.
 * It cannot exist independently and its lifecycle is managed by the aggregate root.
 * <p>
 * Note: Uses approverUserId (Long) instead of User reference because
 * JPA @Embeddable cannot have @ManyToOne relationships.
 * The User is resolved at the application layer when needed.
 */
@Embeddable
public class ApprovalChainLevel {

    @Column(name = "level_order", nullable = false)
    private Integer levelOrder;

    @Column(name = "level_name", nullable = false, length = 100)
    private String levelName;

    @Column(name = "approver_user_id", nullable = false)
    private Long approverUserId;

    @Column(name = "is_required", nullable = false)
    private boolean required = true;

    /**
     * Default constructor for JPA.
     * Required by JPA specification for embeddable classes.
     */
    protected ApprovalChainLevel() {
        // JPA constructor
    }

    /**
     * Create a new approval chain level.
     *
     * @param levelOrder     The order in the approval chain (1, 2, 3...)
     * @param levelName      Display name (e.g., "팀장", "부서장", "사장")
     * @param approverUserId ID of the user who can approve at this level
     * @param required       Whether this level can be skipped
     */
    public ApprovalChainLevel(Integer levelOrder, String levelName, Long approverUserId, boolean required) {
        this.levelOrder = Objects.requireNonNull(levelOrder, "Level order cannot be null");
        this.levelName = Objects.requireNonNull(levelName, "Level name cannot be null");
        this.approverUserId = Objects.requireNonNull(approverUserId, "Approver user ID cannot be null");
        this.required = required;
    }

    public Integer getLevelOrder() {
        return levelOrder;
    }

    public String getLevelName() {
        return levelName;
    }

    public Long getApproverUserId() {
        return approverUserId;
    }

    public boolean isRequired() {
        return required;
    }

    /**
     * Two ApprovalChainLevel objects are equal if they have the same levelOrder.
     * This allows Set/List operations to work correctly within the aggregate.
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ApprovalChainLevel that)) return false;
        return Objects.equals(levelOrder, that.levelOrder);
    }

    @Override
    public int hashCode() {
        return Objects.hash(levelOrder);
    }

    @Override
    public String toString() {
        return "ApprovalChainLevel{" +
                "levelOrder=" + levelOrder +
                ", levelName='" + levelName + '\'' +
                ", approverUserId=" + approverUserId +
                ", required=" + required +
                '}';
    }
}
