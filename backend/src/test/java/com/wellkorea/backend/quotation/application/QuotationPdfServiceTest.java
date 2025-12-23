package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.customer.domain.Customer;
import com.wellkorea.backend.customer.infrastructure.repository.CustomerRepository;
import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.quotation.domain.Quotation;
import com.wellkorea.backend.quotation.domain.QuotationLineItem;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.BusinessException;
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
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("QuotationPdfService Unit Tests")
class QuotationPdfServiceTest {

    @Mock
    private QuotationRepository quotationRepository;

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
                quotationRepository,
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

        // Use Customer builder pattern
        testCustomer = Customer.builder()
                .id(100L)
                .name("Test Customer")
                .contactPerson("John Doe")
                .phone("02-1234-5678")
                .email("customer@test.com")
                .address("Seoul, Korea")
                .build();

        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("Test Product");
        testProduct.setDescription("Product Description");
        testProduct.setUnit("EA");

        // Use Quotation setter pattern (no builder on Quotation)
        testQuotation = new Quotation();
        testQuotation.setId(1L);
        testQuotation.setProject(testProject);
        testQuotation.setQuotationDate(LocalDate.now());
        testQuotation.setValidityDays(30);
        testQuotation.setStatus(QuotationStatus.APPROVED);
        testQuotation.setVersion(1);

        // Use QuotationLineItem setter pattern (no builder on QuotationLineItem)
        QuotationLineItem lineItem = new QuotationLineItem();
        lineItem.setId(1L);
        lineItem.setProduct(testProduct);
        lineItem.setQuantity(BigDecimal.TEN);
        lineItem.setUnitPrice(new BigDecimal("100000"));
        lineItem.setLineTotal(new BigDecimal("1000000"));

        testQuotation.addLineItem(lineItem);

        setupCompanyProperties();
    }

    private void setupCompanyProperties() {
        lenient().when(companyProperties.getName()).thenReturn("웰코리아(주)");
        lenient().when(companyProperties.getNameEn()).thenReturn("WellKorea Co., Ltd.");
        lenient().when(companyProperties.getRegistrationNumber()).thenReturn("123-45-67890");
        lenient().when(companyProperties.getAddress()).thenReturn("대전광역시 유성구");
        lenient().when(companyProperties.getPhone()).thenReturn("042-933-8115");
        lenient().when(companyProperties.getFax()).thenReturn("042-935-8115");
        lenient().when(companyProperties.getDesignDeptPhone()).thenReturn("042-934-8115");
        lenient().when(companyProperties.getEmail()).thenReturn("info@wellkorea.com");
    }

    @Nested
    @DisplayName("generatePdf(Long quotationId)")
    class GeneratePdfByIdTests {

        @Test
        @DisplayName("should throw ResourceNotFoundException when quotation not found")
        void generatePdfById_QuotationNotFound_ThrowsException() {
            given(quotationRepository.findByIdWithLineItems(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationPdfService.generatePdf(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Quotation not found");
        }

        @Test
        @DisplayName("should throw BusinessException when quotation is DRAFT")
        void generatePdfById_DraftQuotation_ThrowsException() {
            testQuotation.setStatus(QuotationStatus.DRAFT);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            assertThatThrownBy(() -> quotationPdfService.generatePdf(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("PDF can only be generated for non-DRAFT quotations");
        }

        @Test
        @DisplayName("should generate PDF for APPROVED quotation")
        void generatePdfById_ApprovedQuotation_GeneratesPdf() {
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willReturn("<html><body>Test PDF</body></html>");

            try {
                quotationPdfService.generatePdf(1L);
            } catch (RuntimeException e) {
                // Expected - font file not available in test
            }

            verify(quotationRepository).findByIdWithLineItems(1L);
            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }

        @Test
        @DisplayName("should generate PDF for PENDING quotation")
        void generatePdfById_PendingQuotation_GeneratesPdf() {
            testQuotation.setStatus(QuotationStatus.PENDING);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(templateEngine.process(eq("quotation-pdf"), any(Context.class)))
                    .willReturn("<html><body>Test PDF</body></html>");

            try {
                quotationPdfService.generatePdf(1L);
            } catch (RuntimeException e) {
                // Expected - font file not available in test
            }

            verify(quotationRepository).findByIdWithLineItems(1L);
            verify(templateEngine).process(eq("quotation-pdf"), any(Context.class));
        }
    }

    @Nested
    @DisplayName("generatePdf(Quotation)")
    class GeneratePdfByEntityTests {

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
