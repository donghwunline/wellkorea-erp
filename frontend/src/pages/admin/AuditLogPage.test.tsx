/**
 * Unit tests for AuditLogPage component.
 *
 * FSD pattern - tests page as composition layer:
 * - Entity components (AuditLogTable) are mocked
 * - Query Factory (auditQueries) is mocked via useQuery
 * - Focus on filter state, detail modal, and page-level interactions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AuditLogPage } from './AuditLogPage';
import type { AuditLog } from '@/entities/audit';

// Sample audit log entry for testing
const mockAuditLogEntry: AuditLog = {
  id: 1,
  action: 'CREATE',
  entityType: 'User',
  entityId: 123,
  userId: 1,
  username: 'admin',
  ipAddress: '192.168.1.1',
  changes: '{"field": "value"}',
  metadata: '{"key": "meta"}',
  createdAt: '2025-01-15T10:30:00Z',
};

const mockAuditLogEntryMinimal: AuditLog = {
  id: 2,
  action: 'LOGIN',
  entityType: 'Session',
  entityId: null,
  userId: null,
  username: 'user',
  ipAddress: null,
  changes: null,
  metadata: null,
  createdAt: '2025-01-15T11:00:00Z',
};

// Track props passed to mocked components
let auditTableProps: Record<string, unknown> = {};

// Mock useQuery
const mockRefetch = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: {
      data: [mockAuditLogEntry, mockAuditLogEntryMinimal],
      pagination: {
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      },
    },
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })),
}));

// Mock entity exports
vi.mock('@/entities/audit', () => ({
  auditQueries: {
    list: vi.fn(() => ({ queryKey: ['audit', 'list'] })),
  },
  AuditLogTable: vi.fn((props: Record<string, unknown>) => {
    auditTableProps = props;
    const logs = props.logs as AuditLog[];
    return (
      <div data-testid="audit-log-table">
        {logs.map(log => (
          <button
            key={log.id}
            data-testid={`view-details-${log.id}`}
            onClick={() => (props.onViewDetails as (entry: AuditLog) => void)(log)}
          >
            View {log.action}
          </button>
        ))}
      </div>
    );
  }),
  AuditLogTableSkeleton: vi.fn(() => <div data-testid="audit-table-skeleton">Loading...</div>),
}));

// Get mocked useQuery for test manipulation
import { useQuery } from '@tanstack/react-query';
const mockUseQuery = vi.mocked(useQuery);

describe('AuditLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditTableProps = {};

    // Reset to default mock state
    mockUseQuery.mockReturnValue({
      data: {
        data: [mockAuditLogEntry, mockAuditLogEntryMinimal],
        pagination: {
          page: 0,
          size: 10,
          totalElements: 2,
          totalPages: 1,
          first: true,
          last: true,
        },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useQuery>);
  });

  describe('rendering', () => {
    it('should render page header with title and description', () => {
      render(<AuditLogPage />);

      expect(screen.getByText('이력 관리')).toBeInTheDocument();
      expect(screen.getByText('System activity and security events')).toBeInTheDocument();
    });

    it('should render filter bar', () => {
      render(<AuditLogPage />);

      expect(screen.getByText('Entity Type')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should render AuditLogTable with logs', () => {
      render(<AuditLogPage />);

      expect(screen.getByTestId('audit-log-table')).toBeInTheDocument();
      expect(auditTableProps.logs).toEqual([mockAuditLogEntry, mockAuditLogEntryMinimal]);
    });

    it('should not render detail modal initially', () => {
      render(<AuditLogPage />);

      expect(screen.queryByText('Audit Log Details')).not.toBeInTheDocument();
    });

    it('should not render Clear Filters button when no filters active', () => {
      render(<AuditLogPage />);

      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useQuery>);

      render(<AuditLogPage />);

      expect(screen.getByTestId('audit-table-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('audit-log-table')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message and retry button on error', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useQuery>);

      render(<AuditLogPage />);

      expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call refetch when retry is clicked', async () => {
      const user = userEvent.setup();
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useQuery>);

      render(<AuditLogPage />);

      await user.click(screen.getByText('Retry'));

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('detail modal', () => {
    it('should open detail modal when onViewDetails is triggered', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
    });

    it('should display entry ID and timestamp in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText(/entry #1/i)).toBeInTheDocument();
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });

    it('should display action badge in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('CREATE')).toBeInTheDocument();
    });

    it('should display entity type in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('Entity Type')).toBeInTheDocument();
      const entityTypeParagraphs = within(modal).getAllByText('User');
      expect(entityTypeParagraphs.length).toBeGreaterThan(0);
    });

    it('should display entity ID in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should display username in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('admin')).toBeInTheDocument();
    });

    it('should display IP address in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('should display changes JSON in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText(/"field"/)).toBeInTheDocument();
    });

    it('should display metadata JSON in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText(/"key"/)).toBeInTheDocument();
    });

    it('should display dash for null IP address in minimal entry', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-2'));

      const modal = screen.getByRole('dialog');
      const dashElements = within(modal).getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('should not display changes section for null changes', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-2'));

      expect(screen.queryByText('Changes')).not.toBeInTheDocument();
    });

    it('should not display metadata section for null metadata', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-2'));

      expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
    });

    it('should not display entity ID section when null', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-2'));

      expect(screen.queryByText('Entity ID')).not.toBeInTheDocument();
    });

    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));
      expect(screen.getByText('Audit Log Details')).toBeInTheDocument();

      const modal = screen.getByRole('dialog');
      const closeButton = within(modal).getByRole('button', { name: /close dialog/i });
      await user.click(closeButton);

      expect(screen.queryByText('Audit Log Details')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', () => {
      render(<AuditLogPage />);

      expect(screen.getByRole('heading', { name: /이력 관리/i })).toBeInTheDocument();
    });

    it('should have accessible filter labels', () => {
      render(<AuditLogPage />);

      expect(screen.getByText('Entity Type')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should have accessible modal when open', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('timestamp formatting', () => {
    it('should format timestamp in Korean locale', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('JSON parsing', () => {
    it('should handle valid JSON in changes field', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText(/field/)).toBeInTheDocument();
      expect(screen.getByText(/value/)).toBeInTheDocument();
    });

    it('should handle valid JSON in metadata field', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('view-details-1'));

      expect(screen.getByText(/key/)).toBeInTheDocument();
      expect(screen.getByText(/meta/)).toBeInTheDocument();
    });
  });
});
