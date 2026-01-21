package com.wellkorea.backend.purchasing.infrastructure.persistence;

import com.wellkorea.backend.purchasing.domain.AccountsPayable;
import com.wellkorea.backend.purchasing.domain.AccountsPayableStatus;
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

    /**
     * Find AP by purchase order ID.
     */
    Optional<AccountsPayable> findByPurchaseOrder_Id(Long purchaseOrderId);

    /**
     * Check if AP exists for a purchase order.
     */
    boolean existsByPurchaseOrder_Id(Long purchaseOrderId);

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
