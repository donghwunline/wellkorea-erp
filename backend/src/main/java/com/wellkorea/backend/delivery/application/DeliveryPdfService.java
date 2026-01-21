package com.wellkorea.backend.delivery.application;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.delivery.api.dto.query.DeliveryDetailView;
import com.wellkorea.backend.delivery.api.dto.query.DeliveryLineItemView;
import com.wellkorea.backend.delivery.infrastructure.mapper.DeliveryMapper;
import com.wellkorea.backend.project.api.dto.query.ProjectDetailView;
import com.wellkorea.backend.project.infrastructure.mapper.ProjectMapper;
import com.wellkorea.backend.quotation.api.dto.query.LineItemView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.infrastructure.mapper.QuotationMapper;
import com.wellkorea.backend.shared.config.CompanyProperties;
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
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service for generating delivery statement PDFs using OpenHTMLtoPDF.
 * Generates professional Korean delivery statements (거래명세서/납품서) with proper Korean font support.
 */
@Service
public class DeliveryPdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DecimalFormat QUANTITY_FORMAT = new DecimalFormat("#,###.##");
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,###");

    private final DeliveryMapper deliveryMapper;
    private final ProjectMapper projectMapper;
    private final QuotationMapper quotationMapper;
    private final CompanyMapper companyMapper;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;

    public DeliveryPdfService(DeliveryMapper deliveryMapper,
                              ProjectMapper projectMapper,
                              QuotationMapper quotationMapper,
                              CompanyMapper companyMapper,
                              CompanyProperties companyProperties,
                              TemplateEngine templateEngine) {
        this.deliveryMapper = deliveryMapper;
        this.projectMapper = projectMapper;
        this.quotationMapper = quotationMapper;
        this.companyMapper = companyMapper;
        this.companyProperties = companyProperties;
        this.templateEngine = templateEngine;
    }

    /**
     * Generate delivery statement PDF for a delivery by ID.
     * Fetches the delivery, project, quotation, and customer info and returns PDF bytes.
     *
     * @param deliveryId The delivery ID
     * @return PDF as byte array
     * @throws ResourceNotFoundException if delivery not found
     */
    public byte[] generateStatement(Long deliveryId) {
        DeliveryDetailView delivery = deliveryMapper.findDetailById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        return generatePdfFromView(delivery);
    }

    private byte[] generatePdfFromView(DeliveryDetailView delivery) {
        // Fetch project for project name
        ProjectDetailView project = projectMapper.findDetailById(delivery.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", delivery.projectId()));

        // Fetch quotation for pricing data (if linked)
        QuotationDetailView quotation = null;
        if (delivery.quotationId() != null) {
            quotation = quotationMapper.findDetailById(delivery.quotationId())
                    .orElse(null);
        }

        // Fetch customer info
        CompanyDetailView customer = companyMapper.findDetailById(project.customerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Company not found with ID: " + project.customerId()));

        try {
            Context context = buildTemplateContext(delivery, project, quotation, customer);
            String html = templateEngine.process("delivery-statement-pdf", context);
            return convertHtmlToPdf(html);
        } catch (IOException e) {
            throw new PdfGenerationException("Failed to generate PDF for delivery: " + delivery.id(), e);
        }
    }

    private Context buildTemplateContext(DeliveryDetailView delivery,
                                         ProjectDetailView project,
                                         QuotationDetailView quotation,
                                         CompanyDetailView customer) throws IOException {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("customer", buildCustomerMap(customer));
        context.setVariable("project", buildProjectMap(project));
        setDeliveryVariables(context, delivery, project);

        LineItemsResult lineItemsResult = buildLineItems(delivery, quotation);
        context.setVariable("lineItems", lineItemsResult.lineItems());
        context.setVariable("totalAmount", lineItemsResult.formattedTotal());

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

    private Map<String, String> buildCustomerMap(CompanyDetailView customer) {
        Map<String, String> customerMap = new HashMap<>();
        customerMap.put("name", customer.name());
        customerMap.put("contactPerson", customer.contactPerson());
        customerMap.put("phone", customer.phone());
        customerMap.put("email", customer.email());
        customerMap.put("address", customer.address());
        return customerMap;
    }

    private Map<String, String> buildProjectMap(ProjectDetailView project) {
        Map<String, String> projectMap = new HashMap<>();
        projectMap.put("jobCode", project.jobCode());
        projectMap.put("projectName", project.projectName());
        return projectMap;
    }

    private void setDeliveryVariables(Context context, DeliveryDetailView delivery, ProjectDetailView project) {
        context.setVariable("deliveryNumber", formatDeliveryNumber(delivery, project));
        context.setVariable("deliveryDate", delivery.deliveryDate().format(DATE_FORMATTER));
        context.setVariable("status", delivery.status());
        context.setVariable("notes", delivery.notes());
    }

    /**
     * Build line items with pricing information from quotation.
     * Creates a lookup map from quotation line items to match by product ID.
     */
    private LineItemsResult buildLineItems(DeliveryDetailView delivery, QuotationDetailView quotation) {
        // Create lookup map: productId -> QuotationLineItemView
        Map<Long, LineItemView> quotationItemsByProductId = Collections.emptyMap();
        if (quotation != null && quotation.lineItems() != null) {
            quotationItemsByProductId = quotation.lineItems().stream()
                    .collect(Collectors.toMap(
                            LineItemView::productId,
                            Function.identity(),
                            (a, b) -> a  // If duplicate productIds, keep first
                    ));
        }

        List<Map<String, Object>> lineItems = new ArrayList<>();
        BigDecimal grandTotal = BigDecimal.ZERO;
        int sequence = 1;

        for (DeliveryLineItemView item : delivery.lineItems()) {
            LineItemView qItem = quotationItemsByProductId.get(item.productId());
            Map<String, Object> itemMap = new HashMap<>();

            itemMap.put("sequence", sequence++);

            if (qItem != null) {
                // Has quotation pricing data
                itemMap.put("productName", qItem.productName());
                itemMap.put("specification", qItem.specification() != null ? qItem.specification() : "-");
                itemMap.put("unit", qItem.unit() != null ? qItem.unit() : "EA");
                itemMap.put("quantity", QUANTITY_FORMAT.format(item.quantityDelivered()));
                itemMap.put("unitPrice", "￦ " + CURRENCY_FORMAT.format(qItem.unitPrice()));

                BigDecimal lineTotal = item.quantityDelivered().multiply(qItem.unitPrice());
                itemMap.put("amount", "￦ " + CURRENCY_FORMAT.format(lineTotal));
                grandTotal = grandTotal.add(lineTotal);
            } else {
                // Fallback: no quotation data - use delivery line item data
                itemMap.put("productName", item.productName() != null ? item.productName() : "Product #" + item.productId());
                itemMap.put("specification", "-");
                itemMap.put("unit", "EA");
                itemMap.put("quantity", QUANTITY_FORMAT.format(item.quantityDelivered()));
                itemMap.put("unitPrice", "-");
                itemMap.put("amount", "-");
            }

            lineItems.add(itemMap);
        }

        String formattedTotal = grandTotal.compareTo(BigDecimal.ZERO) > 0
                ? "￦ " + CURRENCY_FORMAT.format(grandTotal)
                : "-";

        return new LineItemsResult(lineItems, formattedTotal);
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

    private String formatDeliveryNumber(DeliveryDetailView delivery, ProjectDetailView project) {
        return project.jobCode() + "-D" + String.format("%03d", delivery.id());
    }

    /**
     * Result container for line items with calculated total.
     */
    private record LineItemsResult(List<Map<String, Object>> lineItems, String formattedTotal) {
    }
}
