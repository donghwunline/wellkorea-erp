package com.wellkorea.backend.production.application;

import com.wellkorea.backend.production.domain.*;
import com.wellkorea.backend.production.infrastructure.mapper.WorkProgressMapper;
import com.wellkorea.backend.production.infrastructure.persistence.WorkProgressSheetRepository;
import com.wellkorea.backend.production.infrastructure.persistence.WorkProgressStepRepository;
import com.wellkorea.backend.production.infrastructure.persistence.WorkProgressStepTemplateRepository;
import com.wellkorea.backend.product.infrastructure.repository.ProductRepository;
import com.wellkorea.backend.project.infrastructure.repository.ProjectRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for WorkProgressService.
 * Tests progress calculation, status updates, and outsourced step tracking.
 * <p>
 * Test-First Development: These tests MUST be written FIRST and MUST FAIL initially.
 * Per Constitution Principle I (Test-First Development).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WorkProgress Service Unit Tests")
class WorkProgressServiceTest {

    @Mock
    private WorkProgressSheetRepository sheetRepository;

    @Mock
    private WorkProgressStepRepository stepRepository;

    @Mock
    private WorkProgressStepTemplateRepository stepTemplateRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private WorkProgressMapper workProgressMapper;

    @InjectMocks
    private WorkProgressCommandService commandService;

    private WorkProgressQueryService queryService;

    @BeforeEach
    void setUp() {
        queryService = new WorkProgressQueryService(workProgressMapper);
    }

    // ==========================================================================
    // Progress Calculation Tests
    // ==========================================================================

    @Nested
    @DisplayName("Progress Calculation")
    class ProgressCalculationTests {

        @Test
        @DisplayName("should calculate 0% progress when all steps are NOT_STARTED")
        void calculateProgress_AllNotStarted_Returns0() {
            // Given
            WorkProgressSheet sheet = createSheetWithSteps(
                    StepStatus.NOT_STARTED,
                    StepStatus.NOT_STARTED,
                    StepStatus.NOT_STARTED
            );

            // When
            int progress = sheet.calculateProgressPercentage();

            // Then
            assertThat(progress).isEqualTo(0);
        }

        @Test
        @DisplayName("should calculate 50% progress when half steps are completed")
        void calculateProgress_HalfCompleted_Returns50() {
            // Given
            WorkProgressSheet sheet = createSheetWithSteps(
                    StepStatus.COMPLETED,
                    StepStatus.COMPLETED,
                    StepStatus.NOT_STARTED,
                    StepStatus.NOT_STARTED
            );

            // When
            int progress = sheet.calculateProgressPercentage();

            // Then
            assertThat(progress).isEqualTo(50);
        }

        @Test
        @DisplayName("should calculate 100% progress when all steps are completed")
        void calculateProgress_AllCompleted_Returns100() {
            // Given
            WorkProgressSheet sheet = createSheetWithSteps(
                    StepStatus.COMPLETED,
                    StepStatus.COMPLETED,
                    StepStatus.COMPLETED
            );

            // When
            int progress = sheet.calculateProgressPercentage();

            // Then
            assertThat(progress).isEqualTo(100);
        }

        @Test
        @DisplayName("should count IN_PROGRESS as 50% of a step")
        void calculateProgress_InProgress_Counts50Percent() {
            // Given - 2 completed, 1 in progress, 1 not started = (2 + 0.5) / 4 = 62.5% -> 62%
            WorkProgressSheet sheet = createSheetWithSteps(
                    StepStatus.COMPLETED,
                    StepStatus.COMPLETED,
                    StepStatus.IN_PROGRESS,
                    StepStatus.NOT_STARTED
            );

            // When
            int progress = sheet.calculateProgressPercentage();

            // Then
            assertThat(progress).isEqualTo(62);
        }

        @Test
        @DisplayName("should count SKIPPED steps as completed")
        void calculateProgress_Skipped_CountsAsCompleted() {
            // Given
            WorkProgressSheet sheet = createSheetWithSteps(
                    StepStatus.COMPLETED,
                    StepStatus.SKIPPED,
                    StepStatus.NOT_STARTED
            );

            // When
            int progress = sheet.calculateProgressPercentage();

            // Then
            assertThat(progress).isEqualTo(66); // 2/3 = 66.67% -> 66%
        }
    }

    // ==========================================================================
    // Outsourced Step Tracking Tests
    // ==========================================================================

    @Nested
    @DisplayName("Outsourced Step Tracking")
    class OutsourcedStepTrackingTests {

