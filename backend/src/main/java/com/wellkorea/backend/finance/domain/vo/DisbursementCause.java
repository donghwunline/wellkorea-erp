package com.wellkorea.backend.finance.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.util.Objects;

/**
 * Value object representing the cause of a disbursement (지출원인행위).
 * <p>
 * This embeddable abstracts the "causative act" that creates a payment obligation,
 * enabling AccountsPayable to be created from various sources (PurchaseOrder, ExpenseReport, etc.)
 * without direct entity coupling.
 * <p>
 * Each cause is identified by:
 * - {@code causeType}: The type of source document (PURCHASE_ORDER, EXPENSE_REPORT, etc.)
 * - {@code causeId}: The ID of the source entity
 * - {@code causeReferenceNumber}: Human-readable reference number (e.g., PO number)
 */
@Embeddable
public class DisbursementCause {

    @Enumerated(EnumType.STRING)
    @Column(name = "cause_type", nullable = false, length = 30)
    private DisbursementCauseType causeType;

    @Column(name = "cause_id", nullable = false)
    private Long causeId;

    @Column(name = "cause_reference_number", length = 50)
    private String causeReferenceNumber;

    /**
     * Protected no-arg constructor for JPA.
     */
    protected DisbursementCause() {
    }

    private DisbursementCause(DisbursementCauseType causeType, Long causeId, String causeReferenceNumber) {
        this.causeType = Objects.requireNonNull(causeType, "causeType must not be null");
        this.causeId = Objects.requireNonNull(causeId, "causeId must not be null");
        this.causeReferenceNumber = causeReferenceNumber;
    }

    // ========== Factory Methods ==========

    /**
     * Create a DisbursementCause from a PurchaseOrder.
     *
     * @param purchaseOrderId the purchase order ID
     * @param poNumber        the PO number (reference)
     * @return a new DisbursementCause instance
     */
    public static DisbursementCause fromPurchaseOrder(Long purchaseOrderId, String poNumber) {
        return new DisbursementCause(DisbursementCauseType.PURCHASE_ORDER, purchaseOrderId, poNumber);
    }

    /**
     * Create a DisbursementCause from an ExpenseReport.
     * Reserved for future use.
     *
     * @param expenseReportId the expense report ID
     * @param reportNumber    the expense report number (reference)
     * @return a new DisbursementCause instance
     */
    public static DisbursementCause fromExpenseReport(Long expenseReportId, String reportNumber) {
        return new DisbursementCause(DisbursementCauseType.EXPENSE_REPORT, expenseReportId, reportNumber);
    }

    /**
     * Create a DisbursementCause from a ServiceContract.
     * Reserved for future use.
     *
     * @param contractId     the service contract ID
     * @param contractNumber the contract number (reference)
     * @return a new DisbursementCause instance
     */
    public static DisbursementCause fromServiceContract(Long contractId, String contractNumber) {
        return new DisbursementCause(DisbursementCauseType.SERVICE_CONTRACT, contractId, contractNumber);
    }

    /**
     * Create a DisbursementCause from a RecurringBill.
     * Reserved for future use.
     *
     * @param recurringBillId the recurring bill ID
     * @param billReference   the bill reference (reference)
     * @return a new DisbursementCause instance
     */
    public static DisbursementCause fromRecurringBill(Long recurringBillId, String billReference) {
        return new DisbursementCause(DisbursementCauseType.RECURRING_BILL, recurringBillId, billReference);
    }

    /**
     * Create a DisbursementCause from a DirectInvoice.
     * Reserved for future use.
     *
     * @param invoiceId     the invoice ID
     * @param invoiceNumber the invoice number (reference)
     * @return a new DisbursementCause instance
     */
    public static DisbursementCause fromDirectInvoice(Long invoiceId, String invoiceNumber) {
        return new DisbursementCause(DisbursementCauseType.DIRECT_INVOICE, invoiceId, invoiceNumber);
    }

    // ========== Getters ==========

    public DisbursementCauseType getCauseType() {
        return causeType;
    }

    public Long getCauseId() {
        return causeId;
    }

    public String getCauseReferenceNumber() {
        return causeReferenceNumber;
    }

    // ========== Value Object Semantics ==========

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DisbursementCause that = (DisbursementCause) o;
        return causeType == that.causeType &&
                Objects.equals(causeId, that.causeId) &&
                Objects.equals(causeReferenceNumber, that.causeReferenceNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(causeType, causeId, causeReferenceNumber);
    }

    @Override
    public String toString() {
        return "DisbursementCause{" +
                "causeType=" + causeType +
                ", causeId=" + causeId +
                ", causeReferenceNumber='" + causeReferenceNumber + '\'' +
                '}';
    }
}
