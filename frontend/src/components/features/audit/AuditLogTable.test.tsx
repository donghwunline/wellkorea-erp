/**
 * Unit tests for AuditLogTable component.
 * Tests data fetching, table rendering, pagination, loading/error states, and accessibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type AuditLogFilters, AuditLogTable } from './AuditLogTable';
import type { AuditLogEntry, PaginatedAuditLogs } from '@/services/audit/types';
import { auditService } from '@/services';

// Mock auditService
vi.mock('@/services', () => ({
  auditService: {
    getAuditLogs: vi.fn(),
  },
}));

// Factory to create mock audit log entries
function createMockAuditLogEntry(overrides?: Partial<AuditLogEntry>): AuditLogEntry {
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

// Helper to create paginated response
function createPaginatedLogs(
  logs: AuditLogEntry[],
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
    it('should fetch audit logs on mount', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([]));

      renderTable();

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledOnce();
        expect(auditService.getAuditLogs).toHaveBeenCalledWith({
          page: 0,
          size: 10,
          sort: 'createdAt,desc',
          entityType: undefined,
          action: undefined,
        });
      });
    });

    it('should fetch logs with entityType filter', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([]));

      renderTable({ filters: { entityType: 'User' } });

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ entityType: 'User' })
        );
      });
    });

    it('should fetch logs with action filter', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([]));

      renderTable({ filters: { action: 'CREATE' } });

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'CREATE' })
        );
      });
    });

    it('should fetch logs with page parameter', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([]));

      renderTable({ page: 2 });

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    it('should refetch when page changes', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([]));

      const { rerender } = renderTable({ page: 0 });

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledTimes(1);
      });

      rerender(
        <AuditLogTable
          page={1}
          filters={defaultFilters}
          onPageChange={mockOnPageChange}
          onViewDetails={mockOnViewDetails}
        />
      );

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when filters change', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([]));

      const { rerender } = renderTable({ filters: {} });

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledTimes(1);
      });

      rerender(
        <AuditLogTable
          page={0}
          filters={{ entityType: 'User' }}
          onPageChange={mockOnPageChange}
          onViewDetails={mockOnViewDetails}
        />
      );

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state while fetching', async () => {
      let resolveLogs: (value: PaginatedAuditLogs) => void;
      vi.mocked(auditService.getAuditLogs).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveLogs = resolve;
          })
      );

      renderTable();

      expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();

      resolveLogs!(createPaginatedLogs([]));

      await waitFor(() => {
        expect(screen.queryByText('Loading audit logs...')).not.toBeInTheDocument();
      });
    });

    it('should render table header during loading', () => {
      vi.mocked(auditService.getAuditLogs).mockImplementation(() => new Promise(() => {}));

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
    it('should show error message when fetch fails', async () => {
      vi.mocked(auditService.getAuditLogs).mockRejectedValue(new Error('Network error'));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
      });
    });

    it('should call onError callback when fetch fails', async () => {
      vi.mocked(auditService.getAuditLogs).mockRejectedValue(new Error('Network error'));

      renderTable();

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to load audit logs');
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(auditService.getAuditLogs).mockRejectedValue(new Error('Network error'));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should refetch when retry is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(auditService.getAuditLogs).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(auditService.getAuditLogs).mockResolvedValueOnce(createPaginatedLogs([]));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(auditService.getAuditLogs).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('empty state', () => {
    it('should show empty message when no logs', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([]));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('No audit logs found.')).toBeInTheDocument();
      });
    });
  });

  describe('table rendering', () => {
    it('should render audit log data in table', async () => {
      const mockLog = createMockAuditLogEntry({
        entityType: 'User',
        entityId: 123,
        action: 'CREATE',
        username: 'admin',
        ipAddress: '192.168.1.1',
      });
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([mockLog]));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });
      expect(screen.getByText('CREATE')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('ID: 123')).toBeInTheDocument();
    });

    it('should render action badges with correct variants', async () => {
      const logs = [
        createMockAuditLogEntry({ id: 1, action: 'CREATE' }),
        createMockAuditLogEntry({ id: 2, action: 'UPDATE' }),
        createMockAuditLogEntry({ id: 3, action: 'DELETE' }),
      ];
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs(logs));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('CREATE')).toBeInTheDocument();
      });
      expect(screen.getByText('UPDATE')).toBeInTheDocument();
      expect(screen.getByText('DELETE')).toBeInTheDocument();
    });

    it('should format timestamp in Korean locale', async () => {
      const mockLog = createMockAuditLogEntry({
        createdAt: '2025-01-15T10:30:00Z',
      });
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([mockLog]));

      renderTable();

      await waitFor(() => {
        // Date is formatted in Korean locale (ko-KR)
        expect(screen.getByText(/2025/)).toBeInTheDocument();
      });
    });

    it('should show dash for null username', async () => {
      const mockLog = createMockAuditLogEntry({ username: null });
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([mockLog]));

      renderTable();

      await waitFor(() => {
        const dashes = screen.getAllByText('-');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });

    it('should show dash for null ipAddress', async () => {
      const mockLog = createMockAuditLogEntry({ ipAddress: null });
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([mockLog]));

      renderTable();

      await waitFor(() => {
        const dashes = screen.getAllByText('-');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });

    it('should not show entityId when null', async () => {
      const mockLog = createMockAuditLogEntry({ entityId: null });
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([mockLog]));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });
      expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
    });

    it('should render multiple logs', async () => {
      const logs = [
        createMockAuditLogEntry({ id: 1, username: 'admin', action: 'CREATE' }),
        createMockAuditLogEntry({ id: 2, username: 'finance', action: 'UPDATE' }),
        createMockAuditLogEntry({ id: 3, username: 'sales', action: 'VIEW' }),
      ];
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs(logs));

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
      expect(screen.getByText('finance')).toBeInTheDocument();
      expect(screen.getByText('sales')).toBeInTheDocument();
    });
  });

  describe('view details action', () => {
    it('should render view details button for each log', async () => {
      const mockLog = createMockAuditLogEntry();
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([mockLog]));

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
      });
    });

    it('should call onViewDetails when view details button is clicked', async () => {
      const user = userEvent.setup();
      const mockLog = createMockAuditLogEntry();
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(createPaginatedLogs([mockLog]));

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /view details/i }));

      expect(mockOnViewDetails).toHaveBeenCalledOnce();
      expect(mockOnViewDetails).toHaveBeenCalledWith(mockLog);
    });
  });

  describe('pagination', () => {
    it('should not render pagination when only one page', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(
        createPaginatedLogs([createMockAuditLogEntry()], { totalPages: 1 })
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });

      // Pagination should not be visible
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should render pagination when multiple pages', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(
        createPaginatedLogs([createMockAuditLogEntry()], { totalPages: 3, totalElements: 30 })
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });

      // Look for pagination elements - the Pagination component shows item counts
      expect(screen.getByText(/of 30/i)).toBeInTheDocument();
    });
  });

  describe('table header', () => {
    it('should render all column headers', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(
        createPaginatedLogs([createMockAuditLogEntry()])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
      });
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Entity')).toBeInTheDocument();
      // 'User' appears in both header and data, so check for multiple elements
      expect(screen.getAllByText('User').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('IP Address')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(
        createPaginatedLogs([createMockAuditLogEntry()])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should have view details button with aria-label', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(
        createPaginatedLogs([createMockAuditLogEntry()])
      );

      renderTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
      });
    });

    it('should have title attribute on view details button', async () => {
      vi.mocked(auditService.getAuditLogs).mockResolvedValue(
        createPaginatedLogs([createMockAuditLogEntry()])
      );

      renderTable();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /view details/i });
        expect(button).toHaveAttribute('title', 'View details');
      });
    });
  });
});
