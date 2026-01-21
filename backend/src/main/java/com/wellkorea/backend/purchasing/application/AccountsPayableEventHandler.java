package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.purchasing.domain.AccountsPayable;
import com.wellkorea.backend.purchasing.domain.PurchaseOrder;
import com.wellkorea.backend.purchasing.domain.event.PurchaseOrderConfirmedEvent;
import com.wellkorea.backend.purchasing.infrastructure.persistence.AccountsPayableRepository;
import com.wellkorea.backend.purchasing.infrastructure.persistence.PurchaseOrderRepository;
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
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final CompanyRepository companyRepository;

    public AccountsPayableEventHandler(AccountsPayableRepository accountsPayableRepository,
                                       PurchaseOrderRepository purchaseOrderRepository,
                                       CompanyRepository companyRepository) {
        this.accountsPayableRepository = accountsPayableRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
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

        // Check if AP already exists for this PO (idempotency)
        if (accountsPayableRepository.existsByPurchaseOrder_Id(event.purchaseOrderId())) {
            log.info("AccountsPayable already exists for PO {}, skipping creation",
                    event.purchaseOrderId());
            return;
        }

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(event.purchaseOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase order not found with ID: " + event.purchaseOrderId()));

        Company vendor = companyRepository.findById(event.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vendor company not found with ID: " + event.vendorId()));

        AccountsPayable accountsPayable = AccountsPayable.builder()
                .purchaseOrder(purchaseOrder)
                .vendor(vendor)
                .totalAmount(event.totalAmount())
                .currency(event.currency())
                .poNumber(event.poNumber())
                .build();

        accountsPayableRepository.save(accountsPayable);

        log.info("Created AccountsPayable for PO {} with amount {} {}",
                event.poNumber(), event.totalAmount(), event.currency());
    }
}
