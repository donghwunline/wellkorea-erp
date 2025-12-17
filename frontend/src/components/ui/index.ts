/**
 * UI Components Library
 *
 * Organized by functional categories:
 * - primitives/    - Atomic building blocks (Button, Input, Badge, etc.)
 * - forms/         - Form-specific components (FormField)
 * - feedback/      - User feedback and status (Alert, LoadingState, etc.)
 * - data-display/  - Data presentation (Table, Card, StatCard)
 * - navigation/    - Navigation and filtering (Pagination, SearchBar, FilterBar)
 * - modals/        - Modal dialogs (Modal, ConfirmationModal)
 * - layout/        - Page structure (PageHeader)
 *
 * Note: UI hooks (useFocusTrap, useBodyScrollLock) are in @/shared/hooks
 * Note: cn utility is in @/shared/utils
 */

// Primitives - Atomic building blocks
export * from './primitives';

// Forms - Form-specific components
export * from './forms';

// Feedback - User feedback and status indicators
export * from './feedback';

// Data Display - Data presentation components
export * from './data-display';

// Navigation - Navigation, search, and filtering
export * from './navigation';

// Modals - Modal dialogs and confirmations
export * from './modals';

// Layout - Page structure components
export * from './layout';
