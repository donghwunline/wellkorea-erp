package com.wellkorea.backend.purchasing.api;

import com.wellkorea.backend.purchasing.api.dto.command.RecordVendorPaymentRequest;
import com.wellkorea.backend.purchasing.api.dto.command.VendorPaymentCommandResult;
import com.wellkorea.backend.purchasing.api.dto.query.AccountsPayableSummaryView;
import com.wellkorea.backend.purchasing.application.AccountsPayableQueryService;
import com.wellkorea.backend.purchasing.application.VendorPaymentCommandService;
import com.wellkorea.backend.purchasing.infrastructure.mapper.AccountsPayableMapper.APAgingSummary;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.dto.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API controller for accounts payable queries.
 * <p>
 * This is a query-only controller - AP records are created automatically
 * when Purchase Orders are received (handled by domain events).
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Sales: Read access to AP data
 */
@Slf4j
@RestController
@RequestMapping("/api/accounts-payable")
@PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
public class AccountsPayableController {

    private final AccountsPayableQueryService queryService;
    private final VendorPaymentCommandService paymentCommandService;

    public AccountsPayableController(
            AccountsPayableQueryService queryService,
            VendorPaymentCommandService paymentCommandService) {
        this.queryService = queryService;
        this.paymentCommandService = paymentCommandService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List accounts payable with optional filters (paginated).
     * <p>
     * GET /api/accounts-payable
     * GET /api/accounts-payable?calculatedStatus=PENDING
     * GET /api/accounts-payable?vendorId=123
     * GET /api/accounts-payable?overdueOnly=true
     * GET /api/accounts-payable?calculatedStatus=PENDING&overdueOnly=true&vendorId=123
     * <p>
     * Query Parameters:
     * - vendorId (Long, optional): Filter by vendor ID
     * - calculatedStatus (String, optional): PENDING, PARTIALLY_PAID, PAID
     * - overdueOnly (Boolean, optional): Filter for overdue items only
     * - page (int, default 0): Page number
     * - size (int, default 20): Page size
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AccountsPayableSummaryView>>> listAccountsPayable(
            @RequestParam(required = false) Long vendorId,
            @RequestParam(required = false) String calculatedStatus,
            @RequestParam(required = false) Boolean overdueOnly,
            Pageable pageable) {

        Page<AccountsPayableSummaryView> result = queryService.list(
                vendorId, calculatedStatus, overdueOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get accounts payable detail by ID.
     * <p>
     * GET /api/accounts-payable/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountsPayableSummaryView>> getAccountsPayable(
            @PathVariable Long id) {

        AccountsPayableSummaryView detail = queryService.getDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    /**
     * Get accounts payable for a specific vendor.
     * <p>
     * GET /api/accounts-payable/vendor/{vendorId}
     */
    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<ApiResponse<List<AccountsPayableSummaryView>>> getByVendor(
            @PathVariable Long vendorId) {

        List<AccountsPayableSummaryView> result = queryService.getByVendor(vendorId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get all overdue accounts payable.
     * <p>
     * GET /api/accounts-payable/overdue
     */
    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<AccountsPayableSummaryView>>> getOverdue() {
        List<AccountsPayableSummaryView> result = queryService.getOverdue();
        return ResponseEntity.ok(ApiResponse.success(result));
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
