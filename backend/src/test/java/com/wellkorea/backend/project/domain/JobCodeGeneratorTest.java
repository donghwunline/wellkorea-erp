package com.wellkorea.backend.project.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class JobCodeGeneratorTest {

    @Mock
    private JobCodeSequenceProvider mockSequenceProvider;

    private JobCodeGenerator jobCodeGenerator;

    @BeforeEach
    void setUp() {
        jobCodeGenerator = new JobCodeGenerator(mockSequenceProvider);
    }

    @Test
    void shouldGenerateJobCodeWithCorrectFormat() {
        // Given
        LocalDate date = LocalDate.of(2025, 1, 4);
        when(mockSequenceProvider.getNextSequence("25")).thenReturn(1);

        // When
        String jobCode = jobCodeGenerator.generateJobCode(date);

        // Then
        assertThat(jobCode).isEqualTo("WK2K25-0001-0104");
    }

    @Test
    void shouldZeroPadSequenceNumber() {
        // Given
        LocalDate date = LocalDate.of(2025, 1, 4);
        when(mockSequenceProvider.getNextSequence("25")).thenReturn(42);

        // When
        String jobCode = jobCodeGenerator.generateJobCode(date);

        // Then
        assertThat(jobCode).isEqualTo("WK2K25-0042-0104");
    }

    @Test
    void shouldHandleLargeSequenceNumbers() {
        // Given
        LocalDate date = LocalDate.of(2025, 12, 31);
        when(mockSequenceProvider.getNextSequence("25")).thenReturn(9999);

        // When
        String jobCode = jobCodeGenerator.generateJobCode(date);

        // Then
        assertThat(jobCode).isEqualTo("WK2K25-9999-1231");
    }

    @Test
    void shouldValidateCorrectJobCode() {
        // Given
        String validJobCode = "WK2K25-0001-0104";

        // When
        boolean isValid = jobCodeGenerator.isValidJobCode(validJobCode);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    void shouldRejectInvalidJobCodeFormats() {
        // Given / When / Then
        assertThat(jobCodeGenerator.isValidJobCode(null)).isFalse();
        assertThat(jobCodeGenerator.isValidJobCode("")).isFalse();
        assertThat(jobCodeGenerator.isValidJobCode("INVALID")).isFalse();
        assertThat(jobCodeGenerator.isValidJobCode("WK2K25-1-0104")).isFalse(); // Sequence too short
        assertThat(jobCodeGenerator.isValidJobCode("WK2K25-0001-01")).isFalse(); // Date too short
        assertThat(jobCodeGenerator.isValidJobCode("WK225-0001-0104")).isFalse(); // Missing K in prefix
        assertThat(jobCodeGenerator.isValidJobCode("WK2K2025-0001-0104")).isFalse(); // Year too long
    }

    @Test
    void shouldExtractYearFromJobCode() {
        // Given
        String jobCode = "WK2K25-0123-0104";

        // When
        String year = jobCodeGenerator.extractYear(jobCode);

        // Then
        assertThat(year).isEqualTo("25");
    }

    @Test
    void shouldExtractSequenceFromJobCode() {
        // Given
        String jobCode = "WK2K25-0123-0104";

        // When
        int sequence = jobCodeGenerator.extractSequence(jobCode);

        // Then
        assertThat(sequence).isEqualTo(123);
    }

    @Test
    void shouldExtractDateFromJobCode() {
        // Given
        String jobCode = "WK2K25-0123-0104";

        // When
        LocalDate date = jobCodeGenerator.extractDate(jobCode);

        // Then
        assertThat(date).isEqualTo(LocalDate.of(2025, 1, 4));
    }

    @Test
    void shouldThrowExceptionWhenExtractingFromInvalidJobCode() {
        // Given
        String invalidJobCode = "INVALID";

        // When / Then
        assertThatThrownBy(() -> jobCodeGenerator.extractYear(invalidJobCode))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid JobCode format");

        assertThatThrownBy(() -> jobCodeGenerator.extractSequence(invalidJobCode))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid JobCode format");

        assertThatThrownBy(() -> jobCodeGenerator.extractDate(invalidJobCode))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid JobCode format");
    }
}
