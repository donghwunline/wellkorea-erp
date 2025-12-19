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
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("QuotationEmailService Unit Tests")
class QuotationEmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CompanyProperties companyProperties;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private QuotationPdfService quotationPdfService;

    @Mock
    private MimeMessage mimeMessage;

    @Captor
    private ArgumentCaptor<SimpleMailMessage> simpleMailCaptor;

    private QuotationEmailService quotationEmailService;

    private Project testProject;
    private Customer testCustomer;
    private Quotation testQuotation;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        quotationEmailService = new QuotationEmailService(
                mailSender,
                customerRepository,
                companyProperties,
                templateEngine,
                quotationPdfService
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
        testCustomer.setContactPerson("김철수");
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
        lenient().when(companyProperties.getName()).thenReturn("웰코리아(주)");
        lenient().when(companyProperties.getNameEn()).thenReturn("WellKorea Co., Ltd.");
        lenient().when(companyProperties.getPhone()).thenReturn("042-933-8115");
        lenient().when(companyProperties.getFax()).thenReturn("042-935-8115");
        lenient().when(companyProperties.getEmail()).thenReturn("info@wellkorea.com");
        lenient().when(companyProperties.getAddress()).thenReturn("대전광역시 유성구");
    }

    @Nested
    @DisplayName("sendRevisionNotification")
    class SendRevisionNotificationTests {

        @Test
        @DisplayName("should throw ResourceNotFoundException when customer not found")
        void sendRevisionNotification_CustomerNotFound_ThrowsException() {
            given(customerRepository.findById(100L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(testQuotation))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Customer not found");
        }

        @Test
        @DisplayName("should throw BusinessException when customer has no email")
        void sendRevisionNotification_NoEmail_ThrowsException() {
            testCustomer.setEmail(null);
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(testQuotation))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email address");
        }

        @Test
        @DisplayName("should throw BusinessException when customer email is blank")
        void sendRevisionNotification_BlankEmail_ThrowsException() {
            testCustomer.setEmail("   ");
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(testQuotation))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email address");
        }

        @Test
        @DisplayName("should generate PDF and send email with attachment")
        void sendRevisionNotification_ValidQuotation_SendsEmailWithPdf() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(quotationPdfService.generatePdf(testQuotation)).willReturn(new byte[]{1, 2, 3});
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(testQuotation);

            verify(quotationPdfService).generatePdf(testQuotation);
            verify(mailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("should use Korean email template")
        void sendRevisionNotification_ValidQuotation_UsesKoreanTemplate() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(quotationPdfService.generatePdf(testQuotation)).willReturn(new byte[]{1, 2, 3});
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(testQuotation);

            verify(templateEngine).process(eq("quotation-email-ko"), any(Context.class));
        }

        @Test
        @DisplayName("should include correct context variables for email template")
        void sendRevisionNotification_ValidQuotation_IncludesCorrectContext() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(quotationPdfService.generatePdf(testQuotation)).willReturn(new byte[]{1, 2, 3});
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willAnswer(invocation -> {
                        Context context = invocation.getArgument(1);
                        assertThat(context.getVariable("customerName")).isEqualTo("Test Customer");
                        assertThat(context.getVariable("contactPerson")).isEqualTo("김철수");
                        assertThat(context.getVariable("quotationNumber")).isEqualTo("WK2K25-0001-1219-Q01");
                        assertThat(context.getVariable("projectName")).isEqualTo("Test Project");
                        return "<html>Email Content</html>";
                    });

            quotationEmailService.sendRevisionNotification(testQuotation);

            verify(templateEngine).process(eq("quotation-email-ko"), any(Context.class));
        }
    }

    @Nested
    @DisplayName("sendSimpleNotification")
    class SendSimpleNotificationTests {

        @Test
        @DisplayName("should throw ResourceNotFoundException when customer not found")
        void sendSimpleNotification_CustomerNotFound_ThrowsException() {
            given(customerRepository.findById(100L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationEmailService.sendSimpleNotification(testQuotation))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Customer not found");
        }

        @Test
        @DisplayName("should throw BusinessException when customer has no email")
        void sendSimpleNotification_NoEmail_ThrowsException() {
            testCustomer.setEmail(null);
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            assertThatThrownBy(() -> quotationEmailService.sendSimpleNotification(testQuotation))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email address");
        }

        @Test
        @DisplayName("should send simple mail message")
        void sendSimpleNotification_ValidQuotation_SendsSimpleMail() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();

            assertThat(sentMessage.getFrom()).isEqualTo("info@wellkorea.com");
            assertThat(sentMessage.getTo()).contains("customer@test.com");
        }

        @Test
        @DisplayName("should include Korean subject line")
        void sendSimpleNotification_ValidQuotation_HasKoreanSubject() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();

            assertThat(sentMessage.getSubject()).contains("웰코리아(주)");
            assertThat(sentMessage.getSubject()).contains("견적서 안내");
            assertThat(sentMessage.getSubject()).contains("WK2K25-0001-1219");
        }

        @Test
        @DisplayName("should include quotation details in plain text body")
        void sendSimpleNotification_ValidQuotation_IncludesQuotationDetails() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();
            String body = sentMessage.getText();

            assertThat(body).contains("Test Customer");
            assertThat(body).contains("김철수 님");
            assertThat(body).contains("WK2K25-0001-1219-Q01");
            assertThat(body).contains("Test Project");
            assertThat(body).contains("1,000,000");
        }

        @Test
        @DisplayName("should include contact information in plain text body")
        void sendSimpleNotification_ValidQuotation_IncludesContactInfo() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();
            String body = sentMessage.getText();

            assertThat(body).contains("042-933-8115");
            assertThat(body).contains("042-935-8115");
            assertThat(body).contains("info@wellkorea.com");
        }

        @Test
        @DisplayName("should include version info for revised quotations")
        void sendSimpleNotification_RevisedQuotation_IncludesVersionInfo() {
            testQuotation = Quotation.builder()
                    .id(2L)
                    .project(testProject)
                    .quotationDate(LocalDate.now())
                    .validityDays(30)
                    .status(QuotationStatus.APPROVED)
                    .version(2)
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

            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();
            String body = sentMessage.getText();

            assertThat(body).contains("V2");
            assertThat(body).contains("수정 견적");
        }

        @Test
        @DisplayName("should use default greeting when contact person is null")
        void sendSimpleNotification_NoContactPerson_UsesDefaultGreeting() {
            testCustomer.setContactPerson(null);
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();
            String body = sentMessage.getText();

            assertThat(body).contains("담당자 님");
        }
    }

    @Nested
    @DisplayName("Quotation Number Formatting")
    class QuotationNumberFormattingTests {

        @Test
        @DisplayName("should format version with leading zero for single digit")
        void formatQuotationNumber_SingleDigitVersion_FormatsWithLeadingZero() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();

            assertThat(sentMessage.getSubject()).contains("-Q01");
        }

        @Test
        @DisplayName("should format version without leading zero for double digit")
        void formatQuotationNumber_DoubleDigitVersion_FormatsCorrectly() {
            testQuotation = Quotation.builder()
                    .id(2L)
                    .project(testProject)
                    .quotationDate(LocalDate.now())
                    .validityDays(30)
                    .status(QuotationStatus.APPROVED)
                    .version(12)
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

            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();

            assertThat(sentMessage.getSubject()).contains("-Q12");
        }
    }
}
