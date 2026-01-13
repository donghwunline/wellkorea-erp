package com.wellkorea.backend.invoice.application;

import com.wellkorea.backend.invoice.api.dto.command.CreateInvoiceRequest;
import com.wellkorea.backend.invoice.api.dto.command.InvoiceLineItemRequest;
import com.wellkorea.backend.invoice.api.dto.command.RecordPaymentRequest;
import com.wellkorea.backend.invoice.domain.InvoiceLineItem;
import com.wellkorea.backend.invoice.domain.InvoiceLineItemInput;
import com.wellkorea.backend.invoice.domain.InvoiceStatus;
import com.wellkorea.backend.invoice.domain.Payment;
import com.wellkorea.backend.invoice.domain.QuotationInvoiceGuard;
import com.wellkorea.backend.invoice.domain.TaxInvoice;
import com.wellkorea.backend.invoice.infrastructure.persistence.PaymentRepository;
import com.wellkorea.backend.invoice.infrastructure.persistence.TaxInvoiceRepository;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.lock.ProjectLock;
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
 * <p>
 * Uses {@link ProjectLock} annotation for distributed locking to prevent race conditions
 * during concurrent invoice creation for the same project.
 */
@Service
@Transactional
public class InvoiceCommandService {

    private final TaxInvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ProjectRepository projectRepository;
    private final QuotationRepository quotationRepository;
    private final QuotationInvoiceGuard quotationInvoiceGuard;
    private final InvoiceNumberGenerator invoiceNumberGenerator;

    public InvoiceCommandService(TaxInvoiceRepository invoiceRepository,
                                 PaymentRepository paymentRepository,
                                 ProjectRepository projectRepository,
                                 QuotationRepository quotationRepository,
                                 QuotationInvoiceGuard quotationInvoiceGuard,
                                 InvoiceNumberGenerator invoiceNumberGenerator) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.projectRepository = projectRepository;
        this.quotationRepository = quotationRepository;
        this.quotationInvoiceGuard = quotationInvoiceGuard;
        this.invoiceNumberGenerator = invoiceNumberGenerator;
    }

    /**
     * Create a new tax invoice.
     * <p>
     * Acquires a distributed lock on the project (via {@link ProjectLock}) to prevent
     * race conditions during concurrent invoice creation. The lock ensures:
     * <ul>
     *   <li>Consistent quotation data during validation</li>
     *   <li>Accurate cumulative delivered/invoiced quantities</li>
     *   <li>No over-invoicing beyond delivered amounts</li>
     * </ul>
     * <p>
     * Delegates to {@link Quotation#createInvoice} factory method which validates
     * using {@link QuotationInvoiceGuard} and creates the TaxInvoice entity.
     *
     * @param projectId Project ID (used for distributed lock)
     * @param request   Create request
     * @param creatorId User ID creating the invoice
     * @return Created invoice ID
     * @throws ResourceNotFoundException                                  if project doesn't exist
     * @throws BusinessException                                          if validation fails
     * @throws com.wellkorea.backend.shared.lock.LockAcquisitionException if lock cannot be acquired
     */
    @ProjectLock
    public Long createInvoice(Long projectId, CreateInvoiceRequest request, Long creatorId) {
        // Validate project exists
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        // Get approved quotation for the project
        Quotation quotation = findApprovedQuotation(projectId);
        if (quotation == null) {
            throw new BusinessException("No approved quotation found for project. Quotation must be approved before creating invoices.");
        }

        // Convert DTO line items to domain input
        List<InvoiceLineItemInput> lineItemInputs = request.lineItems().stream()
                .map(this::toLineItemInput)
                .toList();

        // Delegate to Quotation's factory method (uses Double Dispatch pattern)
        TaxInvoice invoice = quotation.createInvoice(
                quotationInvoiceGuard,
                invoiceNumberGenerator,
                request.issueDate(),
                request.dueDate(),
                request.taxRate(),
                request.notes(),
                request.deliveryId(),
                lineItemInputs,
                creatorId
        );

        TaxInvoice saved = invoiceRepository.save(invoice);
        return saved.getId();
    }

    /**
     * Convert DTO to domain input.
     */
    private InvoiceLineItemInput toLineItemInput(InvoiceLineItemRequest dto) {
        return new InvoiceLineItemInput(
                dto.productId(),
                dto.productName(),
                dto.productSku(),
                dto.quantityInvoiced(),
                dto.unitPrice()
        );
    }

    /**
     * Find the latest approved quotation for a project.
     *
     * @param projectId Project ID
     * @return Latest approved quotation, or null if none exists
     */
    private Quotation findApprovedQuotation(Long projectId) {
        var quotations = quotationRepository.findLatestApprovedForProject(projectId);
        return quotations.isEmpty() ? null : quotations.getFirst();
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
