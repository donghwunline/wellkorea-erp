package com.wellkorea.backend.purchasing.domain.vo;

/**
 * Status enum for PurchaseOrder lifecycle.
 * DRAFT → SENT → CONFIRMED → RECEIVED, or CANCELED at any point before RECEIVED.
 */
public enum PurchaseOrderStatus {
    /**
     * PO created but not sent.
     */
    DRAFT,

    /**
     * PO sent to vendor.
     */
    SENT,

    /**
     * Vendor confirmed the order.
     */
    CONFIRMED,

    /**
     * Goods/services received.
     */
    RECEIVED,

    /**
     * Order canceled.
     */
    CANCELED
}
