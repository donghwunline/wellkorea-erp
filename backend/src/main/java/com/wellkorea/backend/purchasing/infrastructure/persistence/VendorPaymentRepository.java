package com.wellkorea.backend.purchasing.infrastructure.persistence;

import com.wellkorea.backend.purchasing.domain.VendorPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository for VendorPayment entity.
 */
public interface VendorPaymentRepository extends JpaRepository<VendorPayment, Long> {

    /**
     * Find all payments for an accounts payable entry.
     */
    List<VendorPayment> findByAccountsPayable_Id(Long accountsPayableId);

    /**
     * Find all payments recorded by a specific user.
     */
    List<VendorPayment> findByRecordedById(Long recordedById);

    /**
     * Find payments made on a specific date.
     */
    List<VendorPayment> findByPaymentDate(LocalDate paymentDate);

    /**
     * Find payments made within a date range.
     */
    @Query("SELECT vp FROM VendorPayment vp WHERE vp.paymentDate BETWEEN :startDate AND :endDate")
    List<VendorPayment> findByPaymentDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
