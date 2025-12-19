package com.wellkorea.backend.quotation.application;

import com.wellkorea.backend.quotation.domain.*;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
 * Unit tests for QuotationService.
 * Tests business logic for quotation creation, update, and workflow operations.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("QuotationService Unit Tests")
class QuotationServiceTest {

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
    private QuotationService quotationService;

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
    @DisplayName("createQuotation - T073: Create quotation with line items")
    class CreateQuotationTests {

        @Test
        @DisplayName("should create quotation with valid data")
        void createQuotation_ValidData_ReturnsQuotation() {
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
            Quotation result = quotationService.createQuotation(command, 1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getProject()).isEqualTo(testProject);
            assertThat(result.getVersion()).isEqualTo(1);
            assertThat(result.getStatus()).isEqualTo(QuotationStatus.DRAFT);
            assertThat(result.getValidityDays()).isEqualTo(30);
            verify(quotationRepository).save(any(Quotation.class));
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
            assertThatThrownBy(() -> quotationService.createQuotation(command, 1L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Project");
        }

        @Test
        @DisplayName("should throw exception when product not found")
        void createQuotation_ProductNotFound_ThrowsException() {
            // Given
            CreateQuotationCommand command = new CreateQuotationCommand(
                    1L, 30, null,
                    List.of(new LineItemCommand(999L, BigDecimal.ONE, BigDecimal.TEN, null))
            );

            given(projectRepository.findById(1L)).willReturn(Optional.of(testProject));
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(productRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> quotationService.createQuotation(command, 1L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Product");
        }

        @Test
        @DisplayName("should throw exception when line items are empty")
        void createQuotation_EmptyLineItems_ThrowsException() {
            // Given
            CreateQuotationCommand command = new CreateQuotationCommand(
                    1L, 30, null, List.of()
            );

            // When/Then
            assertThatThrownBy(() -> quotationService.createQuotation(command, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("line item");
        }

        @Test
        @DisplayName("should throw exception when quantity is zero or negative")
        void createQuotation_InvalidQuantity_ThrowsException() {
            // Given
            CreateQuotationCommand command = new CreateQuotationCommand(
                    1L, 30, null,
                    List.of(new LineItemCommand(1L, BigDecimal.ZERO, BigDecimal.TEN, null))
            );

            // When/Then
            assertThatThrownBy(() -> quotationService.createQuotation(command, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("quantity");
        }

        @Test
        @DisplayName("should throw exception when unit price is negative")
        void createQuotation_NegativeUnitPrice_ThrowsException() {
            // Given
            CreateQuotationCommand command = new CreateQuotationCommand(
                    1L, 30, null,
                    List.of(new LineItemCommand(1L, BigDecimal.ONE, BigDecimal.valueOf(-100), null))
            );

            // When/Then
            assertThatThrownBy(() -> quotationService.createQuotation(command, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("unit price");
        }

        @Test
        @DisplayName("should calculate total amount correctly")
        void createQuotation_CalculatesTotalCorrectly() {
            // Given
            CreateQuotationCommand command = new CreateQuotationCommand(
                    1L, 30, null,
                    List.of(
                            new LineItemCommand(1L, BigDecimal.valueOf(10), BigDecimal.valueOf(50000.00), null),
                            new LineItemCommand(1L, BigDecimal.valueOf(5), BigDecimal.valueOf(30000.00), null)
                    )
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
            Quotation result = quotationService.createQuotation(command, 1L);

            // Then
            // Expected: (10 * 50000) + (5 * 30000) = 500000 + 150000 = 650000
            assertThat(result.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(650000.00));
        }
    }

    @Nested
    @DisplayName("updateQuotation - T073: Update quotation")
    class UpdateQuotationTests {

        @Test
        @DisplayName("should update DRAFT quotation successfully")
        void updateQuotation_DraftStatus_ReturnsUpdatedQuotation() {
            // Given
            UpdateQuotationCommand command = new UpdateQuotationCommand(
                    45, "Updated notes",
                    List.of(new LineItemCommand(1L, BigDecimal.valueOf(15), BigDecimal.valueOf(48000.00), "Discounted"))
            );

            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(productRepository.findById(1L)).willReturn(Optional.of(testProduct));
            given(quotationRepository.save(any(Quotation.class))).willReturn(testQuotation);

            // When
            Quotation result = quotationService.updateQuotation(1L, command);

            // Then
            assertThat(result.getValidityDays()).isEqualTo(45);
            assertThat(result.getNotes()).isEqualTo("Updated notes");
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
            assertThatThrownBy(() -> quotationService.updateQuotation(1L, command))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("should throw exception when quotation not found")
        void updateQuotation_QuotationNotFound_ThrowsException() {
            // Given
            UpdateQuotationCommand command = new UpdateQuotationCommand(45, null, List.of());

            given(quotationRepository.findByIdWithLineItems(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> quotationService.updateQuotation(999L, command))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Quotation");
        }
    }

    @Nested
    @DisplayName("getQuotation - T073: Get quotation by ID")
    class GetQuotationTests {

        @Test
        @DisplayName("should return quotation when found")
        void getQuotation_Found_ReturnsQuotation() {
            // Given
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            // When
            Quotation result = quotationService.getQuotation(1L);

            // Then
            assertThat(result).isEqualTo(testQuotation);
        }

        @Test
        @DisplayName("should throw exception when not found")
        void getQuotation_NotFound_ThrowsException() {
            // Given
            given(quotationRepository.findByIdWithLineItems(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> quotationService.getQuotation(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("listQuotations - T073: List quotations with filters")
    class ListQuotationsTests {

        @Test
        @DisplayName("should return paginated list")
        void listQuotations_ReturnsPage() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Quotation> page = new PageImpl<>(List.of(testQuotation));

            given(quotationRepository.findAllWithFilters(any(), any(), any())).willReturn(page);

            // When
            Page<Quotation> result = quotationService.listQuotations(null, null, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0)).isEqualTo(testQuotation);
        }

        @Test
        @DisplayName("should filter by status")
        void listQuotations_FilterByStatus_ReturnsFiltered() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<Quotation> page = new PageImpl<>(List.of(testQuotation));

            given(quotationRepository.findAllWithFilters(eq(QuotationStatus.DRAFT), any(), any()))
                    .willReturn(page);

            // When
            Page<Quotation> result = quotationService.listQuotations(QuotationStatus.DRAFT, null, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            verify(quotationRepository).findAllWithFilters(eq(QuotationStatus.DRAFT), any(), any());
        }
    }

    @Nested
    @DisplayName("submitForApproval - T073: Submit quotation for approval")
    class SubmitForApprovalTests {

        @Test
        @DisplayName("should submit DRAFT quotation for approval")
        void submitForApproval_DraftStatus_ChangesToPending() {
            // Given - add line items so quotation can be submitted
            QuotationLineItem lineItem = new QuotationLineItem();
            lineItem.setProduct(testProduct);
            lineItem.setQuantity(BigDecimal.TEN);
            lineItem.setUnitPrice(BigDecimal.valueOf(50000));
            lineItem.setLineTotal(BigDecimal.valueOf(500000));
            testQuotation.getLineItems().add(lineItem);

            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> invocation.getArgument(0));

            // When
            Quotation result = quotationService.submitForApproval(1L, 100L);

            // Then
            assertThat(result.getStatus()).isEqualTo(QuotationStatus.PENDING);
            assertThat(result.getSubmittedAt()).isNotNull();
        }

        @Test
        @DisplayName("should throw exception when submitting non-DRAFT quotation")
        void submitForApproval_NonDraftStatus_ThrowsException() {
            // Given
            testQuotation.setStatus(QuotationStatus.APPROVED);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            // When/Then
            assertThatThrownBy(() -> quotationService.submitForApproval(1L, 100L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("DRAFT");
        }
    }

    @Nested
    @DisplayName("createNewVersion - T073: Create new version from existing quotation")
    class CreateNewVersionTests {

        @Test
        @DisplayName("should create new version from APPROVED quotation")
        void createNewVersion_FromApproved_ReturnsNewVersion() {
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
            Quotation result = quotationService.createNewVersion(1L, 1L);

            // Then
            assertThat(result.getVersion()).isEqualTo(2);
            assertThat(result.getStatus()).isEqualTo(QuotationStatus.DRAFT);
            verify(quotationRepository).save(any(Quotation.class));
        }

        @Test
        @DisplayName("should throw exception when creating version from DRAFT quotation")
        void createNewVersion_FromDraft_ThrowsException() {
            // Given
            testQuotation.setStatus(QuotationStatus.DRAFT);
            given(quotationRepository.findByIdWithLineItems(1L)).willReturn(Optional.of(testQuotation));

            // When/Then
            assertThatThrownBy(() -> quotationService.createNewVersion(1L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("APPROVED");
        }
    }

    @Nested
    @DisplayName("approveQuotation - T073: Approve quotation after approval workflow")
    class ApproveQuotationTests {

        @Test
        @DisplayName("should approve PENDING quotation")
        void approveQuotation_PendingStatus_ChangesToApproved() {
            // Given
            testQuotation.setStatus(QuotationStatus.PENDING);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> invocation.getArgument(0));

            // When
            Quotation result = quotationService.approveQuotation(1L, 1L);

            // Then
            assertThat(result.getStatus()).isEqualTo(QuotationStatus.APPROVED);
            assertThat(result.getApprovedAt()).isNotNull();
            assertThat(result.getApprovedBy()).isEqualTo(testUser);
        }
    }

    @Nested
    @DisplayName("rejectQuotation - T073: Reject quotation with reason")
    class RejectQuotationTests {

        @Test
        @DisplayName("should reject PENDING quotation with reason")
        void rejectQuotation_PendingStatus_ChangesToRejected() {
            // Given
            testQuotation.setStatus(QuotationStatus.PENDING);
            given(quotationRepository.findById(1L)).willReturn(Optional.of(testQuotation));
            given(quotationRepository.save(any(Quotation.class))).willAnswer(invocation -> invocation.getArgument(0));

            // When
            Quotation result = quotationService.rejectQuotation(1L, "Price too high");

            // Then
            assertThat(result.getStatus()).isEqualTo(QuotationStatus.REJECTED);
            assertThat(result.getRejectionReason()).isEqualTo("Price too high");
        }
    }
}
