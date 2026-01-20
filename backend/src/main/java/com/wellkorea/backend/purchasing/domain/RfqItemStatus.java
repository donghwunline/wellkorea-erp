package com.wellkorea.backend.purchasing.domain;

/**
 * Status enum for RFQ items sent to vendors.
 * SENT → REPLIED → SELECTED/REJECTED, or NO_RESPONSE if vendor doesn't reply.
 */
public enum RfqItemStatus {
    /**
     * RFQ sent to vendor, awaiting response.
     */
    SENT,

    /**
     * Vendor has replied with a quote.
     */
    REPLIED,

    /**
     * Vendor did not respond within deadline.
     */
    NO_RESPONSE,

    /**
     * This vendor's quote was selected for PO.
     */
    SELECTED,

    /**
     * This vendor's quote was not selected.
     */
    REJECTED
}
