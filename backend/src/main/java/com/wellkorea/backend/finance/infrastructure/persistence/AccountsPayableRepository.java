package com.wellkorea.backend.finance.infrastructure.persistence;

import com.wellkorea.backend.finance.domain.AccountsPayable;
import com.wellkorea.backend.finance.domain.vo.AccountsPayableStatus;
import com.wellkorea.backend.finance.domain.vo.DisbursementCauseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for AccountsPayable entity.
 */
public interface AccountsPayableRepository extends JpaRepository<AccountsPayable, Long> {

    // ========== Disbursement Cause-based Methods (New) ==========

    /**
     * Check if AP exists for a specific disbursement cause.
     *
     * @param causeType the type of disbursement cause
     * @param causeId   the ID of the source entity
     * @return true if an AP exists for this cause
     */
    boolean existsByDisbursementCause_CauseTypeAndDisbursementCause_CauseId(
            DisbursementCauseType causeType, Long causeId);

    /**
     * Find AP by disbursement cause type and ID.
     *
     * @param causeType the type of disbursement cause
     * @param causeId   the ID of the source entity
     * @return the AP if found
     */
    Optional<AccountsPayable> findByDisbursementCause_CauseTypeAndDisbursementCause_CauseId(
            DisbursementCauseType causeType, Long causeId);

    /**
     * Find all APs for a specific disbursement cause type.
     *
     * @param causeType the type of disbursement cause
     * @return list of APs
     */
    List<AccountsPayable> findByDisbursementCause_CauseType(DisbursementCauseType causeType);

    // ========== Vendor-based Methods ==========

    /**
     * Find all APs for a vendor.
     */
    List<AccountsPayable> findByVendor_Id(Long vendorId);

    /**
     * Find all APs with a specific status.
     */
    List<AccountsPayable> findByStatus(AccountsPayableStatus status);

    /**
     * Find all APs for a vendor with a specific status.
     */
    List<AccountsPayable> findByVendor_IdAndStatus(Long vendorId, AccountsPayableStatus status);

    // ========== Date-based Queries ==========

    /**
     * Find overdue APs (past due date and not fully paid).
     */
    @Query("SELECT ap FROM AccountsPayable ap WHERE ap.dueDate < :today AND ap.status IN ('PENDING', 'PARTIALLY_PAID')")
    List<AccountsPayable> findOverdue(@Param("today") LocalDate today);

    /**
     * Find APs due within a date range.
     */
    @Query("SELECT ap FROM AccountsPayable ap WHERE ap.dueDate BETWEEN :startDate AND :endDate AND ap.status IN ('PENDING', 'PARTIALLY_PAID')")
    List<AccountsPayable> findDueBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
