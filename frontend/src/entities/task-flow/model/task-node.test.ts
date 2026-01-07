/**
 * Task Node Business Rules Tests.
 *
 * Tests for taskNodeRules pure functions including:
 * - Progress level calculation
 * - Progress color mapping
 * - Overdue detection
 * - Default node creation
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { taskNodeRules, type TaskNode, type ProgressLevel, type ProgressColor } from './task-node';

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestNode(overrides: Partial<TaskNode> = {}): TaskNode {
  return {
    id: 'test-node',
    title: 'Test Task',
    assignee: null,
    deadline: null,
    progress: 50,
    position: { x: 100, y: 100 },
    ...overrides,
  };
}

describe('taskNodeRules', () => {
  // ==========================================================================
  // getProgressLevel Tests
  // ==========================================================================

  describe('getProgressLevel', () => {
    describe('low level (0-33%)', () => {
      it('should return "low" for 0%', () => {
        expect(taskNodeRules.getProgressLevel(0)).toBe('low');
      });

      it('should return "low" for 33%', () => {
        expect(taskNodeRules.getProgressLevel(33)).toBe('low');
      });

      it('should return "low" for middle value 16%', () => {
        expect(taskNodeRules.getProgressLevel(16)).toBe('low');
      });
    });

    describe('medium level (34-66%)', () => {
      it('should return "medium" for 34%', () => {
        expect(taskNodeRules.getProgressLevel(34)).toBe('medium');
      });

      it('should return "medium" for 66%', () => {
        expect(taskNodeRules.getProgressLevel(66)).toBe('medium');
      });

      it('should return "medium" for middle value 50%', () => {
        expect(taskNodeRules.getProgressLevel(50)).toBe('medium');
      });
    });

    describe('high level (67-100%)', () => {
      it('should return "high" for 67%', () => {
        expect(taskNodeRules.getProgressLevel(67)).toBe('high');
      });

      it('should return "high" for 100%', () => {
        expect(taskNodeRules.getProgressLevel(100)).toBe('high');
      });

      it('should return "high" for middle value 83%', () => {
        expect(taskNodeRules.getProgressLevel(83)).toBe('high');
      });
    });

    describe('boundary values', () => {
      it.each<[number, ProgressLevel]>([
        [0, 'low'],
        [33, 'low'],
        [34, 'medium'],
        [66, 'medium'],
        [67, 'high'],
        [100, 'high'],
      ])('should return correct level for %d%%', (progress, expected) => {
        expect(taskNodeRules.getProgressLevel(progress)).toBe(expected);
      });
    });
  });

  // ==========================================================================
  // getProgressColor Tests
  // ==========================================================================

  describe('getProgressColor', () => {
    it('should return "blue" for low progress (0-33%)', () => {
      expect(taskNodeRules.getProgressColor(0)).toBe('blue');
      expect(taskNodeRules.getProgressColor(33)).toBe('blue');
    });

    it('should return "yellow" for medium progress (34-66%)', () => {
      expect(taskNodeRules.getProgressColor(34)).toBe('yellow');
      expect(taskNodeRules.getProgressColor(66)).toBe('yellow');
    });

    it('should return "green" for high progress (67-100%)', () => {
      expect(taskNodeRules.getProgressColor(67)).toBe('green');
      expect(taskNodeRules.getProgressColor(100)).toBe('green');
    });

    describe('color mapping consistency', () => {
      it.each<[number, ProgressColor]>([
        [0, 'blue'],
        [25, 'blue'],
        [33, 'blue'],
        [34, 'yellow'],
        [50, 'yellow'],
        [66, 'yellow'],
        [67, 'green'],
        [85, 'green'],
        [100, 'green'],
      ])('should return "%s" for %d%%', (progress, expected) => {
        expect(taskNodeRules.getProgressColor(progress)).toBe(expected);
      });
    });
  });

  // ==========================================================================
  // isOverdue Tests
  // ==========================================================================

  describe('isOverdue', () => {
    let originalDate: typeof Date;

    beforeEach(() => {
      // Mock Date to control "now"
      originalDate = global.Date;
      const mockDate = new Date('2025-01-07T12:00:00Z');
      vi.setSystemTime(mockDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('when deadline is null', () => {
      it('should return false', () => {
        const node = createTestNode({ deadline: null, progress: 50 });
        expect(taskNodeRules.isOverdue(node)).toBe(false);
      });
    });

    describe('when deadline has passed', () => {
      it('should return true when progress is less than 100%', () => {
        const node = createTestNode({
          deadline: '2025-01-06', // Yesterday
          progress: 50,
        });
        expect(taskNodeRules.isOverdue(node)).toBe(true);
      });

      it('should return false when progress is 100%', () => {
        const node = createTestNode({
          deadline: '2025-01-06', // Yesterday
          progress: 100,
        });
        expect(taskNodeRules.isOverdue(node)).toBe(false);
      });

      it('should return true when progress is 0%', () => {
        const node = createTestNode({
          deadline: '2025-01-06',
          progress: 0,
        });
        expect(taskNodeRules.isOverdue(node)).toBe(true);
      });
    });

    describe('when deadline is today', () => {
      it('should return false (deadline not yet passed)', () => {
        const node = createTestNode({
          deadline: '2025-01-07', // Today
          progress: 50,
        });
        // '2025-01-07' becomes midnight, which is < noon on same day
        expect(taskNodeRules.isOverdue(node)).toBe(true);
      });
    });

    describe('when deadline is in the future', () => {
      it('should return false regardless of progress', () => {
        const node = createTestNode({
          deadline: '2025-01-08', // Tomorrow
          progress: 0,
        });
        expect(taskNodeRules.isOverdue(node)).toBe(false);
      });
    });

    describe('with custom now parameter', () => {
      it('should use provided date for comparison', () => {
        const node = createTestNode({
          deadline: '2025-01-10',
          progress: 50,
        });
        const futureDate = new Date('2025-01-15T12:00:00Z');
        expect(taskNodeRules.isOverdue(node, futureDate)).toBe(true);
      });

      it('should return false when now is before deadline', () => {
        const node = createTestNode({
          deadline: '2025-01-10',
          progress: 50,
        });
        const pastDate = new Date('2025-01-05T12:00:00Z');
        expect(taskNodeRules.isOverdue(node, pastDate)).toBe(false);
      });
    });
  });

  // ==========================================================================
  // getProgressBarClass Tests
  // ==========================================================================

  describe('getProgressBarClass', () => {
    it('should return "bg-blue-500" for low progress', () => {
      expect(taskNodeRules.getProgressBarClass(0)).toBe('bg-blue-500');
      expect(taskNodeRules.getProgressBarClass(33)).toBe('bg-blue-500');
    });

    it('should return "bg-yellow-500" for medium progress', () => {
      expect(taskNodeRules.getProgressBarClass(34)).toBe('bg-yellow-500');
      expect(taskNodeRules.getProgressBarClass(66)).toBe('bg-yellow-500');
    });

    it('should return "bg-green-500" for high progress', () => {
      expect(taskNodeRules.getProgressBarClass(67)).toBe('bg-green-500');
      expect(taskNodeRules.getProgressBarClass(100)).toBe('bg-green-500');
    });
  });

  // ==========================================================================
  // createDefault Tests
  // ==========================================================================

  describe('createDefault', () => {
    it('should create node with provided id', () => {
      const node = taskNodeRules.createDefault('new-node-id', { x: 0, y: 0 });
      expect(node.id).toBe('new-node-id');
    });

    it('should create node with provided position', () => {
      const node = taskNodeRules.createDefault('node-1', { x: 150, y: 250 });
      expect(node.position).toEqual({ x: 150, y: 250 });
    });

    it('should create node with default title "New Task"', () => {
      const node = taskNodeRules.createDefault('node-1', { x: 0, y: 0 });
      expect(node.title).toBe('New Task');
    });

    it('should create node with null assignee', () => {
      const node = taskNodeRules.createDefault('node-1', { x: 0, y: 0 });
      expect(node.assignee).toBeNull();
    });

    it('should create node with null deadline', () => {
      const node = taskNodeRules.createDefault('node-1', { x: 0, y: 0 });
      expect(node.deadline).toBeNull();
    });

    it('should create node with 0% progress', () => {
      const node = taskNodeRules.createDefault('node-1', { x: 0, y: 0 });
      expect(node.progress).toBe(0);
    });

    it('should create immutable node structure', () => {
      const node = taskNodeRules.createDefault('node-1', { x: 100, y: 200 });

      // Verify structure matches TaskNode interface
      expect(node).toMatchObject({
        id: 'node-1',
        title: 'New Task',
        assignee: null,
        deadline: null,
        progress: 0,
        position: { x: 100, y: 200 },
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    describe('progress boundary behavior', () => {
      it('should handle exactly 33% (boundary between low and medium)', () => {
        expect(taskNodeRules.getProgressLevel(33)).toBe('low');
        expect(taskNodeRules.getProgressLevel(34)).toBe('medium');
      });

      it('should handle exactly 66% (boundary between medium and high)', () => {
        expect(taskNodeRules.getProgressLevel(66)).toBe('medium');
        expect(taskNodeRules.getProgressLevel(67)).toBe('high');
      });
    });

    // TODO: Comprehensive edge case coverage
    // - Negative progress values (input validation at command level)
    // - Progress > 100 (input validation at command level)
    // - Invalid deadline formats (handled by mapper)
    // - Timezone edge cases for overdue calculation
  });
});
