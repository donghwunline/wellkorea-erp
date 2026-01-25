package com.wellkorea.backend.finance.infrastructure.mapper;

import com.wellkorea.backend.finance.api.dto.query.AccountsPayableSummaryView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * MyBatis mapper for AccountsPayable queries with calculated status.
 * Status is computed from vendor_payments table, not stored in AP.
 */
@Mapper
public interface AccountsPayableMapper {

    /**
     * Find AP detail by ID with calculated payment status.
     */
    Optional<AccountsPayableSummaryView> findDetailById(@Param("id") Long id);

    /**
     * Find APs with filters and calculated status.
     * Status is calculated from vendor_payments.
     *
     * @param vendorId         optional vendor ID filter
     * @param causeType        optional disbursement cause type filter (PURCHASE_ORDER, EXPENSE_REPORT, etc.)
     * @param calculatedStatus optional calculated status filter (PENDING, PARTIALLY_PAID, PAID)
     * @param overdueOnly      if true, only return overdue APs
     * @param limit            pagination limit
     * @param offset           pagination offset
     * @return list of AP summary views
     */
    List<AccountsPayableSummaryView> findWithFilters(
            @Param("vendorId") Long vendorId,
            @Param("causeType") String causeType,
            @Param("calculatedStatus") String calculatedStatus,
            @Param("overdueOnly") Boolean overdueOnly,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    /**
     * Count APs with filters.
     *
     * @param vendorId         optional vendor ID filter
     * @param causeType        optional disbursement cause type filter
     * @param calculatedStatus optional calculated status filter
     * @param overdueOnly      if true, only count overdue APs
     * @return count of matching APs
     */
    long countWithFilters(
            @Param("vendorId") Long vendorId,
            @Param("causeType") String causeType,
            @Param("calculatedStatus") String calculatedStatus,
            @Param("overdueOnly") Boolean overdueOnly
    );

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
    ) {
    }
}
