package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.customer.domain.Customer;
import com.wellkorea.backend.customer.infrastructure.repository.CustomerRepository;
import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("QuotationPdfService Unit Tests")
class QuotationPdfServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CompanyProperties companyProperties;

    @Mock
    private TemplateEngine templateEngine;

    private QuotationPdfService quotationPdfService;

    private Project testProject;
    private Customer testCustomer;
    private Quotation testQuotation;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        quotationPdfService = new QuotationPdfService(
                customerRepository,
                companyProperties,
                templateEngine
        );

        testProject = Project.builder()
                .id(1L)
                .jobCode("WK2K25-0001-1219")
                .projectName("Test Project")
                .customerId(100L)
                .internalOwnerId(1L)
                .createdById(1L)
                .dueDate(LocalDate.now().plusMonths(1))
                .status(ProjectStatus.ACTIVE)
                .build();

        testCustomer = new Customer();
        testCustomer.setId(100L);
        testCustomer.setName("Test Customer");
        testCustomer.setContactPerson("John Doe");
        testCustomer.setPhone("02-1234-5678");
        testCustomer.setEmail("customer@test.com");
        testCustomer.setAddress("Seoul, Korea");

        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("Test Product");
        testProduct.setDescription("Product Description");
        testProduct.setUnit("EA");

        testQuotation = Quotation.builder()
                .id(1L)
                .project(testProject)
                .quotationDate(LocalDate.now())
                .validityDays(30)
                .status(QuotationStatus.APPROVED)
                .version(1)
                .createdById(1L)
                .build();

        QuotationLineItem lineItem = QuotationLineItem.builder()
                .id(1L)
                .quotation(testQuotation)
                .product(testProduct)
                .quantity(10)
                .unitPrice(new BigDecimal("100000"))
                .build();

        testQuotation.addLineItem(lineItem);

        setupCompanyProperties();
    }

    private void setupCompanyProperties() {
        given(companyProperties.getName()).willReturn("웰코리아(주)");
        given(companyProperties.getNameEn()).willReturn("WellKorea Co., Ltd.");
        given(companyProperties.getRegistrationNumber()).willReturn("123-45-67890");
        given(companyProperties.getAddress()).willReturn("대전광역시 유성구");
        given(companyProperties.getPhone()).willReturn("042-933-8115");
        given(companyProperties.getFax()).willReturn("042-935-8115");
        given(companyProperties.getDesignDeptPhone()).willReturn("042-934-8115");
        given(companyProperties.getEmail()).willReturn("info@wellkorea.com");
    }

    @Nested
    @DisplayName("generatePdf")
    class GeneratePdfTests {

        @Test
        @DisplayName("should throw ResourceNotFoundException when customer not found")
        void generatePdf_CustomerNotFound_ThrowsException() {
            given(customerRepository.findById(100L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationPdfService.generatePdf(testQuotation))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Customer not found");
        }

        @Test
        @DisplayName("should call template engine with correct template name")
        void generatePdf_ValidQuotation_CallsTemplateEngine() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willReturn("<html><body>Test PDF</body></html>");

            try {
                quotationPdfService.generatePdf(testQuotation);
            } catch (RuntimeException e) {
                // Expected - font file not available in test
            }

            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }

        @Test
        @DisplayName("should format quotation number correctly")
        void generatePdf_ValidQuotation_FormatsQuotationNumber() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willAnswer(invocation -> {
                        Context context = invocation.getArgument(1);
                        String quotationNumber = (String) context.getVariable("quotationNumber");
                        assertThat(quotationNumber).isEqualTo("WK2K25-0001-1219-Q01");
                        return "<html></html>";
                    });

            try {
                quotationPdfService.generatePdf(testQuotation);
            } catch (RuntimeException e) {
                // Expected - font file not available in test
            }

            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }
    }

    @Nested
    @DisplayName("Korean Amount Conversion")
    class KoreanAmountConversionTests {

        @Test
        @DisplayName("should convert amount to Korean text in template context")
        void generatePdf_ValidAmount_ConvertsToKoreanText() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willAnswer(invocation -> {
                        Context context = invocation.getArgument(1);
                        String totalAmountText = (String) context.getVariable("totalAmountText");
                        // 1,000,000 = 일금백만원정
                        assertThat(totalAmountText).isEqualTo("일금백만원정");
                        return "<html></html>";
                    });

            try {
                quotationPdfService.generatePdf(testQuotation);
            } catch (RuntimeException e) {
                // Expected - font file not available in test
            }

            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }
    }

    @Nested
    @DisplayName("Template Context Building")
    class TemplateContextTests {

        @Test
        @DisplayName("should include company information in context")
        void generatePdf_ValidQuotation_IncludesCompanyInfo() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willAnswer(invocation -> {
                        Context context = invocation.getArgument(1);
                        @SuppressWarnings("unchecked")
                        var company = (java.util.Map<String, String>) context.getVariable("company");
                        assertThat(company).containsEntry("name", "웰코리아(주)");
                        assertThat(company).containsEntry("phone", "042-933-8115");
                        return "<html></html>";
                    });

            try {
                quotationPdfService.generatePdf(testQuotation);
            } catch (RuntimeException e) {
                // Expected
            }

            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }

        @Test
        @DisplayName("should include customer information in context")
        void generatePdf_ValidQuotation_IncludesCustomerInfo() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willAnswer(invocation -> {
                        Context context = invocation.getArgument(1);
                        @SuppressWarnings("unchecked")
                        var customer = (java.util.Map<String, String>) context.getVariable("customer");
                        assertThat(customer).containsEntry("name", "Test Customer");
                        assertThat(customer).containsEntry("contactPerson", "John Doe");
                        return "<html></html>";
                    });

            try {
                quotationPdfService.generatePdf(testQuotation);
            } catch (RuntimeException e) {
                // Expected
            }

            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }

        @Test
        @DisplayName("should include line items in context")
        void generatePdf_ValidQuotation_IncludesLineItems() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willAnswer(invocation -> {
                        Context context = invocation.getArgument(1);
                        @SuppressWarnings("unchecked")
                        var lineItems = (List<java.util.Map<String, Object>>) context.getVariable("lineItems");
                        assertThat(lineItems).hasSize(1);
                        assertThat(lineItems.get(0)).containsEntry("productName", "Test Product");
                        return "<html></html>";
                    });

            try {
                quotationPdfService.generatePdf(testQuotation);
            } catch (RuntimeException e) {
                // Expected
            }

            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }

        @Test
        @DisplayName("should calculate VAT and grand total correctly")
        void generatePdf_ValidQuotation_CalculatesVatCorrectly() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willAnswer(invocation -> {
                        Context context = invocation.getArgument(1);
                        String totalFormatted = (String) context.getVariable("totalAmountFormatted");
                        String grandTotalFormatted = (String) context.getVariable("grandTotalFormatted");
                        // Total: 1,000,000, Grand Total with VAT: 1,100,000
                        assertThat(totalFormatted).isEqualTo("￦ 1,000,000");
                        assertThat(grandTotalFormatted).isEqualTo("￦ 1,100,000");
                        return "<html></html>";
                    });

            try {
                quotationPdfService.generatePdf(testQuotation);
            } catch (RuntimeException e) {
                // Expected
            }

            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }
    }
}
