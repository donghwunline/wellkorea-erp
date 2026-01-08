package com.wellkorea.backend.invoice.application;

import com.wellkorea.backend.invoice.infrastructure.persistence.TaxInvoiceRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Generates unique invoice numbers.
 * Format: INV-YYYY-NNNNNN (e.g., INV-2026-000001)
 */
@Component
public class InvoiceNumberGenerator {

    private final TaxInvoiceRepository invoiceRepository;
    private final AtomicLong sequenceCounter = new AtomicLong(0);
    private int currentYear = 0;

    public InvoiceNumberGenerator(TaxInvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Generate a unique invoice number.
     *
     * @return Unique invoice number
     */
    public synchronized String generate() {
        int year = LocalDate.now().getYear();

        // Reset counter if year changed
        if (year != currentYear) {
            currentYear = year;
            sequenceCounter.set(0);
        }

        String invoiceNumber;
        do {
            long sequence = sequenceCounter.incrementAndGet();
            invoiceNumber = String.format("INV-%d-%06d", year, sequence);
        } while (invoiceRepository.existsByInvoiceNumber(invoiceNumber));

        return invoiceNumber;
    }
}
