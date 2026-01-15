/**
 * Task Flow Canvas Widget.
 * Provides a React Flow canvas for visualizing and editing task DAG.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/shared/ui';
import { Icon } from '@/shared/ui/primitives/Icon';
import {
  TaskNodeComponent,
  type TaskFlow,
  type TaskNode,
  type TaskEdge,
  type TaskFlowNode,
} from '@/entities/task-flow';
import { EditNodeModal } from '@/features/task-flow/edit-node';
import { useFlowState } from '../model/use-flow-state';

export interface TaskFlowCanvasProps {
  /** Task flow data */
  flow: TaskFlow;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Called when save is requested with current flow state */
  onSave?: (nodes: readonly TaskNode[], edges: readonly TaskEdge[]) => void;
  /** Called when changes occur (for external tracking) */
  onChangesStatusChange?: (hasChanges: boolean) => void;
}

// Register custom node types
const nodeTypes: NodeTypes = {
  task: TaskNodeComponent,
};

/**
 * Task Flow Canvas with React Flow visualization.
 * Includes toolbar for adding nodes and saving.
 */
export function TaskFlowCanvas({
  flow,
  isSaving = false,
  onSave,
  onChangesStatusChange,
}: TaskFlowCanvasProps) {
  // Edit modal state
  const [editingNode, setEditingNode] = useState<TaskNode | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);

  // Flow state management
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    hasChanges,
    markSaved,
    getTaskNodes,
    getTaskEdges,
    addNode,
    updateNode,
    deleteNode,
  } = useFlowState({
    initialFlow: flow,
    onNodeEdit: (node) => setEditingNode(node),
  });

  // Notify parent of changes status
  useMemo(() => {
    onChangesStatusChange?.(hasChanges);
  }, [hasChanges, onChangesStatusChange]);

  // Handle node click for editing
  const handleNodeClick: NodeMouseHandler<TaskFlowNode> = useCallback(
    (_event: React.MouseEvent, node: TaskFlowNode) => {
      const taskNode: TaskNode = {
        id: node.id,
        title: node.data.title,
        assignee: node.data.assignee,
        deadline: node.data.deadline,
        progress: node.data.progress,
        position: node.position,
      };
      setEditingNode(taskNode);
    },
    []
  );

  // Handle add node button
  const handleAddNode = useCallback(() => {
    // Calculate center position for new node
    const centerX = 250;
    const centerY = 150 + nodes.length * 100;
    const newNode = addNode({ x: centerX, y: centerY });
    // Open edit modal immediately for the new node
    setEditingNode(newNode);
    setIsAddingNode(true);
  }, [nodes.length, addNode]);

  // Handle save from modal
  const handleSaveNode = useCallback(
    (data: Omit<TaskNode, 'id' | 'position'>) => {
      if (editingNode) {
        updateNode(editingNode.id, data);
      }
      setEditingNode(null);
      setIsAddingNode(false);
    },
    [editingNode, updateNode]
  );

  // Handle delete from modal
  const handleDeleteNode = useCallback(() => {
    if (editingNode) {
      deleteNode(editingNode.id);
    }
    setEditingNode(null);
    setIsAddingNode(false);
  }, [editingNode, deleteNode]);

  // Handle close modal
  const handleCloseModal = useCallback(() => {
    // If we were adding a new node and closed without saving, delete it
    if (isAddingNode && editingNode) {
      deleteNode(editingNode.id);
    }
    setEditingNode(null);
    setIsAddingNode(false);
  }, [isAddingNode, editingNode, deleteNode]);

  // Handle save button
  const handleSave = useCallback(() => {
    if (onSave) {
      const taskNodes = getTaskNodes();
      const taskEdges = getTaskEdges();
      onSave(taskNodes, taskEdges);
      markSaved();
    }
  }, [onSave, getTaskNodes, getTaskEdges, markSaved]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-steel-700/50 bg-steel-800/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleAddNode}>
            <Icon name="plus" className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-yellow-400">Unsaved changes</span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
          >
            <Icon name="save" className="h-4 w-4" />
            <span>Save</span>
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
          className="bg-steel-900"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255, 255, 255, 0.1)"
          />
          <Controls
            className="[&>button]:!bg-steel-800 [&>button]:!border-steel-700 [&>button]:!text-white [&>button:hover]:!bg-steel-700"
          />
          <MiniMap
            nodeColor={() => 'rgb(59, 130, 246)'}
            maskColor="rgba(0, 0, 0, 0.6)"
            className="!bg-steel-800/80 !border-steel-700"
          />
        </ReactFlow>
      </div>

      {/* Edit Node Modal */}
      <EditNodeModal
        isOpen={editingNode !== null}
        node={editingNode}
        flowId={flow.id}
        onClose={handleCloseModal}
        onSave={handleSaveNode}
        onDelete={isAddingNode ? undefined : handleDeleteNode}
      />
    </div>
  );
}
