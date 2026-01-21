package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseRequestMapper;
import com.wellkorea.backend.shared.config.CompanyProperties;
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
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("RfqEmailService Unit Tests")
class RfqEmailServiceTest {

    @Mock
    private PurchaseRequestMapper purchaseRequestMapper;

    @Mock
    private CompanyMapper companyMapper;

    @Mock
    private CompanyProperties companyProperties;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private RfqPdfService rfqPdfService;

    private MockMailSender mockMailSender;

    private RfqEmailService rfqEmailService;

    private PurchaseRequestDetailView testPurchaseRequest;
    private CompanyDetailView testVendor;

    private static final Long PR_ID = 1L;
    private static final Long VENDOR_ID = 10L;

    @BeforeEach
    void setUp() {
        mockMailSender = new MockMailSender();

        rfqEmailService = new RfqEmailService(
                purchaseRequestMapper,
                companyMapper,
                mockMailSender,
                companyProperties,
                templateEngine,
                rfqPdfService
        );

        testPurchaseRequest = createTestPurchaseRequest();
        testVendor = createTestVendor("vendor@test.com");

        setupCompanyProperties();
    }

    private PurchaseRequestDetailView createTestPurchaseRequest() {
        return new PurchaseRequestDetailView(
                PR_ID,
                "PR-001",
                "SERVICE",
                1L,
                "JOB-101",
                "Test Project",
                1L,
                "Test Service Category",
                null, null, null, null, null, null,
                "Test Service Category",
                "Description",
                BigDecimal.TEN,
                "EA",
                LocalDate.now().plusDays(7),
                "RFQ_SENT",
                1L,
                "User",
                LocalDateTime.now(),
                LocalDateTime.now(),
                List.of()
        );
    }

    private CompanyDetailView createTestVendor(String email) {
        return new CompanyDetailView(
                VENDOR_ID,
                "Test Vendor",
                "123-45-67890",
                "CEO",
                "Biz",
                "Sec",
                "Contact Person",
                "010-1234-5678",
                email,
                "Address",
                "Account",
                "Terms",
                true,
                Instant.now(),
                Instant.now(),
                List.of()
        );
    }

    private void setupCompanyProperties() {
        org.mockito.Mockito.lenient().when(companyProperties.getName()).thenReturn("WellKorea");
        org.mockito.Mockito.lenient().when(companyProperties.getEmail()).thenReturn("info@wellkorea.com");
    }

    @Nested
    @DisplayName("sendRfqEmails (Batch)")
    class SendRfqEmailsTests {

        @Test
        @DisplayName("should send emails to all provided vendors")
        void sendRfqEmails_SendsToAllVendors() {
            given(purchaseRequestMapper.findDetailById(PR_ID)).willReturn(Optional.of(testPurchaseRequest));
            given(companyMapper.findDetailById(VENDOR_ID)).willReturn(Optional.of(testVendor));
            given(rfqPdfService.generatePdf(PR_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("rfq-email-ko"), any(Context.class))).willReturn("Content");

            Map<Long, RfqEmailService.VendorEmailInfo> vendorEmails = Map.of(
                    VENDOR_ID, new RfqEmailService.VendorEmailInfo(null, null)
            );

            RfqEmailService.RfqEmailResult result = rfqEmailService.sendRfqEmails(PR_ID, vendorEmails);

            assertThat(result.successCount()).isEqualTo(1);
            assertThat(result.failureCount()).isEqualTo(0);
            assertThat(mockMailSender.hasSentMessages()).isTrue();
            
            MailMessage sent = mockMailSender.getLastMessage();
            assertThat(sent.to()).isEqualTo("vendor@test.com");
            assertThat(sent.attachments()).hasSize(1);
        }

        @Test
        @DisplayName("should handle overrides for TO and CC emails")
        void sendRfqEmails_HandlesOverrides() {
            given(purchaseRequestMapper.findDetailById(PR_ID)).willReturn(Optional.of(testPurchaseRequest));
            given(companyMapper.findDetailById(VENDOR_ID)).willReturn(Optional.of(testVendor));
            given(rfqPdfService.generatePdf(PR_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("rfq-email-ko"), any(Context.class))).willReturn("Content");

            String overrideEmail = "override@vendor.com";
            List<String> ccEmails = List.of("cc@vendor.com");

            Map<Long, RfqEmailService.VendorEmailInfo> vendorEmails = Map.of(
                    VENDOR_ID, new RfqEmailService.VendorEmailInfo(overrideEmail, ccEmails)
            );

            rfqEmailService.sendRfqEmails(PR_ID, vendorEmails);

            MailMessage sent = mockMailSender.getLastMessage();
            assertThat(sent.to()).isEqualTo(overrideEmail);
            assertThat(sent.cc()).containsExactly("cc@vendor.com");
        }

        @Test
        @DisplayName("should track partial failures")
        void sendRfqEmails_TracksPartialFailures() {
            given(purchaseRequestMapper.findDetailById(PR_ID)).willReturn(Optional.of(testPurchaseRequest));
            given(companyMapper.findDetailById(VENDOR_ID)).willReturn(Optional.of(testVendor));
            given(companyMapper.findDetailById(VENDOR_ID + 1)).willReturn(Optional.empty()); // Fail for vendor 2
            given(rfqPdfService.generatePdf(PR_ID)).willReturn(new byte[]{1, 2, 3});
            given(templateEngine.process(eq("rfq-email-ko"), any(Context.class))).willReturn("Content");

            Map<Long, RfqEmailService.VendorEmailInfo> vendorEmails = Map.of(
                    VENDOR_ID, new RfqEmailService.VendorEmailInfo(null, null),
                    VENDOR_ID + 1, new RfqEmailService.VendorEmailInfo(null, null)
            );

            RfqEmailService.RfqEmailResult result = rfqEmailService.sendRfqEmails(PR_ID, vendorEmails);

            assertThat(result.totalVendors()).isEqualTo(2);
            assertThat(result.successCount()).isEqualTo(1);
            assertThat(result.failureCount()).isEqualTo(1);
            assertThat(result.failures()).containsKey(VENDOR_ID + 1);
        }
    }
}
