package com.wellkorea.backend.shared.storage.domain;

/**
 * Enum defining entity types that can own attachments.
 * Extensible for future entity types.
 */
public enum AttachmentOwnerType {

    DELIVERY("Delivery"),
    QUOTATION("Quotation"),
    INVOICE("Invoice"),
    PROJECT("Project");

    private final String displayName;

    AttachmentOwnerType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
