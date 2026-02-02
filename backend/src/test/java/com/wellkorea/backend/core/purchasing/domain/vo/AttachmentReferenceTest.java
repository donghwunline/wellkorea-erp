package com.wellkorea.backend.core.purchasing.domain.vo;

import com.wellkorea.backend.core.production.domain.AllowedFileType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for AttachmentReference value object.
 * Tests the link() factory method validation rules.
 */
@Tag("unit")
@DisplayName("AttachmentReference")
class AttachmentReferenceTest {

    private static final String VALID_FILE_NAME = "blueprint.pdf";
    private static final AllowedFileType VALID_FILE_TYPE = AllowedFileType.PDF;
    private static final long VALID_FILE_SIZE = 1024L;
    private static final String VALID_STORAGE_PATH = "projects/123/blueprints/blueprint.pdf";
    private static final Long VALID_LINKED_BY_ID = 1L;

    @Nested
    @DisplayName("link() factory method")
    class LinkFactoryMethod {

        @Test
        @DisplayName("should create reference with valid inputs")
        void shouldCreateWithValidInputs() {
            // When
            AttachmentReference ref = AttachmentReference.link(
                    VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                    VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

            // Then
            assertThat(ref.getReferenceId()).isNotNull();
            assertThat(ref.getReferenceId()).hasSize(36); // UUID format
            assertThat(ref.getFileName()).isEqualTo(VALID_FILE_NAME);
            assertThat(ref.getFileType()).isEqualTo(VALID_FILE_TYPE);
            assertThat(ref.getFileSize()).isEqualTo(VALID_FILE_SIZE);
            assertThat(ref.getStoragePath()).isEqualTo(VALID_STORAGE_PATH);
            assertThat(ref.getLinkedById()).isEqualTo(VALID_LINKED_BY_ID);
            assertThat(ref.getLinkedAt()).isNotNull();
        }

        @Nested
        @DisplayName("Null checks")
        class NullChecks {

            @Test
            @DisplayName("should throw NullPointerException when fileName is null")
            void shouldThrowWhenFileNameIsNull() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        null, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID))
                        .isInstanceOf(NullPointerException.class)
                        .hasMessageContaining("fileName must not be null");
            }

