/**
 * Unit tests for useApprovalChainConfig hook.
 * Tests approval chain configuration fetching, updating, and user loading.
 */

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useApprovalChainConfig } from './useApprovalChainConfig.ts';
import { approvalChainService, userService } from '@/services';
import { createMockChainTemplate, createMockUserDetails } from '@/test/fixtures.ts';

// Mock the services
vi.mock('@/services', () => ({
  approvalChainService: {
    getChainTemplates: vi.fn(),
    updateChainLevels: vi.fn(),
  },
  userService: {
    getUsers: vi.fn(),
  },
}));

describe('useApprovalChainConfig', () => {
  const mockGetChainTemplates = approvalChainService.getChainTemplates as Mock;
  const mockUpdateChainLevels = approvalChainService.updateChainLevels as Mock;
  const mockGetUsers = userService.getUsers as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with isLoading true', () => {
      mockGetChainTemplates.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useApprovalChainConfig());

      expect(result.current.isLoading).toBe(true);
    });

    it('should start with empty templates', () => {
      mockGetChainTemplates.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useApprovalChainConfig());

      expect(result.current.templates).toEqual([]);
    });

    it('should start with null error', () => {
      mockGetChainTemplates.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useApprovalChainConfig());

      expect(result.current.error).toBeNull();
    });

    it('should start with isSaving false', () => {
      mockGetChainTemplates.mockImplementation(() => new Promise(() => {}));
      const { result } = renderHook(() => useApprovalChainConfig());

      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('fetching templates', () => {
    it('should fetch templates on mount', async () => {
      const mockTemplates = [createMockChainTemplate()];
      mockGetChainTemplates.mockResolvedValue(mockTemplates);

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetChainTemplates).toHaveBeenCalled();
      expect(result.current.templates).toEqual(mockTemplates);
    });

    it('should set error on fetch failure', async () => {
      mockGetChainTemplates.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load approval chain templates');
    });
  });

  describe('refetch', () => {
    it('should refetch templates when refetch is called', async () => {
      mockGetChainTemplates.mockResolvedValue([]);

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(mockGetChainTemplates).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetChainTemplates).toHaveBeenCalledTimes(2);
    });

    it('should clear error on successful refetch', async () => {
      mockGetChainTemplates.mockRejectedValueOnce(new Error('Error'));
      mockGetChainTemplates.mockResolvedValueOnce([createMockChainTemplate()]);

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load approval chain templates');
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('updateChainLevels', () => {
    it('should set isSaving true during update', async () => {
      mockGetChainTemplates.mockResolvedValue([]);

      let resolvePromise: (value: unknown) => void;
      mockUpdateChainLevels.mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        void result.current.updateChainLevels(1, []);
      });

      expect(result.current.isSaving).toBe(true);

      await act(async () => {
        resolvePromise({});
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should call service with templateId and levels', async () => {
      mockGetChainTemplates.mockResolvedValue([]);
      mockUpdateChainLevels.mockResolvedValue({});

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const levels = [{ levelOrder: 1, levelName: '팀장', approverUserId: 10, isRequired: true }];

      await act(async () => {
        await result.current.updateChainLevels(42, levels);
      });

      expect(mockUpdateChainLevels).toHaveBeenCalledWith(42, levels);
    });

    it('should refetch after successful update', async () => {
      mockGetChainTemplates.mockResolvedValue([]);
      mockUpdateChainLevels.mockResolvedValue({});

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(mockGetChainTemplates).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        await result.current.updateChainLevels(1, []);
      });

      expect(mockGetChainTemplates).toHaveBeenCalledTimes(2);
    });

    it('should set saveError on failure', async () => {
      mockGetChainTemplates.mockResolvedValue([]);
      mockUpdateChainLevels.mockRejectedValue(new Error('Validation failed'));

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateChainLevels(1, []);
        } catch {
          // Expected
        }
      });

      expect(result.current.saveError).toBe('Validation failed');
    });

    it('should re-throw error after setting state', async () => {
      mockGetChainTemplates.mockResolvedValue([]);
      const originalError = new Error('Update failed');
      mockUpdateChainLevels.mockRejectedValue(originalError);

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateChainLevels(1, []);
        })
      ).rejects.toThrow(originalError);
    });
  });

  describe('loadUsers', () => {
    it('should call userService.getUsers with search query', async () => {
      mockGetChainTemplates.mockResolvedValue([]);
      mockGetUsers.mockResolvedValue({
        data: [],
        pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true },
      });

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loadUsers('john');
      });

      expect(mockGetUsers).toHaveBeenCalledWith({
        search: 'john',
        page: 0,
        size: 20,
      });
    });

    it('should return combobox options from users', async () => {
      mockGetChainTemplates.mockResolvedValue([]);
      const mockUser = createMockUserDetails({
        id: 10,
        fullName: 'John Doe',
        email: 'john@example.com',
      });
      mockGetUsers.mockResolvedValue({
        data: [mockUser],
        pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true },
      });

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let options: unknown;
      await act(async () => {
        options = await result.current.loadUsers('john');
      });

      expect(options).toEqual([
        {
          id: 10,
          label: 'John Doe',
          description: 'john@example.com',
        },
      ]);
    });

    it('should use username if fullName is empty', async () => {
      mockGetChainTemplates.mockResolvedValue([]);
      const mockUser = createMockUserDetails({
        id: 10,
        username: 'johndoe',
        fullName: '',
        email: 'john@example.com',
      });
      mockGetUsers.mockResolvedValue({
        data: [mockUser],
        pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true },
      });

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let options: unknown;
      await act(async () => {
        options = await result.current.loadUsers('john');
      });

      expect(options).toEqual([
        {
          id: 10,
          label: 'johndoe',
          description: 'john@example.com',
        },
      ]);
    });
  });

  describe('clearSaveError', () => {
    it('should clear saveError', async () => {
      mockGetChainTemplates.mockResolvedValue([]);
      mockUpdateChainLevels.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create saveError
      await act(async () => {
        try {
          await result.current.updateChainLevels(1, []);
        } catch {
          // Expected
        }
      });

      expect(result.current.saveError).toBe('Error');

      // Clear saveError
      act(() => {
        result.current.clearSaveError();
      });

      expect(result.current.saveError).toBeNull();
    });
  });

  describe('function stability', () => {
    it('should return stable function references', async () => {
      mockGetChainTemplates.mockResolvedValue([]);

      const { result, rerender } = renderHook(() => useApprovalChainConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstRefetch = result.current.refetch;
      const firstUpdate = result.current.updateChainLevels;
      const firstLoadUsers = result.current.loadUsers;
      const firstClear = result.current.clearSaveError;

      rerender();

      expect(result.current.refetch).toBe(firstRefetch);
      expect(result.current.updateChainLevels).toBe(firstUpdate);
      expect(result.current.loadUsers).toBe(firstLoadUsers);
      expect(result.current.clearSaveError).toBe(firstClear);
    });
  });
});
