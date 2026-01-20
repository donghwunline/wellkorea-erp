package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.quotation.api.dto.query.LineItemView;
import com.wellkorea.backend.quotation.api.dto.query.QuotationDetailView;
import com.wellkorea.backend.quotation.domain.QuotationStatus;
import com.wellkorea.backend.quotation.infrastructure.mapper.QuotationMapper;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.mail.MailMessage;
import com.wellkorea.backend.shared.mail.MockMailSender;
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
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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
    private QuotationMapper quotationMapper;

    @Mock
    private CompanyMapper companyMapper;

    @Mock
    private CompanyProperties companyProperties;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private QuotationPdfService quotationPdfService;

    private MockMailSender mockMailSender;

    private QuotationEmailService quotationEmailService;

    private QuotationDetailView testQuotationView;
    private CompanyDetailView testCustomerView;

    private static final Long QUOTATION_ID = 1L;
    private static final Long PROJECT_ID = 1L;
    private static final Long CUSTOMER_ID = 100L;

    @BeforeEach
    void setUp() {
        mockMailSender = new MockMailSender();

        quotationEmailService = new QuotationEmailService(
                quotationMapper,
                mockMailSender,
                companyMapper,
                companyProperties,
                templateEngine,
                quotationPdfService
        );

        testQuotationView = createTestQuotationView(QuotationStatus.APPROVED, 1);
        testCustomerView = createTestCustomerView("customer@test.com", "김철수");

        setupCompanyProperties();
    }

    private QuotationDetailView createTestQuotationView(QuotationStatus status, int version) {
        LineItemView lineItem = new LineItemView(
                1L, 1L, "PROD-001", "Test Product",
                1, BigDecimal.TEN, new BigDecimal("100000"), new BigDecimal("1000000"), null
        );

        return new QuotationDetailView(
                QUOTATION_ID,
                PROJECT_ID,
                CUSTOMER_ID,
                "Test Project",
                "WK2K25-0001-1219",
                version,
                status,
                LocalDate.now(),
                30,
                LocalDate.now().plusDays(30),
                new BigDecimal("1000000"),
                "Test notes",
                1L,
                "테스트 사용자",
                null,
                null,
                null,
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now(),
                List.of(lineItem)
        );
    }

    private CompanyDetailView createTestCustomerView(String email, String contactPerson) {
        return new CompanyDetailView(
                CUSTOMER_ID,
                "Test Customer",
                "123-45-67890",
                "대표자",
                "제조업",
                "기계",
                contactPerson,
                "02-1234-5678",
                email,
                "Seoul, Korea",
                "국민은행 123-456-789",
                "월말 정산",
                true,
                Instant.now(),
                Instant.now(),
                List.of()
        );
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
            given(quotationMapper.findDetailById(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(999L, null, List.of()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Quotation not found with id: 999");
        }

        @Test
        @DisplayName("should throw BusinessException when quotation is in DRAFT status")
        void sendRevisionNotificationById_DraftStatus_ThrowsException() {
            QuotationDetailView draftQuotation = createTestQuotationView(QuotationStatus.DRAFT, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(draftQuotation));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("APPROVED, SENDING, SENT, or ACCEPTED");
        }

        @Test
        @DisplayName("should throw BusinessException when quotation is in PENDING status")
        void sendRevisionNotificationById_PendingStatus_ThrowsException() {
            QuotationDetailView pendingQuotation = createTestQuotationView(QuotationStatus.PENDING, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(pendingQuotation));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("APPROVED, SENDING, SENT, or ACCEPTED");
        }

        @Test
        @DisplayName("should throw BusinessException when quotation is in REJECTED status")
        void sendRevisionNotificationById_RejectedStatus_ThrowsException() {
            QuotationDetailView rejectedQuotation = createTestQuotationView(QuotationStatus.REJECTED, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(rejectedQuotation));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("APPROVED, SENDING, SENT, or ACCEPTED");
        }

        @Test
        @DisplayName("should send email when quotation is APPROVED")
        void sendRevisionNotificationById_ApprovedStatus_SendsEmail() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));
            given(quotationPdfService.generatePdf(QUOTATION_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of());

            assertThat(mockMailSender.hasSentMessages()).isTrue();
            MailMessage sentMessage = mockMailSender.getLastMessage();
            assertThat(sentMessage.to()).isEqualTo("customer@test.com");
            assertThat(sentMessage.from()).isEqualTo("info@wellkorea.com");
            assertThat(sentMessage.html()).isTrue();
            assertThat(sentMessage.attachments()).hasSize(1);
            assertThat(sentMessage.attachments().get(0).filename()).endsWith(".pdf");
        }

        @Test
        @DisplayName("should send email when quotation is SENT")
        void sendRevisionNotificationById_SentStatus_SendsEmail() {
            QuotationDetailView sentQuotation = createTestQuotationView(QuotationStatus.SENT, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(sentQuotation));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));
            given(quotationPdfService.generatePdf(QUOTATION_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of());

            assertThat(mockMailSender.hasSentMessages()).isTrue();
        }

        @Test
        @DisplayName("should send email when quotation is SENDING")
        void sendRevisionNotificationById_SendingStatus_SendsEmail() {
            QuotationDetailView sendingQuotation = createTestQuotationView(QuotationStatus.SENDING, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(sendingQuotation));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));
            given(quotationPdfService.generatePdf(QUOTATION_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of());

            assertThat(mockMailSender.hasSentMessages()).isTrue();
        }

        @Test
        @DisplayName("should send email when quotation is ACCEPTED")
        void sendRevisionNotificationById_AcceptedStatus_SendsEmail() {
            QuotationDetailView acceptedQuotation = createTestQuotationView(QuotationStatus.ACCEPTED, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(acceptedQuotation));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));
            given(quotationPdfService.generatePdf(QUOTATION_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of());

            assertThat(mockMailSender.hasSentMessages()).isTrue();
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when customer not found")
        void sendRevisionNotificationById_CustomerNotFound_ThrowsException() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Company not found");
        }

        @Test
        @DisplayName("should throw BusinessException when customer has no email")
        void sendRevisionNotificationById_NoEmail_ThrowsException() {
            CompanyDetailView customerNoEmail = createTestCustomerView(null, "김철수");
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(customerNoEmail));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email address");
        }

        @Test
        @DisplayName("should throw BusinessException when customer email is blank")
        void sendRevisionNotificationById_BlankEmail_ThrowsException() {
            CompanyDetailView customerBlankEmail = createTestCustomerView("   ", "김철수");
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(customerBlankEmail));

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email address");
        }

        @Test
        @DisplayName("should use Korean email template")
        void sendRevisionNotificationById_ValidQuotation_UsesKoreanTemplate() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));
            given(quotationPdfService.generatePdf(QUOTATION_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of());

            verify(templateEngine).process(eq("quotation-email-ko"), any(Context.class));
        }

        @Test
        @DisplayName("should include correct context variables for email template")
        void sendRevisionNotificationById_ValidQuotation_IncludesCorrectContext() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));
            given(quotationPdfService.generatePdf(QUOTATION_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willAnswer(invocation -> {
                        Context context = invocation.getArgument(1);
                        assertThat(context.getVariable("customerName")).isEqualTo("Test Customer");
                        assertThat(context.getVariable("contactPerson")).isEqualTo("김철수");
                        assertThat(context.getVariable("quotationNumber")).isEqualTo("WK2K25-0001-1219-Q01");
                        assertThat(context.getVariable("projectName")).isEqualTo("Test Project");
                        return "<html>Email Content</html>";
                    });

            quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of());

            verify(templateEngine).process(eq("quotation-email-ko"), any(Context.class));
        }

        @Test
        @DisplayName("should throw BusinessException when mail send fails")
        void sendRevisionNotificationById_MailSendFails_ThrowsBusinessException() {
            mockMailSender.failOnNextSend("Simulated failure");
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));
            given(quotationPdfService.generatePdf(QUOTATION_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("quotation-email-ko"), any(Context.class)))
                    .willReturn("<html>Email Content</html>");

            assertThatThrownBy(() -> quotationEmailService.sendRevisionNotification(QUOTATION_ID, null, List.of()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Failed to send revision notification email");
        }
    }

    @Nested
    @DisplayName("sendSimpleNotification")
    class SendSimpleNotificationTests {

        @Test
        @DisplayName("should throw ResourceNotFoundException when quotation not found")
        void sendSimpleNotification_QuotationNotFound_ThrowsException() {
            given(quotationMapper.findDetailById(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationEmailService.sendSimpleNotification(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Quotation not found with id: 999");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when customer not found")
        void sendSimpleNotification_CustomerNotFound_ThrowsException() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.empty());

            assertThatThrownBy(() -> quotationEmailService.sendSimpleNotification(QUOTATION_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Company not found");
        }

        @Test
        @DisplayName("should throw BusinessException when customer has no email")
        void sendSimpleNotification_NoEmail_ThrowsException() {
            CompanyDetailView customerNoEmail = createTestCustomerView(null, "김철수");
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(customerNoEmail));

            assertThatThrownBy(() -> quotationEmailService.sendSimpleNotification(QUOTATION_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("email address");
        }

        @Test
        @DisplayName("should send simple mail message")
        void sendSimpleNotification_ValidQuotation_SendsSimpleMail() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            assertThat(mockMailSender.hasSentMessages()).isTrue();
            MailMessage sentMessage = mockMailSender.getLastMessage();
            assertThat(sentMessage.from()).isEqualTo("info@wellkorea.com");
            assertThat(sentMessage.to()).isEqualTo("customer@test.com");
            assertThat(sentMessage.html()).isFalse();
            assertThat(sentMessage.attachments()).isEmpty();
        }

        @Test
        @DisplayName("should include Korean subject line")
        void sendSimpleNotification_ValidQuotation_HasKoreanSubject() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            MailMessage sentMessage = mockMailSender.getLastMessage();
            assertThat(sentMessage.subject()).contains("웰코리아(주)");
            assertThat(sentMessage.subject()).contains("견적서 안내");
            assertThat(sentMessage.subject()).contains("WK2K25-0001-1219");
        }

        @Test
        @DisplayName("should include quotation details in plain text body")
        void sendSimpleNotification_ValidQuotation_IncludesQuotationDetails() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            MailMessage sentMessage = mockMailSender.getLastMessage();
            String body = sentMessage.body();

            assertThat(body).contains("Test Customer");
            assertThat(body).contains("김철수 님");
            assertThat(body).contains("WK2K25-0001-1219-Q01");
            assertThat(body).contains("Test Project");
            assertThat(body).contains("1,000,000");
        }

        @Test
        @DisplayName("should include contact information in plain text body")
        void sendSimpleNotification_ValidQuotation_IncludesContactInfo() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            MailMessage sentMessage = mockMailSender.getLastMessage();
            String body = sentMessage.body();

            assertThat(body).contains("042-933-8115");
            assertThat(body).contains("042-935-8115");
            assertThat(body).contains("info@wellkorea.com");
        }

        @Test
        @DisplayName("should include version info for revised quotations")
        void sendSimpleNotification_RevisedQuotation_IncludesVersionInfo() {
            QuotationDetailView revisedQuotation = createTestQuotationView(QuotationStatus.APPROVED, 2);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(revisedQuotation));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            MailMessage sentMessage = mockMailSender.getLastMessage();
            String body = sentMessage.body();

            assertThat(body).contains("V2");
            assertThat(body).contains("수정 견적");
        }

        @Test
        @DisplayName("should use default greeting when contact person is null")
        void sendSimpleNotification_NoContactPerson_UsesDefaultGreeting() {
            CompanyDetailView customerNoContact = createTestCustomerView("customer@test.com", null);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(customerNoContact));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            MailMessage sentMessage = mockMailSender.getLastMessage();
            String body = sentMessage.body();

            assertThat(body).contains("담당자 님");
        }

        @Test
        @DisplayName("should throw BusinessException when mail send fails")
        void sendSimpleNotification_MailSendFails_ThrowsBusinessException() {
            mockMailSender.failOnNextSend("Simulated failure");
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            assertThatThrownBy(() -> quotationEmailService.sendSimpleNotification(QUOTATION_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Failed to send notification email");
        }
    }

    @Nested
    @DisplayName("Quotation Number Formatting")
    class QuotationNumberFormattingTests {

        @Test
        @DisplayName("should format version correctly for single digit")
        void formatQuotationNumber_SingleDigitVersion_FormatsCorrectly() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            MailMessage sentMessage = mockMailSender.getLastMessage();
            // Format: "[웰코리아(주)] 견적서 안내 - WK2K25-0001-1219 (V1)"
            assertThat(sentMessage.subject()).contains("(V1)");
        }

        @Test
        @DisplayName("should format version correctly for double digit")
        void formatQuotationNumber_DoubleDigitVersion_FormatsCorrectly() {
            QuotationDetailView quotationV12 = createTestQuotationView(QuotationStatus.APPROVED, 12);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(quotationV12));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            MailMessage sentMessage = mockMailSender.getLastMessage();
            // Format: "[웰코리아(주)] 견적서 안내 - WK2K25-0001-1219 (V12)"
            assertThat(sentMessage.subject()).contains("(V12)");
        }
    }

    @Nested
    @DisplayName("canSendEmail")
    class CanSendEmailTests {

        @Test
        @DisplayName("should return false when quotation not found")
        void canSendEmail_QuotationNotFound_ReturnsFalse() {
            given(quotationMapper.findDetailById(999L)).willReturn(Optional.empty());

            boolean result = quotationEmailService.canSendEmail(999L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in DRAFT status")
        void canSendEmail_DraftStatus_ReturnsFalse() {
            QuotationDetailView draftQuotation = createTestQuotationView(QuotationStatus.DRAFT, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(draftQuotation));

            boolean result = quotationEmailService.canSendEmail(QUOTATION_ID);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in PENDING status")
        void canSendEmail_PendingStatus_ReturnsFalse() {
            QuotationDetailView pendingQuotation = createTestQuotationView(QuotationStatus.PENDING, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(pendingQuotation));

            boolean result = quotationEmailService.canSendEmail(QUOTATION_ID);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in REJECTED status")
        void canSendEmail_RejectedStatus_ReturnsFalse() {
            QuotationDetailView rejectedQuotation = createTestQuotationView(QuotationStatus.REJECTED, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(rejectedQuotation));

            boolean result = quotationEmailService.canSendEmail(QUOTATION_ID);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return true when quotation is in APPROVED status")
        void canSendEmail_ApprovedStatus_ReturnsTrue() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));

            boolean result = quotationEmailService.canSendEmail(QUOTATION_ID);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should return true when quotation is in SENT status")
        void canSendEmail_SentStatus_ReturnsTrue() {
            QuotationDetailView sentQuotation = createTestQuotationView(QuotationStatus.SENT, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(sentQuotation));

            boolean result = quotationEmailService.canSendEmail(QUOTATION_ID);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should return true when quotation is in ACCEPTED status")
        void canSendEmail_AcceptedStatus_ReturnsTrue() {
            QuotationDetailView acceptedQuotation = createTestQuotationView(QuotationStatus.ACCEPTED, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(acceptedQuotation));

            boolean result = quotationEmailService.canSendEmail(QUOTATION_ID);

            assertThat(result).isTrue();
        }
    }

    @Nested
    @DisplayName("needsStatusUpdateBeforeSend")
    class NeedsStatusUpdateBeforeSendTests {

        @Test
        @DisplayName("should return false when quotation not found")
        void needsStatusUpdateBeforeSend_QuotationNotFound_ReturnsFalse() {
            given(quotationMapper.findDetailById(999L)).willReturn(Optional.empty());

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(999L);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return true when quotation is in APPROVED status")
        void needsStatusUpdateBeforeSend_ApprovedStatus_ReturnsTrue() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(QUOTATION_ID);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should return true when quotation is in SENT status (for re-sending)")
        void needsStatusUpdateBeforeSend_SentStatus_ReturnsTrue() {
            QuotationDetailView sentQuotation = createTestQuotationView(QuotationStatus.SENT, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(sentQuotation));

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(QUOTATION_ID);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should return false when quotation is in ACCEPTED status")
        void needsStatusUpdateBeforeSend_AcceptedStatus_ReturnsFalse() {
            QuotationDetailView acceptedQuotation = createTestQuotationView(QuotationStatus.ACCEPTED, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(acceptedQuotation));

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(QUOTATION_ID);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should return false when quotation is in DRAFT status")
        void needsStatusUpdateBeforeSend_DraftStatus_ReturnsFalse() {
            QuotationDetailView draftQuotation = createTestQuotationView(QuotationStatus.DRAFT, 1);
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(draftQuotation));

            boolean result = quotationEmailService.needsStatusUpdateBeforeSend(QUOTATION_ID);

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("MockMailSender integration")
    class MockMailSenderTests {

        @Test
        @DisplayName("should report correct mail sender type")
        void mailSender_ReturnsCorrectType() {
            assertThat(mockMailSender.getType()).isEqualTo("Mock");
        }

        @Test
        @DisplayName("should track sent message count")
        void mailSender_TracksSentCount() {
            given(quotationMapper.findDetailById(QUOTATION_ID)).willReturn(Optional.of(testQuotationView));
            given(companyMapper.findDetailById(CUSTOMER_ID)).willReturn(Optional.of(testCustomerView));

            quotationEmailService.sendSimpleNotification(QUOTATION_ID);
            quotationEmailService.sendSimpleNotification(QUOTATION_ID);

            assertThat(mockMailSender.getSentCount()).isEqualTo(2);
        }
    }
}
