/**
 * Project Edit Page
 *
 * Page for editing existing projects.
 * Loads project data and shows pre-filled form.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { UpdateProjectInput } from '@/entities/project';
import { projectQueries } from '@/entities/project';
import { Alert, Card, Icon, PageHeader, Spinner } from '@/shared/ui';
import { ProjectForm } from '@/components/features/projects';
import { useUpdateProject } from '@/features/project';

export function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : 0;
  const navigate = useNavigate();

  // Fetch project using Query Factory
  const {
    data: project,
    isLoading: isLoadingProject,
    error: fetchError,
  } = useQuery({
    ...projectQueries.detail(projectId),
    enabled: projectId > 0,
  });

  // Update mutation
  const updateProjectMutation = useUpdateProject();

  // Local error state for mutation errors
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  const handleSubmit = async (data: UpdateProjectInput) => {
    if (!projectId) return;

    setError(null);
    try {
      await updateProjectMutation.mutateAsync({ id: projectId, input: data });
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleCancel = () => {
    navigate(`/projects/${id}`);
  };

  const handleBack = () => {
    navigate('/projects');
  };

  // Loading state
  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title="Loading..." />
        </PageHeader>
        <Card className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center p-12">
            <Spinner size="lg" label="Loading project" />
            <span className="ml-3 text-steel-400">Loading project...</span>
          </div>
        </Card>
      </div>
    );
  }

  // Load error state
  if (fetchError && !project) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title="Error" />
          <PageHeader.Actions>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              Back to Projects
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mx-auto max-w-2xl">
          {fetchError instanceof Error ? fetchError.message : 'Failed to load project'}
        </Alert>
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title="Project Not Found" />
          <PageHeader.Actions>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              Back to Projects
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="warning" className="mx-auto max-w-2xl">
          The requested project could not be found.
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title="Edit Project" description={`Job Code: ${project.jobCode}`} />
        <PageHeader.Actions>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            Back to Project
          </button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Form Card */}
      <Card className="mx-auto max-w-2xl">
        <div className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">Edit Project Details</h2>
          <ProjectForm
            mode="edit"
            initialData={project}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={updateProjectMutation.isPending}
            error={error}
            onDismissError={clearError}
          />
        </div>
      </Card>
    </div>
  );
}
