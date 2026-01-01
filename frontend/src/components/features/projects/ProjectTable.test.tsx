/**
 * Unit tests for ProjectTable component.
 * Tests data fetching, loading states, error handling, pagination, and user interactions.
 *
 * Following Constitution Principle VI, this tests the component using Query Factory:
 * - projectQueries is mocked to control query behavior
 * - QueryClientProvider wraps all renders
 * - Focus is on state management, pagination, and user interactions
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectTable } from './ProjectTable';
import type { ProjectListItem } from '@/entities/project';
import type { PaginationMetadata } from '@/shared/lib/pagination';

// Mock response state - will be set per test
let mockProjectsData: ProjectListItem[] = [];
let mockPaginationData: PaginationMetadata | null = null;
let mockShouldError = false;

// Mock project queries
vi.mock('@/entities/project', async () => {
  const actual = await vi.importActual('@/entities/project');
  return {
    ...actual,
    projectQueries: {
      list: (params: { page: number; size: number; search: string | null; status: string | null }) => ({
        queryKey: ['projects', 'list', params.page, params.size, params.search, params.status],
        queryFn: async () => {
          if (mockShouldError) throw new Error('Network error');
          return {
            data: mockProjectsData,
            pagination: mockPaginationData,
          };
        },
      }),
      lists: () => ['projects', 'list'],
    },
    PROJECT_STATUS_LABELS: {
      DRAFT: 'Draft',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      ARCHIVED: 'Archived',
    },
  };
});

// Helper to create mock project list item
function createMockProject(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 1,
    jobCode: 'WK2-2025-001-0115',
    customerId: 1,
    customerName: 'Test Customer',
    projectName: 'Test Project',
    requesterName: null,
    dueDate: '2025-02-15',
    status: 'ACTIVE',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-16T14:45:00Z',
    ...overrides,
  };
}

// Helper to create mock pagination
function createMockPagination(overrides: Partial<PaginationMetadata> = {}): PaginationMetadata {
  return {
    number: 0,
    size: 10,
    totalElements: mockProjectsData.length,
    totalPages: 1,
    first: true,
    last: true,
    ...overrides,
  };
}

// Helper to create test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

// Helper to render with QueryClientProvider
function renderProjectTable(props: Partial<React.ComponentProps<typeof ProjectTable>> = {}) {
  const queryClient = createTestQueryClient();
  const defaultProps = {
    page: 0,
    search: '',
    onPageChange: vi.fn(),
    onView: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectTable {...defaultProps} {...props} />
    </QueryClientProvider>
  );
}

describe('ProjectTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectsData = [];
    mockPaginationData = null;
    mockShouldError = false;
  });

  describe('loading state', () => {
    it('should display loading state initially', async () => {
      // Keep data empty to simulate loading
      mockProjectsData = [];
      mockPaginationData = null;

      renderProjectTable();

      // Initially shows loading until query resolves
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('should render table header during loading', () => {
      mockProjectsData = [];
      mockPaginationData = null;

      renderProjectTable();

      expect(screen.getByText('Job Code')).toBeInTheDocument();
      expect(screen.getByText('Project Name')).toBeInTheDocument();
      expect(screen.getByText('Requester')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('data fetching', () => {
    it('should fetch and display projects', async () => {
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });

    it('should pass search parameter when provided', async () => {
      mockProjectsData = [createMockProject({ projectName: 'Search Result' })];
      mockPaginationData = createMockPagination();

      renderProjectTable({ search: 'test' });

      await waitFor(() => {
        expect(screen.getByText('Search Result')).toBeInTheDocument();
      });
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', async () => {
      mockShouldError = true;

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
      });
    });

    it('should call onError when provided', async () => {
      const onError = vi.fn();
      mockShouldError = true;

      renderProjectTable({ onError });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to load projects');
      });
    });

    it('should display retry button on error', async () => {
      mockShouldError = true;

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should refetch when retry is clicked', async () => {
      const user = userEvent.setup();
      mockShouldError = true;

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Fix the error for retry
      mockShouldError = false;
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination();

      await user.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should display empty message when no projects', async () => {
      mockProjectsData = [];
      mockPaginationData = createMockPagination({ totalElements: 0 });

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('No projects found.')).toBeInTheDocument();
      });
    });

    it('should display search-specific empty message', async () => {
      mockProjectsData = [];
      mockPaginationData = createMockPagination({ totalElements: 0 });

      renderProjectTable({ search: 'nonexistent' });

      await waitFor(() => {
        expect(screen.getByText('No projects found matching your search.')).toBeInTheDocument();
      });
    });
  });

  describe('project rendering', () => {
    it('should render project job code', async () => {
      mockProjectsData = [createMockProject({ jobCode: 'WK2-2025-042-0120' })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('WK2-2025-042-0120')).toBeInTheDocument();
      });
    });

    it('should render project name', async () => {
      mockProjectsData = [createMockProject({ projectName: 'Important Project' })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Important Project')).toBeInTheDocument();
      });
    });

    it('should render requester name', async () => {
      mockProjectsData = [createMockProject({ requesterName: 'Jane Smith' })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should render dash for null requester', async () => {
      mockProjectsData = [createMockProject({ requesterName: null })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
    });

    it('should render formatted due date', async () => {
      mockProjectsData = [createMockProject({ dueDate: '2025-02-15' })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        // Korean date format: YYYY. MM. DD.
        expect(screen.getByText('2025. 02. 15.')).toBeInTheDocument();
      });
    });

    it('should render status badge', async () => {
      mockProjectsData = [createMockProject({ status: 'ACTIVE' })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should render multiple projects', async () => {
      mockProjectsData = [
        createMockProject({ id: 1, projectName: 'Project A' }),
        createMockProject({ id: 2, projectName: 'Project B' }),
        createMockProject({ id: 3, projectName: 'Project C' }),
      ];
      mockPaginationData = createMockPagination({ totalElements: 3 });

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
        expect(screen.getByText('Project B')).toBeInTheDocument();
        expect(screen.getByText('Project C')).toBeInTheDocument();
      });
    });
  });

  describe('status badge variants', () => {
    it('should render DRAFT status', async () => {
      mockProjectsData = [createMockProject({ status: 'DRAFT' })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should render COMPLETED status', async () => {
      mockProjectsData = [createMockProject({ status: 'COMPLETED' })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('should render ARCHIVED status', async () => {
      mockProjectsData = [createMockProject({ status: 'ARCHIVED' })];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Archived')).toBeInTheDocument();
      });
    });
  });

  describe('action buttons', () => {
    it('should render view button for each project', async () => {
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view project/i })).toBeInTheDocument();
      });
    });

    it('should call onView with project when view is clicked', async () => {
      const user = userEvent.setup();
      const onView = vi.fn();
      const project = createMockProject();
      mockProjectsData = [project];
      mockPaginationData = createMockPagination();

      renderProjectTable({ onView });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view project/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /view project/i }));

      expect(onView).toHaveBeenCalledWith(project);
    });
  });

  describe('pagination', () => {
    it('should not render pagination when single page', async () => {
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination({ totalPages: 1 });

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Pagination should not be present
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    it('should render pagination when multiple pages', async () => {
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination({ totalPages: 3, totalElements: 30 });

      renderProjectTable();

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Pagination should be present
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should pass onPageChange to pagination', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination({
        totalPages: 3,
        totalElements: 30,
        first: true,
        last: false,
      });

      renderProjectTable({ onPageChange });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('table styling', () => {
    it('should render job code with monospace font', async () => {
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        const jobCode = screen.getByText('WK2-2025-001-0115');
        expect(jobCode).toHaveClass('font-mono');
      });
    });

    it('should render job code with copper color', async () => {
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        const jobCode = screen.getByText('WK2-2025-001-0115');
        expect(jobCode).toHaveClass('text-copper-400');
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible view button', async () => {
      mockProjectsData = [createMockProject()];
      mockPaginationData = createMockPagination();

      renderProjectTable();

      await waitFor(() => {
        const viewButton = screen.getByRole('button', { name: /view project/i });
        expect(viewButton).toHaveAttribute('aria-label', 'View project');
      });
    });
  });
});
