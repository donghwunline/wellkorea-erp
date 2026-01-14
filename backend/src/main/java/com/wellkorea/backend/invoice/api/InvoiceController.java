package com.wellkorea.backend.invoice.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.invoice.api.dto.command.CreateInvoiceRequest;
import com.wellkorea.backend.invoice.api.dto.command.InvoiceCommandResult;
import com.wellkorea.backend.invoice.api.dto.command.PaymentCommandResult;
import com.wellkorea.backend.invoice.api.dto.command.RecordPaymentRequest;
import com.wellkorea.backend.invoice.api.dto.query.InvoiceDetailView;
import com.wellkorea.backend.invoice.api.dto.query.InvoiceSummaryView;
import com.wellkorea.backend.invoice.application.InvoiceCommandService;
import com.wellkorea.backend.invoice.application.InvoiceQueryService;
import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.shared.dto.ApiResponse;
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

/**
 * REST controller for invoice operations.
 * Follows CQRS pattern - uses separate Command and Query services.
 * Command endpoints return only IDs; clients fetch fresh data via query endpoints.
 * <p>
 * Endpoints:
 * - GET    /api/invoices?projectId={projectId}&status={status} - List invoices with optional filters
 * - GET    /api/invoices/{id}       - Get invoice detail
 * - POST   /api/invoices            - Create invoice
 * - POST   /api/invoices/{id}/issue - Issue invoice
 * - POST   /api/invoices/{id}/cancel - Cancel invoice
 * - POST   /api/invoices/{id}/payments - Record payment
 * - PATCH  /api/invoices/{id}/notes - Update notes
 */
@RestController
@RequestMapping("/api")
public class InvoiceController {

    private final InvoiceCommandService commandService;
    private final InvoiceQueryService queryService;

    public InvoiceController(InvoiceCommandService commandService,
                             InvoiceQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
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

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new invoice.
     * Uses distributed lock on project to prevent race conditions during concurrent invoice creation.
     */
    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<InvoiceCommandResult>> createInvoice(@Valid @RequestBody CreateInvoiceRequest request,
                                                                           @AuthenticationPrincipal AuthenticatedUser user) {
        Long invoiceId = commandService.createInvoice(request.projectId(), request, user.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(InvoiceCommandResult.created(invoiceId)));
    }

    /**
     * Issue an invoice (DRAFT -> ISSUED).
     */
    @PostMapping("/invoices/{id}/issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<InvoiceCommandResult>> issueInvoice(@PathVariable Long id) {
        commandService.issueInvoice(id);
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
}
