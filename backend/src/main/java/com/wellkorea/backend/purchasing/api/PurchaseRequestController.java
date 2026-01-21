package com.wellkorea.backend.purchasing.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.purchasing.api.dto.command.CreateMaterialPurchaseRequestRequest;
import com.wellkorea.backend.purchasing.api.dto.command.CreateServicePurchaseRequestRequest;
import com.wellkorea.backend.purchasing.api.dto.command.PurchaseRequestCommandResult;
import com.wellkorea.backend.purchasing.api.dto.command.SendRfqRequest;
import com.wellkorea.backend.purchasing.api.dto.command.UpdatePurchaseRequestRequest;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestSummaryView;
import com.wellkorea.backend.purchasing.application.PurchaseRequestCommandService;
import com.wellkorea.backend.purchasing.application.PurchaseRequestQueryService;
import com.wellkorea.backend.purchasing.application.RfqEmailService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST API controller for purchase request management.
 * Follows CQRS pattern - uses separate Command and Query services.
 * <p>
 * RBAC Rules:
 * - Admin, Finance, Production: Full CRUD access
 * - Sales: Read-only access
 */
@RestController
@RequestMapping("/api/purchase-requests")
public class PurchaseRequestController {

    private final PurchaseRequestCommandService commandService;
    private final PurchaseRequestQueryService queryService;
    private final RfqEmailService rfqEmailService;

    public PurchaseRequestController(PurchaseRequestCommandService commandService,
                                     PurchaseRequestQueryService queryService,
                                     RfqEmailService rfqEmailService) {
        this.commandService = commandService;
        this.queryService = queryService;
        this.rfqEmailService = rfqEmailService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List purchase requests with optional filters (paginated).
     * <p>
     * GET /api/purchase-requests
     * GET /api/purchase-requests?status=DRAFT
     * GET /api/purchase-requests?projectId=123
     * GET /api/purchase-requests?dtype=SERVICE
     * GET /api/purchase-requests?dtype=MATERIAL
     * GET /api/purchase-requests?status=RFQ_SENT&projectId=123&dtype=SERVICE
     * <p>
     * Access: All authenticated users
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PurchaseRequestSummaryView>>> listPurchaseRequests(@RequestParam(required = false) String status,
                                                                                              @RequestParam(required = false) Long projectId,
                                                                                              @RequestParam(required = false) String dtype,
                                                                                              Pageable pageable) {

        Page<PurchaseRequestSummaryView> result = queryService.listPurchaseRequests(status, projectId, dtype, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Get purchase request by ID.
     * <p>
     * GET /api/purchase-requests/{id}
     * <p>
     * Access: All authenticated users
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseRequestDetailView>> getPurchaseRequest(@PathVariable Long id) {
        PurchaseRequestDetailView detail = queryService.getPurchaseRequestDetail(id);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    // ========== COMMAND ENDPOINTS ==========

    /**
     * Create a new service purchase request (outsourcing).
     * <p>
     * POST /api/purchase-requests/service
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/service")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> createServicePurchaseRequest(
            @Valid @RequestBody CreateServicePurchaseRequestRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        Long id = commandService.createServicePurchaseRequest(request.toCommand(), userId);
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.created(id);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Create a new material purchase request (physical items).
     * <p>
     * POST /api/purchase-requests/material
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/material")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> createMaterialPurchaseRequest(
            @Valid @RequestBody CreateMaterialPurchaseRequestRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        Long id = commandService.createMaterialPurchaseRequest(request.toCommand(), userId);
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.created(id);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(result));
    }

    /**
     * Update a purchase request.
     * <p>
     * PUT /api/purchase-requests/{id}
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> updatePurchaseRequest(@PathVariable Long id,
                                                                                           @Valid @RequestBody UpdatePurchaseRequestRequest request) {

        Long updatedId = commandService.updatePurchaseRequest(id, request.toCommand());
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.updated(updatedId);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Send RFQ to vendors with email notifications.
     * <p>
     * POST /api/purchase-requests/{id}/send-rfq
     * <p>
     * Creates RFQ items for each vendor, transitions status to RFQ_SENT,
     * and sends email notifications with PDF attachment.
     * If some email sends fail, the RFQ items are still created.
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/{id}/send-rfq")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> sendRfq(@PathVariable Long id,
                                                                             @Valid @RequestBody SendRfqRequest request) {

        // Create RFQ items and transition status
        int vendorCount = commandService.sendRfq(id, request.vendorIds());

        // Build vendor email map for email service
        Map<Long, RfqEmailService.VendorEmailInfo> vendorEmailMap = new HashMap<>();
        for (Long vendorId : request.vendorIds()) {
            if (request.vendorEmails() != null && request.vendorEmails().containsKey(vendorId)) {
                SendRfqRequest.VendorEmailInfo emailInfo = request.vendorEmails().get(vendorId);
                vendorEmailMap.put(vendorId, new RfqEmailService.VendorEmailInfo(
                        emailInfo.to(),
                        emailInfo.ccEmails()
                ));
            } else {
                vendorEmailMap.put(vendorId, RfqEmailService.VendorEmailInfo.empty());
            }
        }

        // Send email notifications (partial failures are handled internally)
        RfqEmailService.RfqEmailResult emailResult = rfqEmailService.sendRfqEmails(id, vendorEmailMap);

        // Return success even if some emails failed (RFQ items are created)
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.rfqSent(
                id,
                vendorCount,
                emailResult.successCount(),
                emailResult.failureCount()
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Cancel a purchase request.
     * <p>
     * DELETE /api/purchase-requests/{id}
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<Void> cancelPurchaseRequest(@PathVariable Long id) {
        commandService.cancelPurchaseRequest(id);
        return ResponseEntity.noContent().build();
    }
}
