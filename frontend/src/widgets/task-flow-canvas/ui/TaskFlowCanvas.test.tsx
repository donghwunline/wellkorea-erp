/**
 * TaskFlowCanvas Widget Tests.
 *
 * Simple render tests for the TaskFlowCanvas component.
 * Mocks @xyflow/react and feature components for isolation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskFlowCanvas, type TaskFlowCanvasProps } from './TaskFlowCanvas';
import type { TaskFlow } from '@/entities/task-flow';

// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  ReactFlow: vi.fn(({ children }) => (
    <div data-testid="react-flow-mock">{children}</div>
  )),
  Background: vi.fn(() => <div data-testid="background-mock" />),
  Controls: vi.fn(() => <div data-testid="controls-mock" />),
  MiniMap: vi.fn(() => <div data-testid="minimap-mock" />),
  BackgroundVariant: { Dots: 'dots' },
  useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  addEdge: vi.fn(),
}));

// Mock EditNodeModal feature
vi.mock('@/features/task-flow/edit-node', () => ({
  EditNodeModal: vi.fn(({ isOpen }) =>
    isOpen ? <div data-testid="edit-modal-mock">Edit Modal</div> : null
  ),
}));

// Mock useFlowState hook
const mockUseFlowState = {
  nodes: [],
  edges: [],
  onNodesChange: vi.fn(),
  onEdgesChange: vi.fn(),
  onConnect: vi.fn(),
  onNodeClick: vi.fn(),
  hasChanges: false,
  markSaved: vi.fn(),
  getTaskNodes: vi.fn(() => []),
  getTaskEdges: vi.fn(() => []),
  addNode: vi.fn(),
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
};

vi.mock('../model/use-flow-state', () => ({
  useFlowState: vi.fn(() => mockUseFlowState),
}));

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestTaskFlow(overrides: Partial<TaskFlow> = {}): TaskFlow {
  return {
    id: 1,
    projectId: 100,
    nodes: [],
    edges: [],
    createdAt: '2025-01-07T10:00:00Z',
    updatedAt: '2025-01-07T10:00:00Z',
    ...overrides,
  };
}

function renderComponent(props: Partial<TaskFlowCanvasProps> = {}) {
  const defaultProps: TaskFlowCanvasProps = {
    flow: createTestTaskFlow(),
    ...props,
  };
  return render(<TaskFlowCanvas {...defaultProps} />);
}

describe('TaskFlowCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUseFlowState.hasChanges = false;
    mockUseFlowState.nodes = [];
    mockUseFlowState.edges = [];
  });

  // ==========================================================================
  // Basic Render Tests
  // ==========================================================================

  describe('rendering', () => {
    it('should render without crashing', () => {
      renderComponent();

      expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
    });

    it('should render toolbar with Add Task button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
    });

    it('should render toolbar with Save button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should render React Flow canvas components', () => {
      renderComponent();

      expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
      expect(screen.getByTestId('background-mock')).toBeInTheDocument();
      expect(screen.getByTestId('controls-mock')).toBeInTheDocument();
      expect(screen.getByTestId('minimap-mock')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Save Button State Tests
  // ==========================================================================

  describe('Save button state', () => {
    it('should disable Save button when there are no changes', () => {
      mockUseFlowState.hasChanges = false;

      renderComponent();

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when there are changes', () => {
      mockUseFlowState.hasChanges = true;

      renderComponent();

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeEnabled();
    });

    it('should disable Save button when isSaving is true', () => {
      mockUseFlowState.hasChanges = true;

      renderComponent({ isSaving: true });

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should show "Unsaved changes" text when hasChanges is true', () => {
      mockUseFlowState.hasChanges = true;

      renderComponent();

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('should not show "Unsaved changes" text when hasChanges is false', () => {
      mockUseFlowState.hasChanges = false;

      renderComponent();

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Button Click Tests
  // ==========================================================================

  describe('button interactions', () => {
    it('should call addNode when Add Task button is clicked', async () => {
      const user = userEvent.setup();
      mockUseFlowState.addNode.mockReturnValue({
        id: 'new-node',
        title: 'New Task',
        assignee: null,
        deadline: null,
        progress: 0,
        position: { x: 250, y: 150 },
      });

      renderComponent();

      await user.click(screen.getByRole('button', { name: /add task/i }));

      expect(mockUseFlowState.addNode).toHaveBeenCalled();
    });

    it('should call onSave with nodes and edges when Save button is clicked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      mockUseFlowState.hasChanges = true;
      mockUseFlowState.getTaskNodes.mockReturnValue([
        { id: 'node-1', title: 'Task 1' },
      ]);
      mockUseFlowState.getTaskEdges.mockReturnValue([
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
      ]);

      renderComponent({ onSave });

      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(onSave).toHaveBeenCalledWith(
        [{ id: 'node-1', title: 'Task 1' }],
        [{ id: 'edge-1', source: 'node-1', target: 'node-2' }]
      );
    });

    it('should call markSaved after onSave', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      mockUseFlowState.hasChanges = true;

      renderComponent({ onSave });

      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(mockUseFlowState.markSaved).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Edit Modal Tests
  // ==========================================================================

  describe('edit modal', () => {
    it('should not render edit modal initially', () => {
      renderComponent();

      expect(screen.queryByTestId('edit-modal-mock')).not.toBeInTheDocument();
    });

    it('should open edit modal when Add Task is clicked', async () => {
      const user = userEvent.setup();
      mockUseFlowState.addNode.mockReturnValue({
        id: 'new-node',
        title: 'New Task',
        assignee: null,
        deadline: null,
        progress: 0,
        position: { x: 250, y: 150 },
      });

      renderComponent();

      await user.click(screen.getByRole('button', { name: /add task/i }));

      expect(screen.getByTestId('edit-modal-mock')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle flow with many nodes', () => {
      const flowWithManyNodes = createTestTaskFlow({
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `node-${i}`,
          title: `Task ${i}`,
          assignee: null,
          deadline: null,
          progress: 0,
          position: { x: i * 100, y: 0 },
        })),
      });

      expect(() => renderComponent({ flow: flowWithManyNodes })).not.toThrow();
    });

    it('should not call onSave when callback is not provided', async () => {
      const user = userEvent.setup();
      mockUseFlowState.hasChanges = true;

      renderComponent({ onSave: undefined });

      // Should not throw when clicking Save without onSave callback
      await expect(
        user.click(screen.getByRole('button', { name: /save/i }))
      ).resolves.not.toThrow();
    });

    // TODO: Comprehensive edge case coverage
    // - Keyboard accessibility
    // - Node drag interactions
    // - Edge connection interactions
    // - Canvas zoom/pan
    // - Delete node confirmation
  });
});
