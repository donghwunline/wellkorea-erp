/**
 * Project Create Page
 *
 * Page for creating new projects.
 * Shows success modal with generated JobCode after creation.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreateProjectRequest, ProjectDetails, UpdateProjectRequest } from '@/services';
import { Card, Icon, PageHeader } from '@/components/ui';
import { JobCodeSuccessModal, ProjectForm, useProjectActions } from '@/components/features/projects';

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const { createProject, isLoading, error, clearError } = useProjectActions();

  // Local UI State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProject, setCreatedProject] = useState<ProjectDetails | null>(null);

  const handleSubmit = async (data: CreateProjectRequest | UpdateProjectRequest) => {
    try {
      // In create mode, the form always provides CreateProjectRequest
      const project = await createProject(data as CreateProjectRequest);
      setCreatedProject(project);
      setShowSuccessModal(true);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/projects');
  };

  const handleViewProject = () => {
    if (createdProject) {
      navigate(`/projects/${createdProject.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="Create New Project"
          description="Create a new project with auto-generated Job Code"
        />
        <PageHeader.Actions>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            Back to Projects
          </button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Form Card */}
      <Card className="mx-auto max-w-2xl">
        <div className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">Project Details</h2>
          <ProjectForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isLoading}
            error={error}
            onDismissError={clearError}
          />
        </div>
      </Card>

      {/* Success Modal */}
      {createdProject && (
        <JobCodeSuccessModal
          isOpen={showSuccessModal}
          jobCode={createdProject.jobCode}
          onClose={handleSuccessClose}
          onViewProject={handleViewProject}
        />
      )}
    </div>
  );
}
