package com.wellkorea.backend.quotation.api;

import com.wellkorea.backend.auth.api.CurrentToken;
import com.wellkorea.backend.auth.infrastructure.config.JwtTokenProvider;
import com.wellkorea.backend.quotation.api.dto.CreateQuotationRequest;
import com.wellkorea.backend.quotation.api.dto.QuotationResponse;
import com.wellkorea.backend.quotation.api.dto.UpdateQuotationRequest;
import com.wellkorea.backend.quotation.application.CreateQuotationCommand;
import com.wellkorea.backend.quotation.application.LineItemCommand;
import com.wellkorea.backend.quotation.application.QuotationService;
import com.wellkorea.backend.quotation.application.UpdateQuotationCommand;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.shared.dto.ApiResponse;
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
 * Provides endpoints for CRUD operations, submission, and PDF generation.
 */
@RestController
@RequestMapping("/api/quotations")
public class QuotationController {

    private final QuotationService quotationService;
    private final JwtTokenProvider jwtTokenProvider;

    public QuotationController(QuotationService quotationService, JwtTokenProvider jwtTokenProvider) {
        this.quotationService = quotationService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Create a new quotation.
     * POST /api/quotations
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationResponse>> createQuotation(
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

        Quotation quotation = quotationService.createQuotation(command, userId);
        QuotationResponse response = QuotationResponse.from(quotation);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * List quotations with optional filters.
     * GET /api/quotations
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<Page<QuotationResponse>>> listQuotations(
            @RequestParam(required = false) QuotationStatus status,
            @RequestParam(required = false) Long projectId,
            Pageable pageable) {

        Page<Quotation> quotations = quotationService.listQuotations(status, projectId, pageable);
        Page<QuotationResponse> response = quotations.map(QuotationResponse::fromSummary);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get quotation by ID.
     * GET /api/quotations/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationResponse>> getQuotation(@PathVariable Long id) {
        Quotation quotation = quotationService.getQuotation(id);
        QuotationResponse response = QuotationResponse.from(quotation);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Update a quotation.
     * PUT /api/quotations/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationResponse>> updateQuotation(
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

        Quotation quotation = quotationService.updateQuotation(id, command);
        QuotationResponse response = QuotationResponse.from(quotation);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Submit quotation for approval.
     * POST /api/quotations/{id}/submit
     *
     * The approval request is created automatically via event-driven architecture.
     * QuotationService publishes QuotationSubmittedEvent, which is handled by
     * ApprovalEventHandler within the same transaction.
     */
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationResponse>> submitForApproval(
            @PathVariable Long id,
            @CurrentToken String token) {

        Long userId = jwtTokenProvider.getUserId(token);
        Quotation quotation = quotationService.submitForApproval(id, userId);
        QuotationResponse response = QuotationResponse.from(quotation);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Create a new version from an existing quotation.
     * POST /api/quotations/{id}/versions
     */
    @PostMapping("/{id}/versions")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<ApiResponse<QuotationResponse>> createNewVersion(
            @PathVariable Long id,
            @CurrentToken String token) {

        Long userId = jwtTokenProvider.getUserId(token);

        Quotation quotation = quotationService.createNewVersion(id, userId);
        QuotationResponse response = QuotationResponse.from(quotation);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * Generate PDF for a quotation.
     * POST /api/quotations/{id}/pdf
     */
    @PostMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'SALES')")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long id) {
        byte[] pdfBytes = quotationService.generatePdf(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=quotation-" + id + ".pdf")
                .body(pdfBytes);
    }
}
