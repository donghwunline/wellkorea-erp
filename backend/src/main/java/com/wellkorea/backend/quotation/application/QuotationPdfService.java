package com.wellkorea.backend.quotation.application;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.PdfGenerationException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.pdf.PdfFontLoader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service for generating PDF quotations using OpenHTMLtoPDF.
 * Generates professional Korean business quotations (견적서) with proper Korean font support.
 * Self-contained: handles its own data access and validation.
 */
@Service
public class QuotationPdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,###");
    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");

    private final QuotationRepository quotationRepository;
    private final CompanyRepository companyRepository;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;

    public QuotationPdfService(QuotationRepository quotationRepository,
                               CompanyRepository companyRepository,
                               CompanyProperties companyProperties,
                               TemplateEngine templateEngine) {
        this.quotationRepository = quotationRepository;
        this.companyRepository = companyRepository;
        this.companyProperties = companyProperties;
        this.templateEngine = templateEngine;
    }

    /**
     * Generate PDF for a quotation by ID.
     * Fetches the quotation, validates it can generate PDF, and returns PDF bytes.
     *
     * @param quotationId The quotation ID
     * @return PDF as byte array
     * @throws ResourceNotFoundException if quotation not found
     * @throws BusinessException         if quotation is in DRAFT status
     */
    public byte[] generatePdf(Long quotationId) {
        Quotation quotation = quotationRepository.findByIdWithLineItems(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", quotationId));

        if (!quotation.canGeneratePdf()) {
            throw new BusinessException("PDF can only be generated for non-DRAFT quotations");
        }

        return generatePdfFromEntity(quotation);
    }

    /**
     * Generate PDF from a quotation entity.
     * Used internally and by QuotationEmailService which already has the entity.
     *
     * @param quotation The quotation entity (must have line items loaded)
     * @return PDF as byte array
     */
    public byte[] generatePdf(Quotation quotation) {
        return generatePdfFromEntity(quotation);
    }

    private byte[] generatePdfFromEntity(Quotation quotation) {
        Company customer = companyRepository.findById(quotation.getProject().getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Company not found with ID: " + quotation.getProject().getCustomerId()));

        try {
            Context context = buildTemplateContext(quotation, customer);
            String html = templateEngine.process("quotation-pdf", context);
            return convertHtmlToPdf(html);
        } catch (IOException e) {
            throw new PdfGenerationException("Failed to generate PDF for quotation: " + quotation.getId(), e);
        }
    }

    private Context buildTemplateContext(Quotation quotation, Company customer) throws IOException {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("customer", buildCustomerMap(customer));
        context.setVariable("project", buildProjectMap(quotation));
        setQuotationVariables(context, quotation);
        context.setVariable("lineItems", buildLineItems(quotation));
        setTotalVariables(context, quotation);
        setImageVariables(context);

        return context;
    }

    private Map<String, String> buildCompanyMap() {
        Map<String, String> company = new HashMap<>();
        company.put("name", companyProperties.getName());
        company.put("nameEn", companyProperties.getNameEn());
        company.put("registrationNumber", companyProperties.getRegistrationNumber());
        company.put("address", companyProperties.getAddress());
        company.put("phone", companyProperties.getPhone());
        company.put("fax", companyProperties.getFax());
        company.put("designDeptPhone", companyProperties.getDesignDeptPhone());
        company.put("email", companyProperties.getEmail());
        return company;
    }

    private Map<String, String> buildCustomerMap(Company customer) {
        Map<String, String> customerMap = new HashMap<>();
        customerMap.put("name", customer.getName());
        customerMap.put("contactPerson", customer.getContactPerson());
        customerMap.put("phone", customer.getPhone());
        customerMap.put("email", customer.getEmail());
        customerMap.put("address", customer.getAddress());
        return customerMap;
    }

    private Map<String, String> buildProjectMap(Quotation quotation) {
        Map<String, String> project = new HashMap<>();
        project.put("jobCode", quotation.getProject().getJobCode());
        project.put("projectName", quotation.getProject().getProjectName());
        return project;
    }

    private void setQuotationVariables(Context context, Quotation quotation) {
        context.setVariable("quotationNumber", formatQuotationNumber(quotation));
        context.setVariable("quotationDate", quotation.getQuotationDate().format(DATE_FORMATTER));
        context.setVariable("validityDays", quotation.getValidityDays());
        context.setVariable("expiryDate", quotation.getExpiryDate().format(DATE_FORMATTER));
        context.setVariable("version", quotation.getVersion());
        context.setVariable("notes", quotation.getNotes());
        context.setVariable("deliveryTerm", "발주후 협의");
    }

    private List<Map<String, Object>> buildLineItems(Quotation quotation) {
        List<Map<String, Object>> lineItems = new ArrayList<>();
        for (QuotationLineItem item : quotation.getLineItems()) {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("productName", item.getProduct().getName());
            itemMap.put("specification", item.getProduct().getDescription());
            itemMap.put("unit", item.getProduct().getUnit() != null ? item.getProduct().getUnit() : "EA");
            itemMap.put("quantity", CURRENCY_FORMAT.format(item.getQuantity()));
            itemMap.put("unitPriceFormatted", "￦ " + CURRENCY_FORMAT.format(item.getUnitPrice()));
            itemMap.put("lineTotalFormatted", "￦ " + CURRENCY_FORMAT.format(item.getLineTotal()));
            lineItems.add(itemMap);
        }
        return lineItems;
    }

    private void setTotalVariables(Context context, Quotation quotation) {
        BigDecimal supplyAmount = quotation.getTotalAmount();
        BigDecimal vat = supplyAmount.multiply(VAT_RATE);
        BigDecimal grandTotal = supplyAmount.add(vat);

        context.setVariable("totalAmountFormatted", "￦ " + CURRENCY_FORMAT.format(supplyAmount));
        context.setVariable("grandTotalFormatted", "￦ " + CURRENCY_FORMAT.format(grandTotal));
        context.setVariable("totalAmountText", convertToKoreanAmount(supplyAmount));
    }

    private void setImageVariables(Context context) throws IOException {
        context.setVariable("logoDataUri", loadImageAsDataUri("assets/logo.png"));
        context.setVariable("sealDataUri", loadImageAsDataUri("assets/seal.png"));
    }

    private byte[] convertHtmlToPdf(String html) throws IOException {
        byte[] fontBytes = PdfFontLoader.getNotoSansKrBytes();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();

            // Font supplier must return a NEW InputStream each time it's called
            // (the font may be read multiple times for metrics, subsetting, etc.)
            builder.useFont(() -> new ByteArrayInputStream(fontBytes), "NotoSansKR");

            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(baos);
            builder.run();

            return baos.toByteArray();
        }
    }

    private String loadImageAsDataUri(String resourcePath) throws IOException {
        ClassPathResource resource = new ClassPathResource(resourcePath);
        try (InputStream is = resource.getInputStream()) {
            byte[] imageBytes = is.readAllBytes();
            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            String mimeType = resourcePath.endsWith(".png") ? "image/png" : "image/jpeg";
            return "data:" + mimeType + ";base64," + base64;
        }
    }

    private String formatQuotationNumber(Quotation quotation) {
        return quotation.getProject().getJobCode() + "-Q" + String.format("%02d", quotation.getVersion());
    }

    private String convertToKoreanAmount(BigDecimal amount) {
        long value = amount.longValue();
        if (value == 0) {
            return "일금영원정";
        }

        String[] units = {"", "만", "억", "조"};
        String[] koreanDigits = {"", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"};
        String[] subUnits = {"", "십", "백", "천"};

        StringBuilder result = new StringBuilder("일금");
        String numStr = String.valueOf(value);

        int padding = (4 - numStr.length() % 4) % 4;
        numStr = "0".repeat(padding) + numStr;

        int groupCount = numStr.length() / 4;

        for (int i = 0; i < groupCount; i++) {
            String group = numStr.substring(i * 4, (i + 1) * 4);
            StringBuilder groupStr = new StringBuilder();
            boolean hasNonZeroDigit = false;

            for (int j = 0; j < 4; j++) {
                int digit = Character.getNumericValue(group.charAt(j));
                if (digit > 0) {
                    hasNonZeroDigit = true;
                    if (digit == 1 && j < 3) {
                        groupStr.append(subUnits[3 - j]);
                    } else {
                        groupStr.append(koreanDigits[digit]).append(subUnits[3 - j]);
                    }
                }
            }

            if (hasNonZeroDigit) {
                result.append(groupStr).append(units[groupCount - 1 - i]);
            }
        }

        result.append("원정");
        return result.toString();
    }
}
