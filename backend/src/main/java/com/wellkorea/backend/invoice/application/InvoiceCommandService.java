package com.wellkorea.backend.invoice.application;

import com.wellkorea.backend.invoice.api.dto.command.CreateInvoiceRequest;
import com.wellkorea.backend.invoice.api.dto.command.InvoiceLineItemRequest;
import com.wellkorea.backend.invoice.api.dto.command.RecordPaymentRequest;
import com.wellkorea.backend.invoice.domain.InvoiceLineItem;
import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.invoice.domain.Payment;
import com.wellkorea.backend.invoice.domain.TaxInvoice;
import com.wellkorea.backend.invoice.infrastructure.persistence.PaymentRepository;
import com.wellkorea.backend.invoice.infrastructure.persistence.TaxInvoiceRepository;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Command service for invoice operations.
 * Handles create, update, issue, cancel, and payment recording.
 * <p>
 * Following CQRS: returns only IDs, clients fetch fresh data via QueryService.
 */
@Service
@Transactional
public class InvoiceCommandService {

    private final TaxInvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;
    private final InvoiceNumberGenerator invoiceNumberGenerator;

    public InvoiceCommandService(TaxInvoiceRepository invoiceRepository,
                                 PaymentRepository paymentRepository,
                                 ProjectRepository projectRepository,
                                 InvoiceNumberGenerator invoiceNumberGenerator) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.projectRepository = projectRepository;
        this.invoiceNumberGenerator = invoiceNumberGenerator;
    }

    /**
     * Create a new tax invoice.
     *
     * @param request   Create request
     * @param creatorId User ID creating the invoice
     * @return Created invoice ID
     */
    public Long createInvoice(CreateInvoiceRequest request, Long creatorId) {
        // Validate project exists
        if (!projectRepository.existsById(request.projectId())) {
            throw new IllegalArgumentException("Project not found: " + request.projectId());
        }

        // Validate dates
        if (request.dueDate().isBefore(request.issueDate())) {
            throw new IllegalArgumentException("Due date must be on or after issue date");
        }

        // Generate unique invoice number
        String invoiceNumber = invoiceNumberGenerator.generate();

        // Build invoice with line items
        TaxInvoice invoice = TaxInvoice.builder()
                .projectId(request.projectId())
                .deliveryId(request.deliveryId())
                .invoiceNumber(invoiceNumber)
                .issueDate(request.issueDate())
                .dueDate(request.dueDate())
                .taxRate(request.taxRate())
                .notes(request.notes())
                .createdById(creatorId)
                .build();

        // Add line items
        for (InvoiceLineItemRequest itemRequest : request.lineItems()) {
            InvoiceLineItem lineItem = InvoiceLineItem.builder()
                    .productId(itemRequest.productId())
                    .productName(itemRequest.productName())
                    .productSku(itemRequest.productSku())
                    .quantityInvoiced(itemRequest.quantityInvoiced())
                    .unitPrice(itemRequest.unitPrice())
                    .build();
            invoice.addLineItem(lineItem);
        }

        TaxInvoice saved = invoiceRepository.save(invoice);
        return saved.getId();
    }

    /**
     * Issue an invoice (change from DRAFT to ISSUED).
     *
     * @param invoiceId Invoice ID
     * @return Invoice ID
     */
    public Long issueInvoice(Long invoiceId) {
        TaxInvoice invoice = findInvoiceById(invoiceId);
        invoice.issue();
        invoiceRepository.save(invoice);
        return invoiceId;
    }

    /**
     * Cancel an invoice.
     *
     * @param invoiceId Invoice ID
     * @return Invoice ID
     */
    public Long cancelInvoice(Long invoiceId) {
        TaxInvoice invoice = findInvoiceById(invoiceId);
        invoice.cancel();
        invoiceRepository.save(invoice);
        return invoiceId;
    }

    /**
     * Record a payment against an invoice.
     *
     * @param invoiceId  Invoice ID
     * @param request    Payment request
     * @param recorderId User ID recording the payment
     * @return Payment ID
     */
    public Long recordPayment(Long invoiceId, RecordPaymentRequest request, Long recorderId) {
        TaxInvoice invoice = findInvoiceById(invoiceId);

        // Validate invoice status allows payments
        if (!invoice.getStatus().canReceivePayment()) {
            throw new IllegalStateException(
                    "Cannot record payment for invoice with status: " + invoice.getStatus());
        }

        // Validate payment doesn't exceed remaining balance
        BigDecimal remainingBalance = invoice.getRemainingBalance();
        if (request.amount().compareTo(remainingBalance) > 0) {
            throw new IllegalArgumentException(
                    "Payment amount " + request.amount() +
                            " exceeds remaining balance " + remainingBalance);
        }

        // Create and save payment
        Payment payment = Payment.builder()
                .paymentDate(request.paymentDate())
                .amount(request.amount())
                .paymentMethod(request.paymentMethod())
                .referenceNumber(request.referenceNumber())
                .notes(request.notes())
                .recordedById(recorderId)
                .build();

        invoice.addPayment(payment);
        invoiceRepository.save(invoice);

        return payment.getId();
    }

    /**
     * Update invoice notes.
     *
     * @param invoiceId Invoice ID
     * @param notes     New notes
     * @return Invoice ID
     */
    public Long updateNotes(Long invoiceId, String notes) {
        TaxInvoice invoice = findInvoiceById(invoiceId);
        invoice.updateNotes(notes);
        invoiceRepository.save(invoice);
        return invoiceId;
    }

    /**
     * Mark overdue invoices.
     * Called by scheduled job.
     *
     * @return Number of invoices marked as overdue
     */
    public int markOverdueInvoices() {
        LocalDate today = LocalDate.now();
        List<InvoiceStatus> overdueEligible = List.of(
                InvoiceStatus.ISSUED,
                InvoiceStatus.PARTIALLY_PAID
        );

        List<TaxInvoice> overdueInvoices = invoiceRepository.findOverdueInvoices(today, overdueEligible);

        int count = 0;
        for (TaxInvoice invoice : overdueInvoices) {
            if (invoice.isOverdue() && invoice.getStatus() != InvoiceStatus.OVERDUE) {
                invoice.markOverdue();
                invoiceRepository.save(invoice);
                count++;
            }
        }

        return count;
    }

    private TaxInvoice findInvoiceById(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));
    }
}
