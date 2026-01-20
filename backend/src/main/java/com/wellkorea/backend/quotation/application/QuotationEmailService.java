package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.infrastructure.mapper.QuotationMapper;
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
import java.util.Map;
import java.util.Set;

/**
 * Service for sending quotation-related emails.
 * Handles revision notifications and other quotation communications.
 * Self-contained: handles its own data access and validation.
 * Uses MailSender abstraction to support multiple mail providers (SMTP, Microsoft Graph).
 */
@Service
public class QuotationEmailService {

    private static final Logger log = LoggerFactory.getLogger(QuotationEmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,###");
    private static final Set<QuotationStatus> SENDABLE_STATUSES = Set.of(
            QuotationStatus.APPROVED,
            QuotationStatus.SENT,
            QuotationStatus.ACCEPTED
    );

    private final QuotationMapper quotationMapper;
    private final MailSender mailSender;
    private final CompanyMapper companyMapper;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;
    private final QuotationPdfService quotationPdfService;

    public QuotationEmailService(QuotationMapper quotationMapper,
                                 MailSender mailSender,
                                 CompanyMapper companyMapper,
                                 CompanyProperties companyProperties,
                                 TemplateEngine templateEngine,
                                 QuotationPdfService quotationPdfService) {
        this.quotationMapper = quotationMapper;
        this.mailSender = mailSender;
        this.companyMapper = companyMapper;
        this.companyProperties = companyProperties;
        this.templateEngine = templateEngine;
        this.quotationPdfService = quotationPdfService;
    }

    /**
     * Send revision notification email for a quotation by ID.
     * Fetches the quotation, validates status (must be APPROVED, SENT, or ACCEPTED),
     * and sends the email with PDF attachment.
     *
     * @param quotationId The quotation ID
     * @throws ResourceNotFoundException if quotation not found
     * @throws BusinessException         if quotation status is not sendable
     */
    public void sendRevisionNotification(Long quotationId) {
        QuotationDetailView quotation = quotationMapper.findDetailById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        validateSendableStatus(quotation);
        sendRevisionNotificationInternal(quotationId, quotation);
    }

    /**
     * Check if quotation can have email sent (APPROVED, SENT, or ACCEPTED status).
     *
     * @param quotationId The quotation ID
     * @return true if email can be sent
     */
    public boolean canSendEmail(Long quotationId) {
        return quotationMapper.findDetailById(quotationId)
                .map(q -> SENDABLE_STATUSES.contains(q.status()))
                .orElse(false);
    }

    /**
     * Check if quotation needs status update to SENT before sending email.
     *
     * @param quotationId The quotation ID
     * @return true if quotation is currently APPROVED (needs to be marked as SENT)
     */
    public boolean needsStatusUpdateBeforeSend(Long quotationId) {
        return quotationMapper.findDetailById(quotationId)
                .map(q -> q.status() == QuotationStatus.APPROVED)
                .orElse(false);
    }

    private void validateSendableStatus(QuotationDetailView quotation) {
        if (!SENDABLE_STATUSES.contains(quotation.status())) {
            throw new BusinessException(
                    "Email can only be sent for APPROVED, SENT, or ACCEPTED quotations. Current status: "
                            + quotation.status());
        }
    }

    private void sendRevisionNotificationInternal(Long quotationId, QuotationDetailView quotation) {
        CompanyDetailView customer = findCustomerOrThrow(quotation);
        validateCustomerEmail(customer);

        try {
            byte[] pdfBytes = quotationPdfService.generatePdf(quotationId);
            String pdfFilename = formatQuotationNumber(quotation) + ".pdf";

            MailMessage message = MailMessage.builder()
                    .from(companyProperties.getEmail())
                    .to(customer.email())
                    .subject(buildSubject(quotation))
                    .htmlBody(buildEmailBody(quotation, customer))
                    .attachment(MailAttachment.pdf(pdfFilename, pdfBytes))
                    .build();

            mailSender.send(message);
            log.info("Revision notification with PDF sent via {} for quotation {} v{} to {}",
                    mailSender.getType(),
                    quotation.jobCode(),
                    quotation.version(),
                    customer.email());

        } catch (MailSendException e) {
            log.error("Failed to send revision notification email for quotation {}", quotation.id(), e);
            throw new BusinessException("Failed to send revision notification email: " + e.getMessage());
        }
    }

    public void sendSimpleNotification(Long quotationId) {
        QuotationDetailView quotation = quotationMapper.findDetailById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        CompanyDetailView customer = findCustomerOrThrow(quotation);
        validateCustomerEmail(customer);

        try {
            MailMessage message = MailMessage.builder()
                    .from(companyProperties.getEmail())
                    .to(customer.email())
                    .subject(buildSubject(quotation))
                    .plainTextBody(buildPlainTextBody(quotation, customer))
                    .build();

            mailSender.send(message);
            log.info("Simple notification sent via {} for quotation {} v{} to {}",
                    mailSender.getType(),
                    quotation.jobCode(),
                    quotation.version(),
                    customer.email());

        } catch (MailSendException e) {
            log.error("Failed to send simple notification email for quotation {}", quotation.id(), e);
            throw new BusinessException("Failed to send notification email: " + e.getMessage());
        }
    }

    private CompanyDetailView findCustomerOrThrow(QuotationDetailView quotation) {
        return companyMapper.findDetailById(quotation.customerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Company not found with ID: " + quotation.customerId()));
    }

    private void validateCustomerEmail(CompanyDetailView customer) {
        if (customer.email() == null || customer.email().isBlank()) {
            throw new BusinessException("Company does not have an email address configured");
        }
    }

    private String buildSubject(QuotationDetailView quotation) {
        return String.format("[%s] 견적서 안내 - %s (V%d)",
                companyProperties.getName(),
                quotation.jobCode(),
                quotation.version());
    }

    private String buildEmailBody(QuotationDetailView quotation, CompanyDetailView customer) {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("customerName", customer.name());
        context.setVariable("contactPerson", customer.contactPerson());
        context.setVariable("quotationNumber", formatQuotationNumber(quotation));
        context.setVariable("projectName", quotation.projectName());
        context.setVariable("quotationDate", quotation.quotationDate().format(DATE_FORMATTER));
        context.setVariable("expiryDate", quotation.expiryDate().format(DATE_FORMATTER));
        context.setVariable("totalAmount", CURRENCY_FORMAT.format(quotation.totalAmount()));
        context.setVariable("version", quotation.version());
        context.setVariable("notes", quotation.notes());

        return templateEngine.process("quotation-email-ko", context);
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

    private String buildPlainTextBody(QuotationDetailView quotation, CompanyDetailView customer) {
        StringBuilder text = new StringBuilder();

        String greeting = customer.contactPerson() != null
                ? customer.contactPerson() + " 님"
                : "담당자 님";

        text.append(customer.name()).append(" ").append(greeting).append(" 귀하\n\n");
        text.append("안녕하세요, ").append(companyProperties.getName()).append("입니다.\n\n");
        text.append("아래와 같이 견적서를 송부 드리오니 검토하여 주시기 바랍니다.\n\n");

        text.append("■ 견적 정보\n");
        text.append("━━━━━━━━━━━━━━━━━━━━\n");
        text.append("견적번호: ").append(formatQuotationNumber(quotation)).append("\n");
        text.append("프로젝트명: ").append(quotation.projectName()).append("\n");
        text.append("견적일자: ").append(quotation.quotationDate().format(DATE_FORMATTER)).append("\n");
        text.append("유효기간: ").append(quotation.expiryDate().format(DATE_FORMATTER)).append("\n");
        text.append("견적금액: ").append(CURRENCY_FORMAT.format(quotation.totalAmount())).append(" 원 (부가세 별도)\n");

        if (quotation.version() > 1) {
            text.append("견적버전: V").append(quotation.version()).append(" (수정 견적)\n");
        }
        text.append("\n");

        if (quotation.notes() != null && !quotation.notes().isBlank()) {
            text.append("■ 비고\n").append(quotation.notes()).append("\n\n");
        }

        text.append("첨부된 견적서(PDF)를 확인하여 주시기 바랍니다.\n");
        text.append("견적서에 대해 문의사항이 있으시면 언제든지 연락 주시기 바랍니다.\n\n");

        text.append("■ 문의처\n");
        text.append("전화: ").append(companyProperties.getPhone()).append("\n");
        text.append("팩스: ").append(companyProperties.getFax()).append("\n");
        text.append("이메일: ").append(companyProperties.getEmail()).append("\n\n");

        text.append("감사합니다.\n\n");
        text.append(companyProperties.getName()).append(" 드림\n\n");
        text.append("━━━━━━━━━━━━━━━━━━━━\n");
        text.append("본 메일은 발신 전용입니다.");

        return text.toString();
    }

    private String formatQuotationNumber(QuotationDetailView quotation) {
        return quotation.jobCode() + "-Q" + String.format("%02d", quotation.version());
    }
}
