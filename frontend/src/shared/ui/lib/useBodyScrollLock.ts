/**
 * Body scroll lock hook for overlays.
 * Internal utility for Modal and overlay components.
 *
 * Prevents body scrolling when an overlay (modal, drawer, etc.) is open,
 * ensuring users can only scroll within the overlay content.
 *
 * Features:
 * - Locks body scroll when active
 * - Restores original overflow value when deactivated
 * - Handles multiple overlays (last one wins)
 * - Zero dependencies
 */

import { useEffect } from 'react';

/**
 * Locks body scrolling when active
 *
 * Prevents the page from scrolling in the background when an overlay is open.
 * Automatically restores the original overflow style when deactivated.
 *
 * @param isLocked - Whether to lock body scroll
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    // Store original overflow value
    const originalOverflow = document.body.style.overflow;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Cleanup: Restore original overflow
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLocked]);
}
