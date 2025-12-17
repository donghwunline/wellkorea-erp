/**
 * Focus trap hook for accessible overlays
 *
 * Traps keyboard focus within a container element, ensuring users can't
 * accidentally tab out of modal dialogs, drawers, or other overlay components.
 *
 * Features:
 * - Auto-focuses first focusable element when activated
 * - Traps Tab/Shift+Tab navigation within container
 * - Restores focus to previously focused element when deactivated
 * - Handles edge cases (no focusable elements, dynamic content)
 *
 * @example
 * ```tsx
 * function Dialog({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap(isOpen);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={trapRef} role="dialog">
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" />
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef, type RefObject } from 'react';

export interface UseFocusTrapOptions {
  /**
   * Auto-focus first focusable element when trap activates
   * @default true
   */
  autoFocus?: boolean;
  /**
   * Restore focus to previously focused element when trap deactivates
   * @default true
   */
  restoreFocus?: boolean;
}

/**
 * Traps keyboard focus within a container element
 *
 * @param isActive - Whether the focus trap is currently active
 * @param options - Configuration options
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean,
  options: UseFocusTrapOptions = {},
): RefObject<T | null> {
  const { autoFocus = true, restoreFocus = true } = options;
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Get all focusable elements within container
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    // If no focusable elements, nothing to do
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Auto-focus first element if enabled
    if (autoFocus) {
      firstElement?.focus();
    }

    // Handle Tab key for focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: Moving backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Moving forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab as EventListener);

    // Cleanup: Remove event listener and restore focus
    return () => {
      container.removeEventListener('keydown', handleTab as EventListener);

      if (restoreFocus && previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [isActive, autoFocus, restoreFocus]);

  return containerRef;
}
