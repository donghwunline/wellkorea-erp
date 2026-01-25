package com.wellkorea.backend.finance.application;

import com.wellkorea.backend.finance.api.dto.command.RecordVendorPaymentRequest;
import com.wellkorea.backend.finance.api.dto.command.VendorPaymentCommandResult;
import com.wellkorea.backend.finance.domain.AccountsPayable;
import com.wellkorea.backend.finance.domain.VendorPayment;
import com.wellkorea.backend.finance.infrastructure.persistence.AccountsPayableRepository;
import com.wellkorea.backend.finance.infrastructure.persistence.VendorPaymentRepository;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Command service for vendor payment operations.
 */
@Slf4j
@Service
@Transactional
public class VendorPaymentCommandService {

    private final AccountsPayableRepository accountsPayableRepository;
    private final VendorPaymentRepository vendorPaymentRepository;

    public VendorPaymentCommandService(
            AccountsPayableRepository accountsPayableRepository,
            VendorPaymentRepository vendorPaymentRepository) {
        this.accountsPayableRepository = accountsPayableRepository;
        this.vendorPaymentRepository = vendorPaymentRepository;
    }

    /**
     * Record a payment against an accounts payable.
     *
     * @param accountsPayableId the AP to pay against
     * @param request           the payment details
     * @param recordedByUserId  the user recording the payment
     * @return the payment result with updated AP info
     * @throws ResourceNotFoundException if AP not found
     * @throws IllegalStateException     if AP cannot receive payments
     * @throws IllegalArgumentException  if payment exceeds remaining balance
     */
    public VendorPaymentCommandResult recordPayment(Long accountsPayableId, RecordVendorPaymentRequest request, Long recordedByUserId) {
        log.info("Recording payment of {} for AP ID {} by user {}",
                request.amount(), accountsPayableId, recordedByUserId);

        AccountsPayable ap = accountsPayableRepository.findById(accountsPayableId)
                .orElseThrow(() -> new ResourceNotFoundException("AccountsPayable", accountsPayableId));

        VendorPayment payment = VendorPayment.builder()
                .paymentDate(request.paymentDate())
                .amount(request.amount())
                .paymentMethod(request.paymentMethod())
                .referenceNumber(request.referenceNumber())
                .notes(request.notes())
                .recordedById(recordedByUserId)
                .build();

        // This will validate and update AP status
        ap.addPayment(payment);

        // Save both entities
        vendorPaymentRepository.save(payment);
        accountsPayableRepository.save(ap);

        log.info("Payment {} recorded successfully. AP new status: {}, remaining: {}",
                payment.getId(), ap.getStatus(), ap.getRemainingBalance());

        // Calculate status string for result
        String calculatedStatus = ap.isFullyPaid() ? "PAID" :
                ap.getTotalPaid().compareTo(java.math.BigDecimal.ZERO) > 0 ? "PARTIALLY_PAID" : "PENDING";

        return VendorPaymentCommandResult.recorded(
                payment.getId(),
                accountsPayableId,
                ap.getRemainingBalance(),
                calculatedStatus);
    }
}
