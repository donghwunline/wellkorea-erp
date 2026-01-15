/**
 * Custom React Flow node component for task visualization.
 * Displays task info with progress bar and connection handles.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { taskNodeRules, type TaskNode } from '../model/task-node';
import { AttachmentCountBadge } from '@/entities/blueprint-attachment';

/**
 * Node data structure expected by React Flow.
 * Index signature required for React Flow v12 compatibility.
 */
export interface TaskNodeData {
  readonly title: string;
  readonly assignee: string | null;
  readonly deadline: string | null;
  readonly progress: number;
  readonly attachmentCount?: number;
  readonly [key: string]: unknown;
}

export type TaskFlowNode = Node<TaskNodeData, 'task'>;

interface TaskNodeComponentProps extends NodeProps<TaskFlowNode> {
  /** Optional callback when node is clicked for editing */
  onEditClick?: (nodeId: string) => void;
}

/**
 * Custom React Flow node for displaying a task.
 *
 * Features:
 * - Blue handle on right (source/output)
 * - Gray handle on left (target/input)
 * - Progress bar with color coding (blue/yellow/green)
 * - Red border when overdue
 */
function TaskNodeComponentBase({ id, data, selected }: TaskNodeComponentProps) {
  const { title, assignee, deadline, progress, attachmentCount = 0 } = data;

  // Create a TaskNode object for business rule checks
  const taskNode: TaskNode = {
    id,
    title,
    assignee,
    deadline,
    progress,
    position: { x: 0, y: 0 }, // Position not needed for rules
  };

  const isOverdue = taskNodeRules.isOverdue(taskNode);
  const progressBarClass = taskNodeRules.getProgressBarClass(progress);

  // Format deadline for display
  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={`
        relative min-w-[180px] max-w-[220px] rounded-lg border-2 bg-white p-3 shadow-md
        transition-all duration-150
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        ${isOverdue ? 'border-red-500' : 'border-gray-200'}
      `}
    >
      {/* Target Handle (Input) - Left side, Gray */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-gray-400 !bg-gray-300"
      />

      {/* Task Content */}
      <div className="flex flex-col gap-2">
        {/* Title */}
        <h3 className="truncate text-sm font-semibold text-gray-900" title={title}>
          {title}
        </h3>

        {/* Meta info row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {/* Assignee */}
          <span className="truncate" title={assignee ?? undefined}>
            {assignee || '-'}
          </span>

          {/* Deadline and Attachment Badge */}
          <div className="flex items-center gap-2">
            <AttachmentCountBadge count={attachmentCount} />
            {formattedDeadline && (
              <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                {formattedDeadline}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${progressBarClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress percentage */}
        <div className="text-right text-xs font-medium text-gray-600">
          {progress}%
        </div>
      </div>

      {/* Source Handle (Output) - Right side, Blue */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-blue-400"
      />
    </div>
  );
}

export const TaskNodeComponent = memo(TaskNodeComponentBase);
