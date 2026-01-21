package com.wellkorea.backend.purchasing.infrastructure.mapper;

import com.wellkorea.backend.purchasing.api.dto.query.AccountsPayableSummaryView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for AccountsPayable queries with calculated status.
 * Status is computed from company_payments table, not stored in AP.
 */
@Mapper
public interface AccountsPayableMapper {

    /**
     * Find AP detail by ID with calculated payment status.
     */
    Optional<AccountsPayableSummaryView> findDetailById(@Param("id") Long id);

    /**
     * Find APs with filters and calculated status.
     * Status is calculated from company_payments.
     */
    List<AccountsPayableSummaryView> findWithFilters(
            @Param("vendorId") Long vendorId,
            @Param("calculatedStatus") String calculatedStatus,
            @Param("overdueOnly") Boolean overdueOnly,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Count APs with filters.
     */
    long countWithFilters(
            @Param("vendorId") Long vendorId,
            @Param("calculatedStatus") String calculatedStatus,
            @Param("overdueOnly") Boolean overdueOnly
    );

    /**
     * Find APs for a specific vendor with calculated status.
     */
    List<AccountsPayableSummaryView> findByVendorId(@Param("vendorId") Long vendorId);

    /**
     * Find overdue APs (past due date with remaining balance).
     */
    List<AccountsPayableSummaryView> findOverdue();

    /**
     * Get AP aging summary (grouped by aging bucket).
     */
    List<APAgingSummary> getAgingSummary();

    /**
     * AP aging summary record.
     */
    record APAgingSummary(
            String agingBucket,
            int count,
            java.math.BigDecimal totalAmount,
            java.math.BigDecimal totalPaid,
            java.math.BigDecimal remainingBalance
    ) {}
}
