package com.wellkorea.backend.invoice.application;

import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.invoice.api.dto.query.*;
import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.invoice.domain.Payment;
import com.wellkorea.backend.invoice.domain.TaxInvoice;
import com.wellkorea.backend.invoice.infrastructure.persistence.TaxInvoiceRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Query service for invoice read operations.
 * Following CQRS: read-only transactional operations.
 */
@Service
@Transactional(readOnly = true)
public class InvoiceQueryService {

    private final TaxInvoiceRepository invoiceRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public InvoiceQueryService(TaxInvoiceRepository invoiceRepository,
                               ProjectRepository projectRepository,
                               UserRepository userRepository) {
        this.invoiceRepository = invoiceRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get invoice detail by ID.
     *
     * @param id Invoice ID
     * @return Invoice detail view
     */
    public InvoiceDetailView getInvoiceDetail(Long id) {
        TaxInvoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
        return mapToDetailView(invoice);
    }

    /**
     * Get invoices list with pagination.
     *
     * @param pageable Pagination info
     * @return Page of invoice summaries
     */
    public Page<InvoiceSummaryView> getInvoices(Pageable pageable) {
        return invoiceRepository.findAll(pageable)
                .map(this::mapToSummaryView);
    }

    /**
     * Get invoices by project.
     *
     * @param projectId Project ID
     * @return List of invoice summaries
     */
    public List<InvoiceSummaryView> getInvoicesByProject(Long projectId) {
        return invoiceRepository.findByProjectIdOrderByIssueDateDesc(projectId)
                .stream()
                .map(this::mapToSummaryView)
                .toList();
    }

    /**
     * Get invoices by status with pagination.
     *
     * @param status   Invoice status
     * @param pageable Pagination info
     * @return Page of invoice summaries
     */
    public Page<InvoiceSummaryView> getInvoicesByStatus(InvoiceStatus status, Pageable pageable) {
        return invoiceRepository.findByStatus(status, pageable)
                .map(this::mapToSummaryView);
    }

    /**
     * Generate AR (Accounts Receivable) aging report.
     *
     * @return AR report view
     */
    public ARReportView generateARReport() {
        List<InvoiceStatus> unpaidStatuses = List.of(
                InvoiceStatus.ISSUED,
                InvoiceStatus.PARTIALLY_PAID,
                InvoiceStatus.OVERDUE
        );

        List<TaxInvoice> unpaidInvoices = invoiceRepository.findWithOutstandingBalance(unpaidStatuses);

        // Initialize totals
        BigDecimal currentAmount = BigDecimal.ZERO;
        BigDecimal days30Amount = BigDecimal.ZERO;
        BigDecimal days60Amount = BigDecimal.ZERO;
        BigDecimal days90PlusAmount = BigDecimal.ZERO;
        int currentCount = 0;
        int days30Count = 0;
        int days60Count = 0;
        int days90PlusCount = 0;

        List<ARInvoiceView> invoiceViews = new java.util.ArrayList<>();

        for (TaxInvoice invoice : unpaidInvoices) {
            BigDecimal remaining = invoice.getRemainingBalance();
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) continue;

            String bucket = invoice.getAgingBucket();
            switch (bucket) {
                case "Current" -> {
                    currentAmount = currentAmount.add(remaining);
                    currentCount++;
                }
                case "30 Days" -> {
                    days30Amount = days30Amount.add(remaining);
                    days30Count++;
                }
                case "60 Days" -> {
                    days60Amount = days60Amount.add(remaining);
                    days60Count++;
                }
                case "90+ Days" -> {
                    days90PlusAmount = days90PlusAmount.add(remaining);
                    days90PlusCount++;
                }
            }

            // Get project and customer info
            String jobCode = "";
            Long customerId = null;
            String customerName = "";

            projectRepository.findById(invoice.getProjectId()).ifPresent(project -> {
                // Project contains jobCode and customer company info
            });

            Project project = projectRepository.findById(invoice.getProjectId()).orElse(null);
            if (project != null) {
                jobCode = project.getJobCode();
                customerId = project.getCustomerId();
                // Note: Customer name would be fetched from Company entity
            }

            invoiceViews.add(new ARInvoiceView(
                    invoice.getId(),
                    invoice.getInvoiceNumber(),
                    invoice.getProjectId(),
                    jobCode,
                    customerId,
                    customerName, // Would need CompanyRepository to populate
                    invoice.getIssueDate(),
                    invoice.getDueDate(),
                    invoice.getStatus(),
                    invoice.getTotalAmount(),
                    invoice.getTotalPaid(),
                    remaining,
                    invoice.getDaysOverdue(),
                    bucket
            ));
        }

        BigDecimal totalOutstanding = currentAmount.add(days30Amount).add(days60Amount).add(days90PlusAmount);
        int totalInvoices = currentCount + days30Count + days60Count + days90PlusCount;

        return new ARReportView(
                totalOutstanding,
                currentAmount,
                days30Amount,
                days60Amount,
                days90PlusAmount,
                totalInvoices,
                currentCount,
                days30Count,
                days60Count,
                days90PlusCount,
                List.of(), // byCustomer - would aggregate by customer
                invoiceViews
        );
    }

