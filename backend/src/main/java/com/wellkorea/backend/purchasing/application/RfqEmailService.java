package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for sending RFQ (Request for Quotation) emails.
 * Handles batch sending to multiple vendors with PDF attachment.
 * Self-contained: handles its own data access via mappers (CQRS read path).
 * Uses MailSender abstraction to support multiple mail providers (SMTP, Microsoft Graph).
 */
@Service
public class RfqEmailService {

    private static final Logger log = LoggerFactory.getLogger(RfqEmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,###");

    private final PurchaseRequestMapper purchaseRequestMapper;
    private final CompanyMapper companyMapper;
    private final MailSender mailSender;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;
    private final RfqPdfService rfqPdfService;

    public RfqEmailService(PurchaseRequestMapper purchaseRequestMapper,
                          CompanyMapper companyMapper,
                          MailSender mailSender,
                          CompanyProperties companyProperties,
                          TemplateEngine templateEngine,
                          RfqPdfService rfqPdfService) {
        this.purchaseRequestMapper = purchaseRequestMapper;
        this.companyMapper = companyMapper;
        this.mailSender = mailSender;
        this.companyProperties = companyProperties;
        this.templateEngine = templateEngine;
        this.rfqPdfService = rfqPdfService;
    }

    /**
     * Result of sending RFQ emails to multiple vendors.
     */
    public record RfqEmailResult(
            int totalVendors,
            int successCount,
            int failureCount,
            Map<Long, String> failures // vendorId -> error message
    ) {
        public boolean hasFailures() {
            return failureCount > 0;
        }

        public boolean allFailed() {
            return successCount == 0 && totalVendors > 0;
        }
    }

    /**
     * Email info for a vendor.
     */
    public record VendorEmailInfo(
            String to,          // Override TO email (null to use vendor's email)
            List<String> ccEmails   // Optional CC recipients
    ) {
        public static VendorEmailInfo empty() {
            return new VendorEmailInfo(null, null);
        }
    }

    /**
     * Send RFQ emails to multiple vendors.
     * Sends emails with PDF attachment to each vendor.
     * Handles partial failures - continues sending to other vendors even if one fails.
     *
     * @param purchaseRequestId The purchase request ID
     * @param vendorEmails      Map of vendorId -> VendorEmailInfo (null for defaults)
     * @return Result with success/failure counts and details
     * @throws ResourceNotFoundException if purchase request not found
     */
    public RfqEmailResult sendRfqEmails(Long purchaseRequestId, Map<Long, VendorEmailInfo> vendorEmails) {
        PurchaseRequestDetailView purchaseRequest = purchaseRequestMapper.findDetailById(purchaseRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", purchaseRequestId));

        if (vendorEmails == null || vendorEmails.isEmpty()) {
            return new RfqEmailResult(0, 0, 0, Map.of());
        }

        // Generate PDF once (shared across all vendors)
        byte[] pdfBytes = rfqPdfService.generatePdf(purchaseRequestId);
        String pdfFilename = purchaseRequest.requestNumber() + "-RFQ.pdf";

        int successCount = 0;
        Map<Long, String> failures = new HashMap<>();

        for (Map.Entry<Long, VendorEmailInfo> entry : vendorEmails.entrySet()) {
            Long vendorId = entry.getKey();
            VendorEmailInfo emailInfo = entry.getValue() != null ? entry.getValue() : VendorEmailInfo.empty();

            try {
                sendRfqToVendorInternal(purchaseRequest, vendorId, emailInfo, pdfBytes, pdfFilename);
                successCount++;
            } catch (Exception e) {
                log.error("Failed to send RFQ email to vendor {}: {}", vendorId, e.getMessage());
                failures.put(vendorId, e.getMessage());
            }
        }

        int totalVendors = vendorEmails.size();
        RfqEmailResult result = new RfqEmailResult(totalVendors, successCount, failures.size(), failures);

        if (result.hasFailures()) {
            log.warn("RFQ email batch completed with failures: {} of {} vendors failed",
                    result.failureCount(), result.totalVendors());
        } else {
            log.info("RFQ emails sent successfully to {} vendors for PR {}",
                    successCount, purchaseRequest.requestNumber());
        }

        return result;
    }

    /**
     * Send RFQ email to a single vendor.
     *
     * @param purchaseRequestId The purchase request ID
     * @param vendorId          The vendor company ID
     * @param toEmail           Optional TO email override (if null, uses vendor email)
     * @param ccEmails          Optional list of CC recipients
     * @throws ResourceNotFoundException if purchase request or vendor not found
     * @throws BusinessException         if email sending fails
     */
    public void sendRfqToVendor(Long purchaseRequestId, Long vendorId, String toEmail, List<String> ccEmails) {
        PurchaseRequestDetailView purchaseRequest = purchaseRequestMapper.findDetailById(purchaseRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", purchaseRequestId));

        byte[] pdfBytes = rfqPdfService.generatePdf(purchaseRequestId);
        String pdfFilename = purchaseRequest.requestNumber() + "-RFQ.pdf";

        VendorEmailInfo emailInfo = new VendorEmailInfo(toEmail, ccEmails);
        sendRfqToVendorInternal(purchaseRequest, vendorId, emailInfo, pdfBytes, pdfFilename);
    }

    private void sendRfqToVendorInternal(PurchaseRequestDetailView purchaseRequest,
                                         Long vendorId,
                                         VendorEmailInfo emailInfo,
                                         byte[] pdfBytes,
                                         String pdfFilename) {
        CompanyDetailView vendor = companyMapper.findDetailById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", vendorId));

        // Determine the actual TO email address
        String actualToEmail = (emailInfo.to() != null && !emailInfo.to().isBlank())
                ? emailInfo.to()
                : vendor.email();

        if (actualToEmail == null || actualToEmail.isBlank()) {
            throw new BusinessException("Vendor email address is not available for vendor: " + vendor.name());
        }

        try {
            MailMessage message = MailMessage.builder()
                    .from(companyProperties.getEmail())
                    .to(actualToEmail)
                    .cc(emailInfo.ccEmails() != null ? emailInfo.ccEmails() : List.of())
                    .subject(buildSubject(purchaseRequest))
                    .htmlBody(buildEmailBody(purchaseRequest, vendor))
                    .attachment(MailAttachment.pdf(pdfFilename, pdfBytes))
                    .build();

            mailSender.send(message);

            log.info("RFQ email sent via {} for PR {} to vendor {} ({})",
                    mailSender.getType(),
                    purchaseRequest.requestNumber(),
                    vendor.name(),
                    actualToEmail);

        } catch (MailSendException e) {
            throw new BusinessException("Failed to send RFQ email to " + vendor.name() + ": " + e.getMessage());
        }
    }

    private String buildSubject(PurchaseRequestDetailView purchaseRequest) {
        return String.format("[%s] 견적요청서 - %s",
                companyProperties.getName(),
                purchaseRequest.requestNumber());
    }

    private String buildEmailBody(PurchaseRequestDetailView purchaseRequest, CompanyDetailView vendor) {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("vendorName", vendor.name());
        context.setVariable("contactPerson", vendor.contactPerson());
        context.setVariable("requestNumber", purchaseRequest.requestNumber());
        context.setVariable("jobCode", purchaseRequest.jobCode());
        context.setVariable("projectName", purchaseRequest.projectName());
        context.setVariable("itemName", purchaseRequest.itemName());
        context.setVariable("quantity", CURRENCY_FORMAT.format(purchaseRequest.quantity()));
        context.setVariable("uom", purchaseRequest.uom());
        context.setVariable("requiredDate", purchaseRequest.requiredDate() != null
                ? purchaseRequest.requiredDate().format(DATE_FORMATTER)
                : "협의");
        context.setVariable("responseDeadline", LocalDate.now().plusDays(7).format(DATE_FORMATTER));
        context.setVariable("description", purchaseRequest.description());

        return templateEngine.process("rfq-email-ko", context);
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
