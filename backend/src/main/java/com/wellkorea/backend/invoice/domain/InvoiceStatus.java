package com.wellkorea.backend.invoice.domain;

/**
 * Status enum for TaxInvoice lifecycle.
 * <p>
 * Status transitions:
 * - DRAFT: Invoice created but not yet issued
 * - ISSUED: Invoice sent to customer, payment expected
 * - PARTIALLY_PAID: Some payments received, balance remains
 * - PAID: Fully paid, invoice closed
 * - OVERDUE: Due date passed without full payment
 * - CANCELLED: Invoice voided (e.g., corrections, returns)
 */
public enum InvoiceStatus {
    DRAFT("임시저장", "Draft"),
    ISSUED("발행", "Issued"),
    PARTIALLY_PAID("부분수금", "Partially Paid"),
    PAID("완납", "Paid"),
    OVERDUE("연체", "Overdue"),
    CANCELLED("취소", "Cancelled");

    private final String labelKo;
    private final String labelEn;

    InvoiceStatus(String labelKo, String labelEn) {
        this.labelKo = labelKo;
        this.labelEn = labelEn;
    }

    public String getLabelKo() {
        return labelKo;
    }

    public String getLabelEn() {
        return labelEn;
    }

    /**
     * Check if transition to target status is valid.
     *
     * @param target Target status
     * @return true if transition is allowed
     */
    public boolean canTransitionTo(InvoiceStatus target) {
        return switch (this) {
            case DRAFT -> target == ISSUED || target == CANCELLED;
            case ISSUED -> target == PARTIALLY_PAID || target == PAID || target == OVERDUE || target == CANCELLED;
            case PARTIALLY_PAID -> target == PAID || target == OVERDUE || target == CANCELLED;
            case OVERDUE -> target == PARTIALLY_PAID || target == PAID || target == CANCELLED;
            case PAID -> target == CANCELLED; // Allow cancellation (e.g., for refunds, corrections)
            case CANCELLED -> false; // Terminal state
        };
    }

    /**
     * Check if this status is a terminal state.
     *
     * @return true if no further transitions possible
     */
    public boolean isTerminal() {
        return this == PAID || this == CANCELLED;
    }

    /**
     * Check if invoice can receive payments in this status.
     *
     * @return true if payments can be recorded
     */
    public boolean canReceivePayment() {
        return this == ISSUED || this == PARTIALLY_PAID || this == OVERDUE;
    }

    /**
     * Check if invoice can be edited in this status.
     *
     * @return true if editable
     */
    public boolean canEdit() {
        return this == DRAFT;
    }
}
