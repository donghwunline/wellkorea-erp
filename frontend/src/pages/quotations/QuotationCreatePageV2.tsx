/**
 * Quotation Create Page (FSD Version).
 *
 * Form for creating a new quotation.
 * Uses FSD architecture with separated concerns.
 *
 * Routes:
 * - /quotations/create (standalone - requires project selection)
 * - /projects/:id/quotations/create (project context - project pre-selected)
 *
 * Pages Layer: Route-level assembly only
 * - URL params handling
 * - Layout composition
 * - Feature delegation
 */

import { useCallback, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Icon, PageHeader, Spinner } from '@/shared/ui';
import { ProjectCombobox } from '@/components/features/shared/selectors';
import { projectQueries } from '@/entities/project';
import { useCreateQuotation, QuotationForm } from '@/features/quotation';
import type { CreateQuotationInput } from '@/entities/quotation';

export function QuotationCreatePageV2() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get('projectId');

  // Determine initial project ID from route or query param
  const initialProjectId = routeProjectId
    ? parseInt(routeProjectId, 10)
    : queryProjectId
      ? parseInt(queryProjectId, 10)
      : null;

  // State
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialProjectId);

  // Hooks
  const {
    data: selectedProject,
    isLoading: isLoadingProject,
    error: projectQueryError,
  } = useQuery({
    ...projectQueries.detail(selectedProjectId ?? 0),
    enabled: selectedProjectId !== null && selectedProjectId > 0,
  });
  const projectError = projectQueryError?.message ?? null;

  const {
    mutate: createQuotation,
    isPending: isSubmitting,
    error: mutationError,
  } = useCreateQuotation({
    onSuccess: result => {
      // Navigate to the created quotation
      if (routeProjectId) {
        navigate(`/projects/${routeProjectId}/quotations/${result.id}`);
      } else {
        navigate(`/quotations/${result.id}`);
      }
    },
  });

  // Handle project selection
  const handleProjectSelect = useCallback((projectId: number | null) => {
    setSelectedProjectId(projectId);
  }, []);

  // Handle form submission
  const handleCreateSubmit = useCallback(
    (data: CreateQuotationInput) => {
      createQuotation(data);
    },
    [createQuotation]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (routeProjectId) {
      navigate(`/projects/${routeProjectId}/quotation`);
    } else {
      navigate('/quotations');
    }
  }, [navigate, routeProjectId]);

  // Error message
  const error = mutationError?.message || null;

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="Create Quotation"
          description={
            selectedProject
              ? `For project: ${selectedProject.projectName}`
              : 'Create a new quotation'
          }
        />
        <PageHeader.Actions>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            Back to Quotations
          </button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Project Selection (if not from project route) */}
      {!routeProjectId && (
        <Card className="mb-6 p-6">
          <h3 className="mb-4 text-lg font-medium text-white">Select Project</h3>
          <div className="max-w-md">
            <ProjectCombobox
              value={selectedProjectId}
              onChange={handleProjectSelect}
              label="Project"
              placeholder="Search for a project..."
              required
            />
          </div>
          {projectError && (
            <Alert variant="error" className="mt-4">
              {projectError}
            </Alert>
          )}
        </Card>
      )}

      {/* Loading State */}
      {isLoadingProject && (
        <Card className="p-12 text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="mt-4 text-steel-400">Loading project details...</p>
        </Card>
      )}

      {/* Form */}
      {!isLoadingProject && selectedProjectId && selectedProject && (
        <QuotationForm
          projectId={selectedProjectId}
          projectName={selectedProject.projectName}
          isSubmitting={isSubmitting}
          error={error}
          onCreateSubmit={handleCreateSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* No Project Selected */}
      {!isLoadingProject && !selectedProjectId && !routeProjectId && (
        <Card className="p-12 text-center">
          <Icon name="document" className="mx-auto h-12 w-12 text-steel-600" />
          <p className="mt-4 text-steel-400">Please select a project to create a quotation.</p>
        </Card>
      )}
    </div>
  );
}
