package com.wellkorea.backend.purchasing.application;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.domain.PurchaseRequestStatus;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseRequestMapper;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Service for generating PDF RFQ documents using OpenHTMLtoPDF.
 * Generates professional Korean business RFQ (견적요청서) with proper Korean font support.
 * Self-contained: handles its own data access via mappers (CQRS read path).
 */
@Service
public class RfqPdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,###");
    private static final Set<String> GENERABLE_STATUSES = Set.of(
            PurchaseRequestStatus.DRAFT.name(),
            PurchaseRequestStatus.RFQ_SENT.name(),
            PurchaseRequestStatus.VENDOR_SELECTED.name(),
            PurchaseRequestStatus.ORDERED.name()
    );

    private final PurchaseRequestMapper purchaseRequestMapper;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;

    public RfqPdfService(PurchaseRequestMapper purchaseRequestMapper,
                         CompanyProperties companyProperties,
                         TemplateEngine templateEngine) {
        this.purchaseRequestMapper = purchaseRequestMapper;
        this.companyProperties = companyProperties;
        this.templateEngine = templateEngine;
    }

    /**
     * Generate PDF for an RFQ by purchase request ID.
     * Fetches the purchase request via mapper, validates status, and returns PDF bytes.
     *
     * @param purchaseRequestId The purchase request ID
     * @return PDF as byte array
     * @throws ResourceNotFoundException if purchase request not found
     * @throws BusinessException         if purchase request is in CANCELED or CLOSED status
     */
    public byte[] generatePdf(Long purchaseRequestId) {
        PurchaseRequestDetailView purchaseRequest = purchaseRequestMapper.findDetailById(purchaseRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", purchaseRequestId));

        validateCanGeneratePdf(purchaseRequest);

        return generatePdfFromView(purchaseRequest);
    }

    private void validateCanGeneratePdf(PurchaseRequestDetailView purchaseRequest) {
        if (!GENERABLE_STATUSES.contains(purchaseRequest.status())) {
            throw new BusinessException("PDF cannot be generated for purchase request in " + purchaseRequest.status() + " status");
        }
    }

    private byte[] generatePdfFromView(PurchaseRequestDetailView purchaseRequest) {
        try {
            Context context = buildTemplateContext(purchaseRequest);
            String html = templateEngine.process("rfq-pdf", context);
            return convertHtmlToPdf(html);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF for RFQ: " + purchaseRequest.id(), e);
        }
    }

    private Context buildTemplateContext(PurchaseRequestDetailView purchaseRequest) throws IOException {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("rfq", buildRfqMap(purchaseRequest));
        context.setVariable("item", buildItemMap(purchaseRequest));
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

    private Map<String, Object> buildRfqMap(PurchaseRequestDetailView purchaseRequest) {
        Map<String, Object> rfqMap = new HashMap<>();
        rfqMap.put("requestNumber", purchaseRequest.requestNumber());
        rfqMap.put("requestDate", LocalDate.now().format(DATE_FORMATTER));
        rfqMap.put("requiredDate", purchaseRequest.requiredDate() != null
                ? purchaseRequest.requiredDate().format(DATE_FORMATTER)
                : "협의");
        rfqMap.put("responseDeadline", LocalDate.now().plusDays(7).format(DATE_FORMATTER)); // Default 7 days

        // Project info if available
        if (purchaseRequest.jobCode() != null) {
            rfqMap.put("jobCode", purchaseRequest.jobCode());
            rfqMap.put("projectName", purchaseRequest.projectName());
        }

        return rfqMap;
    }

    private Map<String, Object> buildItemMap(PurchaseRequestDetailView purchaseRequest) {
        Map<String, Object> itemMap = new HashMap<>();
        itemMap.put("itemName", purchaseRequest.itemName());
        itemMap.put("description", purchaseRequest.description());
        itemMap.put("quantity", CURRENCY_FORMAT.format(purchaseRequest.quantity()));
        itemMap.put("uom", purchaseRequest.uom());
        itemMap.put("dtype", purchaseRequest.dtype()); // SERVICE or MATERIAL

        // Category info based on type
        if ("SERVICE".equals(purchaseRequest.dtype())) {
            itemMap.put("categoryName", purchaseRequest.serviceCategoryName());
        } else {
            itemMap.put("categoryName", purchaseRequest.materialCategoryName());
            itemMap.put("sku", purchaseRequest.materialSku());
            if (purchaseRequest.materialStandardPrice() != null) {
                itemMap.put("referencePrice", "￦ " + CURRENCY_FORMAT.format(purchaseRequest.materialStandardPrice()));
            }
        }

        return itemMap;
    }

    private void setImageVariables(Context context) throws IOException {
        context.setVariable("logoDataUri", loadImageAsDataUri("assets/logo.png"));
        context.setVariable("sealDataUri", loadImageAsDataUri("assets/seal.png"));
    }

    private byte[] convertHtmlToPdf(String html) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();

            try (InputStream fontStream = new ClassPathResource("fonts/NotoSansKR.ttf").getInputStream()) {
                builder.useFont(() -> fontStream, "NotoSansKR");
            }

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
}
