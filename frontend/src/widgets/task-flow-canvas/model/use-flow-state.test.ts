/**
 * useFlowState Hook Tests.
 *
 * Tests for flow state management business logic.
 * Mocks @xyflow/react hooks to focus on our business logic.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowState, type UseFlowStateOptions } from './use-flow-state';
import type { TaskFlow, TaskNode, TaskEdge } from '@/entities/task-flow';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Mock @xyflow/react
const mockSetNodes = vi.fn();
const mockSetEdges = vi.fn();
const mockOnNodesChange = vi.fn();
const mockOnEdgesChange = vi.fn();

vi.mock('@xyflow/react', () => ({
  useNodesState: vi.fn((initial) => {
    // Simple state simulation - in real tests this would track state
    return [initial, mockSetNodes, mockOnNodesChange];
  }),
  useEdgesState: vi.fn((initial) => {
    return [initial, mockSetEdges, mockOnEdgesChange];
  }),
  addEdge: vi.fn((edge, edges) => [...edges, edge]),
}));

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestTaskNode(overrides: Partial<TaskNode> = {}): TaskNode {
  return {
    id: 'node-1',
    title: 'Test Task',
    assignee: 'Alice',
    deadline: '2025-01-15',
    progress: 50,
    position: { x: 100, y: 200 },
    ...overrides,
  };
}

function createTestTaskEdge(overrides: Partial<TaskEdge> = {}): TaskEdge {
  return {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    ...overrides,
  };
}

function createTestTaskFlow(overrides: Partial<TaskFlow> = {}): TaskFlow {
  return {
    id: 1,
    projectId: 100,
    nodes: [
      createTestTaskNode({ id: 'node-1', title: 'Task 1' }),
      createTestTaskNode({ id: 'node-2', title: 'Task 2' }),
    ],
    edges: [createTestTaskEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' })],
    createdAt: '2025-01-07T10:00:00Z',
    updatedAt: '2025-01-07T10:00:00Z',
    ...overrides,
  };
}

describe('useFlowState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetNodes.mockClear();
    mockSetEdges.mockClear();
    mockOnNodesChange.mockClear();
    mockOnEdgesChange.mockClear();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should initialize with empty arrays when no initialFlow provided', () => {
      const { result } = renderHook(() => useFlowState());

      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
    });

    it('should convert initial nodes to flow nodes', () => {
      const initialFlow = createTestTaskFlow();

      const { result } = renderHook(() => useFlowState({ initialFlow }));

      // Nodes should be converted to React Flow format
      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.nodes[0]).toMatchObject({
        id: 'node-1',
        type: 'task',
        position: { x: 100, y: 200 },
        data: {
          title: 'Task 1',
          assignee: 'Alice',
          deadline: '2025-01-15',
          progress: 50,
        },
      });
    });

    it('should convert initial edges to flow edges', () => {
      const initialFlow = createTestTaskFlow();

      const { result } = renderHook(() => useFlowState({ initialFlow }));

      expect(result.current.edges).toHaveLength(1);
      expect(result.current.edges[0]).toMatchObject({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'smoothstep',
      });
    });

    it('should start with hasChanges as false', () => {
      const { result } = renderHook(() => useFlowState());

      expect(result.current.hasChanges).toBe(false);
    });
  });

  // ==========================================================================
  // getTaskNodes / getTaskEdges Tests
  // ==========================================================================

  describe('getTaskNodes', () => {
    it('should return domain TaskNode objects', () => {
      const initialFlow = createTestTaskFlow();

      const { result } = renderHook(() => useFlowState({ initialFlow }));

      const taskNodes = result.current.getTaskNodes();

      expect(taskNodes).toHaveLength(2);
      expect(taskNodes[0]).toMatchObject({
        id: 'node-1',
        title: 'Task 1',
        assignee: 'Alice',
        deadline: '2025-01-15',
        progress: 50,
        position: { x: 100, y: 200 },
      });
    });

    it('should return readonly array', () => {
      const initialFlow = createTestTaskFlow();

      const { result } = renderHook(() => useFlowState({ initialFlow }));

      const taskNodes = result.current.getTaskNodes();

      expect(Array.isArray(taskNodes)).toBe(true);
    });
  });

  describe('getTaskEdges', () => {
    it('should return domain TaskEdge objects', () => {
      const initialFlow = createTestTaskFlow();

      const { result } = renderHook(() => useFlowState({ initialFlow }));

      const taskEdges = result.current.getTaskEdges();

      expect(taskEdges).toHaveLength(1);
      expect(taskEdges[0]).toMatchObject({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      });
    });
  });

  // ==========================================================================
  // addNode Tests
  // ==========================================================================

  describe('addNode', () => {
    it('should call setNodes with new node', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.addNode({ x: 150, y: 250 });
      });

      expect(mockSetNodes).toHaveBeenCalled();
    });

    it('should return the created TaskNode', () => {
      const { result } = renderHook(() => useFlowState());

      let newNode: TaskNode | undefined;
      act(() => {
        newNode = result.current.addNode({ x: 150, y: 250 });
      });

      expect(newNode).toBeDefined();
      expect(newNode!.title).toBe('New Task'); // Default from taskNodeRules.createDefault
      expect(newNode!.progress).toBe(0);
      expect(newNode!.position).toEqual({ x: 150, y: 250 });
    });

    it('should set hasChanges to true', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.addNode({ x: 150, y: 250 });
      });

      expect(result.current.hasChanges).toBe(true);
    });
  });

  // ==========================================================================
  // updateNode Tests
  // ==========================================================================

  describe('updateNode', () => {
    it('should call setNodes with updated node data', () => {
      const initialFlow = createTestTaskFlow();
      const { result } = renderHook(() => useFlowState({ initialFlow }));

      act(() => {
        result.current.updateNode('node-1', {
          title: 'Updated Task',
          assignee: 'Bob',
          deadline: '2025-01-20',
          progress: 75,
        });
      });

      expect(mockSetNodes).toHaveBeenCalled();
    });

    it('should set hasChanges to true', () => {
      const initialFlow = createTestTaskFlow();
      const { result } = renderHook(() => useFlowState({ initialFlow }));

      act(() => {
        result.current.updateNode('node-1', {
          title: 'Updated Task',
          assignee: 'Bob',
          deadline: null,
          progress: 100,
        });
      });

      expect(result.current.hasChanges).toBe(true);
    });
  });

  // ==========================================================================
  // deleteNode Tests
  // ==========================================================================

  describe('deleteNode', () => {
    it('should call setNodes to remove node', () => {
      const initialFlow = createTestTaskFlow();
      const { result } = renderHook(() => useFlowState({ initialFlow }));

      act(() => {
        result.current.deleteNode('node-1');
      });

      expect(mockSetNodes).toHaveBeenCalled();
    });

    it('should call setEdges to remove connected edges', () => {
      const initialFlow = createTestTaskFlow();
      const { result } = renderHook(() => useFlowState({ initialFlow }));

      act(() => {
        result.current.deleteNode('node-1');
      });

      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should set hasChanges to true', () => {
      const initialFlow = createTestTaskFlow();
      const { result } = renderHook(() => useFlowState({ initialFlow }));

      act(() => {
        result.current.deleteNode('node-1');
      });

      expect(result.current.hasChanges).toBe(true);
    });
  });

  // ==========================================================================
  // markSaved Tests
  // ==========================================================================

  describe('markSaved', () => {
    it('should reset hasChanges to false', () => {
      const { result } = renderHook(() => useFlowState());

      // First make a change
      act(() => {
        result.current.addNode({ x: 100, y: 100 });
      });

      expect(result.current.hasChanges).toBe(true);

      // Then mark as saved
      act(() => {
        result.current.markSaved();
      });

      expect(result.current.hasChanges).toBe(false);
    });
  });

  // ==========================================================================
  // onNodeClick Tests
  // ==========================================================================

  describe('onNodeClick', () => {
    it('should call onNodeEdit callback with domain TaskNode', () => {
      const onNodeEdit = vi.fn();
      const initialFlow = createTestTaskFlow();

      const { result } = renderHook(() =>
        useFlowState({ initialFlow, onNodeEdit })
      );

      act(() => {
        result.current.onNodeClick('node-1');
      });

      expect(onNodeEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'node-1',
          title: 'Task 1',
        })
      );
    });

    it('should not throw when onNodeEdit is not provided', () => {
      const initialFlow = createTestTaskFlow();

      const { result } = renderHook(() => useFlowState({ initialFlow }));

      expect(() => {
        act(() => {
          result.current.onNodeClick('node-1');
        });
      }).not.toThrow();
    });

    it('should not call onNodeEdit for non-existent node', () => {
      const onNodeEdit = vi.fn();
      const initialFlow = createTestTaskFlow();

      const { result } = renderHook(() =>
        useFlowState({ initialFlow, onNodeEdit })
      );

      act(() => {
        result.current.onNodeClick('non-existent');
      });

      expect(onNodeEdit).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // onConnect Tests
  // ==========================================================================

  describe('onConnect', () => {
    it('should call setEdges when connecting nodes', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.onConnect({
          source: 'node-1',
          target: 'node-2',
          sourceHandle: null,
          targetHandle: null,
        });
      });

      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should set hasChanges to true when connecting', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.onConnect({
          source: 'node-1',
          target: 'node-2',
          sourceHandle: null,
          targetHandle: null,
        });
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it('should not connect when source is null', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.onConnect({
          source: null,
          target: 'node-2',
          sourceHandle: null,
          targetHandle: null,
        });
      });

      expect(mockSetEdges).not.toHaveBeenCalled();
    });

    it('should not connect when target is null', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.onConnect({
          source: 'node-1',
          target: null,
          sourceHandle: null,
          targetHandle: null,
        });
      });

      expect(mockSetEdges).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty initial flow', () => {
      const initialFlow: TaskFlow = {
        id: 1,
        projectId: 100,
        nodes: [],
        edges: [],
        createdAt: null,
        updatedAt: null,
      };

      const { result } = renderHook(() => useFlowState({ initialFlow }));

      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
      expect(result.current.getTaskNodes()).toEqual([]);
      expect(result.current.getTaskEdges()).toEqual([]);
    });

    it('should handle node with null optional fields', () => {
      const initialFlow: TaskFlow = {
        id: 1,
        projectId: 100,
        nodes: [
          {
            id: 'node-1',
            title: 'Task',
            assignee: null,
            deadline: null,
            progress: 0,
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
        createdAt: null,
        updatedAt: null,
      };

      const { result } = renderHook(() => useFlowState({ initialFlow }));

      const nodes = result.current.getTaskNodes();
      expect(nodes[0].assignee).toBeNull();
      expect(nodes[0].deadline).toBeNull();
    });

    // TODO: Comprehensive edge case coverage
    // - Very large number of nodes/edges (performance)
    // - Rapid sequential updates
    // - Concurrent state changes
    // - Re-render with changed initialFlow prop
  });
});
