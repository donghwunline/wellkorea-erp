package com.wellkorea.backend.production.application;

import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.product.infrastructure.repository.ProductRepository;
import com.wellkorea.backend.production.api.dto.command.CreateWorkProgressSheetRequest;
import com.wellkorea.backend.production.api.dto.command.UpdateStepStatusRequest;
import com.wellkorea.backend.production.domain.*;
import com.wellkorea.backend.production.infrastructure.persistence.WorkProgressSheetRepository;
import com.wellkorea.backend.production.infrastructure.persistence.WorkProgressStepRepository;
import com.wellkorea.backend.production.infrastructure.persistence.WorkProgressStepTemplateRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Command service for work progress (CQRS pattern - write operations).
 */
@Service
@Transactional
public class WorkProgressCommandService {

    private final WorkProgressSheetRepository sheetRepository;
    private final WorkProgressStepRepository stepRepository;
    private final WorkProgressStepTemplateRepository stepTemplateRepository;
    private final ProjectRepository projectRepository;
    private final ProductRepository productRepository;

    public WorkProgressCommandService(
            WorkProgressSheetRepository sheetRepository,
            WorkProgressStepRepository stepRepository,
            WorkProgressStepTemplateRepository stepTemplateRepository,
            ProjectRepository projectRepository,
            ProductRepository productRepository
    ) {
        this.sheetRepository = sheetRepository;
        this.stepRepository = stepRepository;
        this.stepTemplateRepository = stepTemplateRepository;
        this.projectRepository = projectRepository;
        this.productRepository = productRepository;
    }

    /**
     * Create a new work progress sheet for a project-product combination.
     * Steps are automatically created from product type templates.
     *
     * @param request The creation request
     * @return The created sheet ID
     */
    public Long createSheet(CreateWorkProgressSheetRequest request) {
        // Validate project exists
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new BusinessException("Project not found with ID: " + request.projectId()));

        // Validate product exists
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new BusinessException("Product not found with ID: " + request.productId()));

        // Check for duplicate project-product combination
        if (sheetRepository.existsByProjectIdAndProductId(request.projectId(), request.productId())) {
            throw new BusinessException("Work progress sheet already exists for this project-product combination");
        }

        // Create sheet
        WorkProgressSheet sheet = new WorkProgressSheet();
        sheet.setProject(project);
        sheet.setProduct(product);
        sheet.setQuantity(request.quantity() != null ? request.quantity() : 1);
        sheet.setSequence(request.sequence() != null ? request.sequence() : sheetRepository.getNextSequence(request.projectId()));
        sheet.setNotes(request.notes());
        sheet.setStatus(SheetStatus.NOT_STARTED);

        sheet = sheetRepository.save(sheet);

        // Create steps from templates
        createStepsFromTemplates(sheet, product.getProductType().getId());

        return sheet.getId();
    }

    /**
     * Update a work progress step status.
     *
     * @param sheetId The sheet ID
     * @param stepId  The step ID
     * @param request The update request
     * @param userId  The user performing the update
     * @return The updated step ID
     */
    public Long updateStepStatus(Long sheetId, Long stepId, UpdateStepStatusRequest request, Long userId) {
        WorkProgressStep step = stepRepository.findBySheetIdAndId(sheetId, stepId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkProgressStep", stepId));

        // Update status based on request
        switch (request.status()) {
            case IN_PROGRESS -> {
                if (Boolean.TRUE.equals(request.isOutsourced())) {
                    step.markAsOutsourced(
                            request.outsourceVendorId(),
                            request.outsourceEta(),
                            request.outsourceCost()
                    );
                } else {
                    step.startWork();
                }
            }
            case COMPLETED -> step.complete(userId, request.actualHours());
            case SKIPPED -> step.skip();
            case NOT_STARTED -> {
                // Reset step
                step.setStatus(StepStatus.NOT_STARTED);
                step.setStartedAt(null);
                step.setCompletedAt(null);
                step.setCompletedById(null);
            }
        }

        // Update notes if provided
        if (request.notes() != null) {
            step.setNotes(request.notes());
        }

        // Update outsourcing details if provided
        if (Boolean.TRUE.equals(request.isOutsourced()) && request.status() != StepStatus.IN_PROGRESS) {
            step.setOutsourced(true);
            step.setOutsourceVendorId(request.outsourceVendorId());
            step.setOutsourceEta(request.outsourceEta());
            step.setOutsourceCost(request.outsourceCost());
        }

        stepRepository.save(step);
        return step.getId();
    }

    /**
     * Delete a work progress sheet and all its steps.
     */
    public void deleteSheet(Long sheetId) {
        if (!sheetRepository.existsById(sheetId)) {
            throw new ResourceNotFoundException("WorkProgressSheet", sheetId);
        }
        sheetRepository.deleteById(sheetId);
    }

    /**
     * Create steps from product type templates.
     */
    private void createStepsFromTemplates(WorkProgressSheet sheet, Long productTypeId) {
        List<WorkProgressStepTemplate> templates =
                stepTemplateRepository.findByProductTypeIdOrderByStepNumber(productTypeId);

        for (WorkProgressStepTemplate template : templates) {
            WorkProgressStep step = new WorkProgressStep();
            step.setSheet(sheet);
            step.setStepTemplate(template);
            step.setStepNumber(template.getStepNumber());
            step.setStepName(template.getStepName());
            step.setEstimatedHours(template.getEstimatedHours());
            step.setStatus(StepStatus.NOT_STARTED);

            stepRepository.save(step);
        }
    }
}
