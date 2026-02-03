package com.wellkorea.backend.core.finance.application;

import com.wellkorea.backend.core.finance.api.dto.query.AccountsPayableDetailView;
import com.wellkorea.backend.core.finance.api.dto.query.AccountsPayableSummaryView;
import com.wellkorea.backend.core.finance.infrastructure.mapper.AccountsPayableMapper;
import com.wellkorea.backend.core.finance.infrastructure.mapper.AccountsPayableMapper.APAgingSummary;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
     * Get AP detail by ID with calculated status and payment history.
     */
    public AccountsPayableDetailView getDetail(Long id) {
        return accountsPayableMapper.findDetailWithPaymentsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AccountsPayable", id));
    }

    /**
     * List APs with filters and calculated status.
     *
     * @param vendorId         filter by vendor (optional)
     * @param causeType        filter by disbursement cause type (optional): PURCHASE_ORDER, EXPENSE_REPORT, etc.
     * @param calculatedStatus filter by status: PENDING, PARTIALLY_PAID, PAID (optional)
     * @param overdueOnly      filter for overdue only (optional)
     * @param dueDateFrom      filter by due date range start (optional)
     * @param dueDateTo        filter by due date range end (optional)
     * @param pageable         pagination info
     */
    public Page<AccountsPayableSummaryView> list(
            Long vendorId,
            String causeType,
            String calculatedStatus,
            Boolean overdueOnly,
            LocalDate dueDateFrom,
            LocalDate dueDateTo,
            Pageable pageable
    ) {
        List<AccountsPayableSummaryView> aps = accountsPayableMapper.findWithFilters(
                vendorId,
                causeType,
                calculatedStatus,
                overdueOnly,
                dueDateFrom,
                dueDateTo,
                pageable.getPageSize(),
                pageable.getOffset()
        );

        long total = accountsPayableMapper.countWithFilters(
                vendorId, causeType, calculatedStatus, overdueOnly, dueDateFrom, dueDateTo);

        return new PageImpl<>(aps, pageable, total);
    }

    /**
     * Get AP aging summary.
     */
    public List<APAgingSummary> getAgingSummary() {
        return accountsPayableMapper.getAgingSummary();
    }
}
