package com.wellkorea.backend.supporting.storage.domain.constant;

/**
 * Centralized attachment limit constants.
 * <p>
 * Single source of truth for file size and count limits across the application.
 * Used by AttachmentReference, ServicePurchaseRequest, and RfqEmailService.
 * <p>
 * Frontend equivalent: {@code shared/lib/attachment-limits.ts}
 */
public final class AttachmentLimits {

    private AttachmentLimits() {
        // Prevent instantiation
    }

    /**
     * Maximum individual file size (50MB).
     * Same limit as BlueprintAttachment uploads.
     */
    public static final long MAX_FILE_SIZE = 52_428_800L;

    /**
     * Maximum total attachment size per entity (20MB).
     * Applies to ServicePurchaseRequest total attachments.
     * Also used as email attachment size limit.
     */
    public static final long MAX_TOTAL_SIZE = 20 * 1024 * 1024L;

    /**
     * Maximum number of attachments per entity.
     */
    public static final int MAX_ATTACHMENT_COUNT = 20;
}
