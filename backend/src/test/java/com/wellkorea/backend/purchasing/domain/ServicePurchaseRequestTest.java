package com.wellkorea.backend.purchasing.domain;

import com.wellkorea.backend.catalog.domain.ServiceCategory;
import com.wellkorea.backend.production.domain.AllowedFileType;
import com.wellkorea.backend.purchasing.domain.vo.AttachmentReference;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for ServicePurchaseRequest domain entity.
 * Focuses on attachment linking functionality.
 */
@Tag("unit")
@DisplayName("ServicePurchaseRequest")
class ServicePurchaseRequestTest {

    private ServicePurchaseRequest purchaseRequest;
    private ServiceCategory serviceCategory;

    private static final Long PROJECT_ID = 1L;
    private static final String REQUEST_NUMBER = "PR-2024-0001";
    private static final String DESCRIPTION = "CNC machining for prototype";
    private static final BigDecimal QUANTITY = BigDecimal.TEN;
    private static final String UOM = "PCS";
    private static final LocalDate REQUIRED_DATE = LocalDate.now().plusDays(30);
    private static final Long CREATED_BY_ID = 1L;
    private static final Long LINKED_BY_ID = 2L;

    @BeforeEach
    void setUp() {
        serviceCategory = new ServiceCategory();
        serviceCategory.setId(1L);
        serviceCategory.setName("CNC Machining");

        purchaseRequest = new ServicePurchaseRequest(
                PROJECT_ID,
                serviceCategory,
                REQUEST_NUMBER,
                DESCRIPTION,
                QUANTITY,
                UOM,
                REQUIRED_DATE,
                CREATED_BY_ID
        );
    }

    @Nested
    @DisplayName("linkAttachment()")
    class LinkAttachment {

        @Test
        @DisplayName("should link attachment successfully")
        void shouldLinkAttachmentSuccessfully() {
            // When
            AttachmentReference ref = purchaseRequest.linkAttachment(
                    "blueprint.pdf",
                    AllowedFileType.PDF,
                    1024L,
                    "projects/123/blueprints/blueprint.pdf",
                    LINKED_BY_ID
            );

            // Then
            assertThat(ref).isNotNull();
            assertThat(ref.getFileName()).isEqualTo("blueprint.pdf");
            assertThat(ref.getFileType()).isEqualTo(AllowedFileType.PDF);
            assertThat(ref.getFileSize()).isEqualTo(1024L);
            assertThat(ref.getStoragePath()).isEqualTo("projects/123/blueprints/blueprint.pdf");
            assertThat(ref.getLinkedById()).isEqualTo(LINKED_BY_ID);
            assertThat(purchaseRequest.getAttachments()).hasSize(1);
            assertThat(purchaseRequest.getAttachments()).contains(ref);
        }

        @Test
        @DisplayName("should link multiple attachments")
        void shouldLinkMultipleAttachments() {
            // When
            purchaseRequest.linkAttachment(
                    "drawing1.pdf", AllowedFileType.PDF, 1024L,
                    "path/drawing1.pdf", LINKED_BY_ID);
            purchaseRequest.linkAttachment(
                    "drawing2.dxf", AllowedFileType.DXF, 2048L,
                    "path/drawing2.dxf", LINKED_BY_ID);
            purchaseRequest.linkAttachment(
                    "drawing3.dwg", AllowedFileType.DWG, 3072L,
                    "path/drawing3.dwg", LINKED_BY_ID);

            // Then
            assertThat(purchaseRequest.getAttachments()).hasSize(3);
        }

