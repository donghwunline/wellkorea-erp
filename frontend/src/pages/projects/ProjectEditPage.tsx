/**
 * Project Edit Page
 *
 * Page for editing existing projects.
 * Loads project data and shows pre-filled form.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { UpdateProjectInput } from '@/entities/project';
import { projectQueries } from '@/entities/project';
import { Alert, Card, Icon, PageHeader, Spinner } from '@/shared/ui';
import { useUpdateProject } from '@/features/project/update';
import { ProjectForm } from '@/features/project/form';

export function ProjectEditPage() {
  const { t } = useTranslation('pages');
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
      setError(err instanceof Error ? err.message : t('projectEdit.updateError'));
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
          <PageHeader.Title title={t('projectEdit.loadingTitle')} />
        </PageHeader>
        <Card className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center p-12">
            <Spinner size="lg" label={t('projectEdit.loadingLabel')} />
            <span className="ml-3 text-steel-400">{t('projectEdit.loading')}</span>
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
          <PageHeader.Title title={t('projectEdit.errorTitle')} />
          <PageHeader.Actions>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('projectEdit.backToProjects')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="error" className="mx-auto max-w-2xl">
          {fetchError instanceof Error ? fetchError.message : t('projectEdit.loadError')}
        </Alert>
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title={t('projectEdit.notFoundTitle')} />
          <PageHeader.Actions>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
            >
              <Icon name="arrow-left" className="h-5 w-5" />
              {t('projectEdit.backToProjects')}
            </button>
          </PageHeader.Actions>
        </PageHeader>
        <Alert variant="warning" className="mx-auto max-w-2xl">
          {t('projectEdit.notFoundMessage')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title title={t('projectEdit.title')} description={t('projectEdit.description', { jobCode: project.jobCode })} />
        <PageHeader.Actions>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            {t('projectEdit.backToProject')}
          </button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Form Card */}
      <Card className="mx-auto max-w-2xl">
        <div className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">{t('projectEdit.editDetails')}</h2>
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
