package com.wellkorea.backend.invoice.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.invoice.api.dto.command.CreateInvoiceRequest;
import com.wellkorea.backend.invoice.api.dto.command.InvoiceCommandResult;
import com.wellkorea.backend.invoice.api.dto.command.PaymentCommandResult;
import com.wellkorea.backend.invoice.api.dto.command.RecordPaymentRequest;
import com.wellkorea.backend.invoice.api.dto.query.ARReportView;
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

import java.util.List;

/**
 * REST controller for invoice operations.
 * <p>
 * Endpoints:
 * - POST   /api/invoices            - Create invoice
 * - GET    /api/invoices            - List invoices (paginated)
 * - GET    /api/invoices/{id}       - Get invoice detail
 * - POST   /api/invoices/{id}/issue - Issue invoice
 * - POST   /api/invoices/{id}/cancel - Cancel invoice
 * - POST   /api/invoices/{id}/payments - Record payment
 * - GET    /api/invoices/project/{projectId} - Get invoices by project
 * - GET    /api/reports/ar          - AR aging report
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
     * Get invoice list with pagination.
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<Page<InvoiceSummaryView>>> getInvoices(@PageableDefault(size = 20, sort = "issueDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<InvoiceSummaryView> invoices = queryService.getInvoices(pageable);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    /**
     * Get invoice detail.
     */
    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<InvoiceDetailView>> getInvoiceDetail(@PathVariable Long id) {
        InvoiceDetailView invoice = queryService.getInvoiceDetail(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    /**
     * Get invoices by project.
     */
    @GetMapping("/invoices/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<List<InvoiceSummaryView>>> getInvoicesByProject(@PathVariable Long projectId) {
        List<InvoiceSummaryView> invoices = queryService.getInvoicesByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    /**
     * Get invoices by status.
     */
    @GetMapping("/invoices/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<Page<InvoiceSummaryView>>> getInvoicesByStatus(@PathVariable InvoiceStatus status,
                                                                                     @PageableDefault(size = 20, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<InvoiceSummaryView> invoices = queryService.getInvoicesByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    /**
     * Get AR (Accounts Receivable) aging report.
     */
    @GetMapping("/reports/ar")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<ARReportView>> getARReport() {
        ARReportView report = queryService.generateARReport();
        return ResponseEntity.ok(ApiResponse.success(report));
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
