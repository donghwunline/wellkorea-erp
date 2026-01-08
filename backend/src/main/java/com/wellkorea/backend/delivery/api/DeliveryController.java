package com.wellkorea.backend.delivery.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.delivery.api.dto.command.CreateDeliveryRequest;
import com.wellkorea.backend.delivery.api.dto.command.DeliveryCommandResult;
import com.wellkorea.backend.delivery.api.dto.query.DeliveryDetailView;
import com.wellkorea.backend.delivery.api.dto.query.DeliverySummaryView;
import com.wellkorea.backend.delivery.application.DeliveryCommandService;
import com.wellkorea.backend.delivery.application.DeliveryPdfService;
import com.wellkorea.backend.delivery.application.DeliveryQueryService;
import com.wellkorea.backend.delivery.domain.DeliveryStatus;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for delivery management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * Command endpoints return only IDs; clients fetch fresh data via query endpoints.
 */
@RestController
public class DeliveryController {

    private final DeliveryCommandService commandService;
    private final DeliveryQueryService queryService;
    private final DeliveryPdfService pdfService;
    private final ProjectRepository projectRepository;

    public DeliveryController(DeliveryCommandService commandService,
                              DeliveryQueryService queryService,
                              DeliveryPdfService pdfService,
                              ProjectRepository projectRepository) {
        this.commandService = commandService;
        this.queryService = queryService;
        this.pdfService = pdfService;
        this.projectRepository = projectRepository;
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * List deliveries with optional project and status filters.
     * GET /api/deliveries?projectId={projectId}&status={status}
     */
    @GetMapping("/api/deliveries")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<List<DeliverySummaryView>>> listDeliveries(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) DeliveryStatus status,
            Pageable pageable) {

        // Validate project exists if provided
        if (projectId != null) {
            validateProjectExists(projectId);
        }

        Page<DeliverySummaryView> page = queryService.listDeliveries(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page.getContent()));
    }

    /**
     * Get delivery by ID.
     * GET /api/deliveries/{id}
     */
    @GetMapping("/api/deliveries/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<DeliveryDetailView>> getDelivery(@PathVariable Long id) {
        DeliveryDetailView delivery = queryService.getDeliveryDetail(id);
        return ResponseEntity.ok(ApiResponse.success(delivery));
    }

    // ==================== COMMAND ENDPOINTS ====================

    /**
     * Create a new delivery for a project.
     * POST /api/deliveries?projectId={projectId}
     * <p>
     * Validates that:
     * - Project exists and has an approved quotation
     * - All products are in the quotation
     * - Quantities don't exceed remaining deliverable amounts
     */
    @PostMapping("/api/deliveries")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<DeliveryCommandResult>> createDelivery(
            @RequestParam Long projectId,
            @Valid @RequestBody CreateDeliveryRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        Long deliveryId = commandService.createDelivery(projectId, request, userId);
        DeliveryCommandResult result = DeliveryCommandResult.created(deliveryId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
    }

    // ==================== SIDE-EFFECT ENDPOINTS ====================

    /**
     * Generate transaction statement PDF for a delivery.
     * GET /api/deliveries/{id}/statement
     * <p>
     * Returns a PDF document listing all delivered items for the delivery.
     */
    @GetMapping("/api/deliveries/{id}/statement")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<byte[]> generateStatement(@PathVariable Long id) {
        byte[] pdfBytes = pdfService.generateStatement(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=delivery-statement-" + id + ".pdf")
                .body(pdfBytes);
    }

    // ==================== PRIVATE HELPERS ====================

    private void validateProjectExists(Long projectId) {
        projectRepository.findByIdAndIsDeletedFalse(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }
}
