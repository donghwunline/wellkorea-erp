package com.wellkorea.backend.report.infrastructure.mapper;

import com.wellkorea.backend.report.api.dto.ARInvoiceView;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * MyBatis mapper for AR (Accounts Receivable) report queries.
 * <p>
 * Provides optimized queries for AR report generation, avoiding N+1 problems
 * by fetching all necessary data in a single query with JOINs.
 */
@Mapper
public interface ARReportMapper {

    /**
     * Find all unpaid invoices with aging information.
     * <p>
     * Includes invoices with status ISSUED, PARTIALLY_PAID, or OVERDUE
     * that have a positive remaining balance.
     * <p>
     * Results include:
     * - Invoice details (id, number, dates, amounts)
     * - Project info (job code)
     * - Customer info (id, name)
     * - Aging info (days overdue, aging bucket)
     *
     * @return List of AR invoice views with full details
     */
    List<ARInvoiceView> findUnpaidInvoicesWithAgingInfo();
}
