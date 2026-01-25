package com.wellkorea.backend.invoice.api;

import com.wellkorea.backend.invoice.api.dto.command.CreateInvoiceRequest;
import com.wellkorea.backend.invoice.api.dto.command.InvoiceCommandResult;
import com.wellkorea.backend.invoice.api.dto.command.IssueInvoiceRequest;
import com.wellkorea.backend.invoice.api.dto.command.PaymentCommandResult;
import com.wellkorea.backend.invoice.api.dto.command.RecordPaymentRequest;
import com.wellkorea.backend.invoice.api.dto.query.InvoiceDetailView;
import com.wellkorea.backend.invoice.api.dto.query.InvoiceSummaryView;
import com.wellkorea.backend.invoice.application.InvoiceCommandService;
import com.wellkorea.backend.invoice.application.InvoiceQueryService;
import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.dto.AuthenticatedUser;
import com.wellkorea.backend.shared.storage.api.dto.AttachmentView;
import com.wellkorea.backend.shared.storage.api.dto.UploadUrlRequest;
import com.wellkorea.backend.shared.storage.api.dto.UploadUrlResponse;
import com.wellkorea.backend.shared.storage.application.AttachmentService;
import com.wellkorea.backend.shared.storage.domain.AttachmentOwnerType;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST controller for invoice operations.
 * Follows CQRS pattern - uses separate Command and Query services.
 * Command endpoints return only IDs; clients fetch fresh data via query endpoints.
 * <p>
 * Endpoints:
 * - GET    /api/invoices?projectId={projectId}&status={status} - List invoices with optional filters
 * - GET    /api/invoices/{id}       - Get invoice detail
 * - POST   /api/invoices            - Create invoice
 * - POST   /api/invoices/{id}/issue - Issue invoice (with document attachment)
 * - POST   /api/invoices/{id}/cancel - Cancel invoice
 * - POST   /api/invoices/{id}/payments - Record payment
 * - PATCH  /api/invoices/{id}/notes - Update notes
 * - POST   /api/invoices/{id}/document/upload-url - Get presigned URL for document upload
 * - GET    /api/invoices/{id}/document - Get invoice document
 */
@RestController
@RequestMapping("/api")
public class InvoiceController {

    private final InvoiceCommandService commandService;
    private final InvoiceQueryService queryService;
    private final AttachmentService attachmentService;

    public InvoiceController(InvoiceCommandService commandService,
                             InvoiceQueryService queryService,
                             AttachmentService attachmentService) {
        this.commandService = commandService;
        this.queryService = queryService;
        this.attachmentService = attachmentService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List invoices with optional project and status filters.
     * GET /api/invoices?projectId={projectId}&status={status}
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<Page<InvoiceSummaryView>>> listInvoices(@RequestParam(required = false) Long projectId,
                                                                              @RequestParam(required = false) InvoiceStatus status,
                                                                              @PageableDefault(size = 20, sort = "issueDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<InvoiceSummaryView> page = queryService.listInvoices(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * Get invoice detail.
     * GET /api/invoices/{id}
     */
    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<InvoiceDetailView>> getInvoiceDetail(@PathVariable Long id) {
        InvoiceDetailView invoice = queryService.getInvoiceDetail(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    /**
     * Get invoice document.
     * GET /api/invoices/{id}/document
     * <p>
     * Returns the document attachment metadata with download URL.
     * Returns 404 if no document exists.
     */
    @GetMapping("/invoices/{id}/document")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<AttachmentView>> getInvoiceDocument(@PathVariable Long id) {
        // Validate invoice exists
        queryService.validateExists(id);

        Optional<AttachmentView> document = attachmentService.getAttachment(AttachmentOwnerType.INVOICE, id);
        return document
                .map(view -> ResponseEntity.ok(ApiResponse.success(view)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new invoice.
     * Uses distributed lock on quotation to prevent race conditions during concurrent invoice creation.
     */
    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<InvoiceCommandResult>> createInvoice(@Valid @RequestBody CreateInvoiceRequest request,
                                                                           @AuthenticationPrincipal AuthenticatedUser user) {
        Long invoiceId = commandService.createInvoice(request.quotationId(), request, user.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(InvoiceCommandResult.created(invoiceId)));
    }

    /**
     * Issue an invoice with attached document (DRAFT -> ISSUED).
     * <p>
     * This is a 3-step process from the frontend:
     * 1. Call POST /invoices/{id}/document/upload-url to get presigned URL
     * 2. Upload document directly to MinIO using presigned URL
     * 3. Call this endpoint with document info to atomically register document and issue invoice
     */
    @PostMapping("/invoices/{id}/issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<InvoiceCommandResult>> issueInvoice(
            @PathVariable Long id,
            @Valid @RequestBody IssueInvoiceRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        commandService.issueInvoice(id, request, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(InvoiceCommandResult.issued(id)));
    }

    /**
     * Cancel an invoice.
     */
    @PostMapping("/invoices/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<InvoiceCommandResult>> cancelInvoice(@PathVariable Long id) {
        commandService.cancelInvoice(id);
        return ResponseEntity.ok(ApiResponse.success(InvoiceCommandResult.cancelled(id)));
    }

    /**
     * Record a payment against an invoice.
     */
    @PostMapping("/invoices/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<PaymentCommandResult>> recordPayment(@PathVariable Long id,
                                                                           @Valid @RequestBody RecordPaymentRequest request,
                                                                           @AuthenticationPrincipal AuthenticatedUser user) {
        Long paymentId = commandService.recordPayment(id, request, user.getUserId());

        // Get remaining balance after payment
        InvoiceDetailView invoice = queryService.getInvoiceDetail(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(PaymentCommandResult.recorded(
                        paymentId, id, invoice.remainingBalance())));
    }

    /**
     * Update invoice notes.
     */
    @PatchMapping("/invoices/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<InvoiceCommandResult>> updateNotes(@PathVariable Long id,
                                                                         @RequestBody String notes) {
        commandService.updateNotes(id, notes);
        return ResponseEntity.ok(ApiResponse.success(InvoiceCommandResult.updated(id)));
    }

    // ========== DOCUMENT UPLOAD ENDPOINTS ==========

    /**
     * Get presigned URL for invoice document upload.
     * POST /api/invoices/{id}/document/upload-url
     * <p>
     * Returns a presigned URL for direct upload to MinIO.
     * Only JPG, PNG, and PDF files are allowed (imagesOnly=false).
     */
    @PostMapping("/invoices/{id}/document/upload-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<UploadUrlResponse>> getDocumentUploadUrl(
            @PathVariable Long id,
            @Valid @RequestBody UploadUrlRequest request) {

        // Validate invoice exists and is in DRAFT status
        queryService.validateCanIssue(id);

        UploadUrlResponse response = attachmentService.generateUploadUrl(
                AttachmentOwnerType.INVOICE, id,
                request.fileName(), request.fileSize(), request.contentType(),
                false  // allow JPG, PNG, PDF
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
