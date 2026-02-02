package com.wellkorea.backend.supporting.approval.domain.vo;

/**
 * Entity types that can have approval workflows.
 */
public enum EntityType {
    /**
     * Quotation approval workflow.
     */
    QUOTATION,

    /**
     * Purchase order approval workflow.
     */
    PURCHASE_ORDER,

    /**
     * Vendor selection approval workflow.
     * Used when selecting a vendor from RFQ responses.
     */
    VENDOR_SELECTION
}
