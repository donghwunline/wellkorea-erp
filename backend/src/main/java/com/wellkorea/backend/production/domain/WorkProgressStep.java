package com.wellkorea.backend.production.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Individual work step instance within a WorkProgressSheet.
 * Tracks progress, timing, and outsourcing details for one manufacturing step.
 */
@Entity
@Table(name = "work_progress_steps")
public class WorkProgressStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sheet_id", nullable = false)
    private WorkProgressSheet sheet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "step_template_id", nullable = false)
    private WorkProgressStepTemplate stepTemplate;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "step_name", nullable = false, length = 100)
    private String stepName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StepStatus status = StepStatus.NOT_STARTED;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "completed_by_id")
    private Long completedById;

    @Column(name = "estimated_hours", precision = 5, scale = 2)
    private BigDecimal estimatedHours;

    @Column(name = "actual_hours", precision = 5, scale = 2)
    private BigDecimal actualHours;

    @Column(name = "is_outsourced", nullable = false)
    private boolean outsourced = false;

    @Column(name = "outsource_vendor_id")
    private Long outsourceVendorId;

    @Column(name = "outsource_eta")
    private LocalDate outsourceEta;

    @Column(name = "outsource_cost", precision = 12, scale = 2)
    private BigDecimal outsourceCost;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

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
     * Start work on this step. Updates status and records start time.
     */
    public void startWork() {
        if (this.status == StepStatus.COMPLETED || this.status == StepStatus.SKIPPED) {
            throw new IllegalStateException("Cannot start work on a completed or skipped step");
        }
        this.status = StepStatus.IN_PROGRESS;
        this.startedAt = Instant.now();

        // Update sheet status if this is the first step to start
        if (sheet != null && sheet.getStatus() == SheetStatus.NOT_STARTED) {
            sheet.setStatus(SheetStatus.IN_PROGRESS);
            sheet.setStartedAt(Instant.now());
        }
    }

    /**
     * Complete this step. Updates status, records completion time and user.
     *
     * @param userId      ID of the user completing the step
     * @param actualHours Actual hours spent on this step (optional)
     */
    public void complete(Long userId, BigDecimal actualHours) {
        if (userId == null) {
            throw new IllegalArgumentException("Completed by user ID is required");
        }
        this.status = StepStatus.COMPLETED;
        this.completedAt = Instant.now();
        this.completedById = userId;
        this.actualHours = actualHours;

        // Update sheet status if all steps are completed
        if (sheet != null) {
            sheet.checkAndUpdateCompletionStatus();
        }
    }

    /**
     * Skip this step (e.g., not applicable for this product).
     */
    public void skip() {
        this.status = StepStatus.SKIPPED;
        this.completedAt = Instant.now();

        // Update sheet status if all steps are completed/skipped
        if (sheet != null) {
            sheet.checkAndUpdateCompletionStatus();
        }
    }

    /**
     * Mark this step as outsourced to an external vendor.
     *
     * @param vendorId ID of the outsource vendor company
     * @param eta      Expected completion date from vendor
     * @param cost     Cost charged by vendor
     */
    public void markAsOutsourced(Long vendorId, LocalDate eta, BigDecimal cost) {
        if (vendorId == null) {
            throw new IllegalArgumentException("Outsource vendor ID is required");
        }
        this.outsourced = true;
        this.outsourceVendorId = vendorId;
        this.outsourceEta = eta;
        this.outsourceCost = cost;

        // Start the step when outsourcing
        if (this.status == StepStatus.NOT_STARTED) {
            startWork();
        }
    }

    // ========== Getters and Setters ==========

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public WorkProgressSheet getSheet() {
        return sheet;
    }

    public void setSheet(WorkProgressSheet sheet) {
        this.sheet = sheet;
    }

    public WorkProgressStepTemplate getStepTemplate() {
        return stepTemplate;
    }

    public void setStepTemplate(WorkProgressStepTemplate stepTemplate) {
        this.stepTemplate = stepTemplate;
    }

    public Integer getStepNumber() {
        return stepNumber;
    }

    public void setStepNumber(Integer stepNumber) {
        this.stepNumber = stepNumber;
    }

    public String getStepName() {
        return stepName;
    }

    public void setStepName(String stepName) {
        this.stepName = stepName;
    }

    public StepStatus getStatus() {
        return status;
    }

    public void setStatus(StepStatus status) {
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

    public Long getCompletedById() {
        return completedById;
    }

    public void setCompletedById(Long completedById) {
        this.completedById = completedById;
    }

    public BigDecimal getEstimatedHours() {
        return estimatedHours;
    }

    public void setEstimatedHours(BigDecimal estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public BigDecimal getActualHours() {
        return actualHours;
    }

    public void setActualHours(BigDecimal actualHours) {
        this.actualHours = actualHours;
    }

    public boolean isOutsourced() {
        return outsourced;
    }

    public void setOutsourced(boolean outsourced) {
        this.outsourced = outsourced;
    }

    public Long getOutsourceVendorId() {
        return outsourceVendorId;
    }

    public void setOutsourceVendorId(Long outsourceVendorId) {
        this.outsourceVendorId = outsourceVendorId;
    }

    public LocalDate getOutsourceEta() {
        return outsourceEta;
    }

    public void setOutsourceEta(LocalDate outsourceEta) {
        this.outsourceEta = outsourceEta;
    }

    public BigDecimal getOutsourceCost() {
        return outsourceCost;
    }

    public void setOutsourceCost(BigDecimal outsourceCost) {
        this.outsourceCost = outsourceCost;
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
}
