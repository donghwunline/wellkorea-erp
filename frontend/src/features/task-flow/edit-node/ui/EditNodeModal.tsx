/**
 * Modal for editing a task node.
 * Provides form fields for title, assignee, deadline, and progress.
 * Includes buttons to create purchase requests (service/material) for existing tasks.
 *
 * FSD Notes:
 * - Purchase request modals are rendered at the widget layer (TaskFlowCanvas)
 *   via callback props to avoid feature-to-feature imports.
 * - Attachment panel is passed via render prop to avoid feature→widget import.
 */

import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DatePicker, FormField, Modal } from '@/shared/ui';
import { type TaskNode, taskNodeRules } from '@/entities/task-flow';
import { useEditNode } from '../model/use-edit-node';

export interface EditNodeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The node being edited (null for creating new node) */
  node: TaskNode | null;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when save is clicked with the updated/new node data */
  onSave: (nodeData: Omit<TaskNode, 'id' | 'position'>) => void;
  /** Called when delete is clicked (only for existing nodes) */
  onDelete?: () => void;
  /** Called when user wants to create a service (outsource) purchase request */
  onServiceRequest?: () => void;
  /** Called when user wants to create a material purchase request */
  onMaterialRequest?: () => void;
  /** Render prop for attachment panel (passed from widget layer to avoid FSD violation) */
  renderAttachments?: (nodeId: string) => ReactNode;
}

export function EditNodeModal({
  isOpen,
  node,
  onClose,
  onSave,
  onDelete,
  onServiceRequest,
  onMaterialRequest,
  renderAttachments,
}: Readonly<EditNodeModalProps>) {
  const { t } = useTranslation('common');
  const isEditing = node !== null;
  const { formState, errors, setTitle, setAssignee, setDeadline, setProgress, validate, reset } =
    useEditNode(node ?? undefined);

  // Reset form when node changes
  useEffect(() => {
    if (isOpen) {
      reset(node ?? undefined);
    }
  }, [isOpen, node, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        title: formState.title.trim(),
        assignee: formState.assignee.trim() || null,
        deadline: formState.deadline || null,
        progress: formState.progress,
      });
      // Note: Don't call onClose() here - the parent's onSave handler
      // will close the modal by setting editingNode to null.
      // Calling onClose() here would trigger the "cancel add" logic
      // which deletes the newly created node.
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(t('taskFlow.deleteConfirm'))) {
      onDelete();
      // Note: Don't call onClose() here - the parent's onDelete handler
      // will close the modal by setting editingNode to null.
    }
  };

  const progressColor = taskNodeRules.getProgressColor(formState.progress);
  const progressBarClass = taskNodeRules.getProgressBarClass(formState.progress);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? t('taskFlow.editTask') : t('taskFlow.addTask')} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title Field */}
        <FormField
          label={t('taskFlow.taskTitle')}
          value={formState.title}
          onChange={setTitle}
          placeholder={t('taskFlow.enterTaskTitle')}
          required
          error={errors.title}
        />

        {/* Assignee Field */}
        <FormField
          label={t('taskFlow.assignee')}
          value={formState.assignee}
          onChange={setAssignee}
          placeholder={t('taskFlow.enterAssignee')}
        />

        {/* Deadline Field */}
        <DatePicker
          label={t('taskFlow.deadline')}
          mode="single"
          value={formState.deadline}
          onChange={value => setDeadline(value as string)}
          placeholder={t('taskFlow.selectDeadline')}
        />

        {/* Progress Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-steel-300">
            {t('taskFlow.progress')}: {formState.progress}%
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={formState.progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-steel-700"
              style={{
                accentColor:
                  progressColor === 'blue'
                    ? '#3b82f6'
                    : progressColor === 'yellow'
                      ? '#eab308'
                      : '#22c55e',
              }}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={formState.progress}
              onChange={e => setProgress(Number(e.target.value))}
              className="h-8 w-16 rounded-lg border border-steel-700/50 bg-steel-900/60 px-2 text-center text-sm text-white"
            />
          </div>
          {/* Progress preview bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-steel-700">
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${progressBarClass}`}
              style={{ width: `${formState.progress}%` }}
            />
          </div>
          {errors.progress && <span className="text-xs text-red-400">{errors.progress}</span>}
        </div>

        {/* Attachments Section */}
        {renderAttachments && (
          <div className="border-t border-steel-700/50 pt-4">
            <h4 className="mb-3 text-sm font-medium text-steel-300">{t('taskFlow.attachments')}</h4>
            {isEditing ? (
              renderAttachments(node.id)
            ) : (
              <div className="rounded-lg border border-steel-700/50 bg-steel-800/30 p-4">
                <div className="flex items-center gap-2 text-steel-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">{t('taskFlow.saveFirst')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3">
          {/* Purchase Request Buttons - only for existing tasks */}
          {isEditing && (onServiceRequest || onMaterialRequest) && (
            <div className="flex gap-2 border-b border-steel-700/50 pb-3">
              {onServiceRequest && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onServiceRequest}
                  className="flex-1"
                >
                  {t('taskFlow.serviceRequest')}
                </Button>
              )}
              {onMaterialRequest && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onMaterialRequest}
                  className="flex-1"
                >
                  {t('taskFlow.materialRequest')}
                </Button>
              )}
            </div>
          )}

          {/* Standard Action Buttons */}
          <div className="flex items-center justify-between">
            {isEditing && onDelete ? (
              <Button type="button" variant="danger" onClick={handleDelete}>
                {t('buttons.delete')}
              </Button>
            ) : (
              <div /> // Spacer for layout
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                {t('buttons.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {isEditing ? t('buttons.save') : t('taskFlow.addTask')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
