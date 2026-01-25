package com.wellkorea.backend.finance.application;

import com.wellkorea.backend.finance.api.dto.query.AccountsPayableSummaryView;
import com.wellkorea.backend.finance.infrastructure.mapper.AccountsPayableMapper;
import com.wellkorea.backend.finance.infrastructure.mapper.AccountsPayableMapper.APAgingSummary;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Query service for AccountsPayable read operations.
 * Status is calculated from vendor_payments, not stored.
 */
@Service
@Transactional(readOnly = true)
public class AccountsPayableQueryService {

    private final AccountsPayableMapper accountsPayableMapper;

    public AccountsPayableQueryService(AccountsPayableMapper accountsPayableMapper) {
        this.accountsPayableMapper = accountsPayableMapper;
    }

    /**
     * Get AP detail by ID with calculated status.
     */
    public AccountsPayableSummaryView getDetail(Long id) {
        return accountsPayableMapper.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AccountsPayable", id));
    }

    /**
     * List APs with filters and calculated status.
     *
     * @param vendorId         filter by vendor (optional)
     * @param causeType        filter by disbursement cause type (optional): PURCHASE_ORDER, EXPENSE_REPORT, etc.
     * @param calculatedStatus filter by status: PENDING, PARTIALLY_PAID, PAID (optional)
     * @param overdueOnly      filter for overdue only (optional)
     * @param pageable         pagination info
     */
    public Page<AccountsPayableSummaryView> list(
            Long vendorId,
            String causeType,
            String calculatedStatus,
            Boolean overdueOnly,
            Pageable pageable
    ) {
        List<AccountsPayableSummaryView> aps = accountsPayableMapper.findWithFilters(
                vendorId,
                causeType,
                calculatedStatus,
                overdueOnly,
                pageable.getPageSize(),
                pageable.getOffset()
        );

        long total = accountsPayableMapper.countWithFilters(vendorId, causeType, calculatedStatus, overdueOnly);

        return new PageImpl<>(aps, pageable, total);
    }

    /**
     * Get APs for a specific vendor (paginated).
     *
     * @param vendorId the vendor ID
     * @param pageable pagination info
     * @return paginated AP summary views
     */
    public Page<AccountsPayableSummaryView> getByVendorPaged(Long vendorId, Pageable pageable) {
        List<AccountsPayableSummaryView> aps = accountsPayableMapper.findByVendorIdPaged(
                vendorId, pageable.getPageSize(), pageable.getOffset());
        long total = accountsPayableMapper.countByVendorId(vendorId);
        return new PageImpl<>(aps, pageable, total);
    }

    /**
     * Get APs for a specific vendor.
     * @deprecated Use {@link #getByVendorPaged(Long, Pageable)} to prevent OOM on large datasets
     */
    @Deprecated(since = "1.0", forRemoval = true)
    public List<AccountsPayableSummaryView> getByVendor(Long vendorId) {
        return accountsPayableMapper.findByVendorId(vendorId);
    }

    /**
     * Get APs by disbursement cause type.
     *
     * @param causeType the cause type (PURCHASE_ORDER, EXPENSE_REPORT, etc.)
     * @return list of AP summary views
     */
    public List<AccountsPayableSummaryView> getByCauseType(String causeType) {
        return accountsPayableMapper.findByCauseType(causeType);
    }

    /**
     * Get overdue APs.
     */
    public List<AccountsPayableSummaryView> getOverdue() {
        return accountsPayableMapper.findOverdue();
    }

    /**
     * Get AP aging summary.
     */
    public List<APAgingSummary> getAgingSummary() {
        return accountsPayableMapper.getAgingSummary();
    }
}
