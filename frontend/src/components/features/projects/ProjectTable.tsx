/**
 * Project Management Table - Smart Feature Component
 *
 * Responsibilities:
 * - Fetch project list data from projectService
 * - Display projects in table format
 * - Delegate actions to parent via callbacks
 * - Respond to refreshTrigger changes
 *
 * This component owns Server State (Tier 3) for the project list.
 */

import { useCallback, useEffect, useState } from 'react';
import { projectService, PROJECT_STATUS_LABELS } from '@/services';
import type { ProjectDetails, ProjectStatus } from '@/services';
import type { PaginationMetadata } from '@/api/types';
import {
  Badge,
  type BadgeVariant,
  Card,
  EmptyState,
  Icon,
  IconButton,
  LoadingState,
  Pagination,
  Table,
} from '@/components/ui';

// Status badge variant mapping
const STATUS_BADGE_VARIANTS: Record<ProjectStatus, BadgeVariant> = {
  DRAFT: 'warning',
  ACTIVE: 'info',
  COMPLETED: 'success',
  ARCHIVED: 'purple',
};

export interface ProjectTableProps {
  /** Current page (0-indexed) */
  page: number;
  /** Search query string */
  search: string;
  /** Increment to trigger data refetch (optional) */
  refreshTrigger?: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Called when user clicks view */
  onView: (project: ProjectDetails) => void;
  /** Called when user clicks edit */
  onEdit: (project: ProjectDetails) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/**
 * Smart table component that fetches and displays projects.
 */
export function ProjectTable({
  page,
  search,
  refreshTrigger,
  onPageChange,
  onView,
  onEdit,
  onError,
}: Readonly<ProjectTableProps>) {
  // Server State (Tier 3) - managed here in feature component
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await projectService.getProjects({
        page,
        size: 10,
        search: search || undefined,
      });
      setProjects(result.data);
      setPagination(result.pagination);
    } catch {
      const errorMsg = 'Failed to load projects';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, onError]);

  // Refetch when page, search, or refreshTrigger changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, refreshTrigger]);

  // Format date utility
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card variant="table">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Job Code</Table.HeaderCell>
              <Table.HeaderCell>Project Name</Table.HeaderCell>
              <Table.HeaderCell>Requester</Table.HeaderCell>
              <Table.HeaderCell>Due Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <LoadingState variant="table" colspan={6} message="Loading projects..." />
          </Table.Body>
        </Table>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card variant="table">
        <div className="p-8 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="mt-4 text-sm text-copper-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Projects Table */}
      <Card variant="table">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Job Code</Table.HeaderCell>
              <Table.HeaderCell>Project Name</Table.HeaderCell>
              <Table.HeaderCell>Requester</Table.HeaderCell>
              <Table.HeaderCell>Due Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {projects.length === 0 ? (
              <EmptyState
                variant="table"
                colspan={6}
                message={search ? 'No projects found matching your search.' : 'No projects found.'}
              />
            ) : (
              projects.map(project => (
                <Table.Row key={project.id}>
                  <Table.Cell>
                    <span className="font-mono text-sm font-medium text-copper-400">
                      {project.jobCode}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="font-medium text-white">{project.projectName}</div>
                  </Table.Cell>
                  <Table.Cell className="text-steel-400">
                    {project.requesterName || '-'}
                  </Table.Cell>
                  <Table.Cell className="text-steel-400">{formatDate(project.dueDate)}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={STATUS_BADGE_VARIANTS[project.status]}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end gap-2">
                      <IconButton
                        onClick={() => onView(project)}
                        aria-label="View project"
                        title="View project"
                      >
                        <Icon name="eye" className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => onEdit(project)}
                        aria-label="Edit project"
                        title="Edit project"
                      >
                        <Icon name="pencil" className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalItems={pagination.totalElements}
            itemsPerPage={pagination.size}
            onPageChange={onPageChange}
            isFirst={pagination.first}
            isLast={pagination.last}
            itemLabel="projects"
          />
        </div>
      )}
    </>
  );
}