        @Test
        @DisplayName("should throw when linking duplicate storage path")
        void shouldThrowWhenDuplicateStoragePath() {
            // Given
            String storagePath = "projects/123/blueprints/blueprint.pdf";
            purchaseRequest.linkAttachment(
                    "blueprint.pdf", AllowedFileType.PDF, 1024L,
                    storagePath, LINKED_BY_ID);

            // When / Then
            assertThatThrownBy(() -> purchaseRequest.linkAttachment(
                    "blueprint-copy.pdf", AllowedFileType.PDF, 1024L,
                    storagePath, LINKED_BY_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Attachment already linked");
        }

        @Test
        @DisplayName("should throw when max attachments (20) reached")
        void shouldThrowWhenMaxAttachmentsReached() {
            // Given - link 20 attachments
            for (int i = 0; i < 20; i++) {
                purchaseRequest.linkAttachment(
                        "file" + i + ".pdf",
                        AllowedFileType.PDF,
                        1024L, // 1KB each, total 20KB
                        "path/file" + i + ".pdf",
                        LINKED_BY_ID
                );
            }
            assertThat(purchaseRequest.getAttachments()).hasSize(20);

            // When / Then - try to link 21st
            assertThatThrownBy(() -> purchaseRequest.linkAttachment(
                    "file20.pdf", AllowedFileType.PDF, 1024L,
                    "path/file20.pdf", LINKED_BY_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Maximum number of attachments (20) reached");
        }

        @Test
        @DisplayName("should throw when total size exceeds 20MB limit")
        void shouldThrowWhenTotalSizeExceedsLimit() {
            // Given - link attachment of 15MB
            long fifteenMB = 15 * 1024 * 1024;
            purchaseRequest.linkAttachment(
                    "large.pdf", AllowedFileType.PDF, fifteenMB,
                    "path/large.pdf", LINKED_BY_ID);

            // When / Then - try to link another 10MB (would exceed 20MB)
            long tenMB = 10 * 1024 * 1024;
            assertThatThrownBy(() -> purchaseRequest.linkAttachment(
                    "another.pdf", AllowedFileType.PDF, tenMB,
                    "path/another.pdf", LINKED_BY_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Total attachment size would exceed limit of 20MB");
        }

        @Test
        @DisplayName("should allow attachments up to exactly 20MB total")
        void shouldAllowAttachmentsUpToExactly20MB() {
            // Given - link attachment of exactly 20MB
            long twentyMB = 20 * 1024 * 1024;
            AttachmentReference ref = purchaseRequest.linkAttachment(
                    "exactly20mb.pdf", AllowedFileType.PDF, twentyMB,
                    "path/exactly20mb.pdf", LINKED_BY_ID);

            // Then
            assertThat(ref).isNotNull();
            assertThat(purchaseRequest.getAttachments()).hasSize(1);

            // And - cannot add even 1 more byte
            assertThatThrownBy(() -> purchaseRequest.linkAttachment(
                    "tiny.pdf", AllowedFileType.PDF, 1L,
                    "path/tiny.pdf", LINKED_BY_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Total attachment size would exceed limit of 20MB");
        }

        @Test
        @DisplayName("should allow adding attachments that sum to exactly 20MB")
        void shouldAllowAddingAttachmentsThatSumToExactly20MB() {
            // Given - link 10MB
            long tenMB = 10 * 1024 * 1024;
            purchaseRequest.linkAttachment(
                    "first10mb.pdf", AllowedFileType.PDF, tenMB,
                    "path/first10mb.pdf", LINKED_BY_ID);

            // When - add another 10MB (exactly 20MB total)
            AttachmentReference ref = purchaseRequest.linkAttachment(
                    "second10mb.pdf", AllowedFileType.PDF, tenMB,
                    "path/second10mb.pdf", LINKED_BY_ID);

            // Then
            assertThat(ref).isNotNull();
            assertThat(purchaseRequest.getAttachments()).hasSize(2);
        }
    }

    @Nested
    @DisplayName("findAttachmentById()")
    class FindAttachmentById {

        @Test
        @DisplayName("should find attachment by referenceId")
        void shouldFindAttachmentByReferenceId() {
            // Given
            AttachmentReference ref = purchaseRequest.linkAttachment(
                    "blueprint.pdf", AllowedFileType.PDF, 1024L,
                    "path/blueprint.pdf", LINKED_BY_ID);

            // When
            var found = purchaseRequest.findAttachmentById(ref.getReferenceId());

            // Then
            assertThat(found).isPresent();
            assertThat(found.get()).isEqualTo(ref);
        }

        @Test
        @DisplayName("should return empty when referenceId not found")
        void shouldReturnEmptyWhenNotFound() {
            // Given
            purchaseRequest.linkAttachment(
                    "blueprint.pdf", AllowedFileType.PDF, 1024L,
                    "path/blueprint.pdf", LINKED_BY_ID);

            // When
            var found = purchaseRequest.findAttachmentById("non-existent-id");

            // Then
            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("unlinkAttachment()")
    class UnlinkAttachment {

        @Test
        @DisplayName("should unlink attachment by referenceId")
        void shouldUnlinkAttachmentByReferenceId() {
            // Given
            AttachmentReference ref = purchaseRequest.linkAttachment(
                    "blueprint.pdf", AllowedFileType.PDF, 1024L,
                    "path/blueprint.pdf", LINKED_BY_ID);
            assertThat(purchaseRequest.getAttachments()).hasSize(1);

            // When
            purchaseRequest.unlinkAttachment(ref.getReferenceId());

            // Then
            assertThat(purchaseRequest.getAttachments()).isEmpty();
        }

        @Test
        @DisplayName("should do nothing when referenceId not found")
        void shouldDoNothingWhenNotFound() {
            // Given
            purchaseRequest.linkAttachment(
                    "blueprint.pdf", AllowedFileType.PDF, 1024L,
                    "path/blueprint.pdf", LINKED_BY_ID);
            assertThat(purchaseRequest.getAttachments()).hasSize(1);

            // When
            purchaseRequest.unlinkAttachment("non-existent-id");

            // Then - no change
            assertThat(purchaseRequest.getAttachments()).hasSize(1);
        }

        @Test
        @DisplayName("should allow relinking after unlinking (same storage path)")
        void shouldAllowRelinkingAfterUnlinking() {
            // Given
            String storagePath = "path/blueprint.pdf";
            AttachmentReference ref = purchaseRequest.linkAttachment(
                    "blueprint.pdf", AllowedFileType.PDF, 1024L,
                    storagePath, LINKED_BY_ID);

            // When - unlink
            purchaseRequest.unlinkAttachment(ref.getReferenceId());

            // Then - can relink same storage path
            AttachmentReference newRef = purchaseRequest.linkAttachment(
                    "blueprint.pdf", AllowedFileType.PDF, 1024L,
                    storagePath, LINKED_BY_ID);

            assertThat(newRef).isNotNull();
            assertThat(purchaseRequest.getAttachments()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getAttachments()")
    class GetAttachments {

        @Test
        @DisplayName("should return unmodifiable list")
        void shouldReturnUnmodifiableList() {
            // Given
            purchaseRequest.linkAttachment(
                    "blueprint.pdf", AllowedFileType.PDF, 1024L,
                    "path/blueprint.pdf", LINKED_BY_ID);

            // When / Then
            var attachments = purchaseRequest.getAttachments();
            assertThatThrownBy(() -> attachments.add(null))
                    .isInstanceOf(UnsupportedOperationException.class);
        }

        @Test
        @DisplayName("should return empty list when no attachments")
        void shouldReturnEmptyListWhenNoAttachments() {
            assertThat(purchaseRequest.getAttachments()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getItemName()")
    class GetItemName {

        @Test
        @DisplayName("should return service category name")
        void shouldReturnServiceCategoryName() {
            assertThat(purchaseRequest.getItemName()).isEqualTo("CNC Machining");
        }
    }
}
