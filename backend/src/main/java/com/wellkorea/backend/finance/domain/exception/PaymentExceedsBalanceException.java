package com.wellkorea.backend.finance.domain.exception;

import java.math.BigDecimal;

/**
 * Thrown when payment amount exceeds remaining AP balance.
 * HTTP 400 Bad Request.
 */
public class PaymentExceedsBalanceException extends RuntimeException {

    private final BigDecimal paymentAmount;
    private final BigDecimal remainingBalance;

    public PaymentExceedsBalanceException(BigDecimal paymentAmount, BigDecimal remainingBalance) {
        super(String.format("Payment amount %s exceeds remaining balance %s",
                paymentAmount.toPlainString(), remainingBalance.toPlainString()));
        this.paymentAmount = paymentAmount;
        this.remainingBalance = remainingBalance;
    }

    public BigDecimal getPaymentAmount() {
        return paymentAmount;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }
}
