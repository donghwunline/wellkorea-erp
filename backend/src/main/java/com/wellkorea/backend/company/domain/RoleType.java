package com.wellkorea.backend.company.domain;

/**
 * Types of business relationships a company can have.
 * A company can have multiple roles simultaneously (dual-role support).
 */
public enum RoleType {
    /**
     * Customer - companies that buy products/services from us.
     * Can receive quotations, orders, and invoices.
     */
    CUSTOMER,

    /**
     * Vendor - companies that supply materials or components to us.
     * Can receive purchase orders and RFQs.
     */
    VENDOR,

    /**
     * Outsource - external companies that perform manufacturing processes.
     * Used for work that is outsourced (e.g., painting, heat treatment).
     */
    OUTSOURCE
}
