package com.wellkorea.backend.finance.domain.vo;

/**
 * Types of disbursement causes (지출원인행위) that can create an AccountsPayable entry.
 * <p>
 * This enum abstracts the source of payment obligations, enabling future extensibility
 * to support multiple expenditure sources beyond PurchaseOrders.
 */
public enum DisbursementCauseType {

    /**
     * Payment obligation from a confirmed purchase order.
     */
    PURCHASE_ORDER("PO", "Purchase Order"),

    /**
     * Payment obligation from an approved expense report.
     * Future use case.
     */
    EXPENSE_REPORT("ER", "Expense Report"),

    /**
     * Payment obligation from a service contract.
     * Future use case.
     */
    SERVICE_CONTRACT("SC", "Service Contract"),

    /**
     * Recurring payment obligation (utilities, subscriptions, etc.).
     * Future use case.
     */
    RECURRING_BILL("RB", "Recurring Bill"),

    /**
     * Direct invoice without a prior commitment document.
     * Future use case.
     */
    DIRECT_INVOICE("DI", "Direct Invoice");

    private final String code;
    private final String displayName;

    DisbursementCauseType(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Find enum by code.
     *
     * @param code the short code (e.g., "PO", "ER")
     * @return the matching enum value
     * @throws IllegalArgumentException if code not found
     */
    public static DisbursementCauseType fromCode(String code) {
        for (DisbursementCauseType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown DisbursementCauseType code: " + code);
    }
}
