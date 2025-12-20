package com.wellkorea.backend.quotation.api;

import com.wellkorea.backend.auth.api.CurrentToken;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.quotation.api.dto.command.CreateQuotationRequest;
import com.wellkorea.backend.quotation.api.dto.command.UpdateQuotationRequest;
import com.wellkorea.backend.quotation.api.dto.command.QuotationCommandResult;
import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationSummaryView;
import com.wellkorea.backend.quotation.application.*;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.exception.BusinessException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for quotation management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * Command endpoints return only IDs; clients fetch fresh data via query endpoints.
 */
@RestController
@RequestMapping("/api/quotations")
public class QuotationController {

    private final QuotationCommandService commandService;
    private final QuotationQueryService queryService;
    private final QuotationPdfService pdfService;
    private final QuotationEmailService emailService;
    private final JwtTokenProvider jwtTokenProvider;

    public QuotationController(
            QuotationCommandService commandService,
            QuotationQueryService queryService,
            QuotationPdfService pdfService,
            QuotationEmailService emailService,
            JwtTokenProvider jwtTokenProvider) {
        this.commandService = commandService;
        this.queryService = queryService;
        this.pdfService = pdfService;
        this.emailService = emailService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * List quotations with optional filters.
     * GET /api/quotations
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<Page<QuotationSummaryView>>> listQuotations(
            @RequestParam(required = false) QuotationStatus status,
            @RequestParam(required = false) Long projectId,
            Pageable pageable) {

        Page<QuotationSummaryView> quotations = queryService.listQuotations(status, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.success(quotations));
    }

    /**
     * Get quotation by ID.
     * GET /api/quotations/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationDetailView>> getQuotation(@PathVariable Long id) {
        QuotationDetailView quotation = queryService.getQuotationDetail(id);
        return ResponseEntity.ok(ApiResponse.success(quotation));
    }

    // ==================== COMMAND ENDPOINTS ====================

    /**
     * Create a new quotation.
     * POST /api/quotations
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationCommandResult>> createQuotation(
            @Valid @RequestBody CreateQuotationRequest request,
            @CurrentToken String token) {

        Long userId = jwtTokenProvider.getUserId(token);

        CreateQuotationCommand command = new CreateQuotationCommand(
                request.projectId(),
                request.validityDays(),
                request.notes(),
                request.lineItems().stream()
                        .map(li -> new LineItemCommand(
                                li.productId(),
                                li.quantity(),
                                li.unitPrice(),
                                li.notes()))
                        .toList()
        );

        Long quotationId = commandService.createQuotation(command, userId);
        QuotationCommandResult result = QuotationCommandResult.created(quotationId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
    }

    /**
     * Update a quotation.
     * PUT /api/quotations/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationCommandResult>> updateQuotation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuotationRequest request) {

        UpdateQuotationCommand command = new UpdateQuotationCommand(
                request.validityDays(),
                request.notes(),
                request.lineItems().stream()
                        .map(li -> new LineItemCommand(
                                li.productId(),
                                li.quantity(),
                                li.unitPrice(),
                                li.notes()))
                        .toList()
        );

        Long quotationId = commandService.updateQuotation(id, command);
        QuotationCommandResult result = QuotationCommandResult.updated(quotationId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Submit quotation for approval.
     * POST /api/quotations/{id}/submit
     * <p>
     * The approval request is created automatically via event-driven architecture.
     * QuotationCommandService publishes QuotationSubmittedEvent, which is handled by
     * ApprovalEventHandler within the same transaction.
     */
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationCommandResult>> submitForApproval(
            @PathVariable Long id,
            @CurrentToken String token) {

        Long userId = jwtTokenProvider.getUserId(token);
        Long quotationId = commandService.submitForApproval(id, userId);
        QuotationCommandResult result = QuotationCommandResult.submitted(quotationId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Create a new version from an existing quotation.
     * POST /api/quotations/{id}/versions
     */
    @PostMapping("/{id}/versions")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationCommandResult>> createNewVersion(
            @PathVariable Long id,
            @CurrentToken String token) {

        Long userId = jwtTokenProvider.getUserId(token);
        Long newVersionId = commandService.createNewVersion(id, userId);
        QuotationCommandResult result = QuotationCommandResult.versionCreated(newVersionId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(result));
    }

    // ==================== SIDE-EFFECT ENDPOINTS ====================

    /**
     * Generate PDF for a quotation.
     * POST /api/quotations/{id}/pdf
     * <p>
     * This is a query-like operation (returns data, no state change) but uses POST
     * because it generates a resource on-demand.
     */
    @PostMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long id) {
        if (!queryService.canGeneratePdf(id)) {
            throw new BusinessException("PDF can only be generated for non-DRAFT quotations");
        }

        Quotation quotation = queryService.getQuotationEntity(id);
        byte[] pdfBytes = pdfService.generatePdf(quotation);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=quotation-" + id + ".pdf")
                .body(pdfBytes);
    }

    /**
     * Send revision notification email for a quotation.
     * POST /api/quotations/{id}/send-revision-notification
     * <p>
     * Admin can use this endpoint to notify the customer about a new quotation version.
     */
    @PostMapping("/{id}/send-revision-notification")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> sendRevisionNotification(@PathVariable Long id) {
        Quotation quotation = queryService.getQuotationEntity(id);
        emailService.sendRevisionNotification(quotation);

        return ResponseEntity.ok(ApiResponse.success("Revision notification sent successfully"));
    }
}
