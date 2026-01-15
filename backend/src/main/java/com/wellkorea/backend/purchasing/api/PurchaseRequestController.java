package com.wellkorea.backend.purchasing.api;

import com.wellkorea.backend.auth.domain.AuthenticatedUser;
import com.wellkorea.backend.purchasing.api.dto.command.CreatePurchaseRequestRequest;
import com.wellkorea.backend.purchasing.api.dto.command.PurchaseRequestCommandResult;
import com.wellkorea.backend.purchasing.api.dto.command.SendRfqRequest;
import com.wellkorea.backend.purchasing.api.dto.command.UpdatePurchaseRequestRequest;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestSummaryView;
import com.wellkorea.backend.purchasing.application.PurchaseRequestCommandService;
import com.wellkorea.backend.purchasing.application.PurchaseRequestQueryService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
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

    public PurchaseRequestController(PurchaseRequestCommandService commandService,
                                     PurchaseRequestQueryService queryService) {
        this.commandService = commandService;
        this.queryService = queryService;
    }

    // ========== QUERY ENDPOINTS ==========

    /**
     * List all purchase requests (paginated).
     * <p>
     * GET /api/purchase-requests
     * <p>
     * Access: All authenticated users
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PurchaseRequestSummaryView>>> listPurchaseRequests(@RequestParam(required = false) Long projectId,
                                                                                              @RequestParam(required = false) String status,
                                                                                              Pageable pageable) {

        Page<PurchaseRequestSummaryView> result;

        if (projectId != null) {
            result = queryService.listByProjectId(projectId, pageable);
        } else if (status != null) {
            result = queryService.listByStatus(status, pageable);
        } else {
            result = queryService.listPurchaseRequests(pageable);
        }

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
     * Create a new purchase request.
     * <p>
     * POST /api/purchase-requests
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> createPurchaseRequest(@Valid @RequestBody CreatePurchaseRequestRequest request,
                                                                                           @AuthenticationPrincipal AuthenticatedUser user) {

        Long userId = user.getUserId();
        Long id = commandService.createPurchaseRequest(request.toCommand(), userId);
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
     * Send RFQ to vendors.
     * <p>
     * POST /api/purchase-requests/{id}/send-rfq
     * <p>
     * Access: ADMIN, FINANCE, PRODUCTION
     */
    @PostMapping("/{id}/send-rfq")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<PurchaseRequestCommandResult>> sendRfq(@PathVariable Long id,
                                                                             @Valid @RequestBody SendRfqRequest request) {

        int vendorCount = commandService.sendRfq(id, request.vendorIds());
        PurchaseRequestCommandResult result = PurchaseRequestCommandResult.rfqSent(id, vendorCount);

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
