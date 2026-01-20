/**
 * Button for saving task flow changes.
 * Shows loading state during save operation.
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { Icon } from '@/shared/ui/primitives/Icon';
import type { TaskNode, TaskEdge } from '@/entities/task-flow';
import { useSaveFlow } from '../model/use-save-flow';

export interface SaveFlowButtonProps {
  /** Task flow ID */
  flowId: number;
  /** Current nodes */
  nodes: readonly TaskNode[];
  /** Current edges */
  edges: readonly TaskEdge[];
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Callback when save completes successfully */
  onSaved?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export function SaveFlowButton({
  flowId,
  nodes,
  edges,
  hasChanges,
  onSaved,
  onError,
}: SaveFlowButtonProps) {
  const { t } = useTranslation(['items', 'common']);
  const { mutate: save, isPending } = useSaveFlow({
    onSuccess: () => onSaved?.(),
    onError,
  });

  const handleSave = () => {
    save({
      id: flowId,
      nodes,
      edges,
    });
  };

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleSave}
      disabled={!hasChanges || isPending}
      isLoading={isPending}
    >
      <Icon name="save" className="h-4 w-4" />
      <span>{t('common:buttons.save')}</span>
    </Button>
  );
}
