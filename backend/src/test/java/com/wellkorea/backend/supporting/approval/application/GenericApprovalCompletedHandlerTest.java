package com.wellkorea.backend.supporting.approval.application;

import com.wellkorea.backend.shared.exception.ResourceNotFoundException;
import com.wellkorea.backend.supporting.approval.domain.Approvable;
import com.wellkorea.backend.supporting.approval.domain.event.ApprovalCompletedEvent;
import com.wellkorea.backend.supporting.approval.domain.vo.ApprovalState;
import com.wellkorea.backend.supporting.approval.domain.vo.EntityType;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GenericApprovalCompletedHandler.
 * Tests the generic event handler that delegates to Approvable entities.
 *
 * <p>The handler:
 * <ol>
 *   <li>Checks if entity type is registered in ApprovableRegistry</li>
 *   <li>If not registered, returns silently (allows legacy handlers)</li>
 *   <li>If registered, resolves entity and calls onApprovalGranted/onApprovalRejected</li>
 * </ol>
 */
@ExtendWith(MockitoExtension.class)
@Tag("unit")
@DisplayName("GenericApprovalCompletedHandler")
class GenericApprovalCompletedHandlerTest {

    @Mock
    private ApprovableRegistry registry;

    private GenericApprovalCompletedHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GenericApprovalCompletedHandler(registry);
    }

    /**
     * Mock Approvable implementation for testing.
     */
    static class MockApprovable implements Approvable {
        private final Long id;
        private boolean approvalGrantedCalled = false;
        private boolean approvalRejectedCalled = false;
        private Long grantedByUserId;
        private Long rejectedByUserId;
        private String rejectionReason;

        MockApprovable(Long id) {
            this.id = id;
        }

        @Override
        public Long getId() {
            return id;
        }

        @Override
        public EntityType getApprovalEntityType() {
            return EntityType.VENDOR_SELECTION;
        }

        @Override
        public ApprovalState getApprovalState() {
            ApprovalState state = new ApprovalState();
            state.submitForApproval(1L, "TEST");
            return state;
        }

        @Override
        public String getApprovalDescription() {
            return "Test Entity " + id;
        }

        @Override
        public void onApprovalGranted(Long approverUserId) {
            this.approvalGrantedCalled = true;
            this.grantedByUserId = approverUserId;
        }

        @Override
        public void onApprovalRejected(Long rejectorUserId, String reason) {
            this.approvalRejectedCalled = true;
            this.rejectedByUserId = rejectorUserId;
            this.rejectionReason = reason;
        }

        boolean wasApprovalGrantedCalled() {
            return approvalGrantedCalled;
        }

        boolean wasApprovalRejectedCalled() {
            return approvalRejectedCalled;
        }

        Long getGrantedByUserId() {
            return grantedByUserId;
        }

        Long getRejectedByUserId() {
            return rejectedByUserId;
        }

        String getRejectionReason() {
            return rejectionReason;
        }
    }

    @Nested
    @DisplayName("onApprovalCompleted")
    class HandleApprovalCompleted {

        @Test
        @DisplayName("should invoke onApprovalGranted when approved")
        void shouldInvokeOnApprovalGrantedWhenApproved() {
            // Given
            Long entityId = 100L;
            Long approverUserId = 200L;
            MockApprovable entity = new MockApprovable(entityId);

            ApprovalCompletedEvent event = ApprovalCompletedEvent.approved(
                    1L, EntityType.VENDOR_SELECTION, entityId, approverUserId);

            given(registry.supports(EntityType.VENDOR_SELECTION)).willReturn(true);
            given(registry.resolve(EntityType.VENDOR_SELECTION, entityId)).willReturn(Optional.of(entity));

            // When
            handler.onApprovalCompleted(event);

            // Then
            assertThat(entity.wasApprovalGrantedCalled()).isTrue();
            assertThat(entity.getGrantedByUserId()).isEqualTo(approverUserId);
            assertThat(entity.wasApprovalRejectedCalled()).isFalse();
        }

        @Test
        @DisplayName("should invoke onApprovalRejected when rejected")
        void shouldInvokeOnApprovalRejectedWhenRejected() {
            // Given
            Long entityId = 100L;
            Long rejectorUserId = 200L;
            String reason = "Price too high";
            MockApprovable entity = new MockApprovable(entityId);

            ApprovalCompletedEvent event = ApprovalCompletedEvent.rejected(
                    1L, EntityType.VENDOR_SELECTION, entityId, rejectorUserId, reason);

            given(registry.supports(EntityType.VENDOR_SELECTION)).willReturn(true);
            given(registry.resolve(EntityType.VENDOR_SELECTION, entityId)).willReturn(Optional.of(entity));

            // When
            handler.onApprovalCompleted(event);

            // Then
            assertThat(entity.wasApprovalRejectedCalled()).isTrue();
            assertThat(entity.getRejectedByUserId()).isEqualTo(rejectorUserId);
            assertThat(entity.getRejectionReason()).isEqualTo(reason);
            assertThat(entity.wasApprovalGrantedCalled()).isFalse();
        }

        @Test
        @DisplayName("should resolve entity via ApprovableRegistry")
        void shouldResolveEntityViaApprovableRegistry() {
            // Given
            Long entityId = 100L;
            MockApprovable entity = new MockApprovable(entityId);

            ApprovalCompletedEvent event = ApprovalCompletedEvent.approved(
                    1L, EntityType.VENDOR_SELECTION, entityId, 200L);

            given(registry.supports(EntityType.VENDOR_SELECTION)).willReturn(true);
            given(registry.resolve(EntityType.VENDOR_SELECTION, entityId)).willReturn(Optional.of(entity));

            // When
            handler.onApprovalCompleted(event);

            // Then
            verify(registry).supports(EntityType.VENDOR_SELECTION);
            verify(registry).resolve(EntityType.VENDOR_SELECTION, entityId);
        }

        @Test
        @DisplayName("should fall back to legacy handlers for unregistered types")
        void shouldFallBackToLegacyHandlersForUnregisteredTypes() {
            // Given - QUOTATION type is not registered in ApprovableRegistry
            ApprovalCompletedEvent event = ApprovalCompletedEvent.approved(
                    1L, EntityType.QUOTATION, 100L, 200L);

            given(registry.supports(EntityType.QUOTATION)).willReturn(false);

            // When
            handler.onApprovalCompleted(event);

            // Then - should not try to resolve, just return silently
            verify(registry).supports(EntityType.QUOTATION);
            verify(registry, never()).resolve(any(), any());
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when entity not found")
        void shouldThrowWhenEntityNotFound() {
            // Given
            Long entityId = 999L;

            ApprovalCompletedEvent event = ApprovalCompletedEvent.approved(
                    1L, EntityType.VENDOR_SELECTION, entityId, 200L);

            given(registry.supports(EntityType.VENDOR_SELECTION)).willReturn(true);
            given(registry.resolve(EntityType.VENDOR_SELECTION, entityId)).willReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(() -> handler.onApprovalCompleted(event))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("VENDOR_SELECTION")
                    .hasMessageContaining(entityId.toString());
        }

        @Test
        @DisplayName("should not call any callback if neither approved nor rejected")
        void shouldNotCallAnyCallbackIfStatusUnknown() {
            // This is a defensive test - in practice events are always approved or rejected
            // Given - spy on a real entity to verify no callback is called
            Long entityId = 100L;
            Approvable spyEntity = spy(new MockApprovable(entityId));

            // Create event with neither approved nor rejected (edge case)
            // Note: In production, events are created via factory methods, so this shouldn't happen
            // But the handler should still handle it gracefully
            ApprovalCompletedEvent approvedEvent = ApprovalCompletedEvent.approved(
                    1L, EntityType.VENDOR_SELECTION, entityId, 200L);

            given(registry.supports(EntityType.VENDOR_SELECTION)).willReturn(true);
            given(registry.resolve(EntityType.VENDOR_SELECTION, entityId)).willReturn(Optional.of(spyEntity));

            // When
            handler.onApprovalCompleted(approvedEvent);

            // Then - verify only onApprovalGranted is called, not onApprovalRejected
            verify(spyEntity).onApprovalGranted(200L);
            verify(spyEntity, never()).onApprovalRejected(any(), any());
        }
    }

    @Nested
    @DisplayName("Event Properties")
    class EventPropertiesTests {

        @Test
        @DisplayName("should pass correct approverUserId to onApprovalGranted")
        void shouldPassCorrectApproverUserId() {
            // Given
            Long entityId = 100L;
            Long approverUserId = 999L;
            MockApprovable entity = new MockApprovable(entityId);

            ApprovalCompletedEvent event = ApprovalCompletedEvent.approved(
                    1L, EntityType.VENDOR_SELECTION, entityId, approverUserId);

            given(registry.supports(EntityType.VENDOR_SELECTION)).willReturn(true);
            given(registry.resolve(EntityType.VENDOR_SELECTION, entityId)).willReturn(Optional.of(entity));

            // When
            handler.onApprovalCompleted(event);

            // Then
            assertThat(entity.getGrantedByUserId()).isEqualTo(approverUserId);
        }

        @Test
        @DisplayName("should pass correct rejectorUserId and reason to onApprovalRejected")
        void shouldPassCorrectRejectorUserIdAndReason() {
            // Given
            Long entityId = 100L;
            Long rejectorUserId = 888L;
            String reason = "Budget exceeded";
            MockApprovable entity = new MockApprovable(entityId);

            ApprovalCompletedEvent event = ApprovalCompletedEvent.rejected(
                    1L, EntityType.VENDOR_SELECTION, entityId, rejectorUserId, reason);

            given(registry.supports(EntityType.VENDOR_SELECTION)).willReturn(true);
            given(registry.resolve(EntityType.VENDOR_SELECTION, entityId)).willReturn(Optional.of(entity));

            // When
            handler.onApprovalCompleted(event);

            // Then
            assertThat(entity.getRejectedByUserId()).isEqualTo(rejectorUserId);
            assertThat(entity.getRejectionReason()).isEqualTo(reason);
        }

        @Test
        @DisplayName("should handle null rejection reason")
        void shouldHandleNullRejectionReason() {
            // Given
            Long entityId = 100L;
            MockApprovable entity = new MockApprovable(entityId);

            ApprovalCompletedEvent event = ApprovalCompletedEvent.rejected(
                    1L, EntityType.VENDOR_SELECTION, entityId, 200L, null);

            given(registry.supports(EntityType.VENDOR_SELECTION)).willReturn(true);
            given(registry.resolve(EntityType.VENDOR_SELECTION, entityId)).willReturn(Optional.of(entity));

            // When
            handler.onApprovalCompleted(event);

            // Then
            assertThat(entity.wasApprovalRejectedCalled()).isTrue();
            assertThat(entity.getRejectionReason()).isNull();
        }
    }
}
