/**
 * Unit tests for quotationService.
 * Tests quotation CRUD operations, data transformation, pagination handling, and error propagation.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { quotationService } from './quotationService';
import {
  createMockQuotation,
  createMockPagedResponse,
  mockApiErrors,
} from '@/test/fixtures';
import type { CreateQuotationRequest, UpdateQuotationRequest } from './types';
import { httpClient } from '@/api';

// Mock httpClient with inline factory (vi.mock is hoisted)
vi.mock('@/api', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    requestWithMeta: vi.fn(),
  },
  QUOTATION_ENDPOINTS: {
    BASE: '/quotations',
    byId: (id: number) => `/quotations/${id}`,
    submit: (id: number) => `/quotations/${id}/submit`,
    versions: (id: number) => `/quotations/${id}/versions`,
    pdf: (id: number) => `/quotations/${id}/pdf`,
    sendNotification: (id: number) => `/quotations/${id}/send-revision-notification`,
  },
}));

describe('quotationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuotations', () => {
    it('should fetch paginated quotations and transform data', async () => {
      // Given: Mock paginated response
      const mockQuotation = createMockQuotation();
      const mockResponse = createMockPagedResponse([mockQuotation]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get quotations
      const result = await quotationService.getQuotations({ page: 0, size: 10 });

      // Then: Calls httpClient with correct params
      expect(httpClient.requestWithMeta).toHaveBeenCalledOnce();
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/quotations',
        params: { page: 0, size: 10 },
      });

      // And: Returns paginated data
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockQuotation);
      expect(result.pagination.totalElements).toBe(1);
    });

    it('should trim whitespace from text fields', async () => {
      // Given: Response with whitespace
      const mockQuotation = createMockQuotation({
        projectName: '  Test Project  ',
        notes: '  Some notes  ',
        createdByName: '  Creator  ',
      });
      const mockResponse = createMockPagedResponse([mockQuotation]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get quotations
      const result = await quotationService.getQuotations();

      // Then: Text fields are trimmed
      expect(result.data[0].projectName).toBe('Test Project');
      expect(result.data[0].notes).toBe('Some notes');
      expect(result.data[0].createdByName).toBe('Creator');
    });

    it('should handle filter params', async () => {
      // Given: Search and filter params
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get quotations with filter
      await quotationService.getQuotations({
        page: 0,
        size: 10,
        status: 'DRAFT',
        projectId: 123,
      });

      // Then: Passes all params
      expect(httpClient.requestWithMeta).toHaveBeenCalledWith({
        method: 'GET',
        url: '/quotations',
        params: {
          page: 0,
          size: 10,
          status: 'DRAFT',
          projectId: 123,
        },
      });
    });

    it('should handle empty results', async () => {
      // Given: Empty response
      const mockResponse = createMockPagedResponse([]);
      vi.mocked(httpClient.requestWithMeta).mockResolvedValue(mockResponse);

      // When: Get quotations
      const result = await quotationService.getQuotations();

      // Then: Returns empty array
      expect(result.data).toEqual([]);
      expect(result.pagination.totalElements).toBe(0);
    });

    it('should propagate API errors', async () => {
      // Given: API error
      vi.mocked(httpClient.requestWithMeta).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(quotationService.getQuotations()).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('getQuotation', () => {
    it('should fetch single quotation by ID and transform', async () => {
      // Given: Mock quotation response
      const mockQuotation = createMockQuotation({ id: 123 });
      vi.mocked(httpClient.get).mockResolvedValue(mockQuotation);

      // When: Get quotation by ID
      const result = await quotationService.getQuotation(123);

      // Then: Calls httpClient with correct URL
      expect(httpClient.get).toHaveBeenCalledOnce();
      expect(httpClient.get).toHaveBeenCalledWith('/quotations/123');

      // And: Returns transformed quotation
      expect(result.id).toBe(123);
    });

    it('should trim whitespace from text fields', async () => {
      // Given: Quotation with whitespace
      const mockQuotation = createMockQuotation({
        projectName: '  Project  ',
        createdByName: '  Creator  ',
        approvedByName: '  Approver  ',
        rejectionReason: '  Reason  ',
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockQuotation);

      // When: Get quotation
      const result = await quotationService.getQuotation(1);

      // Then: Data is trimmed
      expect(result.projectName).toBe('Project');
      expect(result.createdByName).toBe('Creator');
      expect(result.approvedByName).toBe('Approver');
      expect(result.rejectionReason).toBe('Reason');
    });

    it('should handle null optional fields', async () => {
      // Given: Quotation with null fields
      const mockQuotation = createMockQuotation({
        notes: null,
        approvedByName: null,
        rejectionReason: null,
      });
      vi.mocked(httpClient.get).mockResolvedValue(mockQuotation);

      // When: Get quotation
      const result = await quotationService.getQuotation(1);

      // Then: Null fields remain null
      expect(result.notes).toBeNull();
      expect(result.approvedByName).toBeNull();
      expect(result.rejectionReason).toBeNull();
    });

    it('should propagate 404 errors', async () => {
      // Given: Quotation not found
      vi.mocked(httpClient.get).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      await expect(quotationService.getQuotation(999)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('createQuotation', () => {
    it('should create quotation and return transformed result', async () => {
      // Given: Create request
      const createRequest: CreateQuotationRequest = {
        projectId: 1,
        validityDays: 30,
        notes: 'Test notes',
        lineItems: [
          { productId: 100, quantity: 5, unitPrice: 10000 },
        ],
      };

      const mockCreatedQuotation = createMockQuotation({
        id: 100,
        projectId: 1,
        version: 1,
      });
      vi.mocked(httpClient.post).mockResolvedValue(mockCreatedQuotation);

      // When: Create quotation
      const result = await quotationService.createQuotation(createRequest);

      // Then: Calls httpClient.post with correct data
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/quotations', createRequest);

      // And: Returns transformed quotation
      expect(result.id).toBe(100);
      expect(result.version).toBe(1);
    });

    it('should propagate validation errors', async () => {
      // Given: Validation error
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates validation error
      const request: CreateQuotationRequest = {
        projectId: 1,
        lineItems: [],
      };
      await expect(quotationService.createQuotation(request)).rejects.toEqual(mockApiErrors.validation);
    });
  });

  describe('updateQuotation', () => {
    it('should update quotation and return transformed result', async () => {
      // Given: Update request
      const updateRequest: UpdateQuotationRequest = {
        validityDays: 60,
        notes: 'Updated notes',
        lineItems: [
          { productId: 100, quantity: 10, unitPrice: 15000 },
        ],
      };

      const mockUpdatedQuotation = createMockQuotation({
        id: 50,
        validityDays: 60,
        notes: 'Updated notes',
      });
      vi.mocked(httpClient.put).mockResolvedValue(mockUpdatedQuotation);

      // When: Update quotation
      const result = await quotationService.updateQuotation(50, updateRequest);

      // Then: Calls httpClient.put with correct URL and data
      expect(httpClient.put).toHaveBeenCalledOnce();
      expect(httpClient.put).toHaveBeenCalledWith('/quotations/50', updateRequest);

      // And: Returns transformed quotation
      expect(result.id).toBe(50);
      expect(result.validityDays).toBe(60);
    });

    it('should propagate 404 errors', async () => {
      // Given: Quotation not found
      vi.mocked(httpClient.put).mockRejectedValue(mockApiErrors.notFound);

      // When/Then: Propagates 404
      const request: UpdateQuotationRequest = {
        validityDays: 30,
        lineItems: [],
      };
      await expect(quotationService.updateQuotation(999, request)).rejects.toEqual(mockApiErrors.notFound);
    });
  });

  describe('submitForApproval', () => {
    it('should submit quotation for approval', async () => {
      // Given: Mock submitted quotation
      const mockQuotation = createMockQuotation({
        id: 10,
        status: 'PENDING',
        submittedAt: '2025-01-15T10:00:00Z',
      });
      vi.mocked(httpClient.post).mockResolvedValue(mockQuotation);

      // When: Submit for approval
      const result = await quotationService.submitForApproval(10);

      // Then: Calls httpClient.post with correct URL
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/quotations/10/submit');

      // And: Returns updated quotation
      expect(result.id).toBe(10);
      expect(result.status).toBe('PENDING');
    });

    it('should propagate errors', async () => {
      // Given: Not allowed to submit
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.validation);

      // When/Then: Propagates error
      await expect(quotationService.submitForApproval(1)).rejects.toEqual(mockApiErrors.validation);
    });
  });

  describe('createNewVersion', () => {
    it('should create new version of quotation', async () => {
      // Given: Mock new version
      const mockNewVersion = createMockQuotation({
        id: 200,
        version: 2,
        status: 'DRAFT',
      });
      vi.mocked(httpClient.post).mockResolvedValue(mockNewVersion);

      // When: Create new version
      const result = await quotationService.createNewVersion(100);

      // Then: Calls httpClient.post with correct URL
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/quotations/100/versions');

      // And: Returns new version
      expect(result.id).toBe(200);
      expect(result.version).toBe(2);
    });

    it('should propagate errors', async () => {
      // Given: Error creating version
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(quotationService.createNewVersion(1)).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('generatePdf', () => {
    it('should generate PDF and return blob', async () => {
      // Given: Mock PDF response
      const mockPdfBuffer = new ArrayBuffer(100);
      vi.mocked(httpClient.request).mockResolvedValue(mockPdfBuffer);

      // When: Generate PDF
      const result = await quotationService.generatePdf(10);

      // Then: Calls httpClient.request with correct params
      expect(httpClient.request).toHaveBeenCalledOnce();
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/quotations/10/pdf',
        responseType: 'arraybuffer',
      });

      // And: Returns blob
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    it('should propagate errors', async () => {
      // Given: Error generating PDF
      vi.mocked(httpClient.request).mockRejectedValue(mockApiErrors.serverError);

      // When/Then: Propagates error
      await expect(quotationService.generatePdf(1)).rejects.toEqual(mockApiErrors.serverError);
    });
  });

  describe('downloadPdf', () => {
    it('should trigger download with default filename', async () => {
      // Given: Mock PDF response and DOM elements
      const mockPdfBuffer = new ArrayBuffer(100);
      vi.mocked(httpClient.request).mockResolvedValue(mockPdfBuffer);

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      // When: Download PDF
      await quotationService.downloadPdf(10);

      // Then: Creates link with correct download name
      expect(mockLink.download).toBe('quotation-10.pdf');
      expect(mockLink.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('should trigger download with custom filename', async () => {
      // Given: Mock PDF response
      const mockPdfBuffer = new ArrayBuffer(100);
      vi.mocked(httpClient.request).mockResolvedValue(mockPdfBuffer);

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      // When: Download PDF with custom filename
      await quotationService.downloadPdf(10, 'custom-name.pdf');

      // Then: Uses custom filename
      expect(mockLink.download).toBe('custom-name.pdf');
    });
  });

  describe('sendRevisionNotification', () => {
    it('should send revision notification', async () => {
      // Given: Mock success response
      vi.mocked(httpClient.post).mockResolvedValue('OK');

      // When: Send notification
      await quotationService.sendRevisionNotification(10);

      // Then: Calls httpClient.post with correct URL
      expect(httpClient.post).toHaveBeenCalledOnce();
      expect(httpClient.post).toHaveBeenCalledWith('/quotations/10/send-revision-notification');
    });

    it('should propagate errors', async () => {
      // Given: Error sending notification
      vi.mocked(httpClient.post).mockRejectedValue(mockApiErrors.forbidden);

      // When/Then: Propagates error
      await expect(quotationService.sendRevisionNotification(1)).rejects.toEqual(mockApiErrors.forbidden);
    });
  });
});
