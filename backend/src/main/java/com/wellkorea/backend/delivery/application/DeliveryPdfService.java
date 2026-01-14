package com.wellkorea.backend.delivery.application;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.wellkorea.backend.company.domain.Company;
import com.wellkorea.backend.company.infrastructure.persistence.CompanyRepository;
import com.wellkorea.backend.delivery.domain.Delivery;
import com.wellkorea.backend.delivery.domain.DeliveryLineItem;
import com.wellkorea.backend.delivery.infrastructure.persistence.DeliveryRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service for generating delivery statement PDFs using OpenHTMLtoPDF.
 * Generates professional Korean delivery statements (거래명세서/납품서) with proper Korean font support.
 */
@Service
public class DeliveryPdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");
    private static final DecimalFormat QUANTITY_FORMAT = new DecimalFormat("#,###.##");

    private final DeliveryRepository deliveryRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final CompanyProperties companyProperties;
    private final TemplateEngine templateEngine;

    public DeliveryPdfService(DeliveryRepository deliveryRepository,
                              ProjectRepository projectRepository,
                              CompanyRepository companyRepository,
                              CompanyProperties companyProperties,
                              TemplateEngine templateEngine) {
        this.deliveryRepository = deliveryRepository;
        this.projectRepository = projectRepository;
        this.companyRepository = companyRepository;
        this.companyProperties = companyProperties;
        this.templateEngine = templateEngine;
    }

    /**
     * Generate delivery statement PDF for a delivery by ID.
     * Fetches the delivery, project, and customer info and returns PDF bytes.
     *
     * @param deliveryId The delivery ID
     * @return PDF as byte array
     * @throws ResourceNotFoundException if delivery not found
     */
    public byte[] generateStatement(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", deliveryId));

        return generatePdfFromEntity(delivery);
    }

    private byte[] generatePdfFromEntity(Delivery delivery) {
        Project project = projectRepository.findById(delivery.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", delivery.getProjectId()));

        Company customer = companyRepository.findById(project.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Company not found with ID: " + project.getCustomerId()));

        try {
            Context context = buildTemplateContext(delivery, project, customer);
            String html = templateEngine.process("delivery-statement-pdf", context);
            return convertHtmlToPdf(html);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF for delivery: " + delivery.getId(), e);
        }
    }

    private Context buildTemplateContext(Delivery delivery, Project project, Company customer) throws IOException {
        Context context = new Context();

        context.setVariable("company", buildCompanyMap());
        context.setVariable("customer", buildCustomerMap(customer));
        context.setVariable("project", buildProjectMap(project));
        setDeliveryVariables(context, delivery, project);
        context.setVariable("lineItems", buildLineItems(delivery));
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

    private Map<String, String> buildProjectMap(Project project) {
        Map<String, String> projectMap = new HashMap<>();
        projectMap.put("jobCode", project.getJobCode());
        projectMap.put("projectName", project.getProjectName());
        return projectMap;
    }

    private void setDeliveryVariables(Context context, Delivery delivery, Project project) {
        context.setVariable("deliveryNumber", formatDeliveryNumber(delivery, project));
        context.setVariable("deliveryDate", delivery.getDeliveryDate().format(DATE_FORMATTER));
        context.setVariable("status", delivery.getStatus().name());
        context.setVariable("notes", delivery.getNotes());
    }

    private List<Map<String, Object>> buildLineItems(Delivery delivery) {
        List<Map<String, Object>> lineItems = new ArrayList<>();
        int sequence = 1;
        for (DeliveryLineItem item : delivery.getLineItems()) {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("sequence", sequence++);
            itemMap.put("productId", item.getProductId());
            // Note: Product name would need to be resolved via Product repository
            // For now, just use productId as placeholder
            itemMap.put("productName", "Product #" + item.getProductId());
            itemMap.put("quantityDelivered", QUANTITY_FORMAT.format(item.getQuantityDelivered()));
            lineItems.add(itemMap);
        }
        return lineItems;
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

    private String formatDeliveryNumber(Delivery delivery, Project project) {
        return project.getJobCode() + "-D" + String.format("%03d", delivery.getId());
    }
}
