package com.wellkorea.backend.quotation.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.quotation.api.dto.command.CreateQuotationRequest;
import com.wellkorea.backend.quotation.api.dto.command.QuotationCommandResult;
import com.wellkorea.backend.quotation.api.dto.command.UpdateQuotationRequest;
import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationSummaryView;
import com.wellkorea.backend.quotation.application.*;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    public QuotationController(QuotationCommandService commandService,
                               QuotationQueryService queryService,
                               QuotationPdfService pdfService,
                               QuotationEmailService emailService) {
        this.commandService = commandService;
        this.queryService = queryService;
        this.pdfService = pdfService;
        this.emailService = emailService;
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * List quotations with optional filters.
     * GET /api/quotations
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<Page<QuotationSummaryView>>> listQuotations(@RequestParam(required = false) QuotationStatus status,
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
    public ResponseEntity<ApiResponse<QuotationCommandResult>> createQuotation(@Valid @RequestBody CreateQuotationRequest request,
                                                                               @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();

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
    public ResponseEntity<ApiResponse<QuotationCommandResult>> updateQuotation(@PathVariable Long id,
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
    public ResponseEntity<ApiResponse<QuotationCommandResult>> submitForApproval(@PathVariable Long id,
                                                                                 @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
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
    public ResponseEntity<ApiResponse<QuotationCommandResult>> createNewVersion(@PathVariable Long id,
                                                                                @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
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
     * Validation (non-DRAFT status) is handled by PdfService.
     */
    @PostMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long id) {
        byte[] pdfBytes = pdfService.generatePdf(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=quotation-" + id + ".pdf")
                .body(pdfBytes);
    }

    /**
     * Send revision notification email for a quotation.
     * POST /api/quotations/{id}/send-revision-notification
     * <p>
     * Admin can use this endpoint to notify the customer about a quotation.
     * Only quotations in APPROVED, SENDING, SENT, or ACCEPTED status can be sent.
     * If the quotation is APPROVED, it will be marked as SENDING before email,
     * then marked as SENT after successful email delivery.
     */
    @PostMapping("/{id}/send-revision-notification")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<String>> sendRevisionNotification(@PathVariable Long id) {
        // Mark as SENDING before attempting to send email
        if (emailService.needsStatusUpdateBeforeSend(id)) {
            commandService.markAsSending(id);
        }

        // EmailService validates status and sends email
        emailService.sendRevisionNotification(id);

        // Mark as SENT after successful email delivery
        if (emailService.needsStatusUpdateAfterSend(id)) {
            commandService.markAsSent(id);
        }

        return ResponseEntity.ok(ApiResponse.success("Revision notification sent successfully"));
    }

    /**
     * Accept a quotation (customer acceptance recorded by internal staff).
     * POST /api/quotations/{id}/accept
     * <p>
     * Only quotations in APPROVED or SENT status can be accepted.
     * Publishes QuotationAcceptedEvent which triggers project activation.
     */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationCommandResult>> acceptQuotation(@PathVariable Long id,
                                                                               @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        Long quotationId = commandService.markAsAccepted(id, userId);
        QuotationCommandResult result = QuotationCommandResult.accepted(quotationId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
