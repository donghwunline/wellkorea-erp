/**
 * useDownloadPdf Hook Tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createQueryWrapper } from '@/test/entity-test-utils';

// Mock the entity's downloadQuotationPdf function directly
const mockDownloadQuotationPdf = vi.hoisted(() => vi.fn());

vi.mock('@/entities/quotation', async () => {
  const actual = await vi.importActual('@/entities/quotation');
  return {
    ...actual,
    downloadQuotationPdf: mockDownloadQuotationPdf,
  };
});

import { useDownloadPdf } from './use-download-pdf';

describe('useDownloadPdf', () => {
  beforeEach(() => {
    mockDownloadQuotationPdf.mockReset();
  });

  describe('mutation state', () => {
    it('should return mutation object with required properties', () => {
      const { result } = renderHook(() => useDownloadPdf(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
    });

    it('should have isPending false initially', () => {
      const { result } = renderHook(() => useDownloadPdf(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('mutation execution', () => {
    it('should call downloadQuotationPdf on mutate', async () => {
      mockDownloadQuotationPdf.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDownloadPdf(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDownloadQuotationPdf).toHaveBeenCalledWith(1, undefined);
    });

    it('should pass custom filename', async () => {
      mockDownloadQuotationPdf.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDownloadPdf(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          quotationId: 1,
          filename: 'custom-quotation.pdf',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDownloadQuotationPdf).toHaveBeenCalledWith(
        1,
        'custom-quotation.pdf'
      );
    });

    it('should set isError true on failure', async () => {
      mockDownloadQuotationPdf.mockRejectedValue(new Error('Download failed'));

      const { result } = renderHook(() => useDownloadPdf(), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Download failed');
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      mockDownloadQuotationPdf.mockResolvedValue(undefined);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useDownloadPdf({ onSuccess }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Download failed');
      mockDownloadQuotationPdf.mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() => useDownloadPdf({ onError }), {
        wrapper: createQueryWrapper(),
      });

      await act(async () => {
        result.current.mutate({ quotationId: 1 });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
