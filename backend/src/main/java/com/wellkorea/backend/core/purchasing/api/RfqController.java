package com.wellkorea.backend.core.purchasing.api;

import com.wellkorea.backend.core.purchasing.api.dto.command.PurchaseRequestCommandResult;
import com.wellkorea.backend.core.purchasing.api.dto.command.RecordRfqReplyRequest;
import com.wellkorea.backend.core.purchasing.api.dto.command.RfqItemActionRequest;
import com.wellkorea.backend.core.purchasing.application.RfqCommandService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import com.wellkorea.backend.shared.dto.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST API controller for RFQ item operations within a PurchaseRequest.
 * <p>
 * All endpoints operate on the PurchaseRequest aggregate, with rfqItemId
 * passed in the request body.
 * <p>
 * RBAC Rules:
 * - ADMIN, FINANCE, PRODUCTION: Full access
 */
@RestController
@RequestMapping("/api/purchase-requests/{id}")
public class RfqController {

    private final RfqCommandService rfqCommandService;

    public RfqController(RfqCommandService rfqCommandService) {
        this.rfqCommandService = rfqCommandService;
    }

    /**
     * Record a vendor's reply to an RFQ.
     * <p>
     * POST /api/purchase-requests/{id}/record-reply
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/record-reply")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> recordReply(
            @PathVariable Long id,
            @Valid @RequestBody RecordRfqReplyRequest request) {

        rfqCommandService.recordReply(id, request.toCommand());
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.rfqReplyRecorded(id);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Mark an RFQ item as no response from vendor.
     * <p>
     * POST /api/purchase-requests/{id}/mark-no-response
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/mark-no-response")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> markNoResponse(
            @PathVariable Long id,
            @Valid @RequestBody RfqItemActionRequest request) {

        rfqCommandService.markNoResponse(id, request.itemId());
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.rfqNoResponse(id);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Select a vendor's quote for the purchase request.
     * <p>
     * POST /api/purchase-requests/{id}/select-vendor
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/select-vendor")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> selectVendor(
            @PathVariable Long id,
            @Valid @RequestBody RfqItemActionRequest request) {

        rfqCommandService.selectVendor(id, request.itemId());
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.vendorSelected(id);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Reject a vendor's quote.
     * <p>
     * POST /api/purchase-requests/{id}/reject-rfq
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/reject-rfq")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> rejectRfq(
            @PathVariable Long id,
            @Valid @RequestBody RfqItemActionRequest request) {

        rfqCommandService.rejectRfq(id, request.itemId());
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.rfqRejected(id);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Submit vendor selection for approval.
     * <p>
     * POST /api/purchase-requests/{id}/rfq/{itemId}/submit-for-approval
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/rfq/{itemId}/submit-for-approval")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> submitVendorSelectionForApproval(
            @PathVariable Long id,
            @PathVariable String itemId,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long resultId = rfqCommandService.submitVendorSelectionForApproval(id, itemId, user.getUserId());
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.vendorSelectionSubmitted(resultId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
