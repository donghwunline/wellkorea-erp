/**
 * Date utility functions for domain models.
 *
 * All domain models store dates as ISO strings for React Query serialization.
 * These utilities handle parsing and formatting for display/comparison.
 *
 * Key design decisions:
 * - Dates as strings in domain models (not Date objects)
 * - Parse only when needed for calculations/display
 * - Optional `now` parameter for testability
 */

/**
 * Parse ISO date string (LocalDate from backend: "2025-01-15").
 * Returns Date object for comparison/calculation.
 */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parse ISO datetime string (LocalDateTime from backend: "2025-01-15T10:30:00").
 *
 * Browser behavior varies for datetime strings without timezone:
 * - Some treat as local time
 * - Some treat as UTC
 *
 * This function assumes server sends KST time without offset.
 * If server includes offset, parsing is straightforward.
 */
export function parseLocalDateTime(isoDateTime: string): Date {
  // If server includes offset (e.g., "2025-01-15T10:30:00+09:00"), use directly
  if (isoDateTime.includes('+') || isoDateTime.endsWith('Z')) {
    return new Date(isoDateTime);
  }

  // Server sends without offset - assume KST (+09:00)
  // Append KST offset to ensure consistent parsing across browsers
  return new Date(isoDateTime + '+09:00');
}

/**
 * Date format patterns.
 * - 'YYYY-MM-DD' - ISO format (2025-01-15)
 * - 'YYYY-MM-DD HH:mm' - ISO with time (2025-01-15 10:30)
 * - 'ko-short' - Korean short format (2025년 1월 15일)
 * - 'ko-long' - Korean long format (2025년 1월 15일 오전 10:30)
 */
export type DateFormat = 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm' | 'ko-short' | 'ko-long';

/**
 * Format date for display.
 *
 * For string inputs, distinguishes between:
 * - LocalDate ("2025-01-15") - use parseLocalDate()
 * - LocalDateTime ("2025-01-15T10:30:00") - use parseLocalDateTime()
 *
 * @param date - Date to format (Date object or ISO string)
 * @param format - Format pattern (default: 'YYYY-MM-DD')
 */
export function formatDate(date: Date | string | null, format: DateFormat = 'YYYY-MM-DD'): string {
  if (!date) return '-';

  let d: Date;

  if (typeof date === 'string') {
    // LocalDate format: exactly 10 chars (YYYY-MM-DD)
    if (date.length === 10) {
      d = parseLocalDate(date);
    } else {
      // LocalDateTime format
      d = parseLocalDateTime(date);
    }
  } else {
    d = date;
  }

  switch (format) {
    case 'YYYY-MM-DD':
      return d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\. /g, '-').replace(/\./g, '');

    case 'YYYY-MM-DD HH:mm':
      return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).replace(/\. /g, '-').replace(/\./g, ' ').trim();

    case 'ko-short':
      return d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'ko-long':
      return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    default:
      return d.toLocaleDateString('ko-KR');
  }
}

/**
 * Format datetime for display (localized).
 */
export function formatDateTime(date: Date | string, locale = 'ko-KR'): string {
  let d: Date;

  if (typeof date === 'string') {
    d = date.length === 10 ? parseLocalDate(date) : parseLocalDateTime(date);
  } else {
    d = date;
  }

  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if date is in the past (for expiry checks).
 *
 * @param date - Date to check
 * @param now - Current time for comparison (optional, for testing)
 */
export function isPast(date: Date | string, now: Date = new Date()): boolean {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Get current date/time.
 * Use this instead of new Date() directly for testability.
 * Can be mocked in tests.
 */
export function getNow(): Date {
  return new Date();
}

/**
 * Calculate days between two dates.
 *
 * @param date - Target date
 * @param now - Reference date (optional, for testing)
 */
export function daysBetween(date: Date | string, now: Date = new Date()): number {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffTime = d.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
