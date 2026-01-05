package com.wellkorea.backend.production.application;

import com.wellkorea.backend.production.api.dto.query.ProjectProductionSummaryView;
import com.wellkorea.backend.production.api.dto.query.WorkProgressSheetView;
import com.wellkorea.backend.production.api.dto.query.WorkProgressStepView;
import com.wellkorea.backend.production.infrastructure.mapper.WorkProgressMapper;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for work progress (CQRS pattern - read operations).
 * Uses MyBatis mapper for optimized queries with JOINs.
 */
@Service
@Transactional(readOnly = true)
public class WorkProgressQueryService {

    private final WorkProgressMapper workProgressMapper;

    public WorkProgressQueryService(WorkProgressMapper workProgressMapper) {
        this.workProgressMapper = workProgressMapper;
    }

    /**
     * Get all work progress sheets for a project.
     */
    public List<WorkProgressSheetView> getSheetsByProjectId(Long projectId) {
        return workProgressMapper.findSheetsByProjectId(projectId);
    }

    /**
     * Get a work progress sheet by ID with all steps.
     * Uses two queries: one for sheet, one for steps, then combines.
     */
    public WorkProgressSheetView getSheetById(Long id) {
        WorkProgressSheetView sheet = workProgressMapper.findSheetById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkProgressSheet", id));

        // Fetch steps separately and create a new view with steps
        List<WorkProgressStepView> steps = workProgressMapper.findStepsBySheetId(id);

        return new WorkProgressSheetView(
                sheet.id(),
                sheet.projectId(),
                sheet.jobCode(),
                sheet.productId(),
                sheet.productName(),
                sheet.productSku(),
                sheet.quantity(),
                sheet.sequence(),
                sheet.status(),
                sheet.startedAt(),
                sheet.completedAt(),
                sheet.notes(),
                sheet.progressPercentage(),
                sheet.totalSteps(),
                sheet.completedSteps(),
                steps,
                sheet.createdAt(),
                sheet.updatedAt()
        );
    }

    /**
     * Get a step by sheet ID and step ID.
     */
    public WorkProgressStepView getStep(Long sheetId, Long stepId) {
        return workProgressMapper.findStepBySheetIdAndId(sheetId, stepId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkProgressStep", stepId));
    }

    /**
     * Get project production summary with aggregated progress.
     */
    public ProjectProductionSummaryView getProjectSummary(Long projectId) {
        return workProgressMapper.findProjectSummary(projectId)
                .orElse(ProjectProductionSummaryView.empty(projectId));
    }

    /**
     * Get all outsourced steps for a project.
     */
    public List<WorkProgressStepView> getOutsourcedSteps(Long projectId) {
        return workProgressMapper.findOutsourcedStepsByProjectId(projectId);
    }
}
