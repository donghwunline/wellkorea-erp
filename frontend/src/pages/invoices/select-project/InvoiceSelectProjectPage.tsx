/**
 * Invoice Select Project Page
 *
 * Entry point for creating a new invoice.
 * Shows projects with accepted quotations that can have invoices created.
 *
 * Route: /invoices/create
 *
 * FSD Architecture:
 * - Page layer: project selection before invoice creation
 */

import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  PageHeader,
  Button,
  LoadingState,
  Alert,
  EmptyState,
} from '@/shared/ui';
import { projectQueries, type ProjectListItem } from '@/entities/project';

export function InvoiceSelectProjectPage() {
  const navigate = useNavigate();

  // Fetch all projects
  const {
    data: projectsData,
    isLoading,
    error,
  } = useQuery(
    projectQueries.list({
      page: 0,
      size: 100,
      search: '',
      status: null, // Fetch all statuses
    })
  );

  // Filter to projects that might have accepted quotations
  // (actual quotation check happens on InvoiceCreatePage)
  const projects = useMemo(() => {
    if (!projectsData?.data) return [];
    // Show active and completed projects - the create page will validate quotation status
    return projectsData.data.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'COMPLETED'
    );
  }, [projectsData]);

  const handleSelectProject = useCallback(
    (project: ProjectListItem) => {
      navigate(`/projects/${project.id}/invoices/create`);
    },
    [navigate]
  );

  const handleCancel = useCallback(() => {
    navigate('/invoices');
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Card>
          <LoadingState message="Loading projects..." />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">Failed to load projects: {error.message}</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="새 세금계산서 발행"
          description="Select a project to create an invoice for"
        />
        <PageHeader.Actions>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Project Selection */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Select Project
        </h3>
        <p className="mb-6 text-sm text-steel-400">
          Choose a project with an accepted quotation to create an invoice.
        </p>

        {projects.length === 0 ? (
          <EmptyState
            title="No Projects Available"
            description="There are no projects available for invoicing. Projects must be in progress or completed."
          />
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className="w-full rounded-lg border border-steel-700 bg-steel-800/50 p-4 text-left transition-colors hover:border-copper-500 hover:bg-steel-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">
                      {project.jobCode}
                    </div>
                    <div className="text-sm text-steel-400">
                      {project.customerName}
                    </div>
                  </div>
                  <div className="text-sm text-steel-500">
                    {project.status === 'ACTIVE' ? '진행중' : '완료'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