        @Test
        @DisplayName("should mark step as outsourced with vendor details")
        void markStepOutsourced_SetsVendorDetails() {
            // Given
            WorkProgressStep step = new WorkProgressStep();
            step.setStatus(StepStatus.NOT_STARTED);

            // When
            step.markAsOutsourced(100L, java.time.LocalDate.of(2025, 1, 15), new BigDecimal("50000.00"));

            // Then
            assertThat(step.isOutsourced()).isTrue();
            assertThat(step.getOutsourceVendorId()).isEqualTo(100L);
            assertThat(step.getOutsourceEta()).isEqualTo(java.time.LocalDate.of(2025, 1, 15));
            assertThat(step.getOutsourceCost()).isEqualByComparingTo(new BigDecimal("50000.00"));
            assertThat(step.getStatus()).isEqualTo(StepStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("should require vendor when marking as outsourced")
        void markStepOutsourced_RequiresVendor() {
            // Given
            WorkProgressStep step = new WorkProgressStep();
            step.setStatus(StepStatus.NOT_STARTED);

            // When/Then
            assertThatThrownBy(() -> step.markAsOutsourced(null, null, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("vendor");
        }

        @Test
        @DisplayName("should track outsourced steps separately in sheet")
        void getOutsourcedSteps_ReturnsOnlyOutsourced() {
            // Given
            WorkProgressSheet sheet = new WorkProgressSheet();

            WorkProgressStep normalStep = new WorkProgressStep();
            normalStep.setOutsourced(false);

            WorkProgressStep outsourcedStep = new WorkProgressStep();
            outsourcedStep.setOutsourced(true);
            outsourcedStep.setOutsourceVendorId(100L);

            sheet.setSteps(List.of(normalStep, outsourcedStep));

            // When
            List<WorkProgressStep> outsourcedSteps = sheet.getOutsourcedSteps();

            // Then
            assertThat(outsourcedSteps).hasSize(1);
            assertThat(outsourcedSteps.get(0).getOutsourceVendorId()).isEqualTo(100L);
        }
    }

    // ==========================================================================
    // Status Transition Tests
    // ==========================================================================

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("should update sheet status to IN_PROGRESS when first step starts")
        void startFirstStep_UpdatesSheetStatus() {
            // Given
            WorkProgressSheet sheet = new WorkProgressSheet();
            sheet.setStatus(SheetStatus.NOT_STARTED);

            WorkProgressStep step = new WorkProgressStep();
            step.setStatus(StepStatus.NOT_STARTED);
            step.setSheet(sheet);
            sheet.setSteps(List.of(step));

            // When
            step.startWork();

            // Then
            assertThat(step.getStatus()).isEqualTo(StepStatus.IN_PROGRESS);
            assertThat(step.getStartedAt()).isNotNull();
            assertThat(sheet.getStatus()).isEqualTo(SheetStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("should update sheet status to COMPLETED when all steps complete")
        void completeAllSteps_UpdatesSheetStatus() {
            // Given
            WorkProgressSheet sheet = new WorkProgressSheet();
            sheet.setStatus(SheetStatus.IN_PROGRESS);

            WorkProgressStep step1 = new WorkProgressStep();
            step1.setStatus(StepStatus.COMPLETED);
            step1.setSheet(sheet);

            WorkProgressStep step2 = new WorkProgressStep();
            step2.setStatus(StepStatus.IN_PROGRESS);
            step2.setSheet(sheet);

            sheet.setSteps(List.of(step1, step2));

            // When
            step2.complete(1L, new BigDecimal("2.5"));

            // Then
            assertThat(step2.getStatus()).isEqualTo(StepStatus.COMPLETED);
            assertThat(step2.getCompletedAt()).isNotNull();
            assertThat(step2.getCompletedById()).isEqualTo(1L);
            assertThat(step2.getActualHours()).isEqualByComparingTo(new BigDecimal("2.5"));
            assertThat(sheet.getStatus()).isEqualTo(SheetStatus.COMPLETED);
        }

        @Test
        @DisplayName("should not allow completing step without user ID")
        void completeStep_RequiresUserId() {
            // Given
            WorkProgressStep step = new WorkProgressStep();
            step.setStatus(StepStatus.IN_PROGRESS);

            // When/Then
            assertThatThrownBy(() -> step.complete(null, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("user");
        }
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private WorkProgressSheet createSheetWithSteps(StepStatus... statuses) {
        WorkProgressSheet sheet = new WorkProgressSheet();
        sheet.setStatus(SheetStatus.IN_PROGRESS);

        List<WorkProgressStep> steps = new java.util.ArrayList<>();
        int stepNumber = 1;
        for (StepStatus status : statuses) {
            WorkProgressStep step = new WorkProgressStep();
            step.setStepNumber(stepNumber++);
            step.setStatus(status);
            step.setSheet(sheet);
            steps.add(step);
        }
        sheet.setSteps(steps);

        return sheet;
    }
}
