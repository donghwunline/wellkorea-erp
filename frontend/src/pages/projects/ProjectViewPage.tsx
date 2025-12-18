/**
 * Project View Page
 *
 * Displays project details in read-only format.
 * Provides navigation to edit page.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ProjectDetails } from '@/services';
import { Alert, Button, Card, Icon, PageHeader } from '@/components/ui';
import {
  ProjectDetailsCard,
  ProjectRelatedNavigationGrid,
  useProjectActions,
} from '@/components/features/projects';

// Mock data for resolving names (to be replaced with real API)
const MOCK_CUSTOMERS: Record<number, string> = {
  1: 'Samsung Electronics',
  2: 'LG Display',
  3: 'SK Hynix',
  4: 'Hyundai Motor',
  5: 'POSCO',
};

const MOCK_USERS: Record<number, string> = {
  1: 'Kim Minjun (Admin)',
  2: 'Lee Jiwon (Sales)',
  3: 'Park Seohyun (Finance)',
  4: 'Choi Daehyun (Production)',
};

export function ProjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, isLoading, error } = useProjectActions();

  // Local State
  const [project, setProject] = useState<ProjectDetails | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        const data = await getProject(parseInt(id, 10));
        setProject(data);
      } catch {
        // Error is handled by the hook
      }
    };

    fetchProject();
  }, [id, getProject]);

  const handleBack = () => {
    navigate('/projects');
  };

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <PageHeader>
          <PageHeader.Title title="Loading..." />
        </PageHeader>
        <Card className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel-600 border-t-copper-500" />
            <span className="ml-3 text-steel-400">Loading project details...</span>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
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
        <Alert variant="error" className="mx-auto max-w-4xl">
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
        <Alert variant="warning" className="mx-auto max-w-4xl">
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
          title={project.projectName}
          description={`Job Code: ${project.jobCode}`}
        />
        <PageHeader.Actions>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-steel-400 transition-colors hover:text-white"
          >
            <Icon name="arrow-left" className="h-5 w-5" />
            Back to Projects
          </button>
          <Button onClick={handleEdit}>
            <Icon name="pencil" className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Project Details */}
      <div className="mx-auto max-w-4xl">
        <ProjectDetailsCard
          project={project}
          customerName={MOCK_CUSTOMERS[project.customerId]}
          internalOwnerName={MOCK_USERS[project.internalOwnerId]}
          createdByName={MOCK_USERS[project.createdById]}
        />

        {/* Related Sections Navigation */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Related Sections</h2>
          <ProjectRelatedNavigationGrid projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
