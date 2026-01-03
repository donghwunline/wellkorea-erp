/**
 * Internal UI library utilities.
 *
 * These are internal utilities for UI components and should not be
 * exported from the main shared/ui barrel. Components in shared/ui
 * can import directly from this module.
 */

// Re-export cn from shared/lib for internal UI component use
export { cn } from '@/shared/lib';

// Internal hooks for modal/overlay components
export { useFocusTrap, type UseFocusTrapOptions } from './useFocusTrap';
export { useBodyScrollLock } from './useBodyScrollLock';
