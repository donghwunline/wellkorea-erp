package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.quotation.domain.*;
import com.wellkorea.backend.quotation.domain.event.QuotationSubmittedEvent;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationRepository;
import com.wellkorea.backend.quotation.infrastructure.repository.QuotationLineItemRepository;
import com.wellkorea.backend.project.domain.Project;
import com.wellkorea.backend.project.domain.ProjectStatus;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import com.wellkorea.backend.product.domain.Product;
import com.wellkorea.backend.product.infrastructure.repository.ProductRepository;
import com.wellkorea.backend.auth.domain.Role;
import com.wellkorea.backend.auth.domain.User;
import com.wellkorea.backend.auth.infrastructure.persistence.UserRepository;
import com.wellkorea.backend.shared.event.DomainEventPublisher;
import com.wellkorea.backend.shared.exception.BusinessException;
import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit tests for QuotationCommandService.
 * Tests business logic for quotation creation, update, and workflow operations.
 * Following CQRS pattern - command service returns IDs, not entities.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("QuotationCommandService Unit Tests")
class QuotationCommandServiceTest {

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private QuotationLineItemRepository lineItemRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DomainEventPublisher eventPublisher;

    @InjectMocks
    private QuotationCommandService commandService;

    private Project testProject;
    private User testUser;
    private Product testProduct;
    private Quotation testQuotation;

    @BeforeEach
    void setUp() {
        // Set up test project using builder
        testProject = Project.builder()
                .id(1L)
                .jobCode("WK2K25-0001-1219")
                .projectName("Test Project")
                .customerId(1L)
                .internalOwnerId(1L)
                .createdById(1L)
                .dueDate(LocalDate.now().plusMonths(1))
                .status(ProjectStatus.ACTIVE)
                .build();

        // Set up test user using builder
        testUser = User.builder()
                .id(1L)
                .username("admin")
                .email("admin@wellkorea.com")
                .passwordHash("hashed")
                .fullName("Admin User")
                .roles(Set.of(Role.ADMIN))
                .build();

        // Set up test product
        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setSku("SM-PANEL-001");
        testProduct.setName("Control Panel");
        testProduct.setBaseUnitPrice(BigDecimal.valueOf(50000.00));

        // Set up test quotation
        testQuotation = new Quotation();
        testQuotation.setId(1L);
        testQuotation.setProject(testProject);
        testQuotation.setVersion(1);
        testQuotation.setStatus(QuotationStatus.DRAFT);
        testQuotation.setQuotationDate(LocalDate.now());
        testQuotation.setValidityDays(30);
        testQuotation.setTotalAmount(BigDecimal.ZERO);
        testQuotation.setCreatedBy(testUser);
    }

    @Nested
    @DisplayName("createQuotation - Create quotation with line items")
    class CreateQuotationTests {

        @Test
        @DisplayName("should create quotation and return ID")
        void createQuotation_ValidData_ReturnsId() {
            // Given
            CreateQuotationCommand command = new CreateQuotationCommand(
                    1L, // projectId
                    30, // validityDays
                    "Test notes",
                    List.of(new LineItemCommand(1L, BigDecimal.valueOf(10), BigDecimal.valueOf(50000.00), "Notes"))
            );

            given(projectRepository.findById(1L)).willReturn(Optional.of(testProject));
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(productRepository.findById(1L)).willReturn(Optional.of(testProduct));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> {
                Quotation q = invocation.getArgument(0);
                q.setId(1L);
                return q;
            });

            // When
            Long result = commandService.createQuotation(command, 1L);

            // Then
            assertThat(result).isEqualTo(1L);
            ArgumentCaptor<Quotation> quotationCaptor = ArgumentCaptor.forClass(Quotation.class);
            verify(quotationRepository).save(quotationCaptor.capture());
            Quotation savedQuotation = quotationCaptor.getValue();
            assertThat(savedQuotation.getProject()).isEqualTo(testProject);
            assertThat(savedQuotation.getVersion()).isEqualTo(1);
            assertThat(savedQuotation.getStatus()).isEqualTo(QuotationStatus.DRAFT);
        }