    // ========== Mapping Methods ==========

    private InvoiceDetailView mapToDetailView(TaxInvoice invoice) {
        // Get project job code
        String jobCode = projectRepository.findById(invoice.getProjectId())
                .map(Project::getJobCode)
                .orElse("");

        // Get creator name
        String createdByName = userRepository.findById(invoice.getCreatedById())
                .map(user -> user.getUsername())
                .orElse("");

        // Map line items
        List<InvoiceLineItemView> lineItemViews = invoice.getLineItems().stream()
                .map(item -> new InvoiceLineItemView(
                        item.getId(),
                        item.getProductId(),
                        item.getProductName(),
                        item.getProductSku(),
                        item.getQuantityInvoiced(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                ))
                .toList();

        // Map payments
        List<PaymentView> paymentViews = invoice.getPayments().stream()
                .map(this::mapToPaymentView)
                .toList();

        return new InvoiceDetailView(
                invoice.getId(),
                invoice.getProjectId(),
                jobCode,
                invoice.getDeliveryId(),
                invoice.getInvoiceNumber(),
                invoice.getIssueDate(),
                invoice.getStatus(),
                invoice.getStatus().getLabelKo(),
                invoice.getTotalBeforeTax(),
                invoice.getTaxRate(),
                invoice.getTotalTax(),
                invoice.getTotalAmount(),
                invoice.getTotalPaid(),
                invoice.getRemainingBalance(),
                invoice.getDueDate(),
                invoice.getNotes(),
                invoice.getCreatedById(),
                createdByName,
                invoice.getCreatedAt(),
                invoice.getUpdatedAt(),
                invoice.getIssuedToCustomerDate(),
                invoice.isOverdue(),
                invoice.getDaysOverdue(),
                invoice.getAgingBucket(),
                lineItemViews,
                paymentViews
        );
    }

    private InvoiceSummaryView mapToSummaryView(TaxInvoice invoice) {
        String jobCode = projectRepository.findById(invoice.getProjectId())
                .map(Project::getJobCode)
                .orElse("");

        return new InvoiceSummaryView(
                invoice.getId(),
                invoice.getProjectId(),
                jobCode,
                invoice.getInvoiceNumber(),
                invoice.getIssueDate(),
                invoice.getStatus(),
                invoice.getStatus().getLabelKo(),
                invoice.getTotalAmount(),
                invoice.getTotalPaid(),
                invoice.getRemainingBalance(),
                invoice.getDueDate(),
                invoice.isOverdue(),
                invoice.getAgingBucket(),
                invoice.getLineItems().size(),
                invoice.getPayments().size()
        );
    }

    private PaymentView mapToPaymentView(Payment payment) {
        String recordedByName = userRepository.findById(payment.getRecordedById())
                .map(user -> user.getUsername())
                .orElse("");

        return new PaymentView(
                payment.getId(),
                payment.getInvoiceId(),
                payment.getPaymentDate(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getPaymentMethod().getLabelKo(),
                payment.getReferenceNumber(),
                payment.getNotes(),
                payment.getRecordedById(),
                recordedByName,
                payment.getCreatedAt()
        );
    }
}
