/**
 * Modal for editing a task node.
 * Provides form fields for title, assignee, deadline, and progress.
 * Includes buttons to create purchase requests (service/material) for existing tasks.
 *
 * FSD Note: Purchase request modals are rendered at the widget layer (TaskFlowCanvas)
 * via callback props to avoid feature-to-feature imports.
 */

import { useEffect } from 'react';
import { Button, DatePicker, FormField, Modal } from '@/shared/ui';
import { type TaskNode, taskNodeRules } from '@/entities/task-flow';
import { useEditNode } from '../model/use-edit-node';
import { AttachmentSection } from './AttachmentSection';

export interface EditNodeModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The node being edited (null for creating new node) */
  node: TaskNode | null;
  /** TaskFlow ID for attachment operations */
  flowId: number;
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
}

export function EditNodeModal({
  isOpen,
  node,
  flowId,
  onClose,
  onSave,
  onDelete,
  onServiceRequest,
  onMaterialRequest,
}: Readonly<EditNodeModalProps>) {
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
    if (onDelete && window.confirm('Are you sure you want to delete this task?')) {
      onDelete();
      // Note: Don't call onClose() here - the parent's onDelete handler
      // will close the modal by setting editingNode to null.
    }
  };

  const progressColor = taskNodeRules.getProgressColor(formState.progress);
  const progressBarClass = taskNodeRules.getProgressBarClass(formState.progress);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Add Task'} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title Field */}
        <FormField
          label="Task Title"
          value={formState.title}
          onChange={setTitle}
          placeholder="Enter task title"
          required
          error={errors.title}
        />

        {/* Assignee Field */}
        <FormField
          label="Assignee"
          value={formState.assignee}
          onChange={setAssignee}
          placeholder="Enter assignee name"
        />

        {/* Deadline Field */}
        <DatePicker
          label="Deadline"
          mode="single"
          value={formState.deadline}
          onChange={value => setDeadline(value as string)}
          placeholder="Select deadline"
        />

        {/* Progress Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-steel-300">
            Progress: {formState.progress}%
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
        <div className="border-t border-steel-700/50 pt-4">
          <h4 className="mb-3 text-sm font-medium text-steel-300">Blueprints & Attachments</h4>
          <AttachmentSection flowId={flowId} nodeId={isEditing ? node.id : null} />
        </div>

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
                  외주 요청
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
                  구매 요청
                </Button>
              )}
            </div>
          )}

          {/* Standard Action Buttons */}
          <div className="flex items-center justify-between">
            {isEditing && onDelete ? (
              <Button type="button" variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            ) : (
              <div /> // Spacer for layout
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {isEditing ? 'Save' : 'Add Task'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
