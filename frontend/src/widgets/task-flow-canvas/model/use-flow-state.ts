/**
 * Hook for managing React Flow state.
 * Provides controlled state for nodes and edges with change tracking.
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import {
  type TaskNode,
  type TaskEdge,
  type TaskFlow,
  type TaskFlowNode,
  taskNodeRules,
} from '@/entities/task-flow';

/**
 * Convert domain TaskNode to React Flow node.
 */
function toFlowNode(node: TaskNode): TaskFlowNode {
  return {
    id: node.id,
    type: 'task',
    position: node.position,
    data: {
      title: node.title,
      assignee: node.assignee,
      deadline: node.deadline,
      progress: node.progress,
    },
  };
}

/**
 * Convert React Flow node back to domain TaskNode.
 */
function toTaskNode(node: TaskFlowNode): TaskNode {
  return {
    id: node.id,
    title: node.data.title,
    assignee: node.data.assignee,
    deadline: node.data.deadline,
    progress: node.data.progress,
    position: node.position,
  };
}

/**
 * Convert domain TaskEdge to React Flow edge.
 */
function toFlowEdge(edge: TaskEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
  };
}

/**
 * Convert React Flow edge back to domain TaskEdge.
 */
function toTaskEdge(edge: Edge): TaskEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
  };
}

export interface UseFlowStateOptions {
  /** Initial task flow data */
  initialFlow?: TaskFlow;
  /** Called when a node is clicked for editing */
  onNodeEdit?: (node: TaskNode) => void;
}

export interface UseFlowStateReturn {
  /** React Flow nodes */
  nodes: TaskFlowNode[];
  /** React Flow edges */
  edges: Edge[];
  /** Handler for node changes (drag, select, etc.) */
  onNodesChange: (changes: NodeChange<TaskFlowNode>[]) => void;
  /** Handler for edge changes (select, delete) */
  onEdgesChange: (changes: EdgeChange[]) => void;
  /** Handler for new edge connections */
  onConnect: (connection: Connection) => void;
  /** Handler for node click */
  onNodeClick: (nodeId: string) => void;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Mark changes as saved */
  markSaved: () => void;
  /** Get current nodes as domain model */
  getTaskNodes: () => readonly TaskNode[];
  /** Get current edges as domain model */
  getTaskEdges: () => readonly TaskEdge[];
  /** Add a new node */
  addNode: (position: { x: number; y: number }) => TaskNode;
  /** Update an existing node */
  updateNode: (nodeId: string, data: Omit<TaskNode, 'id' | 'position'>) => void;
  /** Delete a node and its connected edges */
  deleteNode: (nodeId: string) => void;
}

/**
 * Hook for managing task flow canvas state.
 */
export function useFlowState(options: UseFlowStateOptions = {}): UseFlowStateReturn {
  const { initialFlow, onNodeEdit } = options;

  // Initialize React Flow state
  const initialNodes = useMemo(
    () => initialFlow?.nodes.map(toFlowNode) ?? [],
    [initialFlow]
  );
  const initialEdges = useMemo(
    () => initialFlow?.edges.map(toFlowEdge) ?? [],
    [initialFlow]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if initial sync is in progress to avoid marking as dirty
  const isSyncingRef = useRef(false);

  // Sync with initial data when it changes
  useEffect(() => {
    if (initialFlow) {
      isSyncingRef.current = true;
      setNodes(initialFlow.nodes.map(toFlowNode));
      setEdges(initialFlow.edges.map(toFlowEdge));
      // Reset changes flag after sync completes on next tick
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
        setHasChanges(false);
      });
    }
  }, [initialFlow, setNodes, setEdges]);

  // Wrap change handlers to track dirty state
  const handleNodesChange = useCallback(
    (changes: NodeChange<TaskFlowNode>[]) => {
      onNodesChange(changes);
      // Position changes indicate dirty state
      if (changes.some(c => c.type === 'position' && c.dragging === false)) {
        setHasChanges(true);
      }
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (changes.some(c => c.type === 'remove')) {
        setHasChanges(true);
      }
    },
    [onEdgesChange]
  );

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const newEdge: Edge = {
          id: `e-${uuidv4()}`,
          source: connection.source,
          target: connection.target,
          type: 'smoothstep',
        };
        setEdges(eds => addEdge(newEdge, eds));
        setHasChanges(true);
      }
    },
    [setEdges]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node && onNodeEdit) {
        onNodeEdit(toTaskNode(node));
      }
    },
    [nodes, onNodeEdit]
  );

  // Mark as saved
  const markSaved = useCallback(() => {
    setHasChanges(false);
  }, []);

  // Get domain models
  const getTaskNodes = useCallback(
    (): readonly TaskNode[] => nodes.map(toTaskNode),
    [nodes]
  );

  const getTaskEdges = useCallback(
    (): readonly TaskEdge[] => edges.map(toTaskEdge),
    [edges]
  );

  // Add new node
  const addNode = useCallback(
    (position: { x: number; y: number }): TaskNode => {
      const id = `n-${uuidv4()}`;
      const newTaskNode = taskNodeRules.createDefault(id, position);
      const flowNode = toFlowNode(newTaskNode);
      setNodes(nds => [...nds, flowNode]);
      setHasChanges(true);
      return newTaskNode;
    },
    [setNodes]
  );

  // Update existing node
  const updateNode = useCallback(
    (nodeId: string, data: Omit<TaskNode, 'id' | 'position'>) => {
      setNodes(nds =>
        nds.map(node =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  title: data.title,
                  assignee: data.assignee,
                  deadline: data.deadline,
                  progress: data.progress,
                },
              }
            : node
        )
      );
      setHasChanges(true);
    },
    [setNodes]
  );

  // Delete node and connected edges
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes(nds => nds.filter(node => node.id !== nodeId));
      setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
      setHasChanges(true);
    },
    [setNodes, setEdges]
  );

  return {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect,
    onNodeClick,
    hasChanges,
    markSaved,
    getTaskNodes,
    getTaskEdges,
    addNode,
    updateNode,
    deleteNode,
  };
}
