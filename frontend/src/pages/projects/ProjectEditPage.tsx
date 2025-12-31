/**
 * Project Edit Page
 *
 * Page for editing existing projects.
 * Loads project data and shows pre-filled form.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Project, UpdateProjectRequest } from '@/entities/project';
import { Alert, Card, Icon, PageHeader, Spinner } from '@/shared/ui';
import { ProjectForm, useProjectActions } from '@/components/features/projects';

// Alias for backward compatibility
type ProjectDetails = Project;

export function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getProject,
    updateProject,
    isLoading,
    error,
    clearError,
  } = useProjectActions();

  // Local State
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);

  // Fetch project on mount
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      setIsLoadingProject(true);
      try {
        const data = await getProject(parseInt(id, 10));
        setProject(data);
      } catch {
        // Error is handled by the hook
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [id, getProject]);

  const handleSubmit = async (data: UpdateProjectRequest) => {
    if (!id) return;

    try {
      await updateProject(parseInt(id, 10), data);
      navigate(`/projects/${id}`);
    } catch {
      // Error is handled by the hook
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
  if (error && !project) {
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
          {error}
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
        <PageHeader.Title
          title="Edit Project"
          description={`Job Code: ${project.jobCode}`}
        />
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
            isSubmitting={isLoading}
            error={error}
            onDismissError={clearError}
          />
        </div>
      </Card>
    </div>
  );
}
