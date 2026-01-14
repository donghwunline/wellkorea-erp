package com.wellkorea.backend.invoice.infrastructure.persistence;

import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.invoice.domain.TaxInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository for TaxInvoice entities.
 */
@Repository
public interface TaxInvoiceRepository extends JpaRepository<TaxInvoice, Long> {
    /**
     * Check if invoice number exists.
     *
     * @param invoiceNumber Invoice number to check
     * @return true if exists
     */
    boolean existsByInvoiceNumber(String invoiceNumber);

    /**
     * Find overdue invoices (due date passed, not fully paid).
     *
     * @param today    Current date
     * @param statuses Statuses to include (ISSUED, PARTIALLY_PAID)
     * @return List of overdue invoices
     */
    @Query("SELECT i FROM TaxInvoice i WHERE i.dueDate < :today AND i.status IN :statuses")
    List<TaxInvoice> findOverdueInvoices(@Param("today") LocalDate today,
                                         @Param("statuses") List<InvoiceStatus> statuses);
}
