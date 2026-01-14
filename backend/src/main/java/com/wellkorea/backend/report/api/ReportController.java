package com.wellkorea.backend.report.api;

import com.wellkorea.backend.report.api.dto.ARReportView;
import com.wellkorea.backend.report.application.ARReportService;
import com.wellkorea.backend.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for report endpoints.
 * <p>
 * Provides read-only analytics and reporting endpoints.
 * Separated from domain CRUD controllers for clarity.
 * <p>
 * Endpoints:
 * - GET /api/reports/ar - Accounts Receivable aging report
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ARReportService arReportService;

    public ReportController(ARReportService arReportService) {
        this.arReportService = arReportService;
    }

    // ========== AR REPORT ==========

    /**
     * Get AR (Accounts Receivable) aging report.
     * GET /api/reports/ar
     * <p>
     * Returns accounts receivable analysis by aging bucket:
     * - Current (not yet due)
     * - 30 Days (1-30 days overdue)
     * - 60 Days (31-60 days overdue)
     * - 90+ Days (90+ days overdue)
     * <p>
     * Includes summary totals, customer breakdown, and detailed invoice list.
     */
    @GetMapping("/ar")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<ARReportView>> getARReport() {
        ARReportView report = arReportService.generateARReport();
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
