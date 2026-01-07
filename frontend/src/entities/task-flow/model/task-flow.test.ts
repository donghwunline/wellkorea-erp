/**
 * Unit tests for taskFlowRules business logic.
 */

import { describe, it, expect } from 'vitest';
import { taskFlowRules } from './task-flow';
import type { TaskEdge } from './task-edge';

describe('taskFlowRules', () => {
  describe('hasCycle', () => {
    it('should return false for empty edges', () => {
      expect(taskFlowRules.hasCycle([])).toBe(false);
    });

    it('should return false for linear chain (A → B → C)', () => {
      const edges: TaskEdge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'B', target: 'C' },
      ];
      expect(taskFlowRules.hasCycle(edges)).toBe(false);
    });

    it('should return false for DAG with multiple paths (A → B, A → C, B → D, C → D)', () => {
      const edges: TaskEdge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'A', target: 'C' },
        { id: 'e3', source: 'B', target: 'D' },
        { id: 'e4', source: 'C', target: 'D' },
      ];
      expect(taskFlowRules.hasCycle(edges)).toBe(false);
    });

    it('should return true for self-loop (A → A)', () => {
      const edges: TaskEdge[] = [{ id: 'e1', source: 'A', target: 'A' }];
      expect(taskFlowRules.hasCycle(edges)).toBe(true);
    });

    it('should return true for simple cycle (A → B → A)', () => {
      const edges: TaskEdge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'B', target: 'A' },
      ];
      expect(taskFlowRules.hasCycle(edges)).toBe(true);
    });

    it('should return true for longer cycle (A → B → C → A)', () => {
      const edges: TaskEdge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'B', target: 'C' },
        { id: 'e3', source: 'C', target: 'A' },
      ];
      expect(taskFlowRules.hasCycle(edges)).toBe(true);
    });

    it('should return true for cycle in subset of graph', () => {
      // A → B → C (no cycle) + D → E → D (cycle)
      const edges: TaskEdge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'B', target: 'C' },
        { id: 'e3', source: 'D', target: 'E' },
        { id: 'e4', source: 'E', target: 'D' },
      ];
      expect(taskFlowRules.hasCycle(edges)).toBe(true);
    });

    it('should handle disconnected components without cycles', () => {
      const edges: TaskEdge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'C', target: 'D' },
      ];
      expect(taskFlowRules.hasCycle(edges)).toBe(false);
    });
  });
});
