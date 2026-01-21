package com.wellkorea.backend.purchasing.application;

import com.wellkorea.backend.company.api.dto.query.CompanyDetailView;
import com.wellkorea.backend.company.infrastructure.mapper.CompanyMapper;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseOrderDetailView;
import com.wellkorea.backend.purchasing.api.dto.query.PurchaseRequestDetailView;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseOrderMapper;
import com.wellkorea.backend.purchasing.infrastructure.mapper.PurchaseRequestMapper;
import com.wellkorea.backend.shared.config.CompanyProperties;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.shared.mail.MailMessage;
import com.wellkorea.backend.shared.mail.MockMailSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("PurchaseOrderEmailService Unit Tests")
class PurchaseOrderEmailServiceTest {

    @Mock
    private PurchaseOrderMapper purchaseOrderMapper;

    @Mock
    private PurchaseRequestMapper purchaseRequestMapper;

    @Mock
    private CompanyMapper companyMapper;

    @Mock
    private CompanyProperties companyProperties;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private PurchaseOrderPdfService purchaseOrderPdfService;

    private MockMailSender mockMailSender;

    private PurchaseOrderEmailService purchaseOrderEmailService;

    private PurchaseOrderDetailView testPurchaseOrder;
    private PurchaseRequestDetailView testPurchaseRequest;
    private CompanyDetailView testVendor;

    private static final Long PO_ID = 1L;
    private static final Long PR_ID = 10L;
    private static final Long VENDOR_ID = 20L;

    @BeforeEach
    void setUp() {
        mockMailSender = new MockMailSender();

        purchaseOrderEmailService = new PurchaseOrderEmailService(
                purchaseOrderMapper,
                purchaseRequestMapper,
                companyMapper,
                mockMailSender,
                companyProperties,
                templateEngine,
                purchaseOrderPdfService
        );

        testPurchaseOrder = createTestPurchaseOrder();
        testPurchaseRequest = createTestPurchaseRequest();
        testVendor = createTestVendor();

        setupCompanyProperties();
    }

    private PurchaseOrderDetailView createTestPurchaseOrder() {
        return new PurchaseOrderDetailView(
                PO_ID,
                "PO-001",
                PR_ID,
                "PR-001",
                "RFQ-001",
                1L,
                "JOB-101",
                "Test Project",
                VENDOR_ID,
                "Test Vendor",
                "vendor@test.com",
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                BigDecimal.valueOf(100000),
                "KRW",
                "SENT",
                "Notes",
                1L,
                "User",
                LocalDateTime.now(),
                LocalDateTime.now()
        );
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

    private CompanyDetailView createTestVendor() {
        return new CompanyDetailView(
                VENDOR_ID,
                "Test Vendor",
                "123-45-67890",
                "CEO",
                "Biz",
                "Sec",
                "Contact Person",
                "010-1234-5678",
                "vendor@test.com",
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

    @Test
    @DisplayName("should send email to vendor")
    void sendPurchaseOrderEmail_SendsEmail() {
        given(purchaseOrderMapper.findDetailById(PO_ID)).willReturn(Optional.of(testPurchaseOrder));
        given(purchaseRequestMapper.findDetailById(PR_ID)).willReturn(Optional.of(testPurchaseRequest));
        given(companyMapper.findDetailById(VENDOR_ID)).willReturn(Optional.of(testVendor));
        given(purchaseOrderPdfService.generatePdf(PO_ID)).willReturn(new byte[]{1, 2, 3});
        given(templateEngine.process(eq("purchase-order-email-ko"), any(Context.class))).willReturn("Content");

        purchaseOrderEmailService.sendPurchaseOrderEmail(PO_ID, null, null);

        assertThat(mockMailSender.hasSentMessages()).isTrue();
        MailMessage sent = mockMailSender.getLastMessage();
        assertThat(sent.to()).isEqualTo("vendor@test.com");
        assertThat(sent.attachments()).hasSize(1);
    }

    @Test
    @DisplayName("should override TO email")
    void sendPurchaseOrderEmail_OverridesTo() {
        given(purchaseOrderMapper.findDetailById(PO_ID)).willReturn(Optional.of(testPurchaseOrder));
        given(purchaseRequestMapper.findDetailById(PR_ID)).willReturn(Optional.of(testPurchaseRequest));
        given(companyMapper.findDetailById(VENDOR_ID)).willReturn(Optional.of(testVendor));
        given(purchaseOrderPdfService.generatePdf(PO_ID)).willReturn(new byte[]{1, 2, 3});
        given(templateEngine.process(eq("purchase-order-email-ko"), any(Context.class))).willReturn("Content");

        String overrideEmail = "override@test.com";
        purchaseOrderEmailService.sendPurchaseOrderEmail(PO_ID, overrideEmail, null);

        MailMessage sent = mockMailSender.getLastMessage();
        assertThat(sent.to()).isEqualTo(overrideEmail);
    }

    @Test
    @DisplayName("should add CC emails")
    void sendPurchaseOrderEmail_AddsCC() {
        given(purchaseOrderMapper.findDetailById(PO_ID)).willReturn(Optional.of(testPurchaseOrder));
        given(purchaseRequestMapper.findDetailById(PR_ID)).willReturn(Optional.of(testPurchaseRequest));
        given(companyMapper.findDetailById(VENDOR_ID)).willReturn(Optional.of(testVendor));
        given(purchaseOrderPdfService.generatePdf(PO_ID)).willReturn(new byte[]{1, 2, 3});
        given(templateEngine.process(eq("purchase-order-email-ko"), any(Context.class))).willReturn("Content");

        List<String> ccEmails = List.of("cc@test.com");
        purchaseOrderEmailService.sendPurchaseOrderEmail(PO_ID, null, ccEmails);

        MailMessage sent = mockMailSender.getLastMessage();
        assertThat(sent.cc()).containsExactly("cc@test.com");
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException when PO not found")
    void sendPurchaseOrderEmail_NotFound_ThrowsException() {
        given(purchaseOrderMapper.findDetailById(PO_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> purchaseOrderEmailService.sendPurchaseOrderEmail(PO_ID, null, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}