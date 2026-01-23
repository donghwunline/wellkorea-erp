package com.wellkorea.backend.purchasing.application;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.domain.vo.PurchaseOrderStatus;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseOrderMapper;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseRequestMapper;
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
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for generating PDF purchase orders using OpenHTMLtoPDF.
 * Generates professional Korean business purchase orders (발주서) with proper Korean font support.
 * Self-contained: handles its own data access via mappers (CQRS read path).
 */
@Service
public class PurchaseOrderPdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,###");
    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");

    private final PurchaseOrderMapper purchaseOrderMapper;
    private final PurchaseRequestMapper purchaseRequestMapper;
    private final CompanyMapper companyMapper;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;

    public PurchaseOrderPdfService(PurchaseOrderMapper purchaseOrderMapper,
                                   PurchaseRequestMapper purchaseRequestMapper,
                                   CompanyMapper companyMapper,
                                   CompanyProperties companyProperties,
                                   TemplateEngine templateEngine) {
        this.purchaseOrderMapper = purchaseOrderMapper;
        this.purchaseRequestMapper = purchaseRequestMapper;
        this.companyMapper = companyMapper;
        this.companyProperties = companyProperties;
        this.templateEngine = templateEngine;
    }

    /**
     * Generate PDF for a purchase order by ID.
     * Fetches the purchase order via mapper, validates status, and returns PDF bytes.
     *
     * @param purchaseOrderId The purchase order ID
     * @return PDF as byte array
     * @throws ResourceNotFoundException if purchase order not found
     * @throws BusinessException         if purchase order is in CANCELED status
     */
    public byte[] generatePdf(Long purchaseOrderId) {
        PurchaseOrderDetailView purchaseOrder = purchaseOrderMapper.findDetailById(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order", purchaseOrderId));

        validateCanGeneratePdf(purchaseOrder);

        // Get vendor details
        CompanyDetailView vendor = companyMapper.findDetailById(purchaseOrder.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", purchaseOrder.vendorId()));

        // Get purchase request details with RFQ items
        PurchaseRequestDetailView purchaseRequest = purchaseRequestMapper.findDetailById(purchaseOrder.purchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase request", purchaseOrder.purchaseRequestId()));

        return generatePdfFromViews(purchaseOrder, vendor, purchaseRequest);
    }

    private void validateCanGeneratePdf(PurchaseOrderDetailView purchaseOrder) {
        if (PurchaseOrderStatus.CANCELED.name().equals(purchaseOrder.status())) {
            throw new BusinessException("PDF cannot be generated for CANCELED purchase orders");
        }
    }

    private byte[] generatePdfFromViews(PurchaseOrderDetailView purchaseOrder,
                                        CompanyDetailView vendor,
                                        PurchaseRequestDetailView purchaseRequest) {
        try {
            Context context = buildTemplateContext(purchaseOrder, vendor, purchaseRequest);
            String html = templateEngine.process("purchase-order-pdf", context);
            return convertHtmlToPdf(html);
        } catch (IOException e) {
            throw new PdfGenerationException("Failed to generate PDF for purchase order: " + purchaseOrder.id(), e);
        }
    }

    private Context buildTemplateContext(PurchaseOrderDetailView purchaseOrder,
                                         CompanyDetailView vendor,
                                         PurchaseRequestDetailView purchaseRequest) throws IOException {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("vendor", buildVendorMap(vendor));
        context.setVariable("purchaseOrder", buildPurchaseOrderMap(purchaseOrder));
        context.setVariable("item", buildItemMap(purchaseRequest, purchaseOrder));
        setTotalVariables(context, purchaseOrder.totalAmount());
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

    private Map<String, String> buildVendorMap(CompanyDetailView vendor) {
        Map<String, String> vendorMap = new HashMap<>();
        vendorMap.put("name", vendor.name());
        vendorMap.put("contactPerson", vendor.contactPerson());
        vendorMap.put("phone", vendor.phone());
        vendorMap.put("email", vendor.email());
        vendorMap.put("address", vendor.address());
        return vendorMap;
    }

    private Map<String, Object> buildPurchaseOrderMap(PurchaseOrderDetailView purchaseOrder) {
        Map<String, Object> poMap = new HashMap<>();
        poMap.put("poNumber", purchaseOrder.poNumber());
        poMap.put("orderDate", purchaseOrder.orderDate().format(DATE_FORMATTER));
        poMap.put("expectedDeliveryDate", purchaseOrder.expectedDeliveryDate().format(DATE_FORMATTER));
        poMap.put("status", purchaseOrder.status());
        poMap.put("notes", purchaseOrder.notes());
        poMap.put("jobCode", purchaseOrder.jobCode());
        poMap.put("projectName", purchaseOrder.projectName());
        poMap.put("purchaseRequestNumber", purchaseOrder.purchaseRequestNumber());
        return poMap;
    }

    private Map<String, Object> buildItemMap(PurchaseRequestDetailView purchaseRequest,
                                             PurchaseOrderDetailView purchaseOrder) {
        Map<String, Object> itemMap = new HashMap<>();

        // Purchase request details
        itemMap.put("description", purchaseRequest.description());
        itemMap.put("itemName", purchaseRequest.itemName());
        itemMap.put("quantity", CURRENCY_FORMAT.format(purchaseRequest.quantity()));
        itemMap.put("uom", purchaseRequest.uom());
        itemMap.put("requestNumber", purchaseRequest.requestNumber());

        // Find the matching RFQ item for this PO
        if (purchaseRequest.rfqItems() != null && purchaseOrder.rfqItemId() != null) {
            purchaseRequest.rfqItems().stream()
                    .filter(rfq -> rfq.itemId().equals(purchaseOrder.rfqItemId()))
                    .findFirst()
                    .ifPresent(rfqItem -> {
                        if (rfqItem.quotedPrice() != null) {
                            BigDecimal unitPrice = rfqItem.quotedPrice()
                                    .divide(purchaseRequest.quantity(), 2, RoundingMode.HALF_UP);
                            itemMap.put("unitPrice", "￦ " + CURRENCY_FORMAT.format(unitPrice));
                            itemMap.put("lineTotal", "￦ " + CURRENCY_FORMAT.format(rfqItem.quotedPrice()));
                        }
                        if (rfqItem.quotedLeadTime() != null) {
                            itemMap.put("quotedLeadTime", rfqItem.quotedLeadTime() + "일");
                        }
                    });
        }

        return itemMap;
    }

    private void setTotalVariables(Context context, BigDecimal totalAmount) {
        BigDecimal vat = totalAmount.multiply(VAT_RATE);
        BigDecimal grandTotal = totalAmount.add(vat);

        context.setVariable("totalAmountFormatted", "￦ " + CURRENCY_FORMAT.format(totalAmount));
        context.setVariable("vatAmountFormatted", "￦ " + CURRENCY_FORMAT.format(vat));
        context.setVariable("grandTotalFormatted", "￦ " + CURRENCY_FORMAT.format(grandTotal));
        context.setVariable("totalAmountText", convertToKoreanAmount(totalAmount));
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

    /**
     * Convert amount to Korean representation.
     * e.g., 1,234,567 -> 일금일백이십삼만사천오백육십칠원정
     */
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
