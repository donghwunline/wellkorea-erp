/**
 * Project List Page
 *
 * Main page for viewing and managing projects.
 * Pure composition layer following Constitution Principle VI:
 * - Composes feature components and UI components
 * - No direct service calls (feature components own their service calls)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Icon, PageHeader, SearchBar } from '@/shared/ui';
import { ProjectTable } from '@/components/features/projects';
import { usePaginatedSearch } from '@/shared/hooks';

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

  // Navigation handlers
  const handleCreate = () => {
    navigate('/projects/new');
  };

  const handleView = (project: { id: number }) => {
    navigate(`/projects/${project.id}`);
  };

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

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Project Table (handles data fetching) */}
      <ProjectTable
        page={page}
        search={search}
        onPageChange={setPage}
        onView={handleView}
        onError={setError}
      />
    </div>
  );
}
