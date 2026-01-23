package com.wellkorea.backend.finance.application;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.finance.domain.AccountsPayable;
import com.wellkorea.backend.finance.domain.vo.DisbursementCause;
import com.wellkorea.backend.finance.domain.vo.DisbursementCauseType;
import com.wellkorea.backend.finance.infrastructure.persistence.AccountsPayableRepository;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderConfirmedEvent;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event handler that listens for purchase order confirmation events
 * and creates AccountsPayable entries for tracking vendor payments.
 * Uses @TransactionalEventListener with BEFORE_COMMIT phase to ensure
 * the AP creation is within the same transaction as the PO confirmation.
 */
@Component
public class AccountsPayableEventHandler {

    private static final Logger log = LoggerFactory.getLogger(AccountsPayableEventHandler.class);

    private final AccountsPayableRepository accountsPayableRepository;
    private final CompanyRepository companyRepository;

    public AccountsPayableEventHandler(AccountsPayableRepository accountsPayableRepository,
                                       CompanyRepository companyRepository) {
        this.accountsPayableRepository = accountsPayableRepository;
        this.companyRepository = companyRepository;
    }

    /**
     * Handle purchase order confirmed events.
     * Creates an AccountsPayable entry to track payment obligations.
     *
     * @param event the PO confirmed event
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onPurchaseOrderConfirmed(PurchaseOrderConfirmedEvent event) {
        log.debug("Handling PO confirmed event: poId={}, vendorId={}, amount={}",
                event.purchaseOrderId(), event.vendorId(), event.totalAmount());

        // Check if AP already exists for this disbursement cause (idempotency)
        if (accountsPayableRepository.existsByDisbursementCause_CauseTypeAndDisbursementCause_CauseId(
                DisbursementCauseType.PURCHASE_ORDER, event.purchaseOrderId())) {
            log.info("AccountsPayable already exists for PO {}, skipping creation",
                    event.purchaseOrderId());
            return;
        }

        Company vendor = companyRepository.findById(event.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vendor company not found with ID: " + event.vendorId()));

        // Create DisbursementCause from PurchaseOrder
        DisbursementCause disbursementCause = DisbursementCause.fromPurchaseOrder(
                event.purchaseOrderId(),
                event.poNumber()
        );

        // Build AP with disbursementCause
        AccountsPayable accountsPayable = AccountsPayable.builder()
                .disbursementCause(disbursementCause)
                .vendor(vendor)
                .totalAmount(event.totalAmount())
                .currency(event.currency())
                .build();

        accountsPayableRepository.save(accountsPayable);

        log.info("Created AccountsPayable for PO {} with amount {} {} (causeType={}, causeId={})",
                event.poNumber(), event.totalAmount(), event.currency(),
                disbursementCause.getCauseType(), disbursementCause.getCauseId());
    }
}
