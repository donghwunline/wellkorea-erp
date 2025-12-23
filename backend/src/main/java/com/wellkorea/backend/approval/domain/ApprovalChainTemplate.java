package com.wellkorea.backend.approval.domain;

import com.wellkorea.backend.approval.domain.vo.ApprovalChainLevel;
import com.wellkorea.backend.approval.domain.vo.EntityType;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * ApprovalChainTemplate is the aggregate root for approval chain configuration.
 * It defines the approval chain for an entity type (e.g., Quotation → 팀장 → 부서장 → 사장).
 * <p>
 * This aggregate manages the lifecycle of its ApprovalChainLevel collection elements.
 * Levels cannot exist independently and are always accessed through the template.
 */
@Entity
@Table(name = "approval_chain_templates")
public class ApprovalChainTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, unique = true, length = 50)
    private EntityType entityType;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Ordered list of approval levels in this chain.
     * Persisted to approval_chain_levels table via @ElementCollection.
     * JPA automatically manages the collection table for CRUD operations.
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "approval_chain_levels",
            joinColumns = @JoinColumn(name = "chain_template_id")
    )
    @OrderBy("levelOrder ASC")
    private List<ApprovalChainLevel> levels = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ==================== BUSINESS METHODS ====================

    /**
     * Get total number of levels in the chain.
     */
    public int getTotalLevels() {
        return levels.size();
    }

    /**
     * Check if chain has any levels configured.
     */
    public boolean hasLevels() {
        return !levels.isEmpty();
    }

    /**
     * Replace all levels in the chain with new levels.
     * This is the only way to modify levels - enforcing aggregate boundary.
     *
     * @param newLevels List of new levels to set
     * @throws IllegalArgumentException if levels are null or have invalid ordering
     */
    public void replaceAllLevels(List<ApprovalChainLevel> newLevels) {
        Objects.requireNonNull(newLevels, "Levels cannot be null");
        validateLevelOrders(newLevels);

        this.levels.clear();
        this.levels.addAll(newLevels);
    }

    /**
     * Get unmodifiable view of levels.
     * Clients cannot modify the levels directly - must use replaceAllLevels().
     */
    public List<ApprovalChainLevel> getLevels() {
        return Collections.unmodifiableList(levels);
    }

    /**
     * Get approver user ID for a specific level order.
     *
     * @param levelOrder The level order (1-based)
     * @return The approver user ID, or null if level not found
     */
    public Long getApproverUserIdAt(int levelOrder) {
        return levels.stream()
                .filter(l -> l.getLevelOrder() == levelOrder)
                .map(ApprovalChainLevel::getApproverUserId)
                .findFirst()
                .orElse(null);
    }

    private void validateLevelOrders(List<ApprovalChainLevel> levelsToValidate) {
        if (levelsToValidate.isEmpty()) {
            return; // Empty is valid (admin might clear levels)
        }

        // Verify sequential ordering starting from 1
        List<Integer> orders = levelsToValidate.stream()
                .map(ApprovalChainLevel::getLevelOrder)
                .sorted()
                .toList();

        for (int i = 0; i < orders.size(); i++) {
            if (orders.get(i) != i + 1) {
                throw new IllegalArgumentException("Level orders must be sequential starting from 1");
            }
        }
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
