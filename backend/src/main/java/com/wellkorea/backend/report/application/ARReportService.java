package com.wellkorea.backend.report.application;

import com.wellkorea.backend.report.api.dto.ARInvoiceView;
import com.wellkorea.backend.report.api.dto.ARReportView;
import com.wellkorea.backend.report.api.dto.CustomerARView;
import com.wellkorea.backend.report.infrastructure.mapper.ARReportMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for generating AR (Accounts Receivable) reports.
 * <p>
 * Uses MyBatis for optimized queries and performs aggregation in Java.
 */
@Service
@Transactional(readOnly = true)
public class ARReportService {

    private final ARReportMapper arReportMapper;

    public ARReportService(ARReportMapper arReportMapper) {
        this.arReportMapper = arReportMapper;
    }

    /**
     * Generate AR aging report.
     * <p>
     * Fetches all unpaid invoices and aggregates them:
     * - Summary totals by aging bucket
     * - Customer-level breakdown
     * - Individual invoice details
     *
     * @return AR report with aging analysis
     */
    public ARReportView generateARReport() {
        List<ARInvoiceView> invoices = arReportMapper.findUnpaidInvoicesWithAgingInfo();

        // Initialize bucket totals
        BigDecimal currentAmount = BigDecimal.ZERO;
        BigDecimal days30Amount = BigDecimal.ZERO;
        BigDecimal days60Amount = BigDecimal.ZERO;
        BigDecimal days90PlusAmount = BigDecimal.ZERO;
        int currentCount = 0;
        int days30Count = 0;
        int days60Count = 0;
        int days90PlusCount = 0;

        // Customer aggregation map (preserves insertion order)
        Map<Long, CustomerAggregator> customerMap = new LinkedHashMap<>();

        for (ARInvoiceView invoice : invoices) {
            BigDecimal remaining = invoice.remainingBalance();
            String bucket = invoice.agingBucket();

            // Aggregate by bucket
            switch (bucket) {
                case "Current" -> {
                    currentAmount = currentAmount.add(remaining);
                    currentCount++;
                }
                case "30 Days" -> {
                    days30Amount = days30Amount.add(remaining);
                    days30Count++;
                }
                case "60 Days" -> {
                    days60Amount = days60Amount.add(remaining);
                    days60Count++;
                }
                case "90+ Days" -> {
                    days90PlusAmount = days90PlusAmount.add(remaining);
                    days90PlusCount++;
                }
            }

            // Aggregate by customer
            Long customerId = invoice.customerId();
            if (customerId != null) {
                customerMap.computeIfAbsent(customerId,
                                id -> new CustomerAggregator(customerId, invoice.customerName()))
                        .addInvoice(bucket, remaining);
            }
        }

        BigDecimal totalOutstanding = currentAmount.add(days30Amount).add(days60Amount).add(days90PlusAmount);
        int totalInvoices = currentCount + days30Count + days60Count + days90PlusCount;

        List<CustomerARView> customerViews = customerMap.values().stream()
                .map(CustomerAggregator::toView)
                .toList();

        return new ARReportView(
                totalOutstanding,
                currentAmount,
                days30Amount,
                days60Amount,
                days90PlusAmount,
                totalInvoices,
                currentCount,
                days30Count,
                days60Count,
                days90PlusCount,
                customerViews,
                invoices
        );
    }

    /**
     * Helper class to aggregate invoice data by customer.
     */
    private static class CustomerAggregator {
        private final Long customerId;
        private final String customerName;
        private BigDecimal currentAmount = BigDecimal.ZERO;
        private BigDecimal days30Amount = BigDecimal.ZERO;
        private BigDecimal days60Amount = BigDecimal.ZERO;
        private BigDecimal days90PlusAmount = BigDecimal.ZERO;
        private int invoiceCount = 0;

        CustomerAggregator(Long customerId, String customerName) {
            this.customerId = customerId;
            this.customerName = customerName;
        }

        void addInvoice(String bucket, BigDecimal amount) {
            invoiceCount++;
            switch (bucket) {
                case "Current" -> currentAmount = currentAmount.add(amount);
                case "30 Days" -> days30Amount = days30Amount.add(amount);
                case "60 Days" -> days60Amount = days60Amount.add(amount);
                case "90+ Days" -> days90PlusAmount = days90PlusAmount.add(amount);
            }
        }

        CustomerARView toView() {
            BigDecimal total = currentAmount.add(days30Amount).add(days60Amount).add(days90PlusAmount);
            return new CustomerARView(
                    customerId,
                    customerName,
                    total,
                    currentAmount,
                    days30Amount,
                    days60Amount,
                    days90PlusAmount,
                    invoiceCount
            );
        }
    }
}
