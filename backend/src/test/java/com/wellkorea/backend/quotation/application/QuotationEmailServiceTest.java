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
    private QuotationRepository quotationRepository;

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
                quotationRepository,
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

        // Use Customer builder pattern
        testCustomer = Customer.builder()
                .id(100L)
                .name("Test Customer")
                .contactPerson("김철수")
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
        lenient().when(companyProperties.getPhone()).thenReturn("042-933-8115");
        lenient().when(companyProperties.getFax()).thenReturn("042-935-8115");
        lenient().when(companyProperties.getEmail()).thenReturn("info@wellkorea.com");
        lenient().when(companyProperties.getAddress()).thenReturn("대전광역시 유성구");
    }

    @Nested
    @DisplayName("sendRevisionNotification by ID")
    class SendRevisionNotificationByIdTests {

        @Test
        @DisplayName("should throw ResourceNotFoundException when quotation not found")
        void sendRevisionNotificationById_QuotationNotFound_ThrowsException() {
            given(quotationRepository.findByIdWithLineItems(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Quotation not found with ID: 999");
        }

        @Test
        @DisplayName("should throw BusinessException when quotation is in DRAFT status")
        void sendRevisionNotificationById_DraftStatus_ThrowsException() {
            testQuotation.setStatus(QuotationStatus.DRAFT);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("APPROVED, SENT, or ACCEPTED");
        }

        @Test
        @DisplayName("should throw BusinessException when quotation is in PENDING status")
        void sendRevisionNotificationById_PendingStatus_ThrowsException() {
            testQuotation.setStatus(QuotationStatus.PENDING);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("APPROVED, SENT, or ACCEPTED");
        }

        @Test
        @DisplayName("should throw BusinessException when quotation is in REJECTED status")
        void sendRevisionNotificationById_RejectedStatus_ThrowsException() {
            testQuotation.setStatus(QuotationStatus.REJECTED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("APPROVED, SENT, or ACCEPTED");
        }

        @Test
        @DisplayName("should send email when quotation is APPROVED")
        void sendRevisionNotificationById_ApprovedStatus_SendsEmail() {
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(quotationPdfService.generatePdf(testQuotation)).willReturn(new byte[]{1, 2, 3});
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(1L);

            verify(mailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("should send email when quotation is SENT")
        void sendRevisionNotificationById_SentStatus_SendsEmail() {
            testQuotation.setStatus(QuotationStatus.SENT);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(quotationPdfService.generatePdf(testQuotation)).willReturn(new byte[]{1, 2, 3});
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(1L);

            verify(mailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("should send email when quotation is ACCEPTED")
        void sendRevisionNotificationById_AcceptedStatus_SendsEmail() {
            testQuotation.setStatus(QuotationStatus.ACCEPTED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(quotationPdfService.generatePdf(testQuotation)).willReturn(new byte[]{1, 2, 3});
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(1L);

            verify(mailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when customer not found")
        void sendRevisionNotificationById_CustomerNotFound_ThrowsException() {
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(1L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Customer not found");
        }

        @Test
        @DisplayName("should throw BusinessException when customer has no email")
        void sendRevisionNotificationById_NoEmail_ThrowsException() {
            Customer customerNoEmail = Customer.builder()
                    .id(100L)
                    .name("Test Customer")
                    .contactPerson("김철수")
                    .phone("02-1234-5678")
                    .email(null)
                    .address("Seoul, Korea")
                    .build();
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.of(customerNoEmail));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email address");
        }

        @Test
        @DisplayName("should throw BusinessException when customer email is blank")
        void sendRevisionNotificationById_BlankEmail_ThrowsException() {
            Customer customerBlankEmail = Customer.builder()
                    .id(100L)
                    .name("Test Customer")
                    .contactPerson("김철수")
                    .phone("02-1234-5678")
                    .email("   ")
                    .address("Seoul, Korea")
                    .build();
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.of(customerBlankEmail));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email address");
        }

        @Test
        @DisplayName("should use Korean email template")
        void sendRevisionNotificationById_ValidQuotation_UsesKoreanTemplate() {
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));
            given(quotationPdfService.generatePdf(testQuotation)).willReturn(new byte[]{1, 2, 3});
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(1L);

            verify(templateEngine).process(eq("quotation-email-ko"), any(Context.class));
        }

        @Test
        @DisplayName("should include correct context variables for email template")
        void sendRevisionNotificationById_ValidQuotation_IncludesCorrectContext() {
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
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

            quotationEmailService.sendRevisionNotification(1L);

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
            Customer customerNoEmail = Customer.builder()
                    .id(100L)
                    .name("Test Customer")
                    .contactPerson("김철수")
                    .phone("02-1234-5678")
                    .email(null)
                    .address("Seoul, Korea")
                    .build();
            given(customerRepository.findById(100L)).willReturn(Optional.of(customerNoEmail));

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
            // Create revised quotation (version 2)
            Quotation revisedQuotation = new Quotation();
            revisedQuotation.setId(2L);
            revisedQuotation.setProject(testProject);
            revisedQuotation.setQuotationDate(LocalDate.now());
            revisedQuotation.setValidityDays(30);
            revisedQuotation.setStatus(QuotationStatus.APPROVED);
            revisedQuotation.setVersion(2);

            QuotationLineItem lineItem = new QuotationLineItem();
            lineItem.setId(1L);
            lineItem.setProduct(testProduct);
            lineItem.setQuantity(BigDecimal.TEN);
            lineItem.setUnitPrice(new BigDecimal("100000"));
            lineItem.setLineTotal(new BigDecimal("1000000"));
            revisedQuotation.addLineItem(lineItem);

            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(revisedQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();
            String body = sentMessage.getText();

            assertThat(body).contains("V2");
            assertThat(body).contains("수정 견적");
        }

        @Test
        @DisplayName("should use default greeting when contact person is null")
        void sendSimpleNotification_NoContactPerson_UsesDefaultGreeting() {
            Customer customerNoContact = Customer.builder()
                    .id(100L)
                    .name("Test Customer")
                    .contactPerson(null)
                    .phone("02-1234-5678")
                    .email("customer@test.com")
                    .address("Seoul, Korea")
                    .build();
            given(customerRepository.findById(100L)).willReturn(Optional.of(customerNoContact));

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
        @DisplayName("should format version correctly for single digit")
        void formatQuotationNumber_SingleDigitVersion_FormatsCorrectly() {
            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(testQuotation);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();

            // Format: "[웰코리아(주)] 견적서 안내 - WK2K25-0001-1219 (V1)"
            assertThat(sentMessage.getSubject()).contains("(V1)");
        }

        @Test
        @DisplayName("should format version correctly for double digit")
        void formatQuotationNumber_DoubleDigitVersion_FormatsCorrectly() {
            // Create quotation with version 12
            Quotation quotationV12 = new Quotation();
            quotationV12.setId(2L);
            quotationV12.setProject(testProject);
            quotationV12.setQuotationDate(LocalDate.now());
            quotationV12.setValidityDays(30);
            quotationV12.setStatus(QuotationStatus.APPROVED);
            quotationV12.setVersion(12);

            QuotationLineItem lineItem = new QuotationLineItem();
            lineItem.setId(1L);
            lineItem.setProduct(testProduct);
            lineItem.setQuantity(BigDecimal.TEN);
            lineItem.setUnitPrice(new BigDecimal("100000"));
            lineItem.setLineTotal(new BigDecimal("1000000"));
            quotationV12.addLineItem(lineItem);

            given(customerRepository.findById(100L)).willReturn(Optional.of(testCustomer));

            quotationEmailService.sendSimpleNotification(quotationV12);

            verify(mailSender).send(simpleMailCaptor.capture());
            SimpleMailMessage sentMessage = simpleMailCaptor.getValue();

            // Format: "[웰코리아(주)] 견적서 안내 - WK2K25-0001-1219 (V12)"
            assertThat(sentMessage.getSubject()).contains("(V12)");
        }
    }

    @Nested
    @DisplayName("canSendEmail")
    class CanSendEmailTests {

        @Test
        @DisplayName("should return false when quotation not found")
        void canSendEmail_QuotationNotFound_ReturnsFalse() {
            given(quotationRepository.findById(999L)).willReturn(Optional.empty());

            boolean result = quotationEmailService.canSendEmail(999L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in DRAFT status")
        void canSendEmail_DraftStatus_ReturnsFalse() {
            testQuotation.setStatus(QuotationStatus.DRAFT);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.canSendEmail(1L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in PENDING status")
        void canSendEmail_PendingStatus_ReturnsFalse() {
            testQuotation.setStatus(QuotationStatus.PENDING);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.canSendEmail(1L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in REJECTED status")
        void canSendEmail_RejectedStatus_ReturnsFalse() {
            testQuotation.setStatus(QuotationStatus.REJECTED);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.canSendEmail(1L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return true when quotation is in APPROVED status")
        void canSendEmail_ApprovedStatus_ReturnsTrue() {
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.canSendEmail(1L);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should return true when quotation is in SENT status")
        void canSendEmail_SentStatus_ReturnsTrue() {
            testQuotation.setStatus(QuotationStatus.SENT);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.canSendEmail(1L);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should return true when quotation is in ACCEPTED status")
        void canSendEmail_AcceptedStatus_ReturnsTrue() {
            testQuotation.setStatus(QuotationStatus.ACCEPTED);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.canSendEmail(1L);

            assertThat(result).isTrue();
        }
    }

    @Nested
    @DisplayName("needsStatusUpdateBeforeSend")
    class NeedsStatusUpdateBeforeSendTests {

        @Test
        @DisplayName("should return false when quotation not found")
        void needsStatusUpdateBeforeSend_QuotationNotFound_ReturnsFalse() {
            given(quotationRepository.findById(999L)).willReturn(Optional.empty());

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(999L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return true when quotation is in APPROVED status")
        void needsStatusUpdateBeforeSend_ApprovedStatus_ReturnsTrue() {
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(1L);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should return false when quotation is in SENT status")
        void needsStatusUpdateBeforeSend_SentStatus_ReturnsFalse() {
            testQuotation.setStatus(QuotationStatus.SENT);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(1L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in ACCEPTED status")
        void needsStatusUpdateBeforeSend_AcceptedStatus_ReturnsFalse() {
            testQuotation.setStatus(QuotationStatus.ACCEPTED);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(1L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in DRAFT status")
        void needsStatusUpdateBeforeSend_DraftStatus_ReturnsFalse() {
            testQuotation.setStatus(QuotationStatus.DRAFT);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(1L);

            assertThat(result).isFalse();
        }
    }
}
