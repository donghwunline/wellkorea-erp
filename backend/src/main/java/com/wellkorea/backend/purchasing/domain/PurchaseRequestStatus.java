package com.wellkorea.backend.purchasing.domain;

/**
 * Status enum for PurchaseRequest lifecycle.
 * DRAFT → RFQ_SENT → VENDOR_SELECTED → CLOSED, or CANCELED at any point.
 */
public enum PurchaseRequestStatus {
    /**
     * Request created, not yet sent to vendors.
     */
    DRAFT,

    /**
     * RFQs sent to vendors awaiting responses.
     */
    RFQ_SENT,

    /**
     * Vendor chosen, PO to be created.
     */
    VENDOR_SELECTED,

    /**
     * PO completed and received.
     */
    CLOSED,

    /**
     * Request canceled.
     */
    CANCELED
}
