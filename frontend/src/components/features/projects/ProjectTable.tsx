/**
 * Project Management Table - Smart Feature Component
 *
 * Responsibilities:
 * - Fetch project list data using Query Factory pattern
 * - Display projects in table format
 * - Delegate actions to parent via callbacks
 *
 * Uses TanStack Query for server state management.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  projectQueries,
  PROJECT_STATUS_LABELS,
  type ProjectListItem,
  type ProjectStatus,
} from '@/entities/project';
import { formatDate } from '@/shared/lib/formatting';
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
} from '@/shared/ui';

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
  onView: (project: ProjectListItem) => void;
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
  onError,
}: Readonly<ProjectTableProps>) {
  const queryClient = useQueryClient();

  // Use Query Factory pattern for server state
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery(
    projectQueries.list({
      page,
      size: 10,
      search,
      status: null,
    })
  );

  const projects = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const error = queryError ? 'Failed to load projects' : null;

  // Notify parent of errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Handle refreshTrigger changes by invalidating query
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      queryClient.invalidateQueries({ queryKey: projectQueries.lists() });
    }
  }, [refreshTrigger, queryClient]);

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
            onClick={() => refetch()}
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
                    <div className="flex justify-end">
                      <IconButton
                        onClick={() => onView(project)}
                        aria-label="View project"
                        title="View project"
                      >
                        <Icon name="eye" className="h-4 w-4" />
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
