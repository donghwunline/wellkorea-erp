/**
 * Production Progress Panel Widget.
 *
 * Displays aggregated production progress for a project with sheet list.
 * Smart component - fetches data and handles navigation.
 *
 * FSD Layer: widgets (composes entities + features with data fetching)
 */

import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  workProgressQueries,
  WorkProgressSheetTable,
  ProjectProductionSummaryCard,
  type WorkProgressSheetListItem,
} from '@/entities/work-progress';
import { CreateSheetDialog } from '@/features/work-progress/create-sheet';
import { useAuth } from '@/entities/auth';
import { Alert, Button, Card, Icon, IconButton, Spinner } from '@/shared/ui';

/**
 * Roles that can create/modify production data.
 * Sales and Finance can only view (read-only).
 */
const PRODUCTION_UPDATE_ROLES = ['ROLE_ADMIN', 'ROLE_PRODUCTION'] as const;

export interface ProductionProgressPanelProps {
  /** Project ID to display production progress for */
  projectId: number;
}

/**
 * Panel showing production progress summary and work sheets for a project.
 * Used in project detail page under the "공정" tab.
 */
export function ProductionProgressPanel({
  projectId,
}: Readonly<ProductionProgressPanelProps>) {
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();

  // Check if user can create production data
  const canCreate = useMemo(() => hasAnyRole([...PRODUCTION_UPDATE_ROLES]), [hasAnyRole]);

  // Dialog state for creating new sheet
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch production summary
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery(workProgressQueries.projectSummary(projectId));

  // Fetch work progress sheets for this project
  const {
    data: sheets,
    isLoading: sheetsLoading,
    error: sheetsError,
    refetch,
  } = useQuery(workProgressQueries.list(projectId));

  const isLoading = summaryLoading || sheetsLoading;
  const error = summaryError || sheetsError;

  // Handle navigation to sheet detail
  const handleSheetClick = useCallback(
    (sheet: WorkProgressSheetListItem) => {
      navigate(`/production/${sheet.id}`);
    },
    [navigate]
  );

  // Handle opening create sheet dialog
  const handleCreateSheet = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  // Handle successful sheet creation
  const handleCreateSuccess = useCallback(() => {
    // Query invalidation is handled by the useCreateSheet hook
    // Optionally navigate to the new sheet
    setIsCreateDialogOpen(false);
  }, []);

  // Handle navigation to full production list
  const handleViewAllSheets = useCallback(() => {
    navigate(`/projects/${projectId}/production`);
  }, [navigate, projectId]);

  // Render action buttons for each sheet row
  const renderActions = useCallback(
    (sheet: WorkProgressSheetListItem) => (
      <IconButton
        onClick={() => navigate(`/production/${sheet.id}`)}
        aria-label="작업지 상세"
        title="작업지 상세"
      >
        <Icon name="eye" className="h-4 w-4" />
      </IconButton>
    ),
    [navigate]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" label="Loading production data" />
        <span className="ml-3 text-steel-400">Loading production data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="error" className="mb-6">
        <div className="flex items-center justify-between">
          <span>{error instanceof Error ? error.message : 'Failed to load production data'}</span>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  // Empty state - no sheets yet
  if (!sheets || sheets.data.length === 0) {
    return (
      <>
        <Card className="p-12 text-center">
          <Icon name="clipboard" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="mb-2 text-lg font-semibold text-white">작업지가 없습니다</h3>
          <p className="mb-6 text-steel-500">
            이 프로젝트에는 아직 작업지가 등록되지 않았습니다.
            {canCreate && (
              <>
                <br />
                작업지를 추가하여 생산 진행 상황을 추적하세요.
              </>
            )}
          </p>
          {canCreate && (
            <Button onClick={handleCreateSheet}>
              <Icon name="plus" className="h-5 w-5" />
              첫 작업지 추가
            </Button>
          )}
        </Card>

        {/* Create Sheet Dialog */}
        <CreateSheetDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          projectId={projectId}
          onSuccess={handleCreateSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleViewAllSheets}>
            <Icon name="list" className="h-5 w-5" />
            전체 목록
          </Button>
          {canCreate && (
            <Button onClick={handleCreateSheet}>
              <Icon name="plus" className="h-5 w-5" />
              작업지 추가
            </Button>
          )}
        </div>

        {/* Summary Card */}
        {summary && <ProjectProductionSummaryCard summary={summary} />}

        {/* Sheets Table */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">작업지 목록</h3>
          <WorkProgressSheetTable
            sheets={sheets.data}
            onRowClick={handleSheetClick}
            renderActions={renderActions}
            emptyMessage="등록된 작업지가 없습니다."
          />
        </div>
      </div>

      {/* Create Sheet Dialog */}
      <CreateSheetDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        projectId={projectId}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
