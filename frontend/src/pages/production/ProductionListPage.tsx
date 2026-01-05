/**
 * Production List Page (FSD-Lite Version)
 *
 * Displays all work progress sheets for a project.
 * Allows viewing progress and navigating to details.
 *
 * Route: /projects/:projectId/production
 *
 * Architecture Notes:
 * - Page = assembly layer (combines entities, features, widgets)
 * - Data fetching via TanStack Query
 * - No refreshTrigger pattern - uses query invalidation
 */

import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Icon,
  IconButton,
  PageHeader,
} from '@/shared/ui';

// Entity imports - domain model and UI
import {
  workProgressQueries,
  WorkProgressSheetTable,
  ProjectProductionSummaryCard,
  type WorkProgressSheetListItem,
} from '@/entities/work-progress';
import { projectQueries } from '@/entities/project';
import { useAuth } from '@/entities/auth';

// Feature imports - user actions
import { CreateSheetDialog } from '@/features/work-progress/create-sheet';

/**
 * Roles that can create/modify production data.
 * Sales and Finance can only view (read-only).
 */
const PRODUCTION_UPDATE_ROLES = ['ROLE_ADMIN', 'ROLE_PRODUCTION'] as const;

export function ProductionListPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = projectId ? parseInt(projectId, 10) : 0;
  const { hasAnyRole } = useAuth();

  // Check if user can create production data
  const canCreate = useMemo(() => hasAnyRole([...PRODUCTION_UPDATE_ROLES]), [hasAnyRole]);

  // Dialog state for creating new sheet
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Query hooks - fetch project and work progress data
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery(
    projectQueries.detail(projectIdNum)
  );

  const { data: sheets, isLoading: sheetsLoading, error: sheetsError } = useQuery(
    workProgressQueries.list(projectIdNum)
  );

  const { data: summary } = useQuery(
    workProgressQueries.projectSummary(projectIdNum)
  );

  const isLoading = projectLoading || sheetsLoading;
  const error = projectError || sheetsError;

  // Render action buttons for each sheet row
  const renderActions = useCallback(
    (sheet: WorkProgressSheetListItem) => (
      <>
        {/* View - always available */}
        <IconButton
          onClick={() => navigate(`/production/${sheet.id}`)}
          aria-label="작업지 상세"
          title="작업지 상세"
        >
          <Icon name="eye" className="h-4 w-4" />
        </IconButton>
      </>
    ),
    [navigate]
  );

  if (!projectIdNum) {
    return (
      <div className="min-h-screen bg-steel-950 p-8">
        <Alert variant="error">
          Invalid project ID
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-950 p-8">
      {/* Header */}
      <PageHeader>
        <PageHeader.Title
          title="생산 관리"
          description={project ? `${project.jobCode} - ${project.projectName}` : 'Loading...'}
        />
        <PageHeader.Actions>
          <Button variant="secondary" onClick={() => navigate(`/projects/${projectIdNum}`)}>
            <Icon name="arrow-left" className="h-5 w-5" />
            프로젝트로 돌아가기
          </Button>
          {canCreate && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Icon name="plus" className="h-5 w-5" />
              작업지 추가
            </Button>
          )}
        </PageHeader.Actions>
      </PageHeader>

      {/* Error Message */}
      {error && (
        <Alert variant="error" className="mb-6">
          {error.message}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-8 text-steel-400">Loading...</div>
      ) : (
        <>
          {/* Production Summary */}
          {summary && (
            <div className="mb-6">
              <ProjectProductionSummaryCard summary={summary} />
            </div>
          )}

          {/* Work Progress Sheets Table */}
          <WorkProgressSheetTable
            sheets={sheets?.data ?? []}
            onRowClick={(sheet) => navigate(`/production/${sheet.id}`)}
            renderActions={renderActions}
            emptyMessage={
              canCreate
                ? "등록된 작업지가 없습니다. '작업지 추가' 버튼을 클릭하여 첫 작업지를 생성하세요."
                : '등록된 작업지가 없습니다.'
            }
          />
        </>
      )}

      {/* Create Sheet Dialog */}
      <CreateSheetDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        projectId={projectIdNum}
        onSuccess={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
