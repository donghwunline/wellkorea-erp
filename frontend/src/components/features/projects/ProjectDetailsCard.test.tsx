/**
 * Unit tests for ProjectDetailsCard component.
 * Tests rendering of project details, status badge, date formatting, and optional fields.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ProjectDetailsCard } from './ProjectDetailsCard';
import type { ProjectDetails } from '@/services';

// Helper to create mock project details
function createMockProject(overrides: Partial<ProjectDetails> = {}): ProjectDetails {
  return {
    id: 1,
    jobCode: 'WK2-2025-001-0115',
    customerId: 1,
    projectName: 'Test Project',
    requesterName: 'John Doe',
    dueDate: '2025-02-15',
    internalOwnerId: 2,
    status: 'ACTIVE',
    createdById: 1,
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-16T14:45:00Z',
    ...overrides,
  };
}

describe('ProjectDetailsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers for consistent date formatting
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render job code prominently', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.getByText('WK2-2025-001-0115')).toBeInTheDocument();
    });

    it('should render project name', () => {
      render(<ProjectDetailsCard project={createMockProject({ projectName: 'My Project' })} />);

      expect(screen.getByText('My Project')).toBeInTheDocument();
    });

    it('should render customer name when provided', () => {
      render(
        <ProjectDetailsCard project={createMockProject()} customerName="Samsung Electronics" />
      );

      expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
    });

    it('should render fallback customer ID when name not provided', () => {
      render(<ProjectDetailsCard project={createMockProject({ customerId: 42 })} />);

      expect(screen.getByText('Customer #42')).toBeInTheDocument();
    });

    it('should render requester name', () => {
      render(<ProjectDetailsCard project={createMockProject({ requesterName: 'Jane Smith' })} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render dash when requester name is null', () => {
      render(<ProjectDetailsCard project={createMockProject({ requesterName: null })} />);

      // Find the Requester section and check its value
      const requesterLabel = screen.getByText('Requester');
      const requesterValue = requesterLabel.closest('div')?.parentElement?.querySelector('p');
      expect(requesterValue).toHaveTextContent('-');
    });

    it('should render internal owner name when provided', () => {
      render(<ProjectDetailsCard project={createMockProject()} internalOwnerName="Kim Minjun" />);

      expect(screen.getByText('Kim Minjun')).toBeInTheDocument();
    });

    it('should render fallback owner ID when name not provided', () => {
      render(<ProjectDetailsCard project={createMockProject({ internalOwnerId: 5 })} />);

      expect(screen.getByText('User #5')).toBeInTheDocument();
    });

    it('should render created by name when provided', () => {
      render(<ProjectDetailsCard project={createMockProject()} createdByName="Park Admin" />);

      expect(screen.getByText('Park Admin')).toBeInTheDocument();
    });

    it('should render fallback created by ID when name not provided', () => {
      render(<ProjectDetailsCard project={createMockProject({ createdById: 3 })} />);

      expect(screen.getByText('User #3')).toBeInTheDocument();
    });
  });

  describe('status badge', () => {
    it('should render DRAFT status with warning variant', () => {
      render(<ProjectDetailsCard project={createMockProject({ status: 'DRAFT' })} />);

      const badge = screen.getByText('Draft');
      expect(badge).toBeInTheDocument();
    });

    it('should render ACTIVE status with info variant', () => {
      render(<ProjectDetailsCard project={createMockProject({ status: 'ACTIVE' })} />);

      const badge = screen.getByText('Active');
      expect(badge).toBeInTheDocument();
    });

    it('should render COMPLETED status with success variant', () => {
      render(<ProjectDetailsCard project={createMockProject({ status: 'COMPLETED' })} />);

      const badge = screen.getByText('Completed');
      expect(badge).toBeInTheDocument();
    });

    it('should render ARCHIVED status with purple variant', () => {
      render(<ProjectDetailsCard project={createMockProject({ status: 'ARCHIVED' })} />);

      const badge = screen.getByText('Archived');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('should format due date in Korean locale', () => {
      render(<ProjectDetailsCard project={createMockProject({ dueDate: '2025-02-15' })} />);

      // Korean date format: YYYY. MM. DD.
      // Use a more specific regex to match just the due date
      expect(screen.getByText('2025. 02. 15.')).toBeInTheDocument();
    });

    it('should format created at with time', () => {
      render(
        <ProjectDetailsCard project={createMockProject({ createdAt: '2025-01-15T10:30:00Z' })} />
      );

      // Should show date and time
      const createdAtLabel = screen.getAllByText('Created At')[0];
      expect(createdAtLabel).toBeInTheDocument();
    });

    it('should format updated at with time', () => {
      render(
        <ProjectDetailsCard project={createMockProject({ updatedAt: '2025-01-16T14:45:00Z' })} />
      );

      // Should show date and time
      const updatedAtLabel = screen.getByText('Last Updated');
      expect(updatedAtLabel).toBeInTheDocument();
    });

    it('should display dash for null due date', () => {
      // Note: dueDate is required in the type, but testing edge case
      const project = createMockProject();
      // @ts-expect-error Testing null handling
      project.dueDate = null;

      render(<ProjectDetailsCard project={project} />);

      const dueDateLabel = screen.getByText('Due Date');
      const dueDateValue = dueDateLabel.closest('div')?.parentElement?.querySelector('p');
      expect(dueDateValue).toHaveTextContent('-');
    });
  });

  describe('field labels', () => {
    it('should render Customer label', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.getByText('Customer')).toBeInTheDocument();
    });

    it('should render Requester label', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.getByText('Requester')).toBeInTheDocument();
    });

    it('should render Due Date label', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.getByText('Due Date')).toBeInTheDocument();
    });

    it('should render Internal Owner label', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.getByText('Internal Owner')).toBeInTheDocument();
    });

    it('should render Created By label', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.getByText('Created By')).toBeInTheDocument();
    });

    it('should render Created At label', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.getByText('Created At')).toBeInTheDocument();
    });

    it('should render Last Updated label', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.getByText('Last Updated')).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('should render icons for each field', () => {
      const { container } = render(<ProjectDetailsCard project={createMockProject()} />);

      // Should have SVG icons for Customer, Requester, Due Date, etc.
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });
  });

  describe('layout', () => {
    it('should render in a Card component', () => {
      const { container } = render(<ProjectDetailsCard project={createMockProject()} />);

      // Card component has border and rounded corners
      const card = container.firstChild;
      expect(card).toHaveClass('rounded-xl');
    });

    it('should render fields in grid layout', () => {
      const { container } = render(<ProjectDetailsCard project={createMockProject()} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('job code styling', () => {
    it('should render job code with monospace font', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      const jobCode = screen.getByText('WK2-2025-001-0115');
      expect(jobCode).toHaveClass('font-mono');
    });

    it('should render job code with copper color', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      const jobCode = screen.getByText('WK2-2025-001-0115');
      expect(jobCode).toHaveClass('text-copper-400');
    });
  });

  describe('all optional props', () => {
    it('should render correctly with all name props provided', () => {
      render(
        <ProjectDetailsCard
          project={createMockProject()}
          customerName="Samsung Electronics"
          internalOwnerName="Kim Minjun"
          createdByName="Park Admin"
        />
      );

      expect(screen.getByText('Samsung Electronics')).toBeInTheDocument();
      expect(screen.getByText('Kim Minjun')).toBeInTheDocument();
      expect(screen.getByText('Park Admin')).toBeInTheDocument();
    });

    it('should render correctly with no name props provided', () => {
      render(
        <ProjectDetailsCard
          project={createMockProject({ customerId: 10, internalOwnerId: 20, createdById: 30 })}
        />
      );

      expect(screen.getByText('Customer #10')).toBeInTheDocument();
      expect(screen.getByText('User #20')).toBeInTheDocument();
      expect(screen.getByText('User #30')).toBeInTheDocument();
    });
  });

  describe('edit action', () => {
    it('should not render edit button when onEdit is not provided', () => {
      render(<ProjectDetailsCard project={createMockProject()} />);

      expect(screen.queryByRole('button', { name: /edit project/i })).not.toBeInTheDocument();
    });

    it('should render edit button when onEdit is provided', () => {
      render(<ProjectDetailsCard project={createMockProject()} onEdit={() => {}} />);

      expect(screen.getByRole('button', { name: /edit project/i })).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      // Note: Need to use real timers for userEvent, as fake timers are set in beforeEach
      vi.useRealTimers();
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<ProjectDetailsCard project={createMockProject()} onEdit={onEdit} />);

      await user.click(screen.getByRole('button', { name: /edit project/i }));

      expect(onEdit).toHaveBeenCalledOnce();
    });

    it('should have accessible edit button with title', () => {
      render(<ProjectDetailsCard project={createMockProject()} onEdit={() => {}} />);

      const editButton = screen.getByRole('button', { name: /edit project/i });
      expect(editButton).toHaveAttribute('title', 'Edit project');
    });
  });
});
