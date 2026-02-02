package com.wellkorea.backend.core.purchasing.application.dto;

import com.wellkorea.backend.core.purchasing.api.dto.command.AttachmentInfo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Internal command for creating a service purchase request (outsourcing).
 */
public record CreateServicePurchaseRequestCommand(
        Long projectId,
        Long serviceCategoryId,
        String description,
        BigDecimal quantity,
        String uom,
        LocalDate requiredDate,
        List<AttachmentInfo> attachments
) {
}
