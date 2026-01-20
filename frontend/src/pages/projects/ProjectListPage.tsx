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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');
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
      aria-label={t('actions.view')}
      title={t('actions.view')}
    >
      <Icon name="eye" className="h-4 w-4" />
    </IconButton>
  );

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title={t('title')} description={t('description')} />
        <PageHeader.Actions>
          <Button onClick={handleCreate}>
            <Icon name="plus" className="h-5 w-5" />
            {t('list.new')}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <SearchBar
          value={searchInput}
          onValueChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder={t('list.searchPlaceholder')}
          className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
        />
        <Button variant="secondary" onClick={handleSearchSubmit}>
          {tCommon('buttons.search')}
        </Button>
      </div>

      {/* Error Messages */}
      {(error || queryError) && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error || t('list.loadError')}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card variant="table">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('table.headers.jobCode')}</Table.HeaderCell>
                <Table.HeaderCell>{t('table.headers.projectName')}</Table.HeaderCell>
                <Table.HeaderCell>{t('fields.contact')}</Table.HeaderCell>
                <Table.HeaderCell>{t('table.headers.dueDate')}</Table.HeaderCell>
                <Table.HeaderCell>{t('table.headers.status')}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">{t('table.headers.actions')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <LoadingState variant="table" colspan={6} message={t('list.loading')} />
            </Table.Body>
          </Table>
        </Card>
      )}

      {/* Error State with Retry */}
      {queryError && !isLoading && (
        <Card variant="table">
          <div className="p-8 text-center">
            <p className="text-red-400">{t('list.loadError')}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-sm text-copper-500 hover:underline"
            >
              {tCommon('buttons.retry')}
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
            emptyMessage={search ? t('list.emptySearch') : t('list.empty')}
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
