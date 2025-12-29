/**
 * Quotation Create Page
 *
 * Form for creating a new quotation.
 * Requires project selection or comes from project context.
 *
 * Routes:
 * - /quotations/create (standalone - requires project selection)
 * - /projects/:id/quotations/create (project context - project pre-selected)
 */

import { useCallback, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Card, Icon, PageHeader, Spinner } from '@/components/ui';
import { ProjectCombobox } from '@/components/features/shared/selectors';
import {
  QuotationForm,
  useProjectDetails,
  useQuotationActions,
} from '@/components/features/quotations';
import type { CreateQuotationRequest, UpdateQuotationRequest } from '@/services';

export function QuotationCreatePage() {
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
  const { isLoading: isSubmitting, error, createQuotation, clearError } = useQuotationActions();
  const {
    project: selectedProject,
    isLoading: isLoadingProject,
    error: projectError,
  } = useProjectDetails(selectedProjectId);

  // Handle project selection
  const handleProjectSelect = useCallback(
    (projectId: number | null) => {
      setSelectedProjectId(projectId);
      clearError();
    },
    [clearError]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: CreateQuotationRequest | UpdateQuotationRequest) => {
      try {
        // In create mode, data is always CreateQuotationRequest
        const quotation = await createQuotation(data as CreateQuotationRequest);
        // Navigate to the created quotation
        if (routeProjectId) {
          navigate(`/projects/${routeProjectId}/quotations/${quotation.id}`);
        } else {
          navigate(`/quotations/${quotation.id}`);
        }
      } catch {
        // Error is handled by the hook
      }
    },
    [createQuotation, navigate, routeProjectId]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (routeProjectId) {
      navigate(`/projects/${routeProjectId}/quotation`);
    } else {
      navigate('/quotations');
    }
  }, [navigate, routeProjectId]);

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
          onSubmit={handleSubmit}
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
