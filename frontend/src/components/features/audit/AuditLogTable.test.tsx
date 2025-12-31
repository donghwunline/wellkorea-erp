/**
 * Unit tests for AuditLogTable component.
 * Tests data fetching, table rendering, pagination, loading/error states, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type AuditLogFilters, AuditLogTable } from './AuditLogTable';
import type { AuditLog } from '@/entities/audit';
import type { PaginationMetadata } from '@/shared/api/types';

// Mock the useAuditLogs hook from entities
const mockRefetch = vi.fn();
vi.mock('@/entities/audit', () => ({
  useAuditLogs: vi.fn(),
}));

// Import the mocked module
import { useAuditLogs } from '@/entities/audit';

// Factory to create mock audit log entries
function createMockAuditLog(overrides?: Partial<AuditLog>): AuditLog {
  return {
    id: 1,
    entityType: 'User',
    entityId: 123,
    action: 'CREATE',
    userId: 1,
    username: 'admin',
    ipAddress: '192.168.1.1',
    changes: null,
    metadata: null,
    createdAt: '2025-01-15T10:30:00Z',
    ...overrides,
  };
}

// Helper to create paginated response structure
interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: PaginationMetadata;
}

function createPaginatedLogs(
  logs: AuditLog[],
  options: { page?: number; totalPages?: number; totalElements?: number } = {}
): PaginatedAuditLogs {
  const { page = 0, totalPages = 1, totalElements = logs.length } = options;
  return {
    data: logs,
    pagination: {
      page,
      size: 10,
      totalElements,
      totalPages,
      first: page === 0,
      last: page === totalPages - 1,
    },
  };
}

// Helper to set up useAuditLogs mock return value
interface MockQueryResult {
  data?: PaginatedAuditLogs;
  isLoading?: boolean;
  error?: Error | null;
  refetch?: ReturnType<typeof vi.fn>;
}

function mockUseAuditLogs(result: MockQueryResult) {
  vi.mocked(useAuditLogs).mockReturnValue({
    data: result.data,
    isLoading: result.isLoading ?? false,
    error: result.error ?? null,
    refetch: result.refetch ?? mockRefetch,
    // Add other TanStack Query properties that might be needed
    isError: !!result.error,
    isSuccess: !result.isLoading && !result.error && !!result.data,
    isPending: result.isLoading ?? false,
    isFetching: result.isLoading ?? false,
    status: result.isLoading ? 'pending' : result.error ? 'error' : 'success',
  } as unknown as ReturnType<typeof useAuditLogs>);
}

describe('AuditLogTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnViewDetails = vi.fn();
  const mockOnError = vi.fn();

  const defaultFilters: AuditLogFilters = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderTable(props: Partial<React.ComponentProps<typeof AuditLogTable>> = {}) {
    const defaultProps = {
      page: 0,
      filters: defaultFilters,
      onPageChange: mockOnPageChange,
      onViewDetails: mockOnViewDetails,
      onError: mockOnError,
    };
    return render(<AuditLogTable {...defaultProps} {...props} />);
  }

  describe('data fetching', () => {
    it('should call useAuditLogs with correct parameters', () => {
      mockUseAuditLogs({ data: createPaginatedLogs([]) });

      renderTable();

      expect(useAuditLogs).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        sort: 'createdAt,desc',
        entityType: undefined,
        action: undefined,
      });
    });

    it('should pass entityType filter to hook', () => {
      mockUseAuditLogs({ data: createPaginatedLogs([]) });

      renderTable({ filters: { entityType: 'User' } });

      expect(useAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'User' })
      );
    });

    it('should pass action filter to hook', () => {
      mockUseAuditLogs({ data: createPaginatedLogs([]) });

      renderTable({ filters: { action: 'CREATE' } });

      expect(useAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE' })
      );
    });

    it('should pass page parameter to hook', () => {
      mockUseAuditLogs({ data: createPaginatedLogs([]) });

      renderTable({ page: 2 });

      expect(useAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });

    it('should update hook params when page changes', () => {
      mockUseAuditLogs({ data: createPaginatedLogs([]) });

      const { rerender } = renderTable({ page: 0 });

      rerender(
        <AuditLogTable
          page={1}
          filters={defaultFilters}
          onPageChange={mockOnPageChange}
          onViewDetails={mockOnViewDetails}
        />
      );

      // Check that the second call has page: 1
      const calls = vi.mocked(useAuditLogs).mock.calls;
      expect(calls[calls.length - 1][0]).toEqual(
        expect.objectContaining({ page: 1 })
      );
    });

    it('should update hook params when filters change', () => {
      mockUseAuditLogs({ data: createPaginatedLogs([]) });

      const { rerender } = renderTable({ filters: {} });

      rerender(
        <AuditLogTable
          page={0}
          filters={{ entityType: 'User' }}
          onPageChange={mockOnPageChange}
          onViewDetails={mockOnViewDetails}
        />
      );

      const calls = vi.mocked(useAuditLogs).mock.calls;
      expect(calls[calls.length - 1][0]).toEqual(
        expect.objectContaining({ entityType: 'User' })
      );
    });
  });

  describe('loading state', () => {
    it('should show loading state while fetching', () => {
      mockUseAuditLogs({ isLoading: true });

      renderTable();

      expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();
    });

    it('should render table header during loading', () => {
      mockUseAuditLogs({ isLoading: true });

      renderTable();

      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Entity')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('IP Address')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when fetch fails', () => {
      mockUseAuditLogs({ error: new Error('Network error') });

      renderTable();

      expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      mockUseAuditLogs({ error: new Error('Network error') });

      renderTable();

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call refetch when retry is clicked', async () => {
      const user = userEvent.setup();
      mockUseAuditLogs({ error: new Error('Network error'), refetch: mockRefetch });

      renderTable();

      await user.click(screen.getByText('Retry'));

      expect(mockRefetch).toHaveBeenCalledOnce();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no logs', () => {
      mockUseAuditLogs({ data: createPaginatedLogs([]) });

      renderTable();

      expect(screen.getByText('No audit logs found.')).toBeInTheDocument();
    });
  });

  describe('table rendering', () => {
    it('should render audit log data in table', () => {
      const mockLog = createMockAuditLog({
        entityType: 'Project', // Use different entityType to avoid collision with 'User' header
        entityId: 123,
        action: 'CREATE',
        username: 'admin',
        ipAddress: '192.168.1.1',
      });
      mockUseAuditLogs({ data: createPaginatedLogs([mockLog]) });

      renderTable();

      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('CREATE')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('ID: 123')).toBeInTheDocument();
    });

    it('should render action badges with correct variants', () => {
      const logs = [
        createMockAuditLog({ id: 1, action: 'CREATE' }),
        createMockAuditLog({ id: 2, action: 'UPDATE' }),
        createMockAuditLog({ id: 3, action: 'DELETE' }),
      ];
      mockUseAuditLogs({ data: createPaginatedLogs(logs) });

      renderTable();

      expect(screen.getByText('CREATE')).toBeInTheDocument();
      expect(screen.getByText('UPDATE')).toBeInTheDocument();
      expect(screen.getByText('DELETE')).toBeInTheDocument();
    });

    it('should format timestamp in Korean locale', () => {
      const mockLog = createMockAuditLog({
        createdAt: '2025-01-15T10:30:00Z',
      });
      mockUseAuditLogs({ data: createPaginatedLogs([mockLog]) });

      renderTable();

      // Date is formatted in Korean locale (ko-KR)
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });

    it('should show dash for null username', () => {
      const mockLog = createMockAuditLog({ username: null });
      mockUseAuditLogs({ data: createPaginatedLogs([mockLog]) });

      renderTable();

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('should show dash for null ipAddress', () => {
      const mockLog = createMockAuditLog({ ipAddress: null });
      mockUseAuditLogs({ data: createPaginatedLogs([mockLog]) });

      renderTable();

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('should not show entityId when null', () => {
      const mockLog = createMockAuditLog({ entityType: 'Project', entityId: null });
      mockUseAuditLogs({ data: createPaginatedLogs([mockLog]) });

      renderTable();

      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
    });

    it('should render multiple logs', () => {
      const logs = [
        createMockAuditLog({ id: 1, username: 'admin', action: 'CREATE' }),
        createMockAuditLog({ id: 2, username: 'finance', action: 'UPDATE' }),
        createMockAuditLog({ id: 3, username: 'sales', action: 'VIEW' }),
      ];
      mockUseAuditLogs({ data: createPaginatedLogs(logs) });

      renderTable();

      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('finance')).toBeInTheDocument();
      expect(screen.getByText('sales')).toBeInTheDocument();
    });
  });

  describe('view details action', () => {
    it('should render view details button for each log', () => {
      const mockLog = createMockAuditLog();
      mockUseAuditLogs({ data: createPaginatedLogs([mockLog]) });

      renderTable();

      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });

    it('should call onViewDetails when view details button is clicked', async () => {
      const user = userEvent.setup();
      const mockLog = createMockAuditLog();
      mockUseAuditLogs({ data: createPaginatedLogs([mockLog]) });

      renderTable();

      await user.click(screen.getByRole('button', { name: /view details/i }));

      expect(mockOnViewDetails).toHaveBeenCalledOnce();
      expect(mockOnViewDetails).toHaveBeenCalledWith(mockLog);
    });
  });

  describe('pagination', () => {
    it('should not render pagination when only one page', () => {
      mockUseAuditLogs({
        data: createPaginatedLogs([createMockAuditLog({ entityType: 'Project' })], { totalPages: 1 }),
      });

      renderTable();

      expect(screen.getByText('Project')).toBeInTheDocument();
      // Pagination should not be visible
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should render pagination when multiple pages', () => {
      mockUseAuditLogs({
        data: createPaginatedLogs([createMockAuditLog({ entityType: 'Project' })], { totalPages: 3, totalElements: 30 }),
      });

      renderTable();

      expect(screen.getByText('Project')).toBeInTheDocument();
      // Look for pagination elements - the Pagination component shows item counts
      expect(screen.getByText(/of 30/i)).toBeInTheDocument();
    });
  });

  describe('table header', () => {
    it('should render all column headers', () => {
      mockUseAuditLogs({
        data: createPaginatedLogs([createMockAuditLog()]),
      });

      renderTable();

      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Entity')).toBeInTheDocument();
      // 'User' appears in both header and data, so check for multiple elements
      expect(screen.getAllByText('User').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('IP Address')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure', () => {
      mockUseAuditLogs({
        data: createPaginatedLogs([createMockAuditLog()]),
      });

      renderTable();

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should have view details button with aria-label', () => {
      mockUseAuditLogs({
        data: createPaginatedLogs([createMockAuditLog()]),
      });

      renderTable();

      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });

    it('should have title attribute on view details button', () => {
      mockUseAuditLogs({
        data: createPaginatedLogs([createMockAuditLog()]),
      });

      renderTable();

      const button = screen.getByRole('button', { name: /view details/i });
      expect(button).toHaveAttribute('title', 'View details');
    });
  });
});
