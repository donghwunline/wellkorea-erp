/**
 * Unit tests for useQuotationActions hook.
 * Tests quotation CRUD operations, loading states, error handling, and state management.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useQuotationActions } from './useQuotationActions';
import { quotationService } from '@/services';
import { createMockQuotation } from '@/test/fixtures';
import type { CommandResult, CreateQuotationRequest, QuotationDetails, UpdateQuotationRequest } from '@/services';

// Mock the quotation service
vi.mock('@/services', () => ({
  quotationService: {
    getQuotation: vi.fn(),
    createQuotation: vi.fn(),
    updateQuotation: vi.fn(),
    submitForApproval: vi.fn(),
    createNewVersion: vi.fn(),
    downloadPdf: vi.fn(),
    sendRevisionNotification: vi.fn(),
  },
}));

describe('useQuotationActions', () => {
  const mockGetQuotation = quotationService.getQuotation as Mock;
  const mockCreateQuotation = quotationService.createQuotation as Mock;
  const mockUpdateQuotation = quotationService.updateQuotation as Mock;
  const mockSubmitForApproval = quotationService.submitForApproval as Mock;
  const mockCreateNewVersion = quotationService.createNewVersion as Mock;
  const mockDownloadPdf = quotationService.downloadPdf as Mock;
  const mockSendRevisionNotification = quotationService.sendRevisionNotification as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with isLoading false', () => {
      const { result } = renderHook(() => useQuotationActions());

      expect(result.current.isLoading).toBe(false);
    });

    it('should start with error null', () => {
      const { result } = renderHook(() => useQuotationActions());

      expect(result.current.error).toBeNull();
    });

    it('should return all action functions', () => {
      const { result } = renderHook(() => useQuotationActions());

      expect(typeof result.current.getQuotation).toBe('function');
      expect(typeof result.current.createQuotation).toBe('function');
      expect(typeof result.current.updateQuotation).toBe('function');
      expect(typeof result.current.submitForApproval).toBe('function');
      expect(typeof result.current.createNewVersion).toBe('function');
      expect(typeof result.current.downloadPdf).toBe('function');
      expect(typeof result.current.sendRevisionNotification).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('getQuotation', () => {
    it('should set isLoading true during fetch', async () => {
      let resolvePromise: (value: QuotationDetails) => void;
      mockGetQuotation.mockImplementation(
        () =>
          new Promise<QuotationDetails>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useQuotationActions());

      act(() => {
        void result.current.getQuotation(1);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise(createMockQuotation());
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call quotationService.getQuotation with id', async () => {
      const mockQuotation = createMockQuotation();
      mockGetQuotation.mockResolvedValue(mockQuotation);

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        await result.current.getQuotation(42);
      });

      expect(mockGetQuotation).toHaveBeenCalledWith(42);
    });

    it('should return fetched quotation', async () => {
      const mockQuotation = createMockQuotation({ id: 42 });
      mockGetQuotation.mockResolvedValue(mockQuotation);

      const { result } = renderHook(() => useQuotationActions());

      let fetchedQuotation: QuotationDetails | undefined;
      await act(async () => {
        fetchedQuotation = await result.current.getQuotation(42);
      });

      expect(fetchedQuotation).toEqual(mockQuotation);
    });

    it('should set error on failure', async () => {
      mockGetQuotation.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        try {
          await result.current.getQuotation(999);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Not found');
    });
  });

  describe('createQuotation', () => {
    it('should set isLoading true during creation', async () => {
      let resolvePromise: (value: CommandResult) => void;
      mockCreateQuotation.mockImplementation(
        () =>
          new Promise<CommandResult>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useQuotationActions());

      act(() => {
        void result.current.createQuotation({
          projectId: 1,
          lineItems: [],
        });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise({ id: 1, message: 'Created' });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call quotationService.createQuotation with data', async () => {
      const mockQuotation = createMockQuotation();
      mockCreateQuotation.mockResolvedValue(mockQuotation);

      const { result } = renderHook(() => useQuotationActions());

      const createData: CreateQuotationRequest = {
        projectId: 1,
        validityDays: 30,
        notes: 'Test notes',
        lineItems: [{ productId: 100, quantity: 5, unitPrice: 10000 }],
      };

      await act(async () => {
        await result.current.createQuotation(createData);
      });

      expect(mockCreateQuotation).toHaveBeenCalledWith(createData);
    });

    it('should return command result with id', async () => {
      const mockCommandResult: CommandResult = { id: 100, message: 'Quotation created successfully' };
      mockCreateQuotation.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useQuotationActions());

      let commandResult: CommandResult | undefined;
      await act(async () => {
        commandResult = await result.current.createQuotation({
          projectId: 1,
          lineItems: [],
        });
      });

      expect(commandResult).toEqual(mockCommandResult);
    });

    it('should set error on failure', async () => {
      mockCreateQuotation.mockRejectedValue(new Error('Validation failed'));

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        try {
          await result.current.createQuotation({
            projectId: 1,
            lineItems: [],
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Validation failed');
    });

    it('should re-throw error after setting state', async () => {
      const originalError = new Error('Creation failed');
      mockCreateQuotation.mockRejectedValue(originalError);

      const { result } = renderHook(() => useQuotationActions());

      await expect(
        act(async () => {
          await result.current.createQuotation({
            projectId: 1,
            lineItems: [],
          });
        })
      ).rejects.toThrow(originalError);
    });
  });

  describe('updateQuotation', () => {
    it('should set isLoading true during update', async () => {
      let resolvePromise: (value: CommandResult) => void;
      mockUpdateQuotation.mockImplementation(
        () =>
          new Promise<CommandResult>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useQuotationActions());

      act(() => {
        void result.current.updateQuotation(1, { lineItems: [] });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise({ id: 1, message: 'Updated' });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call quotationService.updateQuotation with id and data', async () => {
      const mockQuotation = createMockQuotation();
      mockUpdateQuotation.mockResolvedValue(mockQuotation);

      const { result } = renderHook(() => useQuotationActions());

      const updateData: UpdateQuotationRequest = {
        validityDays: 60,
        notes: 'Updated notes',
        lineItems: [{ productId: 100, quantity: 10, unitPrice: 15000 }],
      };

      await act(async () => {
        await result.current.updateQuotation(42, updateData);
      });

      expect(mockUpdateQuotation).toHaveBeenCalledWith(42, updateData);
    });

    it('should return command result with id', async () => {
      const mockCommandResult: CommandResult = { id: 1, message: 'Quotation updated successfully' };
      mockUpdateQuotation.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useQuotationActions());

      let commandResult: CommandResult | undefined;
      await act(async () => {
        commandResult = await result.current.updateQuotation(1, { lineItems: [] });
      });

      expect(commandResult).toEqual(mockCommandResult);
    });

    it('should set error on failure', async () => {
      mockUpdateQuotation.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        try {
          await result.current.updateQuotation(1, { lineItems: [] });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('submitForApproval', () => {
    it('should set isLoading true during submission', async () => {
      let resolvePromise: (value: CommandResult) => void;
      mockSubmitForApproval.mockImplementation(
        () =>
          new Promise<CommandResult>(resolve => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useQuotationActions());

      act(() => {
        void result.current.submitForApproval(1);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise({ id: 1, message: 'Submitted for approval' });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should call quotationService.submitForApproval with id', async () => {
      const mockCommandResult: CommandResult = { id: 42, message: 'Submitted for approval' };
      mockSubmitForApproval.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        await result.current.submitForApproval(42);
      });

      expect(mockSubmitForApproval).toHaveBeenCalledWith(42);
    });

    it('should return command result', async () => {
      const mockCommandResult: CommandResult = { id: 1, message: 'Submitted for approval' };
      mockSubmitForApproval.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useQuotationActions());

      let commandResult: CommandResult | undefined;
      await act(async () => {
        commandResult = await result.current.submitForApproval(1);
      });

      expect(commandResult).toEqual(mockCommandResult);
    });

    it('should set error on failure', async () => {
      mockSubmitForApproval.mockRejectedValue(new Error('Cannot submit'));

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        try {
          await result.current.submitForApproval(1);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Cannot submit');
    });
  });

  describe('createNewVersion', () => {
    it('should call quotationService.createNewVersion with id', async () => {
      const mockCommandResult: CommandResult = { id: 200, message: 'New version created' };
      mockCreateNewVersion.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        await result.current.createNewVersion(42);
      });

      expect(mockCreateNewVersion).toHaveBeenCalledWith(42);
    });

    it('should return command result with new version id', async () => {
      const mockCommandResult: CommandResult = { id: 200, message: 'New version created' };
      mockCreateNewVersion.mockResolvedValue(mockCommandResult);

      const { result } = renderHook(() => useQuotationActions());

      let commandResult: CommandResult | undefined;
      await act(async () => {
        commandResult = await result.current.createNewVersion(100);
      });

      expect(commandResult).toEqual(mockCommandResult);
    });

    it('should set error on failure', async () => {
      mockCreateNewVersion.mockRejectedValue(new Error('Version creation failed'));

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        try {
          await result.current.createNewVersion(1);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Version creation failed');
    });
  });

  describe('downloadPdf', () => {
    it('should call quotationService.downloadPdf with id', async () => {
      mockDownloadPdf.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        await result.current.downloadPdf(42);
      });

      expect(mockDownloadPdf).toHaveBeenCalledWith(42, undefined);
    });

    it('should pass custom filename', async () => {
      mockDownloadPdf.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        await result.current.downloadPdf(42, 'custom-name.pdf');
      });

      expect(mockDownloadPdf).toHaveBeenCalledWith(42, 'custom-name.pdf');
    });

    it('should set error on failure', async () => {
      mockDownloadPdf.mockRejectedValue(new Error('PDF generation failed'));

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        try {
          await result.current.downloadPdf(1);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('PDF generation failed');
    });
  });

  describe('sendRevisionNotification', () => {
    it('should call quotationService.sendRevisionNotification with id', async () => {
      mockSendRevisionNotification.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        await result.current.sendRevisionNotification(42);
      });

      expect(mockSendRevisionNotification).toHaveBeenCalledWith(42);
    });

    it('should set error on failure', async () => {
      mockSendRevisionNotification.mockRejectedValue(new Error('Email failed'));

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        try {
          await result.current.sendRevisionNotification(1);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Email failed');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockCreateQuotation.mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(() => useQuotationActions());

      // Create error state
      await act(async () => {
        try {
          await result.current.createQuotation({
            projectId: 1,
            lineItems: [],
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Some error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear error before new request', async () => {
      mockCreateQuotation.mockRejectedValueOnce(new Error('First error'));
      mockCreateQuotation.mockResolvedValueOnce(createMockQuotation());

      const { result } = renderHook(() => useQuotationActions());

      // First call fails
      await act(async () => {
        try {
          await result.current.createQuotation({
            projectId: 1,
            lineItems: [],
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second call should clear error
      await act(async () => {
        await result.current.createQuotation({
          projectId: 1,
          lineItems: [],
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('function stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useQuotationActions());

      const firstGet = result.current.getQuotation;
      const firstCreate = result.current.createQuotation;
      const firstUpdate = result.current.updateQuotation;
      const firstClear = result.current.clearError;

      rerender();

      expect(result.current.getQuotation).toBe(firstGet);
      expect(result.current.createQuotation).toBe(firstCreate);
      expect(result.current.updateQuotation).toBe(firstUpdate);
      expect(result.current.clearError).toBe(firstClear);
    });
  });
});
