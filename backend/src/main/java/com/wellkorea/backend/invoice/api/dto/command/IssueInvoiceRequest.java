package com.wellkorea.backend.invoice.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for issuing an invoice with an attached document.
 * The document must be uploaded to MinIO first, then this request is sent
 * with the object key from the upload.
 */
public record IssueInvoiceRequest(
        @NotBlank(message = "File name is required")
        String fileName,

        @Positive(message = "File size must be positive")
        Long fileSize,

        @NotBlank(message = "Object key is required")
        String objectKey
) {
}
