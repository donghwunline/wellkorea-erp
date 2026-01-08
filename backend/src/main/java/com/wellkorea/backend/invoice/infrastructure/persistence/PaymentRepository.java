package com.wellkorea.backend.invoice.infrastructure.persistence;

import com.wellkorea.backend.invoice.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository for Payment entities.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Find all payments for an invoice.
     *
     * @param invoiceId Invoice ID
     * @return List of payments ordered by payment date
     */
    List<Payment> findByInvoice_IdOrderByPaymentDateDesc(Long invoiceId);

    /**
     * Calculate total payments for an invoice.
     *
     * @param invoiceId Invoice ID
     * @return Sum of all payment amounts
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    BigDecimal sumPaymentsByInvoiceId(@Param("invoiceId") Long invoiceId);

    /**
     * Find payments within date range.
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return List of payments
     */
    List<Payment> findByPaymentDateBetweenOrderByPaymentDateDesc(LocalDate startDate, LocalDate endDate);

    /**
     * Find payments recorded by a specific user.
     *
     * @param recordedById User ID
     * @return List of payments
     */
    List<Payment> findByRecordedByIdOrderByPaymentDateDesc(Long recordedById);

    /**
     * Count payments for an invoice.
     *
     * @param invoiceId Invoice ID
     * @return Count
     */
    long countByInvoice_Id(Long invoiceId);

    /**
     * Calculate total payments within date range.
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return Total amount
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate")
    BigDecimal sumPaymentsBetweenDates(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
