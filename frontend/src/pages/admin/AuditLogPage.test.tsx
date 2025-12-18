/**
 * Unit tests for AuditLogPage component.
 * Tests page rendering, filter interactions, detail modal, error display, and accessibility.
 *
 * Following Constitution Principle VI, this tests the page as a composition layer:
 * - Feature components (AuditLogTable) are mocked
 * - Feature hooks (useAuditLogPage) are mocked
 * - Focus is on filter state, detail modal, and page-level interactions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AuditLogPage } from './AuditLogPage';
import type { AuditLogEntry } from '@/services';
// Import mocked hook for type-safe assertions
import { useAuditLogPage } from '@/components/features/audit';

// Sample audit log entry for testing
const mockAuditLogEntry: AuditLogEntry = {
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

const mockAuditLogEntryMinimal: AuditLogEntry = {
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

// Mock handlers
const mockSetPage = vi.fn();
const mockHandleFilterChange = vi.fn();
const mockHandleClearFilters = vi.fn();
const mockHandleSearchChange = vi.fn();
const mockHandleSearchSubmit = vi.fn();
const mockHandleClearSearch = vi.fn();

// Mock the feature hook
vi.mock('@/components/features/audit', () => ({
  useAuditLogPage: vi.fn(() => ({
    page: 0,
    setPage: mockSetPage,
    search: '',
    searchInput: '',
    handleSearchChange: mockHandleSearchChange,
    handleSearchSubmit: mockHandleSearchSubmit,
    handleClearSearch: mockHandleClearSearch,
    filters: {
      username: '',
      action: '',
      startDate: '',
      endDate: '',
    },
    handleFilterChange: mockHandleFilterChange,
    handleClearFilters: mockHandleClearFilters,
  })),
  AuditLogTable: vi.fn((props: Record<string, unknown>) => {
    auditTableProps = props;
    return (
      <div data-testid="audit-log-table">
        <button
          data-testid="trigger-view-details"
          onClick={() => (props.onViewDetails as (entry: AuditLogEntry) => void)(mockAuditLogEntry)}
        >
          View Details
        </button>
        <button
          data-testid="trigger-view-minimal"
          onClick={() =>
            (props.onViewDetails as (entry: AuditLogEntry) => void)(mockAuditLogEntryMinimal)
          }
        >
          View Minimal
        </button>
        <button
          data-testid="trigger-error"
          onClick={() => (props.onError as (error: string) => void)('Failed to load audit logs')}
        >
          Trigger Error
        </button>
      </div>
    );
  }),
}));

describe('AuditLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditTableProps = {};

    // Reset to default mock state
    vi.mocked(useAuditLogPage).mockReturnValue({
      page: 0,
      setPage: mockSetPage,
      search: '',
      searchInput: '',
      handleSearchChange: mockHandleSearchChange,
      handleSearchSubmit: mockHandleSearchSubmit,
      handleClearSearch: mockHandleClearSearch,
      filters: {
        username: '',
        action: '',
        startDate: '',
        endDate: '',
      },
      handleFilterChange: mockHandleFilterChange,
      handleClearFilters: mockHandleClearFilters,
    });
  });

  describe('rendering', () => {
    it('should render page header with title and description', () => {
      render(<AuditLogPage />);

      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText('System activity and security events')).toBeInTheDocument();
    });

    it('should render filter bar', () => {
      render(<AuditLogPage />);

      expect(screen.getByText('Entity Type')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should render AuditLogTable', () => {
      render(<AuditLogPage />);

      expect(screen.getByTestId('audit-log-table')).toBeInTheDocument();
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

  describe('filter interactions', () => {
    it('should render Clear Filters button when filters are active', () => {
      vi.mocked(useAuditLogPage).mockReturnValue({
        page: 0,
        setPage: mockSetPage,
        search: '',
        searchInput: '',
        handleSearchChange: mockHandleSearchChange,
        handleSearchSubmit: mockHandleSearchSubmit,
        handleClearSearch: mockHandleClearSearch,
        filters: {
          username: 'admin', // Active filter
          action: '',
          startDate: '',
          endDate: '',
        },
        handleFilterChange: mockHandleFilterChange,
        handleClearFilters: mockHandleClearFilters,
      });

      render(<AuditLogPage />);

      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('should render Clear Filters button when action filter is active', () => {
      vi.mocked(useAuditLogPage).mockReturnValue({
        page: 0,
        setPage: mockSetPage,
        search: '',
        searchInput: '',
        handleSearchChange: mockHandleSearchChange,
        handleSearchSubmit: mockHandleSearchSubmit,
        handleClearSearch: mockHandleClearSearch,
        filters: {
          username: '',
          action: 'CREATE', // Active filter
          startDate: '',
          endDate: '',
        },
        handleFilterChange: mockHandleFilterChange,
        handleClearFilters: mockHandleClearFilters,
      });

      render(<AuditLogPage />);

      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('should call handleClearFilters when Clear Filters button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useAuditLogPage).mockReturnValue({
        page: 0,
        setPage: mockSetPage,
        search: '',
        searchInput: '',
        handleSearchChange: mockHandleSearchChange,
        handleSearchSubmit: mockHandleSearchSubmit,
        handleClearSearch: mockHandleClearSearch,
        filters: {
          username: 'admin',
          action: 'CREATE',
          startDate: '',
          endDate: '',
        },
        handleFilterChange: mockHandleFilterChange,
        handleClearFilters: mockHandleClearFilters,
      });

      render(<AuditLogPage />);

      await user.click(screen.getByRole('button', { name: /clear filters/i }));

      expect(mockHandleClearFilters).toHaveBeenCalledOnce();
    });
  });

  describe('props passed to AuditLogTable', () => {
    it('should pass page from useAuditLogPage', () => {
      render(<AuditLogPage />);

      expect(auditTableProps.page).toBe(0);
    });

    it('should pass filters mapped correctly', () => {
      vi.mocked(useAuditLogPage).mockReturnValue({
        page: 0,
        setPage: mockSetPage,
        search: '',
        searchInput: '',
        handleSearchChange: mockHandleSearchChange,
        handleSearchSubmit: mockHandleSearchSubmit,
        handleClearSearch: mockHandleClearSearch,
        filters: {
          username: 'User', // Entity type filter (note: maps to entityType in table)
          action: 'CREATE',
          startDate: '',
          endDate: '',
        },
        handleFilterChange: mockHandleFilterChange,
        handleClearFilters: mockHandleClearFilters,
      });

      render(<AuditLogPage />);

      expect(auditTableProps.filters).toEqual({
        entityType: 'User',
        action: 'CREATE',
      });
    });

    it('should pass undefined for empty filter values', () => {
      render(<AuditLogPage />);

      expect(auditTableProps.filters).toEqual({
        entityType: undefined,
        action: undefined,
      });
    });

    it('should pass callback functions', () => {
      render(<AuditLogPage />);

      expect(typeof auditTableProps.onPageChange).toBe('function');
      expect(typeof auditTableProps.onViewDetails).toBe('function');
      expect(typeof auditTableProps.onError).toBe('function');
    });

    it('should pass setPage to onPageChange', () => {
      render(<AuditLogPage />);

      expect(auditTableProps.onPageChange).toBe(mockSetPage);
    });

    it('should reflect page changes from hook', () => {
      vi.mocked(useAuditLogPage).mockReturnValue({
        page: 3,
        setPage: mockSetPage,
        search: '',
        searchInput: '',
        handleSearchChange: mockHandleSearchChange,
        handleSearchSubmit: mockHandleSearchSubmit,
        handleClearSearch: mockHandleClearSearch,
        filters: {
          username: '',
          action: '',
          startDate: '',
          endDate: '',
        },
        handleFilterChange: mockHandleFilterChange,
        handleClearFilters: mockHandleClearFilters,
      });

      render(<AuditLogPage />);

      expect(auditTableProps.page).toBe(3);
    });
  });

  describe('detail modal', () => {
    it('should open detail modal when onViewDetails is triggered', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
    });

    it('should display entry ID and timestamp in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      expect(screen.getByText(/entry #1/i)).toBeInTheDocument();
      // Date formatted in ko-KR locale
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });

    it('should display action badge in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('CREATE')).toBeInTheDocument();
    });

    it('should display entity type in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      const modal = screen.getByRole('dialog');
      // Entity Type label and value "User" are both in the modal
      expect(within(modal).getByText('Entity Type')).toBeInTheDocument();
      // The value "User" is in the paragraph after the label
      const entityTypeParagraphs = within(modal).getAllByText('User');
      expect(entityTypeParagraphs.length).toBeGreaterThan(0);
    });

    it('should display entity ID in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should display username in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('admin')).toBeInTheDocument();
    });

    it('should display IP address in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('should display changes JSON in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      // Changes are parsed and displayed
      expect(screen.getByText(/"field"/)).toBeInTheDocument();
    });

    it('should display metadata JSON in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      // Metadata is parsed and displayed
      expect(screen.getByText(/"key"/)).toBeInTheDocument();
    });

    it('should display dash for null IP address in minimal entry', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-minimal'));

      // Modal should be open
      const modal = screen.getByRole('dialog');

      // Should have dash for null ipAddress
      const dashElements = within(modal).getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('should not display changes section for null changes', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-minimal'));

      // Changes section should not appear when changes is null
      expect(screen.queryByText('Changes')).not.toBeInTheDocument();
    });

    it('should not display metadata section for null metadata', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-minimal'));

      // Metadata section should not appear when metadata is null
      expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
    });

    it('should not display entity ID section when null', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-minimal'));

      expect(screen.queryByText('Entity ID')).not.toBeInTheDocument();
    });

    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));
      expect(screen.getByText('Audit Log Details')).toBeInTheDocument();

      // Find and click modal close button (aria-label="Close dialog")
      const modal = screen.getByRole('dialog');
      const closeButton = within(modal).getByRole('button', { name: /close dialog/i });
      await user.click(closeButton);

      expect(screen.queryByText('Audit Log Details')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error alert when onError is triggered', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-error'));

      expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
    });

    it('should dismiss error alert when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-error'));
      expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();

      const alert = screen.getByRole('alert');
      const closeButton = within(alert).getByRole('button');
      await user.click(closeButton);

      expect(screen.queryByText('Failed to load audit logs')).not.toBeInTheDocument();
    });
  });

  describe('action badge variants', () => {
    it('should display CREATE action with badge in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      const modal = screen.getByRole('dialog');
      // Badge is inside the modal under Action label
      expect(within(modal).getByText('CREATE')).toBeInTheDocument();
    });

    it('should display LOGIN action badge in modal', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-minimal'));

      const modal = screen.getByRole('dialog');
      // Badge is inside the modal under Action label
      expect(within(modal).getByText('LOGIN')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible page heading', () => {
      render(<AuditLogPage />);

      expect(screen.getByRole('heading', { name: /audit logs/i })).toBeInTheDocument();
    });

    it('should have accessible filter labels', () => {
      render(<AuditLogPage />);

      expect(screen.getByText('Entity Type')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should have accessible modal when open', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible error alert', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-error'));

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('timestamp formatting', () => {
    it('should format timestamp in Korean locale', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      // Korean date format includes year and specific formatting
      // 2025-01-15T10:30:00Z should contain 2025
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('JSON parsing', () => {
    it('should handle valid JSON in changes field', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      // The JSON should be pretty-printed
      expect(screen.getByText(/field/)).toBeInTheDocument();
      expect(screen.getByText(/value/)).toBeInTheDocument();
    });

    it('should handle valid JSON in metadata field', async () => {
      const user = userEvent.setup();
      render(<AuditLogPage />);

      await user.click(screen.getByTestId('trigger-view-details'));

      expect(screen.getByText(/key/)).toBeInTheDocument();
      expect(screen.getByText(/meta/)).toBeInTheDocument();
    });
  });
});
