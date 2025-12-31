/**
 * Internal UI library utilities.
 *
 * These are internal utilities for UI components and should not be
 * exported from the main shared/ui barrel. Components in shared/ui
 * can import directly from this module.
 */

export { cn } from './cn';
export { useFocusTrap, type UseFocusTrapOptions } from './useFocusTrap';
export { useBodyScrollLock } from './useBodyScrollLock';
