package com.wellkorea.backend.purchasing.api.dto.command;

import com.wellkorea.backend.production.domain.AllowedFileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for linking an existing file to a ServicePurchaseRequest.
 * Frontend provides details from existing TaskFlow BlueprintAttachment.
 *
 * @param fileName    Original file name
 * @param fileType    File type (PDF, DXF, DWG, JPG, PNG)
 * @param fileSize    File size in bytes
 * @param storagePath Existing MinIO path from TaskFlow
 */
public record LinkAttachmentRequest(
        @NotBlank String fileName,
        @NotNull AllowedFileType fileType,
        @NotNull @Positive Long fileSize,
        @NotBlank String storagePath
) {}
