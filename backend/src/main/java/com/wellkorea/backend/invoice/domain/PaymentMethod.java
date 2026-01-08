package com.wellkorea.backend.invoice.domain;

/**
 * Payment method enum for recording customer payments.
 */
public enum PaymentMethod {
    BANK_TRANSFER("계좌이체", "Bank Transfer"),
    CREDIT_CARD("카드결제", "Credit Card"),
    CHECK("수표", "Check"),
    CASH("현금", "Cash"),
    OTHER("기타", "Other");

    private final String labelKo;
    private final String labelEn;

    PaymentMethod(String labelKo, String labelEn) {
        this.labelKo = labelKo;
        this.labelEn = labelEn;
    }

    public String getLabelKo() {
        return labelKo;
    }

    public String getLabelEn() {
        return labelEn;
    }
}
