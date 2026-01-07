/**
 * Save Task Flow Command Function Tests.
 *
 * Tests for validation, input mapping, and API call behavior.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { saveTaskFlow, type SaveTaskFlowInput } from './save-task-flow';
import {
  createUpdatedResult,
  DomainValidationError,
} from '@/test/entity-test-utils';
import type { TaskNode } from '../model/task-node';
import type { TaskEdge } from '../model/task-edge';

/**
 * Helper for async validation error assertions.
 */
async function expectAsyncValidationError(
  fn: () => Promise<unknown>,
  expectedCode: string,
  expectedField: string,
  expectedMessagePattern?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw DomainValidationError');
  } catch (error) {
    if (!(error instanceof DomainValidationError)) {
      throw error;
    }
    expect(error.code).toBe(expectedCode);
    expect(error.fieldPath).toBe(expectedField);
    if (expectedMessagePattern) {
      if (typeof expectedMessagePattern === 'string') {
        expect(error.message).toContain(expectedMessagePattern);
      } else {
        expect(error.message).toMatch(expectedMessagePattern);
      }
    }
  }
}

// Use vi.hoisted to ensure mock is available during hoisting
const { mockPut } = vi.hoisted(() => ({
  mockPut: vi.fn(),
}));

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual<typeof import('@/shared/api')>('@/shared/api');
  return {
    ...actual,
    httpClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: mockPut,
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestNode(overrides: Partial<TaskNode> = {}): TaskNode {
  return {
    id: 'node-1',
    title: 'Test Task',
    assignee: null,
    deadline: null,
    progress: 50,
    position: { x: 100, y: 100 },
    ...overrides,
  };
}

function createTestEdge(overrides: Partial<TaskEdge> = {}): TaskEdge {
  return {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    ...overrides,
  };
}

function createValidInput(overrides: Partial<SaveTaskFlowInput> = {}): SaveTaskFlowInput {
  return {
    id: 1,
    nodes: [
      createTestNode({ id: 'node-1', title: 'Task 1' }),
      createTestNode({ id: 'node-2', title: 'Task 2' }),
    ],
    edges: [createTestEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' })],
    ...overrides,
  };
}

describe('saveTaskFlow', () => {
  beforeEach(() => {
    mockPut.mockReset();
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('validation', () => {
    describe('id validation', () => {
      it('should throw REQUIRED error when id is missing', async () => {
        const input = createValidInput({ id: 0 });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'REQUIRED',
          'id',
          'Task flow ID is required'
        );
      });

      it('should throw REQUIRED error when id is undefined', async () => {
        const input = { ...createValidInput(), id: undefined as unknown as number };

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'REQUIRED',
          'id'
        );
      });
    });

    describe('node title validation', () => {
      it('should throw REQUIRED error when node title is empty', async () => {
        const input = createValidInput({
          nodes: [createTestNode({ id: 'node-1', title: '' })],
          edges: [],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'REQUIRED',
          'nodes[0].title',
          'Task title is required'
        );
      });

      it('should throw REQUIRED error when node title is whitespace only', async () => {
        const input = createValidInput({
          nodes: [createTestNode({ id: 'node-1', title: '   ' })],
          edges: [],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'REQUIRED',
          'nodes[0].title'
        );
      });

      it('should validate correct node index in error field path', async () => {
        const input = createValidInput({
          nodes: [
            createTestNode({ id: 'node-1', title: 'Valid' }),
            createTestNode({ id: 'node-2', title: '' }),
          ],
          edges: [],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'REQUIRED',
          'nodes[1].title'
        );
      });
    });

    describe('progress validation', () => {
      it('should throw OUT_OF_RANGE error when progress is negative', async () => {
        const input = createValidInput({
          nodes: [createTestNode({ id: 'node-1', title: 'Task', progress: -1 })],
          edges: [],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'OUT_OF_RANGE',
          'nodes[0].progress',
          'Progress must be between 0 and 100'
        );
      });

      it('should throw OUT_OF_RANGE error when progress exceeds 100', async () => {
        const input = createValidInput({
          nodes: [createTestNode({ id: 'node-1', title: 'Task', progress: 101 })],
          edges: [],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'OUT_OF_RANGE',
          'nodes[0].progress'
        );
      });

      it('should accept progress at boundary values (0 and 100)', async () => {
        mockPut.mockResolvedValue(createUpdatedResult(1));

        const inputZero = createValidInput({
          nodes: [createTestNode({ id: 'node-1', title: 'Task', progress: 0 })],
          edges: [],
        });
        await expect(saveTaskFlow(inputZero)).resolves.not.toThrow();

        const inputHundred = createValidInput({
          nodes: [createTestNode({ id: 'node-1', title: 'Task', progress: 100 })],
          edges: [],
        });
        await expect(saveTaskFlow(inputHundred)).resolves.not.toThrow();
      });
    });

    describe('edge reference validation', () => {
      it('should throw INVALID_REFERENCE error when edge source references non-existent node', async () => {
        const input = createValidInput({
          nodes: [createTestNode({ id: 'node-1', title: 'Task 1' })],
          edges: [createTestEdge({ source: 'non-existent', target: 'node-1' })],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'INVALID_REFERENCE',
          'edges[0].source',
          'Edge source references non-existent node'
        );
      });

      it('should throw INVALID_REFERENCE error when edge target references non-existent node', async () => {
        const input = createValidInput({
          nodes: [createTestNode({ id: 'node-1', title: 'Task 1' })],
          edges: [createTestEdge({ source: 'node-1', target: 'non-existent' })],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'INVALID_REFERENCE',
          'edges[0].target',
          'Edge target references non-existent node'
        );
      });

      it('should validate correct edge index in error field path', async () => {
        const input = createValidInput({
          nodes: [
            createTestNode({ id: 'node-1', title: 'Task 1' }),
            createTestNode({ id: 'node-2', title: 'Task 2' }),
          ],
          edges: [
            createTestEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' }),
            createTestEdge({ id: 'edge-2', source: 'node-1', target: 'missing' }),
          ],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'INVALID_REFERENCE',
          'edges[1].target'
        );
      });
    });

    describe('cycle detection validation', () => {
      it('should throw CYCLE_DETECTED error for circular dependencies (A → B → A)', async () => {
        const input = createValidInput({
          nodes: [
            createTestNode({ id: 'A', title: 'Task A' }),
            createTestNode({ id: 'B', title: 'Task B' }),
          ],
          edges: [
            createTestEdge({ id: 'e1', source: 'A', target: 'B' }),
            createTestEdge({ id: 'e2', source: 'B', target: 'A' }),
          ],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'CYCLE_DETECTED',
          'edges',
          'circular dependencies'
        );
      });

      it('should throw CYCLE_DETECTED error for self-loop (A → A)', async () => {
        const input = createValidInput({
          nodes: [createTestNode({ id: 'A', title: 'Task A' })],
          edges: [createTestEdge({ id: 'e1', source: 'A', target: 'A' })],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'CYCLE_DETECTED',
          'edges'
        );
      });

      it('should accept valid DAG without cycles', async () => {
        mockPut.mockResolvedValue(createUpdatedResult(1));

        const input = createValidInput({
          nodes: [
            createTestNode({ id: 'A', title: 'Task A' }),
            createTestNode({ id: 'B', title: 'Task B' }),
            createTestNode({ id: 'C', title: 'Task C' }),
          ],
          edges: [
            createTestEdge({ id: 'e1', source: 'A', target: 'B' }),
            createTestEdge({ id: 'e2', source: 'B', target: 'C' }),
          ],
        });

        await expect(saveTaskFlow(input)).resolves.not.toThrow();
      });
    });

    describe('duplicate ID validation', () => {
      it('should throw DUPLICATE_ID error for duplicate node IDs', async () => {
        const input = createValidInput({
          nodes: [
            createTestNode({ id: 'same-id', title: 'Task 1' }),
            createTestNode({ id: 'same-id', title: 'Task 2' }),
          ],
          edges: [],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'DUPLICATE_ID',
          'nodes[1].id',
          'Duplicate node ID: same-id'
        );
      });

      it('should throw DUPLICATE_ID error for duplicate edge IDs', async () => {
        const input = createValidInput({
          nodes: [
            createTestNode({ id: 'A', title: 'Task A' }),
            createTestNode({ id: 'B', title: 'Task B' }),
            createTestNode({ id: 'C', title: 'Task C' }),
          ],
          edges: [
            createTestEdge({ id: 'same-edge', source: 'A', target: 'B' }),
            createTestEdge({ id: 'same-edge', source: 'B', target: 'C' }),
          ],
        });

        await expectAsyncValidationError(
          () => saveTaskFlow(input),
          'DUPLICATE_ID',
          'edges[1].id',
          'Duplicate edge ID: same-edge'
        );
      });

      it('should accept unique node and edge IDs', async () => {
        mockPut.mockResolvedValue(createUpdatedResult(1));

        const input = createValidInput({
          nodes: [
            createTestNode({ id: 'node-1', title: 'Task 1' }),
            createTestNode({ id: 'node-2', title: 'Task 2' }),
          ],
          edges: [createTestEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' })],
        });

        await expect(saveTaskFlow(input)).resolves.not.toThrow();
      });
    });
  });

  // ==========================================================================
  // Input Mapping Tests
  // ==========================================================================

  describe('input mapping', () => {
    it('should map nodes with correct structure to request', async () => {
      mockPut.mockResolvedValue(createUpdatedResult(1));

      const input = createValidInput({
        id: 1,
        nodes: [
          createTestNode({
            id: 'node-1',
            title: '  Task with spaces  ',
            assignee: '  Alice  ',
            deadline: '2025-01-15',
            progress: 75,
            position: { x: 150, y: 250 },
          }),
        ],
        edges: [],
      });

      await saveTaskFlow(input);

      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          nodes: [
            {
              id: 'node-1',
              title: 'Task with spaces', // trimmed
              assignee: 'Alice', // trimmed
              deadline: '2025-01-15',
              progress: 75,
              positionX: 150,
              positionY: 250,
            },
          ],
        })
      );
    });

    it('should map edges with correct structure to request', async () => {
      mockPut.mockResolvedValue(createUpdatedResult(1));

      const input = createValidInput({
        id: 1,
        nodes: [
          createTestNode({ id: 'node-1', title: 'Task 1' }),
          createTestNode({ id: 'node-2', title: 'Task 2' }),
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
        ],
      });

      await saveTaskFlow(input);

      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          edges: [
            { id: 'edge-1', source: 'node-1', target: 'node-2' },
          ],
        })
      );
    });

    it('should convert null assignee from undefined', async () => {
      mockPut.mockResolvedValue(createUpdatedResult(1));

      const input = createValidInput({
        id: 1,
        nodes: [createTestNode({ id: 'node-1', title: 'Task', assignee: null })],
        edges: [],
      });

      await saveTaskFlow(input);

      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          nodes: [expect.objectContaining({ assignee: null })],
        })
      );
    });

    it('should convert empty assignee string to null', async () => {
      mockPut.mockResolvedValue(createUpdatedResult(1));

      const input = createValidInput({
        id: 1,
        nodes: [createTestNode({ id: 'node-1', title: 'Task', assignee: '   ' })],
        edges: [],
      });

      await saveTaskFlow(input);

      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          nodes: [expect.objectContaining({ assignee: null })],
        })
      );
    });
  });

  // ==========================================================================
  // API Call Tests
  // ==========================================================================

  describe('API call', () => {
    it('should call PUT endpoint with correct URL', async () => {
      mockPut.mockResolvedValue(createUpdatedResult(42));

      const input = createValidInput({ id: 42 });
      await saveTaskFlow(input);

      expect(mockPut).toHaveBeenCalledWith(
        '/task-flows/42',
        expect.any(Object)
      );
    });

    it('should return CommandResult from API response', async () => {
      const expectedResult = { id: 1, message: 'Task flow saved successfully' };
      mockPut.mockResolvedValue(expectedResult);

      const input = createValidInput({ id: 1 });
      const result = await saveTaskFlow(input);

      expect(result).toEqual(expectedResult);
    });

    it('should handle empty nodes and edges arrays', async () => {
      mockPut.mockResolvedValue(createUpdatedResult(1));

      const input = createValidInput({
        id: 1,
        nodes: [],
        edges: [],
      });

      await saveTaskFlow(input);

      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        { nodes: [], edges: [] }
      );
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle nodes with null deadline', async () => {
      mockPut.mockResolvedValue(createUpdatedResult(1));

      const input = createValidInput({
        id: 1,
        nodes: [createTestNode({ id: 'node-1', title: 'Task', deadline: null })],
        edges: [],
      });

      await saveTaskFlow(input);

      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          nodes: [expect.objectContaining({ deadline: null })],
        })
      );
    });

    it('should handle multiple nodes and edges', async () => {
      mockPut.mockResolvedValue(createUpdatedResult(1));

      const input = createValidInput({
        id: 1,
        nodes: [
          createTestNode({ id: 'node-1', title: 'Task 1' }),
          createTestNode({ id: 'node-2', title: 'Task 2' }),
          createTestNode({ id: 'node-3', title: 'Task 3' }),
        ],
        edges: [
          createTestEdge({ id: 'edge-1', source: 'node-1', target: 'node-2' }),
          createTestEdge({ id: 'edge-2', source: 'node-2', target: 'node-3' }),
        ],
      });

      await saveTaskFlow(input);

      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          nodes: expect.arrayContaining([
            expect.objectContaining({ id: 'node-1' }),
            expect.objectContaining({ id: 'node-2' }),
            expect.objectContaining({ id: 'node-3' }),
          ]),
          edges: expect.arrayContaining([
            expect.objectContaining({ id: 'edge-1' }),
            expect.objectContaining({ id: 'edge-2' }),
          ]),
        })
      );
    });

    // TODO: Comprehensive edge case coverage
    // - Duplicate node IDs in same request (API validation)
    // - Very large number of nodes/edges (performance)
    // - Self-referencing edges (node-1 -> node-1)
    // - Circular dependencies (node-1 -> node-2 -> node-1)
    // - Network error handling (tested at httpClient level)
  });
});
