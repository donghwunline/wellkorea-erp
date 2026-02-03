package com.wellkorea.backend.core.finance.infrastructure.mapper;

import com.wellkorea.backend.core.finance.api.dto.query.AccountsPayableDetailView;
import com.wellkorea.backend.core.finance.api.dto.query.AccountsPayableSummaryView;
import com.wellkorea.backend.core.finance.api.dto.query.VendorPaymentView;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
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
     * @param dueDateFrom      optional due date range start filter
     * @param dueDateTo        optional due date range end filter
     * @param limit            pagination limit
     * @param offset           pagination offset
     * @return list of AP summary views
     */
    List<AccountsPayableSummaryView> findWithFilters(
            @Param("vendorId") Long vendorId,
            @Param("causeType") String causeType,
            @Param("calculatedStatus") String calculatedStatus,
            @Param("overdueOnly") Boolean overdueOnly,
            @Param("dueDateFrom") LocalDate dueDateFrom,
            @Param("dueDateTo") LocalDate dueDateTo,
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
     * @param dueDateFrom      optional due date range start filter
     * @param dueDateTo        optional due date range end filter
     * @return count of matching APs
     */
    long countWithFilters(
            @Param("vendorId") Long vendorId,
            @Param("causeType") String causeType,
            @Param("calculatedStatus") String calculatedStatus,
            @Param("overdueOnly") Boolean overdueOnly,
            @Param("dueDateFrom") LocalDate dueDateFrom,
            @Param("dueDateTo") LocalDate dueDateTo
    );

    /**
     * Get AP aging summary (grouped by aging bucket).
     */
    List<APAgingSummary> getAgingSummary();

    /**
     * Find AP detail by ID with payment history.
     *
     * @param id AP ID
     * @return AP detail with payments
     */
    Optional<AccountsPayableDetailView> findDetailWithPaymentsById(@Param("id") Long id);

    /**
     * Find payments by accounts payable ID.
     * Used as nested select for detail view.
     *
     * @param accountsPayableId the AP ID
     * @return list of vendor payment views
     */
    List<VendorPaymentView> findPaymentsByAccountsPayableId(@Param("accountsPayableId") Long accountsPayableId);

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
