package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.domain.vo.PurchaseOrderStatus;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseOrderMapper;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseRequestMapper;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.mail.MailAttachment;
import com.wellkorea.backend.shared.mail.MailMessage;
import com.wellkorea.backend.shared.mail.MailSendException;
import com.wellkorea.backend.shared.mail.MailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Service for sending purchase order-related emails.
 * Handles PO notifications to vendors with PDF attachment.
 * Self-contained: handles its own data access via mappers (CQRS read path).
 * Uses MailSender abstraction to support multiple mail providers (SMTP, Microsoft Graph).
 */
@Service
public class PurchaseOrderEmailService {

    private static final Logger log = LoggerFactory.getLogger(PurchaseOrderEmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,###");
    private static final Set<String> SENDABLE_STATUSES = Set.of(
            PurchaseOrderStatus.DRAFT.name(),
            PurchaseOrderStatus.SENT.name(),
            PurchaseOrderStatus.CONFIRMED.name()
    );

    private final PurchaseOrderMapper purchaseOrderMapper;
    private final PurchaseRequestMapper purchaseRequestMapper;
    private final CompanyMapper companyMapper;
    private final MailSender mailSender;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;
    private final PurchaseOrderPdfService purchaseOrderPdfService;

    public PurchaseOrderEmailService(PurchaseOrderMapper purchaseOrderMapper,
                                     PurchaseRequestMapper purchaseRequestMapper,
                                     CompanyMapper companyMapper,
                                     MailSender mailSender,
                                     CompanyProperties companyProperties,
                                     TemplateEngine templateEngine,
                                     PurchaseOrderPdfService purchaseOrderPdfService) {
        this.purchaseOrderMapper = purchaseOrderMapper;
        this.purchaseRequestMapper = purchaseRequestMapper;
        this.companyMapper = companyMapper;
        this.mailSender = mailSender;
        this.companyProperties = companyProperties;
        this.templateEngine = templateEngine;
        this.purchaseOrderPdfService = purchaseOrderPdfService;
    }

    /**
     * Send purchase order email to vendor by PO ID.
     * Fetches the PO, validates status, and sends the email with PDF attachment.
     *
     * @param purchaseOrderId The purchase order ID
     * @param toEmail         Optional TO email override (if null, uses vendor email)
     * @param ccEmails        Optional list of CC recipients
     * @throws ResourceNotFoundException if purchase order not found
     * @throws BusinessException         if PO status is not sendable or email sending fails
     */
    public void sendPurchaseOrderEmail(Long purchaseOrderId, String toEmail, List<String> ccEmails) {
        PurchaseOrderDetailView purchaseOrder = purchaseOrderMapper.findDetailById(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order", purchaseOrderId));

        validateSendableStatus(purchaseOrder);

        CompanyDetailView vendor = companyMapper.findDetailById(purchaseOrder.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", purchaseOrder.vendorId()));

        PurchaseRequestDetailView purchaseRequest = purchaseRequestMapper.findDetailById(purchaseOrder.purchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", purchaseOrder.purchaseRequestId()));

        sendPurchaseOrderEmailInternal(purchaseOrderId, purchaseOrder, vendor, purchaseRequest, toEmail, ccEmails);
    }

    /**
     * Check if purchase order can have email sent (DRAFT, SENT, or CONFIRMED status).
     *
     * @param purchaseOrderId The purchase order ID
     * @return true if email can be sent
     */
    public boolean canSendEmail(Long purchaseOrderId) {
        return purchaseOrderMapper.findDetailById(purchaseOrderId)
                .map(po -> SENDABLE_STATUSES.contains(po.status()))
                .orElse(false);
    }

    private void validateSendableStatus(PurchaseOrderDetailView purchaseOrder) {
        if (!SENDABLE_STATUSES.contains(purchaseOrder.status())) {
            throw new BusinessException(
                    "Email can only be sent for DRAFT, SENT, or CONFIRMED purchase orders. Current status: "
                            + purchaseOrder.status());
        }
    }

    private void sendPurchaseOrderEmailInternal(Long purchaseOrderId,
                                                PurchaseOrderDetailView purchaseOrder,
                                                CompanyDetailView vendor,
                                                PurchaseRequestDetailView purchaseRequest,
                                                String toEmail,
                                                List<String> ccEmails) {
        // Determine the actual TO email address
        String actualToEmail = (toEmail != null && !toEmail.isBlank()) ? toEmail : vendor.email();
        if (actualToEmail == null || actualToEmail.isBlank()) {
            throw new BusinessException("Vendor email address is not available");
        }

        try {
            byte[] pdfBytes = purchaseOrderPdfService.generatePdf(purchaseOrderId);
            String pdfFilename = purchaseOrder.poNumber() + ".pdf";

            MailMessage message = MailMessage.builder()
                    .from(companyProperties.getEmail())
                    .to(actualToEmail)
                    .cc(ccEmails != null ? ccEmails : List.of())
                    .subject(buildSubject(purchaseOrder))
                    .htmlBody(buildEmailBody(purchaseOrder, vendor, purchaseRequest))
                    .attachment(MailAttachment.pdf(pdfFilename, pdfBytes))
                    .build();

            mailSender.send(message);

            if (ccEmails != null && !ccEmails.isEmpty()) {
                log.info("Purchase order email with PDF sent via {} for PO {} to {} (CC: {} recipients)",
                        mailSender.getType(),
                        purchaseOrder.poNumber(),
                        actualToEmail,
                        ccEmails.size());
            } else {
                log.info("Purchase order email with PDF sent via {} for PO {} to {}",
                        mailSender.getType(),
                        purchaseOrder.poNumber(),
                        actualToEmail);
            }

        } catch (MailSendException e) {
            log.error("Failed to send purchase order email for PO {}", purchaseOrder.poNumber(), e);
            throw new BusinessException("Failed to send purchase order email: " + e.getMessage());
        }
    }

    private String buildSubject(PurchaseOrderDetailView purchaseOrder) {
        return String.format("[%s] 발주서 안내 - %s",
                companyProperties.getName(),
                purchaseOrder.poNumber());
    }

    private String buildEmailBody(PurchaseOrderDetailView purchaseOrder,
                                  CompanyDetailView vendor,
                                  PurchaseRequestDetailView purchaseRequest) {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("vendorName", vendor.name());
        context.setVariable("contactPerson", vendor.contactPerson());
        context.setVariable("poNumber", purchaseOrder.poNumber());
        context.setVariable("jobCode", purchaseOrder.jobCode());
        context.setVariable("projectName", purchaseOrder.projectName());
        context.setVariable("itemName", purchaseRequest.itemName());
        context.setVariable("orderDate", purchaseOrder.orderDate().format(DATE_FORMATTER));
        context.setVariable("expectedDeliveryDate", purchaseOrder.expectedDeliveryDate().format(DATE_FORMATTER));
        context.setVariable("totalAmount", CURRENCY_FORMAT.format(purchaseOrder.totalAmount()));
        context.setVariable("notes", purchaseOrder.notes());

        return templateEngine.process("purchase-order-email-ko", context);
    }

    private Map<String, String> buildCompanyMap() {
        Map<String, String> company = new HashMap<>();
        company.put("name", companyProperties.getName());
        company.put("nameEn", companyProperties.getNameEn());
        company.put("phone", companyProperties.getPhone());
        company.put("fax", companyProperties.getFax());
        company.put("email", companyProperties.getEmail());
        company.put("address", companyProperties.getAddress());
        return company;
    }
}