        @Test
        @DisplayName("should throw exception when project not found")
        void createQuotation_ProjectNotFound_ThrowsException() {
            // Given
            CreateQuotationCommand command = new CreateQuotationCommand(
                    999L, 30, null,
                    List.of(new LineItemCommand(1L, BigDecimal.ONE, BigDecimal.TEN, null))
            );

            given(projectRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> commandService.createQuotation(command, 1L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Project");
        }

        @Test
        @DisplayName("should throw exception when line items are empty")
        void createQuotation_EmptyLineItems_ThrowsException() {
            // Given
            CreateQuotationCommand command = new CreateQuotationCommand(
                    1L, 30, null, List.of()
            );

            // When/Then
            assertThatThrownBy(() -> commandService.createQuotation(command, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("line item");
        }
    }

    @Nested
    @DisplayName("updateQuotation - Update quotation")
    class UpdateQuotationTests {

        @Test
        @DisplayName("should update DRAFT quotation and return ID")
        void updateQuotation_DraftStatus_ReturnsId() {
            // Given
            testQuotation.setId(1L);
            UpdateQuotationCommand command = new UpdateQuotationCommand(
                    45, "Updated notes",
                    List.of(new LineItemCommand(1L, BigDecimal.valueOf(15), BigDecimal.valueOf(48000.00), "Discounted"))
            );

            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(productRepository.findById(1L)).willReturn(Optional.of(testProduct));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> {
                Quotation q = invocation.getArgument(0);
                return q;
            });

            // When
            Long result = commandService.updateQuotation(1L, command);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(quotationRepository).save(any(Quotation.class));
        }

        @Test
        @DisplayName("should throw exception when updating non-DRAFT quotation")
        void updateQuotation_NonDraftStatus_ThrowsException() {
            // Given
            testQuotation.setStatus(QuotationStatus.PENDING);
            UpdateQuotationCommand command = new UpdateQuotationCommand(
                    45, null,
                    List.of(new LineItemCommand(1L, BigDecimal.ONE, BigDecimal.TEN, null))
            );

            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            // When/Then
            assertThatThrownBy(() -> commandService.updateQuotation(1L, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("DRAFT");
        }
    }

    @Nested
    @DisplayName("submitForApproval - Submit quotation for approval")
    class SubmitForApprovalTests {

        @Test
        @DisplayName("should submit DRAFT quotation and return ID")
        void submitForApproval_DraftStatus_ReturnsId() {
            // Given - add line items so quotation can be submitted
            QuotationLineItem lineItem = new QuotationLineItem();
            lineItem.setProduct(testProduct);
            lineItem.setQuantity(BigDecimal.TEN);
            lineItem.setUnitPrice(BigDecimal.valueOf(50000));
            lineItem.setLineTotal(BigDecimal.valueOf(500000));
            testQuotation.getLineItems().add(lineItem);
            testQuotation.setId(1L);

            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> invocation.getArgument(0));

            // When
            Long result = commandService.submitForApproval(1L, 100L);

            // Then
            assertThat(result).isEqualTo(1L);
            verify(eventPublisher).publish(any(QuotationSubmittedEvent.class));
        }

        @Test
        @DisplayName("should throw exception when submitting non-DRAFT quotation")
        void submitForApproval_NonDraftStatus_ThrowsException() {
            // Given
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            // When/Then
            assertThatThrownBy(() -> commandService.submitForApproval(1L, 100L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("DRAFT");
        }
    }

    @Nested
    @DisplayName("createNewVersion - Create new version from existing quotation")
    class CreateNewVersionTests {

        @Test
        @DisplayName("should create new version from APPROVED quotation")
        void createNewVersion_FromApproved_ReturnsNewId() {
            // Given
            testQuotation.setStatus(QuotationStatus.APPROVED);
            testQuotation.setVersion(1);

            QuotationLineItem lineItem = new QuotationLineItem();
            lineItem.setProduct(testProduct);
            lineItem.setQuantity(BigDecimal.TEN);
            lineItem.setUnitPrice(BigDecimal.valueOf(50000));
            lineItem.setLineTotal(BigDecimal.valueOf(500000));
            testQuotation.setLineItems(new ArrayList<>(List.of(lineItem)));

            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(quotationRepository.findLatestVersionByProjectId(anyLong())).willReturn(Optional.of(1));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> {
                Quotation q = invocation.getArgument(0);
                q.setId(2L);
                return q;
            });

            // When
            Long result = commandService.createNewVersion(1L, 1L);

            // Then
            assertThat(result).isEqualTo(2L);
            ArgumentCaptor<Quotation> quotationCaptor = ArgumentCaptor.forClass(Quotation.class);
            verify(quotationRepository).save(quotationCaptor.capture());
            Quotation newVersion = quotationCaptor.getValue();
            assertThat(newVersion.getVersion()).isEqualTo(2);
            assertThat(newVersion.getStatus()).isEqualTo(QuotationStatus.DRAFT);
        }

        @Test
        @DisplayName("should throw exception when creating version from DRAFT quotation")
        void createNewVersion_FromDraft_ThrowsException() {
            // Given
            testQuotation.setStatus(QuotationStatus.DRAFT);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            // When/Then
            assertThatThrownBy(() -> commandService.createNewVersion(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("APPROVED");
        }
    }

    @Nested
    @DisplayName("approveQuotation - Approve quotation after approval workflow")
    class ApproveQuotationTests {

        @Test
        @DisplayName("should approve PENDING quotation and return ID")
        void approveQuotation_PendingStatus_ReturnsId() {
            // Given
            testQuotation.setStatus(QuotationStatus.PENDING);
            testQuotation.setId(1L);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> invocation.getArgument(0));

            // When
            Long result = commandService.approveQuotation(1L, 1L);

            // Then
            assertThat(result).isEqualTo(1L);
            ArgumentCaptor<Quotation> quotationCaptor = ArgumentCaptor.forClass(Quotation.class);
            verify(quotationRepository).save(quotationCaptor.capture());
            assertThat(quotationCaptor.getValue().getStatus()).isEqualTo(QuotationStatus.APPROVED);
        }
    }

    @Nested
    @DisplayName("rejectQuotation - Reject quotation with reason")
    class RejectQuotationTests {

        @Test
        @DisplayName("should reject PENDING quotation and return ID")
        void rejectQuotation_PendingStatus_ReturnsId() {
            // Given
            testQuotation.setStatus(QuotationStatus.PENDING);
            testQuotation.setId(1L);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> invocation.getArgument(0));

            // When
            Long result = commandService.rejectQuotation(1L, "Price too high");

            // Then
            assertThat(result).isEqualTo(1L);
            ArgumentCaptor<Quotation> quotationCaptor = ArgumentCaptor.forClass(Quotation.class);
            verify(quotationRepository).save(quotationCaptor.capture());
            assertThat(quotationCaptor.getValue().getStatus()).isEqualTo(QuotationStatus.REJECTED);
            assertThat(quotationCaptor.getValue().getRejectionReason()).isEqualTo("Price too high");
        }
    }
}
