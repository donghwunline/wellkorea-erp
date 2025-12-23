package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.customer.domain.Customer;
import com.wellkorea.backend.customer.infrastructure.repository.CustomerRepository;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    private final QuotationRepository quotationRepository;
    private final JavaMailSender mailSender;
    private final CustomerRepository customerRepository;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;
    private final QuotationPdfService quotationPdfService;

    public QuotationEmailService(QuotationRepository quotationRepository,
                                 JavaMailSender mailSender,
                                 CustomerRepository customerRepository,
                                 CompanyProperties companyProperties,
                                 TemplateEngine templateEngine,
                                 QuotationPdfService quotationPdfService) {
        this.quotationRepository = quotationRepository;
        this.mailSender = mailSender;
        this.customerRepository = customerRepository;
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
        Quotation quotation = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with ID: " + quotationId));

        validateSendableStatus(quotation);
        sendRevisionNotificationInternal(quotation);
    }

    /**
     * Check if quotation can have email sent (APPROVED, SENT, or ACCEPTED status).
     *
     * @param quotationId The quotation ID
     * @return true if email can be sent
     */
    public boolean canSendEmail(Long quotationId) {
        return quotationRepository.findById(quotationId)
                .map(q -> SENDABLE_STATUSES.contains(q.getStatus()))
                .orElse(false);
    }

    /**
     * Check if quotation needs status update to SENT before sending email.
     *
     * @param quotationId The quotation ID
     * @return true if quotation is currently APPROVED (needs to be marked as SENT)
     */
    public boolean needsStatusUpdateBeforeSend(Long quotationId) {
        return quotationRepository.findById(quotationId)
                .map(q -> q.getStatus() == QuotationStatus.APPROVED)
                .orElse(false);
    }

    private void validateSendableStatus(Quotation quotation) {
        if (!SENDABLE_STATUSES.contains(quotation.getStatus())) {
            throw new BusinessException(
                    "Email can only be sent for APPROVED, SENT, or ACCEPTED quotations. Current status: "
                            + quotation.getStatus());
        }
    }

    private void sendRevisionNotificationInternal(Quotation quotation) {
        Customer customer = findCustomerOrThrow(quotation);
        validateCustomerEmail(customer);

        try {
            byte[] pdfBytes = quotationPdfService.generatePdf(quotation);
            String pdfFilename = formatQuotationNumber(quotation) + ".pdf";

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(companyProperties.getEmail());
            helper.setTo(customer.getEmail());
            helper.setSubject(buildSubject(quotation));
            helper.setText(buildEmailBody(quotation, customer), true);
            helper.addAttachment(pdfFilename, new ByteArrayResource(pdfBytes), "application/pdf");

            mailSender.send(message);
            log.info("Revision notification with PDF sent for quotation {} v{} to {}",
                    quotation.getProject().getJobCode(),
                    quotation.getVersion(),
                    customer.getEmail());

        } catch (MessagingException e) {
            log.error("Failed to send revision notification email for quotation {}", quotation.getId(), e);
            throw new BusinessException("Failed to send revision notification email: " + e.getMessage());
        }
    }

    public void sendSimpleNotification(Quotation quotation) {
        Customer customer = findCustomerOrThrow(quotation);
        validateCustomerEmail(customer);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(companyProperties.getEmail());
        message.setTo(customer.getEmail());
        message.setSubject(buildSubject(quotation));
        message.setText(buildPlainTextBody(quotation, customer));

        mailSender.send(message);
        log.info("Simple notification sent for quotation {} v{} to {}",
                quotation.getProject().getJobCode(),
                quotation.getVersion(),
                customer.getEmail());
    }

    private Customer findCustomerOrThrow(Quotation quotation) {
        return customerRepository.findById(quotation.getProject().getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Customer not found with ID: " + quotation.getProject().getCustomerId()));
    }

    private void validateCustomerEmail(Customer customer) {
        if (customer.getEmail() == null || customer.getEmail().isBlank()) {
            throw new BusinessException("Customer does not have an email address configured");
        }
    }

    private String buildSubject(Quotation quotation) {
        return String.format("[%s] 견적서 안내 - %s (V%d)",
                companyProperties.getName(),
                quotation.getProject().getJobCode(),
                quotation.getVersion());
    }

    private String buildEmailBody(Quotation quotation, Customer customer) {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("customerName", customer.getName());
        context.setVariable("contactPerson", customer.getContactPerson());
        context.setVariable("quotationNumber", formatQuotationNumber(quotation));
        context.setVariable("projectName", quotation.getProject().getProjectName());
        context.setVariable("quotationDate", quotation.getQuotationDate().format(DATE_FORMATTER));
        context.setVariable("expiryDate", quotation.getExpiryDate().format(DATE_FORMATTER));
        context.setVariable("totalAmount", CURRENCY_FORMAT.format(quotation.getTotalAmount()));
        context.setVariable("version", quotation.getVersion());
        context.setVariable("notes", quotation.getNotes());

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

    private String buildPlainTextBody(Quotation quotation, Customer customer) {
        StringBuilder text = new StringBuilder();

        String greeting = customer.getContactPerson() != null
                ? customer.getContactPerson() + " 님"
                : "담당자 님";

        text.append(customer.getName()).append(" ").append(greeting).append(" 귀하\n\n");
        text.append("안녕하세요, ").append(companyProperties.getName()).append("입니다.\n\n");
        text.append("아래와 같이 견적서를 송부 드리오니 검토하여 주시기 바랍니다.\n\n");

        text.append("■ 견적 정보\n");
        text.append("━━━━━━━━━━━━━━━━━━━━\n");
        text.append("견적번호: ").append(formatQuotationNumber(quotation)).append("\n");
        text.append("프로젝트명: ").append(quotation.getProject().getProjectName()).append("\n");
        text.append("견적일자: ").append(quotation.getQuotationDate().format(DATE_FORMATTER)).append("\n");
        text.append("유효기간: ").append(quotation.getExpiryDate().format(DATE_FORMATTER)).append("\n");
        text.append("견적금액: ").append(CURRENCY_FORMAT.format(quotation.getTotalAmount())).append(" 원 (부가세 별도)\n");

        if (quotation.getVersion() > 1) {
            text.append("견적버전: V").append(quotation.getVersion()).append(" (수정 견적)\n");
        }
        text.append("\n");

        if (quotation.getNotes() != null && !quotation.getNotes().isBlank()) {
            text.append("■ 비고\n").append(quotation.getNotes()).append("\n\n");
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

    private String formatQuotationNumber(Quotation quotation) {
        return quotation.getProject().getJobCode() + "-Q" + String.format("%02d", quotation.getVersion());
    }
}
