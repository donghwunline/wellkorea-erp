package com.wellkorea.backend.purchasing.domain;

/**
 * Payment methods for vendor payments.
 */
public enum VendorPaymentMethod {
    /**
     * Bank wire transfer.
     */
    BANK_TRANSFER,

    /**
     * Paper check.
     */
    CHECK,

    /**
     * Cash payment.
     */
    CASH,

    /**
     * Promissory note (약속어음).
     */
    PROMISSORY_NOTE,

    /**
     * Other payment method.
     */
    OTHER
}
