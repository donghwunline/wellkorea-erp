/**
 * Unit tests for ProjectTable component.
 * Tests data fetching, loading states, error handling, pagination, and user interactions.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProjectTable } from './ProjectTable';
import { projectService } from '@/services';
import type { ProjectListItem } from '@/services';
import type { PaginationMetadata } from '@/shared/api/types';

// Mock the project service
vi.mock('@/services', () => ({
  projectService: {
    getProjects: vi.fn(),
  },
  PROJECT_STATUS_LABELS: {
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
  },
}));

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

// Helper to create mock paginated response
function createMockPagedResponse(
  projects: ProjectListItem[],
  pagination: Partial<PaginationMetadata> = {}
) {
  return {
    data: projects,
    pagination: {
      number: 0,
      size: 10,
      totalElements: projects.length,
      totalPages: 1,
      first: true,
      last: true,
      ...pagination,
    },
  };
}

describe('ProjectTable', () => {
  const mockGetProjects = projectService.getProjects as Mock;
  const defaultProps = {
    page: 0,
    search: '',
    onPageChange: vi.fn(),
    onView: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should display loading state initially', () => {
      mockGetProjects.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ProjectTable {...defaultProps} />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('should render table header during loading', () => {
      mockGetProjects.mockImplementation(() => new Promise(() => {}));

      render(<ProjectTable {...defaultProps} />);

      expect(screen.getByText('Job Code')).toBeInTheDocument();
      expect(screen.getByText('Project Name')).toBeInTheDocument();
      expect(screen.getByText('Requester')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('data fetching', () => {
    it('should fetch projects on mount', async () => {
      const projects = [createMockProject()];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalledOnce();
      });

      expect(mockGetProjects).toHaveBeenCalledWith({ page: 0, size: 10, search: undefined });
    });

    it('should pass search parameter when provided', async () => {
      mockGetProjects.mockResolvedValue(createMockPagedResponse([]));

      render(<ProjectTable {...defaultProps} search="test" />);

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalledWith({ page: 0, size: 10, search: 'test' });
      });
    });

    it('should pass page parameter correctly', async () => {
      mockGetProjects.mockResolvedValue(createMockPagedResponse([]));

      render(<ProjectTable {...defaultProps} page={2} />);

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalledWith({ page: 2, size: 10, search: undefined });
      });
    });

    it('should refetch when refreshTrigger changes', async () => {
      mockGetProjects.mockResolvedValue(createMockPagedResponse([createMockProject()]));

      const { rerender } = render(<ProjectTable {...defaultProps} refreshTrigger={0} />);

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalledTimes(1);
      });

      rerender(<ProjectTable {...defaultProps} refreshTrigger={1} />);

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', async () => {
      mockGetProjects.mockRejectedValue(new Error('Network error'));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
      });
    });

    it('should call onError when provided', async () => {
      const onError = vi.fn();
      mockGetProjects.mockRejectedValue(new Error('Network error'));

      render(<ProjectTable {...defaultProps} onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to load projects');
      });
    });

    it('should display retry button on error', async () => {
      mockGetProjects.mockRejectedValue(new Error('Network error'));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should refetch when retry is clicked', async () => {
      const user = userEvent.setup();
      mockGetProjects.mockRejectedValueOnce(new Error('Network error'));
      mockGetProjects.mockResolvedValueOnce(createMockPagedResponse([createMockProject()]));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('empty state', () => {
    it('should display empty message when no projects', async () => {
      mockGetProjects.mockResolvedValue(createMockPagedResponse([]));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No projects found.')).toBeInTheDocument();
      });
    });

    it('should display search-specific empty message', async () => {
      mockGetProjects.mockResolvedValue(createMockPagedResponse([]));

      render(<ProjectTable {...defaultProps} search="nonexistent" />);

      await waitFor(() => {
        expect(screen.getByText('No projects found matching your search.')).toBeInTheDocument();
      });
    });
  });

  describe('project rendering', () => {
    it('should render project job code', async () => {
      const projects = [createMockProject({ jobCode: 'WK2-2025-042-0120' })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('WK2-2025-042-0120')).toBeInTheDocument();
      });
    });

    it('should render project name', async () => {
      const projects = [createMockProject({ projectName: 'Important Project' })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Important Project')).toBeInTheDocument();
      });
    });

    it('should render requester name', async () => {
      const projects = [createMockProject({ requesterName: 'Jane Smith' })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should render dash for null requester', async () => {
      const projects = [createMockProject({ requesterName: null })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
    });

    it('should render formatted due date', async () => {
      const projects = [createMockProject({ dueDate: '2025-02-15' })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        // Korean date format: YYYY. MM. DD.
        expect(screen.getByText('2025. 02. 15.')).toBeInTheDocument();
      });
    });

    it('should render status badge', async () => {
      const projects = [createMockProject({ status: 'ACTIVE' })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should render multiple projects', async () => {
      const projects = [
        createMockProject({ id: 1, projectName: 'Project A' }),
        createMockProject({ id: 2, projectName: 'Project B' }),
        createMockProject({ id: 3, projectName: 'Project C' }),
      ];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
        expect(screen.getByText('Project B')).toBeInTheDocument();
        expect(screen.getByText('Project C')).toBeInTheDocument();
      });
    });
  });

  describe('status badge variants', () => {
    it('should render DRAFT status', async () => {
      const projects = [createMockProject({ status: 'DRAFT' })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should render COMPLETED status', async () => {
      const projects = [createMockProject({ status: 'COMPLETED' })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('should render ARCHIVED status', async () => {
      const projects = [createMockProject({ status: 'ARCHIVED' })];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Archived')).toBeInTheDocument();
      });
    });
  });

  describe('action buttons', () => {
    it('should render view button for each project', async () => {
      const projects = [createMockProject()];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view project/i })).toBeInTheDocument();
      });
    });

    it('should call onView with project when view is clicked', async () => {
      const user = userEvent.setup();
      const onView = vi.fn();
      const project = createMockProject();
      mockGetProjects.mockResolvedValue(createMockPagedResponse([project]));

      render(<ProjectTable {...defaultProps} onView={onView} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view project/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /view project/i }));

      expect(onView).toHaveBeenCalledWith(project);
    });
  });

  describe('pagination', () => {
    it('should not render pagination when single page', async () => {
      mockGetProjects.mockResolvedValue(
        createMockPagedResponse([createMockProject()], { totalPages: 1 })
      );

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Pagination should not be present
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    it('should render pagination when multiple pages', async () => {
      mockGetProjects.mockResolvedValue(
        createMockPagedResponse([createMockProject()], { totalPages: 3, totalElements: 30 })
      );

      render(<ProjectTable {...defaultProps} />);

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
      mockGetProjects.mockResolvedValue(
        createMockPagedResponse([createMockProject()], {
          totalPages: 3,
          totalElements: 30,
          first: true,
          last: false,
        })
      );

      render(<ProjectTable {...defaultProps} onPageChange={onPageChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('table styling', () => {
    it('should render job code with monospace font', async () => {
      const projects = [createMockProject()];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        const jobCode = screen.getByText('WK2-2025-001-0115');
        expect(jobCode).toHaveClass('font-mono');
      });
    });

    it('should render job code with copper color', async () => {
      const projects = [createMockProject()];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        const jobCode = screen.getByText('WK2-2025-001-0115');
        expect(jobCode).toHaveClass('text-copper-400');
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible view button', async () => {
      const projects = [createMockProject()];
      mockGetProjects.mockResolvedValue(createMockPagedResponse(projects));

      render(<ProjectTable {...defaultProps} />);

      await waitFor(() => {
        const viewButton = screen.getByRole('button', { name: /view project/i });
        expect(viewButton).toHaveAttribute('aria-label', 'View project');
      });
    });
  });
});
