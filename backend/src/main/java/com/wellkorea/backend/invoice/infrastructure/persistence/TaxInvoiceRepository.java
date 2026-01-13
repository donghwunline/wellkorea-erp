package com.wellkorea.backend.invoice.infrastructure.persistence;

import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.invoice.domain.TaxInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for TaxInvoice entities.
 */
@Repository
public interface TaxInvoiceRepository extends JpaRepository<TaxInvoice, Long> {

    /**
     * Find invoice by invoice number.
     *
     * @param invoiceNumber Invoice number
     * @return Optional containing the invoice
     */
    Optional<TaxInvoice> findByInvoiceNumber(String invoiceNumber);

    /**
     * Check if invoice number exists.
     *
     * @param invoiceNumber Invoice number to check
     * @return true if exists
     */
    boolean existsByInvoiceNumber(String invoiceNumber);

    /**
     * Find invoices by project ID.
     *
     * @param projectId Project ID
     * @return List of invoices
     */
    List<TaxInvoice> findByProjectIdOrderByIssueDateDesc(Long projectId);

    /**
     * Find invoices by project ID with pagination.
     *
     * @param projectId Project ID
     * @param pageable  Pagination info
     * @return Page of invoices
     */
    Page<TaxInvoice> findByProjectId(Long projectId, Pageable pageable);

    /**
     * Find invoices by status.
     *
     * @param status   Invoice status
     * @param pageable Pagination info
     * @return Page of invoices
     */
    Page<TaxInvoice> findByStatus(InvoiceStatus status, Pageable pageable);

    /**
     * Find invoices by delivery ID.
     *
     * @param deliveryId Delivery ID
     * @return List of invoices linked to the delivery
     */
    List<TaxInvoice> findByDeliveryId(Long deliveryId);

    /**
     * Find overdue invoices (due date passed, not fully paid).
     *
     * @param today    Current date
     * @param statuses Statuses to include (ISSUED, PARTIALLY_PAID)
     * @return List of overdue invoices
     */
    @Query("SELECT i FROM TaxInvoice i WHERE i.dueDate < :today AND i.status IN :statuses")
    List<TaxInvoice> findOverdueInvoices(
            @Param("today") LocalDate today,
            @Param("statuses") List<InvoiceStatus> statuses);

    /**
     * Find invoices for AR aging analysis within date range.
     *
     * @param startDate Start date
     * @param endDate   End date
     * @param statuses  Statuses to include
     * @param pageable  Pagination info
     * @return Page of invoices
     */
    @Query("SELECT i FROM TaxInvoice i WHERE i.issueDate BETWEEN :startDate AND :endDate " +
            "AND i.status IN :statuses ORDER BY i.dueDate ASC")
    Page<TaxInvoice> findForAgingAnalysis(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<InvoiceStatus> statuses,
            Pageable pageable);

    /**
     * Find invoices by status and due date before a given date.
     *
     * @param status  Invoice status
     * @param dueDate Due date cutoff
     * @return List of invoices
     */
    List<TaxInvoice> findByStatusAndDueDateBefore(InvoiceStatus status, LocalDate dueDate);

    /**
     * Count invoices by status.
     *
     * @param status Invoice status
     * @return Count
     */
    long countByStatus(InvoiceStatus status);

    /**
     * Find all invoices with unpaid balance.
     *
     * @param statuses Statuses to include
     * @return List of invoices with outstanding balance
     */
    @Query("SELECT i FROM TaxInvoice i WHERE i.status IN :statuses")
    List<TaxInvoice> findWithOutstandingBalance(@Param("statuses") List<InvoiceStatus> statuses);

    /**
     * Get invoiced quantities for all products in a project.
     * Returns a list of [productId, totalInvoiced] arrays.
     * Excludes CANCELLED invoices.
     * <p>
     * Similar pattern: {@link com.wellkorea.backend.delivery.infrastructure.persistence.DeliveryRepository#getDeliveredQuantitiesByProject}
     *
     * @param projectId Project ID
     * @return List of product invoice summaries
     */
    @Query("""
            SELECT ili.productId, SUM(ili.quantityInvoiced)
            FROM InvoiceLineItem ili
            JOIN ili.invoice i
            WHERE i.projectId = :projectId
            AND i.status != 'CANCELLED'
            GROUP BY ili.productId
            """)
    List<Object[]> getInvoicedQuantitiesByProject(@Param("projectId") Long projectId);
}
