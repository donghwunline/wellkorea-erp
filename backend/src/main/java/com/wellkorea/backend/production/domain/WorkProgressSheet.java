package com.wellkorea.backend.production.domain;

import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.project.domain.Project;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Work progress sheet tracking production for one product within a project.
 * One sheet per (project, product) combination.
 * Contains multiple work progress steps that track the manufacturing process.
 */
@Entity
@Table(name = "work_progress_sheets",
        uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "product_id"}))
public class WorkProgressSheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Column(name = "sequence", nullable = false)
    private Integer sequence = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SheetStatus status = SheetStatus.NOT_STARTED;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "sheet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("stepNumber ASC")
    private List<WorkProgressStep> steps = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // ========== Business Methods ==========

    /**
     * Calculate overall progress percentage based on step completion.
     * Completed and Skipped steps count as 100%.
     * IN_PROGRESS steps count as 50%.
     * NOT_STARTED steps count as 0%.
     *
     * @return Progress percentage (0-100)
     */
    public int calculateProgressPercentage() {
        if (steps == null || steps.isEmpty()) {
            return 0;
        }

        double totalWeight = 0;
        for (WorkProgressStep step : steps) {
            switch (step.getStatus()) {
                case COMPLETED, SKIPPED -> totalWeight += 1.0;
                case IN_PROGRESS -> totalWeight += 0.5;
                case NOT_STARTED -> totalWeight += 0.0;
            }
        }

        return (int) Math.floor((totalWeight / steps.size()) * 100);
    }

    /**
     * Check if all steps are completed/skipped and update sheet status.
     */
    public void checkAndUpdateCompletionStatus() {
        if (steps == null || steps.isEmpty()) {
            return;
        }

        boolean allCompleted = steps.stream()
                .allMatch(step -> step.getStatus() == StepStatus.COMPLETED ||
                        step.getStatus() == StepStatus.SKIPPED);

        if (allCompleted) {
            this.status = SheetStatus.COMPLETED;
            this.completedAt = Instant.now();
        }
    }

    /**
     * Get all outsourced steps.
     *
     * @return List of steps that are outsourced
     */
    public List<WorkProgressStep> getOutsourcedSteps() {
        if (steps == null) {
            return List.of();
        }
        return steps.stream()
                .filter(WorkProgressStep::isOutsourced)
                .collect(Collectors.toList());
    }

    /**
     * Get the current step (first non-completed step).
     *
     * @return Current step or null if all completed
     */
    public WorkProgressStep getCurrentStep() {
        if (steps == null || steps.isEmpty()) {
            return null;
        }
        return steps.stream()
                .filter(step -> step.getStatus() != StepStatus.COMPLETED &&
                        step.getStatus() != StepStatus.SKIPPED)
                .findFirst()
                .orElse(null);
    }

    /**
     * Add a step to this sheet.
     */
    public void addStep(WorkProgressStep step) {
        steps.add(step);
        step.setSheet(this);
    }

    // ========== Getters and Setters ==========

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getSequence() {
        return sequence;
    }

    public void setSequence(Integer sequence) {
        this.sequence = sequence;
    }

    public SheetStatus getStatus() {
        return status;
    }

    public void setStatus(SheetStatus status) {
        this.status = status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<WorkProgressStep> getSteps() {
        return steps;
    }

    public void setSteps(List<WorkProgressStep> steps) {
        this.steps = steps;
    }
}
