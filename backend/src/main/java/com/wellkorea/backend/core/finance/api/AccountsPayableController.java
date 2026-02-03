package com.wellkorea.backend.core.finance.api;

import com.wellkorea.backend.core.finance.api.dto.command.APCommandResult;
import com.wellkorea.backend.core.finance.api.dto.command.RecordVendorPaymentRequest;
import com.wellkorea.backend.core.finance.api.dto.command.UpdateAPMetadataRequest;
import com.wellkorea.backend.core.finance.api.dto.command.VendorPaymentCommandResult;
import com.wellkorea.backend.core.finance.api.dto.query.AccountsPayableDetailView;
import com.wellkorea.backend.core.finance.api.dto.query.AccountsPayableSummaryView;
import com.wellkorea.backend.core.finance.application.AccountsPayableCommandService;
import com.wellkorea.backend.core.finance.application.AccountsPayableQueryService;
import com.wellkorea.backend.core.finance.application.VendorPaymentCommandService;
import com.wellkorea.backend.core.finance.infrastructure.mapper.AccountsPayableMapper.APAgingSummary;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.dto.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST API controller for accounts payable operations.
 * <p>
 * Provides query endpoints (list, detail, aging) and command endpoints
 * (update metadata, record payments).
 * <p>
 * AP records are created automatically via domain events when disbursement causes
 * (e.g., Purchase Orders) are confirmed.
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Sales: Read access to AP data
 * - Admin, Finance: Write access (metadata updates, payments)
 */
@Slf4j
@RestController
@RequestMapping("/api/accounts-payable")
@PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
public class AccountsPayableController {

    private final AccountsPayableQueryService queryService;
    private final AccountsPayableCommandService commandService;
    private final VendorPaymentCommandService paymentCommandService;

    public AccountsPayableController(
            AccountsPayableQueryService queryService,
            AccountsPayableCommandService commandService,
            VendorPaymentCommandService paymentCommandService) {
        this.queryService = queryService;
        this.commandService = commandService;
        this.paymentCommandService = paymentCommandService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List accounts payable with optional filters (paginated).
     * <p>
     * GET /api/accounts-payable
     * GET /api/accounts-payable?calculatedStatus=PENDING
     * GET /api/accounts-payable?vendorId=123
     * GET /api/accounts-payable?causeType=PURCHASE_ORDER
     * GET /api/accounts-payable?overdueOnly=true
     * GET /api/accounts-payable?calculatedStatus=PENDING&overdueOnly=true&vendorId=123
     * <p>
     * Query Parameters:
     * - vendorId (Long, optional): Filter by vendor ID
     * - causeType (String, optional): Filter by disbursement cause type (PURCHASE_ORDER, EXPENSE_REPORT, etc.)
     * - calculatedStatus (String, optional): PENDING, PARTIALLY_PAID, PAID
     * - overdueOnly (Boolean, optional): Filter for overdue items only
     * - dueDateFrom (LocalDate, optional): Filter by due date range start (YYYY-MM-DD)
     * - dueDateTo (LocalDate, optional): Filter by due date range end (YYYY-MM-DD)
     * - page (int, default 0): Page number
     * - size (int, default 20): Page size
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AccountsPayableSummaryView>>> listAccountsPayable(
            @RequestParam(required = false) Long vendorId,
            @RequestParam(required = false) String causeType,
            @RequestParam(required = false) String calculatedStatus,
            @RequestParam(required = false) Boolean overdueOnly,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateTo,
            Pageable pageable) {

        Page<AccountsPayableSummaryView> result = queryService.list(
                vendorId, causeType, calculatedStatus, overdueOnly, dueDateFrom, dueDateTo, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get accounts payable detail by ID with payment history.
     * <p>
     * GET /api/accounts-payable/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountsPayableDetailView>> getAccountsPayable(
            @PathVariable Long id) {

        AccountsPayableDetailView detail = queryService.getDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    /**
     * Get AP aging summary for reporting.
     * <p>
     * GET /api/accounts-payable/aging-summary
     * <p>
     * Returns aging buckets: Current, 1-30 Days, 31-60 Days, 61-90 Days, Over 90 Days
     */
    @GetMapping("/aging-summary")
    public ResponseEntity<ApiResponse<List<APAgingSummary>>> getAgingSummary() {
        List<APAgingSummary> result = queryService.getAgingSummary();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Update accounts payable metadata (due date, notes).
     * <p>
     * PATCH /api/accounts-payable/{id}
     * <p>
     * Allows finance personnel to set or update due date and notes.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<APCommandResult>> updateMetadata(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAPMetadataRequest request) {

        Long apId = commandService.updateMetadata(id, request.dueDate(), request.notes());
        APCommandResult result = APCommandResult.updated(apId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Record a payment against an accounts payable.
     * <p>
     * POST /api/accounts-payable/{id}/payments
     * <p>
     * Creates a vendor payment and updates AP status automatically.
     * Validates that payment amount doesn't exceed remaining balance.
     */
    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<VendorPaymentCommandResult>> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody RecordVendorPaymentRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        VendorPaymentCommandResult result = paymentCommandService.recordPayment(id, request, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
