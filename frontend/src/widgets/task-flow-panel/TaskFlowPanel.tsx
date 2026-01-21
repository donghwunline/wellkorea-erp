/**
 * Task Flow Panel Widget
 *
 * Displays task flow (process management) for a project including:
 * - Inline canvas view with expand button
 * - Fullscreen modal editor
 * - Loading/error/empty states
 *
 * FSD Layer: widgets
 * Can import from: features, entities, shared
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { type TaskEdge, taskFlowQueries, type TaskNode } from '@/entities/task-flow';
import { useSaveFlow } from '@/features/task-flow/save-flow';
import { Alert, Button, Card, Icon, Spinner } from '@/shared/ui';
import { TaskFlowCanvas, TaskFlowModal } from '@/widgets';

export interface TaskFlowPanelProps {
  /** Project ID to display task flow for */
  readonly projectId: number;
  /** Project name for modal title */
  readonly projectName: string;
}

export function TaskFlowPanel({ projectId, projectName }: TaskFlowPanelProps) {
  const { t } = useTranslation('widgets');
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch task flow data
  const {
    data: taskFlow,
    isLoading,
    error,
  } = useQuery(taskFlowQueries.byProject(projectId));

  // Save mutation
  const { mutate: saveTaskFlow, isPending: isSaving } = useSaveFlow();

  // Handle save from inline canvas
  const handleSave = useCallback(
    (nodes: readonly TaskNode[], edges: readonly TaskEdge[]) => {
      if (taskFlow) {
        saveTaskFlow({ id: taskFlow.id, nodes, edges });
      }
    },
    [taskFlow, saveTaskFlow]
  );

  // Check if task flow has nodes (not empty)
  const hasNodes = taskFlow && taskFlow.nodes.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <Spinner size="lg" label={t('taskFlowPanel.loadingLabel')} />
        <p className="mt-4 text-steel-400">{t('taskFlowPanel.loading')}</p>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="error">
        {t('taskFlowPanel.loadError', { message: error.message })}
      </Alert>
    );
  }

  // Empty state - show button to open editor
  if (!hasNodes) {
    return (
      <>
        <Card className="p-12 text-center">
          <Icon name="workflow" className="mx-auto mb-4 h-12 w-12 text-steel-600" />
          <h3 className="text-lg font-semibold text-white">{t('taskFlowPanel.emptyTitle')}</h3>
          <p className="mt-2 text-steel-500">
            {t('taskFlowPanel.emptyDescription')}
          </p>
          <Button
            variant="primary"
            className="mt-6"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon name="plus" className="h-4 w-4" />
            {t('taskFlowPanel.openEditor')}
          </Button>
        </Card>

        {/* Fullscreen Modal */}
        <TaskFlowModal
          isOpen={isModalOpen}
          projectId={projectId}
          projectName={projectName}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // Content state - show inline canvas with expand button
  return (
    <>
      <Card className="overflow-hidden">
        {/* Header with Expand Button */}
        <div className="flex items-center justify-between border-b border-steel-700/50 bg-steel-800/50 px-4 py-3">
          <h3 className="font-medium text-white">{t('taskFlowPanel.titleWithSuffix')}</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon name="arrows-pointing-out" className="h-4 w-4" />
            {t('taskFlowPanel.expandFullscreen')}
          </Button>
        </div>

        {/* Inline Canvas - Fixed 500px height */}
        <div className="h-[500px]">
          <TaskFlowCanvas
            flow={taskFlow}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </div>
      </Card>

      {/* Fullscreen Modal */}
      <TaskFlowModal
        isOpen={isModalOpen}
        projectId={projectId}
        projectName={projectName}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
