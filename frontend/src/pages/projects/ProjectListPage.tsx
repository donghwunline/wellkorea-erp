/**
 * Project List Page
 *
 * Main page for viewing and managing projects.
 * Pure composition layer following FSD principles:
 * - Uses Query Factory for data fetching
 * - Composes entity UI components
 * - No direct service calls
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Icon,
  IconButton,
  LoadingState,
  PageHeader,
  Pagination,
  SearchBar,
  Card,
  Table,
} from '@/shared/ui';
import {
  projectQueries,
  ProjectTable,
  type ProjectListItem,
} from '@/entities/project';
import { usePaginatedSearch } from '@/shared/lib/pagination';

export function ProjectListPage() {
  const navigate = useNavigate();

  // Page UI State (Tier 2) - pagination and search
  const {
    page,
    setPage,
    search,
    searchInput,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
  } = usePaginatedSearch();

  // Local UI State (Tier 1) - Error message
  const [error, setError] = useState<string | null>(null);

  // Server State (Tier 3) - Query Factory pattern
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

  // Navigation handlers
  const handleCreate = () => {
    navigate('/projects/new');
  };

  const handleView = (project: ProjectListItem) => {
    navigate(`/projects/${project.id}`);
  };

  // Render actions for each row
  const renderActions = (project: ProjectListItem) => (
    <IconButton
      onClick={() => handleView(project)}
      aria-label="View project"
      title="View project"
    >
      <Icon name="eye" className="h-4 w-4" />
    </IconButton>
  );

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title="프로젝트" description="Manage customer projects and job codes" />
        <PageHeader.Actions>
          <Button onClick={handleCreate}>
            <Icon name="plus" className="h-5 w-5" />
            New Project
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <SearchBar
          value={searchInput}
          onValueChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder="Search by job code or project name..."
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
        />
        <Button variant="secondary" onClick={handleSearchSubmit}>
          Search
        </Button>
      </div>

      {/* Error Messages */}
      {(error || queryError) && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error || 'Failed to load projects'}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
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
      )}

      {/* Error State with Retry */}
      {queryError && !isLoading && (
        <Card variant="table">
          <div className="p-8 text-center">
            <p className="text-red-400">Failed to load projects</p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-sm text-copper-500 hover:underline"
            >
              Retry
            </button>
          </div>
        </Card>
      )}

      {/* Project Table */}
      {!isLoading && !queryError && (
        <>
          <ProjectTable
            projects={projects}
            onRowClick={handleView}
            renderActions={renderActions}
            emptyMessage={search ? 'No projects found matching your search.' : 'No projects found.'}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalItems={pagination.totalElements}
                itemsPerPage={pagination.size}
                onPageChange={setPage}
                isFirst={pagination.first}
                isLast={pagination.last}
                itemLabel="projects"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
