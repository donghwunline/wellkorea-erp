/**
 * UI Components Library
 *
 * Organized by functional categories:
 * - primitives/    - Atomic building blocks (Button, Input, Badge, etc.)
 * - forms/         - Form-specific components (FormField, DatePicker, Combobox)
 * - feedback/      - User feedback and status (Alert, LoadingState, etc.)
 * - data-display/  - Data presentation (Table, Card, StatCard)
 * - navigation/    - Navigation and filtering (Pagination, SearchBar, FilterBar)
 * - modals/        - Modal dialogs (Modal, ConfirmationModal)
 * - layout/        - Page structure (PageHeader)
 *
 * Internal utilities (lib/) are used internally by UI components.
 * For className utility, import cn from @/shared/lib/cn.
 */

// ============================================================================
// Primitives - Atomic building blocks
// ============================================================================

export { Badge } from './primitives/Badge';
export type { BadgeProps, BadgeVariant } from './primitives/Badge';

export { Button } from './primitives/Button';
export type { ButtonProps } from './primitives/Button';

export { Icon } from './primitives/Icon';
export type { IconName } from './primitives/Icon';

export { IconButton } from './primitives/IconButton';
export type { IconButtonProps, IconButtonVariant } from './primitives/IconButton';

export { Input } from './primitives/Input';
export type { InputProps } from './primitives/Input';

export { Spinner } from './primitives/Spinner';
export type { SpinnerProps } from './primitives/Spinner';

// ============================================================================
// Forms - Form-specific components
// ============================================================================

export { FormField } from './forms/FormField';
export type { FormFieldProps } from './forms/FormField';

export { DatePicker } from './forms/DatePicker';
export type { DatePickerProps, DateRange } from './forms/DatePicker';

export { Combobox } from './forms/Combobox';
export type { ComboboxProps, ComboboxOption } from './forms/Combobox';

// ============================================================================
// Feedback - User feedback and status indicators
// ============================================================================

export { Alert } from './feedback/Alert';
export type { AlertProps, AlertVariant } from './feedback/Alert';

export { EmptyState } from './feedback/EmptyState';
export type { EmptyStateProps, EmptyStateVariant } from './feedback/EmptyState';

export { ErrorAlert } from './feedback/ErrorAlert';
export type { ErrorAlertProps } from './feedback/ErrorAlert';

export { LoadingState } from './feedback/LoadingState';
export type { LoadingStateProps, LoadingStateVariant } from './feedback/LoadingState';

// ============================================================================
// Data Display - Data presentation components
// ============================================================================

export { Card } from './data-display/Card';
export type { CardProps, CardVariant } from './data-display/Card';

export { StatCard } from './data-display/StatCard';
export type { StatCardProps } from './data-display/StatCard';

export { Table } from './data-display/Table';
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
} from './data-display/Table';

// ============================================================================
// Navigation - Navigation, search, filtering, and tabs
// ============================================================================

export { FilterBar } from './navigation/FilterBar';
export type { FilterBarProps, FilterFieldProps, FilterSelectProps } from './navigation/FilterBar';

export { Pagination } from './navigation/Pagination';
export type { PaginationProps } from './navigation/Pagination';

export { SearchBar } from './navigation/SearchBar';
export type { SearchBarProps } from './navigation/SearchBar';

export { Tabs, TabList, Tab, TabPanel } from './navigation/Tabs';
export type { TabsProps, TabListProps, TabProps, TabPanelProps } from './navigation/Tabs';

export { TabOverflow } from './navigation/TabOverflow';
export type { TabOverflowProps, TabOverflowItemProps } from './navigation/TabOverflow';

export { Navigation } from './navigation/Navigation';
export type {
  NavigationProps,
  NavigationSectionProps,
  NavigationLinkProps,
} from './navigation/Navigation';

// ============================================================================
// Modals - Modal dialogs and confirmations
// ============================================================================

export { ConfirmationModal } from './modals/ConfirmationModal';
export type { ConfirmationModalProps } from './modals/ConfirmationModal';

export { Modal } from './modals/Modal';
export type { ModalProps } from './modals/Modal';

export { ModalActions } from './modals/ModalActions';
export type { ModalActionsProps } from './modals/ModalActions';

// ============================================================================
// Layout - Page structure components
// ============================================================================

export { PageHeader } from './layout/PageHeader';
export type { PageHeaderProps, PageHeaderTitleProps, PageHeaderActionsProps } from './layout/PageHeader';