            @Test
            @DisplayName("should throw NullPointerException when fileType is null")
            void shouldThrowWhenFileTypeIsNull() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, null, VALID_FILE_SIZE,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID))
                        .isInstanceOf(NullPointerException.class)
                        .hasMessageContaining("fileType must not be null");
            }

            @Test
            @DisplayName("should throw NullPointerException when storagePath is null")
            void shouldThrowWhenStoragePathIsNull() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        null, VALID_LINKED_BY_ID))
                        .isInstanceOf(NullPointerException.class)
                        .hasMessageContaining("storagePath must not be null");
            }

            @Test
            @DisplayName("should throw NullPointerException when linkedById is null")
            void shouldThrowWhenLinkedByIdIsNull() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        VALID_STORAGE_PATH, null))
                        .isInstanceOf(NullPointerException.class)
                        .hasMessageContaining("linkedById must not be null");
            }
        }

        @Nested
        @DisplayName("Blank checks")
        class BlankChecks {

            @Test
            @DisplayName("should throw IllegalArgumentException when fileName is blank")
            void shouldThrowWhenFileNameIsBlank() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        "   ", VALID_FILE_TYPE, VALID_FILE_SIZE,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("fileName cannot be blank");
            }

            @Test
            @DisplayName("should throw IllegalArgumentException when fileName is empty")
            void shouldThrowWhenFileNameIsEmpty() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        "", VALID_FILE_TYPE, VALID_FILE_SIZE,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("fileName cannot be blank");
            }

            @Test
            @DisplayName("should throw IllegalArgumentException when storagePath is blank")
            void shouldThrowWhenStoragePathIsBlank() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        "   ", VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("storagePath cannot be blank");
            }

            @Test
            @DisplayName("should throw IllegalArgumentException when storagePath is empty")
            void shouldThrowWhenStoragePathIsEmpty() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        "", VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("storagePath cannot be blank");
            }
        }

        @Nested
        @DisplayName("Length validation")
        class LengthValidation {

            @Test
            @DisplayName("should throw when fileName exceeds 255 characters")
            void shouldThrowWhenFileNameExceedsMaxLength() {
                String longFileName = "a".repeat(256);

                assertThatThrownBy(() -> AttachmentReference.link(
                        longFileName, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("fileName exceeds maximum length of 255 characters");
            }

            @Test
            @DisplayName("should accept fileName at exactly 255 characters")
            void shouldAcceptFileNameAtMaxLength() {
                String maxFileName = "a".repeat(255);

                AttachmentReference ref = AttachmentReference.link(
                        maxFileName, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

                assertThat(ref.getFileName()).hasSize(255);
            }

            @Test
            @DisplayName("should throw when storagePath exceeds 500 characters")
            void shouldThrowWhenStoragePathExceedsMaxLength() {
                String longPath = "path/" + "a".repeat(496);

                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        longPath, VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("storagePath exceeds maximum length of 500 characters");
            }

            @Test
            @DisplayName("should accept storagePath at exactly 500 characters")
            void shouldAcceptStoragePathAtMaxLength() {
                String maxPath = "a".repeat(500);

                AttachmentReference ref = AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                        maxPath, VALID_LINKED_BY_ID);

                assertThat(ref.getStoragePath()).hasSize(500);
            }
        }

        @Nested
        @DisplayName("File size validation")
        class FileSizeValidation {

            @Test
            @DisplayName("should throw when fileSize is zero")
            void shouldThrowWhenFileSizeIsZero() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, 0L,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("fileSize must be positive");
            }

            @Test
            @DisplayName("should throw when fileSize is negative")
            void shouldThrowWhenFileSizeIsNegative() {
                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, -1L,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("fileSize must be positive");
            }

            @Test
            @DisplayName("should throw when fileSize exceeds 50MB")
            void shouldThrowWhenFileSizeExceeds50MB() {
                long fiftyMBPlusOne = 52_428_800L + 1;

                assertThatThrownBy(() -> AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, fiftyMBPlusOne,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID))
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessageContaining("fileSize exceeds maximum allowed (50MB)");
            }

            @Test
            @DisplayName("should accept fileSize at exactly 50MB")
            void shouldAcceptFileSizeAtMax() {
                long fiftyMB = 52_428_800L;

                AttachmentReference ref = AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, fiftyMB,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

                assertThat(ref.getFileSize()).isEqualTo(fiftyMB);
            }

            @Test
            @DisplayName("should accept minimum positive fileSize")
            void shouldAcceptMinimumPositiveFileSize() {
                AttachmentReference ref = AttachmentReference.link(
                        VALID_FILE_NAME, VALID_FILE_TYPE, 1L,
                        VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

                assertThat(ref.getFileSize()).isEqualTo(1L);
            }
        }
    }

    @Nested
    @DisplayName("getFormattedFileSize()")
    class GetFormattedFileSize {

        @Test
        @DisplayName("should format bytes correctly")
        void shouldFormatBytes() {
            AttachmentReference ref = AttachmentReference.link(
                    VALID_FILE_NAME, VALID_FILE_TYPE, 512L,
                    VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

            assertThat(ref.getFormattedFileSize()).isEqualTo("512 B");
        }

        @Test
        @DisplayName("should format kilobytes correctly")
        void shouldFormatKilobytes() {
            AttachmentReference ref = AttachmentReference.link(
                    VALID_FILE_NAME, VALID_FILE_TYPE, 2560L,
                    VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

            assertThat(ref.getFormattedFileSize()).isEqualTo("2.5 KB");
        }

        @Test
        @DisplayName("should format megabytes correctly")
        void shouldFormatMegabytes() {
            AttachmentReference ref = AttachmentReference.link(
                    VALID_FILE_NAME, VALID_FILE_TYPE, 5_242_880L,
                    VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

            assertThat(ref.getFormattedFileSize()).isEqualTo("5 MB");
        }
    }

    @Nested
    @DisplayName("Equals and HashCode")
    class EqualsAndHashCode {

        @Test
        @DisplayName("two references with different referenceIds should not be equal")
        void shouldNotBeEqualWithDifferentIds() {
            AttachmentReference ref1 = AttachmentReference.link(
                    VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                    VALID_STORAGE_PATH, VALID_LINKED_BY_ID);
            AttachmentReference ref2 = AttachmentReference.link(
                    VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                    VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

            // Each call to link() generates a new UUID
            assertThat(ref1).isNotEqualTo(ref2);
            assertThat(ref1.hashCode()).isNotEqualTo(ref2.hashCode());
        }

        @Test
        @DisplayName("same reference should be equal to itself")
        void shouldBeEqualToSelf() {
            AttachmentReference ref = AttachmentReference.link(
                    VALID_FILE_NAME, VALID_FILE_TYPE, VALID_FILE_SIZE,
                    VALID_STORAGE_PATH, VALID_LINKED_BY_ID);

            assertThat(ref).isEqualTo(ref);
            assertThat(ref.hashCode()).isEqualTo(ref.hashCode());
        }
    }
}
