/**
 * Pagination component for paginated lists
 *
 * Features:
 * - Previous/Next navigation
 * - Item range info display
 * - Disabled states for first/last page
 * - Customizable item label
 *
 * Usage:
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalItems={pagination.totalElements}
 *   itemsPerPage={pagination.size}
 *   onPageChange={setPage}
 *   isFirst={pagination.first}
 *   isLast={pagination.last}
 *   itemLabel="users"
 * />
 * ```
 */

import { cn } from '@/shared/utils';

export interface PaginationProps {
  /** Current page (0-indexed) */
  currentPage: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  itemsPerPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Is this the first page? */
  isFirst: boolean;
  /** Is this the last page? */
  isLast: boolean;
  /** Optional label for items (e.g., "users", "entries") */
  itemLabel?: string;
  /** Show item range info */
  showInfo?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function Pagination({
                             currentPage,
                             totalItems,
                             itemsPerPage,
                             onPageChange,
                             isFirst,
                             isLast,
                             itemLabel = 'entries',
                             showInfo = true,
                             className,
                           }: Readonly<PaginationProps>) {
  const startItem = currentPage * itemsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (!isFirst) {
      onPageChange(Math.max(0, currentPage - 1));
    }
  };

  const handleNext = () => {
    if (!isLast) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex items-center justify-between border-t border-steel-800/50 bg-steel-900/80 px-6 py-3',
        className,
      )}
    >
      {showInfo && (
        <div className="text-sm text-steel-400">
          Showing {startItem} - {endItem} of {totalItems} {itemLabel}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handlePrevious}
          disabled={isFirst}
          aria-label="Go to previous page"
          className="rounded-lg border border-steel-700/50 px-3 py-1.5 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={isLast}
          aria-label="Go to next page"
          className="rounded-lg border border-steel-700/50 px-3 py-1.5 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
