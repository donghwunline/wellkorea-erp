/**
 * Upload Attachment Command Tests.
 *
 * Tests for the full 3-step presigned URL upload flow:
 * 1. Get presigned upload URL from backend
 * 2. Upload file directly to MinIO using presigned URL
 * 3. Register attachment metadata in backend
 */

import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { uploadAttachment, type UploadAttachmentInput } from './upload-attachment';
import { DomainValidationError } from '@/shared/api';

// =============================================================================
// Mock Setup
// =============================================================================

const mockGetUploadUrl = vi.hoisted(() => vi.fn());
const mockRegisterAttachment = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('./get-upload-url', () => ({
  getUploadUrl: mockGetUploadUrl,
}));

vi.mock('./register-attachment', () => ({
  registerAttachment: mockRegisterAttachment,
}));

// Mock global fetch
globalThis.fetch = mockFetch as unknown as typeof fetch;

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockFile(overrides?: Partial<File>): File {
  const file = new File(['test content'], 'blueprint.pdf', {
    type: 'application/pdf',
  });
  if (overrides) {
    Object.defineProperties(file, {
      name: { value: overrides.name ?? file.name },
      size: { value: overrides.size ?? file.size },
      type: { value: overrides.type ?? file.type },
    });
  }
  return file;
}

function createValidInput(overrides?: Partial<UploadAttachmentInput>): UploadAttachmentInput {
  return {
    flowId: 1,
    nodeId: 'node-1',
    file: createMockFile(),
    ...overrides,
  };
}

function createUploadUrlResponse() {
  return {
    uploadUrl: 'https://minio.example.com/bucket/blueprints/flow-1/node-1/blueprint.pdf?presigned',
    objectKey: 'blueprints/flow-1/node-1/blueprint.pdf',
  };
}

function createCommandResult(id: number = 1) {
  return {
    id,
    message: 'Attachment uploaded successfully',
  };
}

describe('uploadAttachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUploadUrl.mockResolvedValue(createUploadUrlResponse());
    mockRegisterAttachment.mockResolvedValue(createCommandResult());
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });
  });

  // ==========================================================================
  // Validation Tests - flowId
  // ==========================================================================

  describe('validation - flowId', () => {
    it('should pass with valid flowId', async () => {
      const input = createValidInput({ flowId: 1 });
      await expect(uploadAttachment(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when flowId is null', async () => {
      const input = createValidInput({ flowId: null as unknown as number });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);

      try {
        await uploadAttachment(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('flowId');
      }
    });

    it('should throw REQUIRED error when flowId is 0', async () => {
      const input = createValidInput({ flowId: 0 });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);
    });

    it('should throw REQUIRED error when flowId is negative', async () => {
      const input = createValidInput({ flowId: -1 });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);
    });
  });

  // ==========================================================================
  // Validation Tests - nodeId
  // ==========================================================================

  describe('validation - nodeId', () => {
    it('should pass with valid nodeId', async () => {
      const input = createValidInput({ nodeId: 'node-123' });
      await expect(uploadAttachment(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when nodeId is empty', async () => {
      const input = createValidInput({ nodeId: '' });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);

      try {
        await uploadAttachment(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('nodeId');
      }
    });

    it('should throw REQUIRED error when nodeId is whitespace only', async () => {
      const input = createValidInput({ nodeId: '   ' });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);
    });
  });

  // ==========================================================================
  // Validation Tests - file
  // ==========================================================================

  describe('validation - file', () => {
    it('should pass with valid file', async () => {
      const input = createValidInput();
      await expect(uploadAttachment(input)).resolves.not.toThrow();
    });

    it('should throw REQUIRED error when file is null', async () => {
      const input = createValidInput({ file: null as unknown as File });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);

      try {
        await uploadAttachment(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('REQUIRED');
        expect(e.fieldPath).toBe('file');
      }
    });

    it('should throw INVALID error for disallowed file extension', async () => {
      const file = createMockFile({ name: 'script.exe' });
      const input = createValidInput({ file });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);

      try {
        await uploadAttachment(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('INVALID');
        expect(e.fieldPath).toBe('file');
        expect(e.message).toContain('File type not allowed');
      }
    });

    it('should accept all allowed file extensions', async () => {
      const allowedFiles = ['file.pdf', 'file.dxf', 'file.dwg', 'file.png', 'file.jpg', 'file.jpeg'];

      for (const fileName of allowedFiles) {
        vi.clearAllMocks();
        mockGetUploadUrl.mockResolvedValue(createUploadUrlResponse());
        mockRegisterAttachment.mockResolvedValue(createCommandResult());
        mockFetch.mockResolvedValue({ ok: true });

        const file = createMockFile({ name: fileName });
        const input = createValidInput({ file });
        await expect(uploadAttachment(input)).resolves.not.toThrow();
      }
    });

    it('should throw INVALID error when file is empty (size 0)', async () => {
      const file = createMockFile({ size: 0 });
      const input = createValidInput({ file });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);

      try {
        await uploadAttachment(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('INVALID');
        expect(e.fieldPath).toBe('file');
        expect(e.message).toContain('empty');
      }
    });

    it('should throw OUT_OF_RANGE error when file exceeds max size', async () => {
      const file = createMockFile({ size: 100 * 1024 * 1024 }); // 100MB
      const input = createValidInput({ file });

      await expect(uploadAttachment(input)).rejects.toThrow(DomainValidationError);

      try {
        await uploadAttachment(input);
      } catch (error) {
        const e = error as DomainValidationError;
        expect(e.code).toBe('OUT_OF_RANGE');
        expect(e.fieldPath).toBe('file');
        expect(e.message).toContain('maximum');
      }
    });
  });

  // ==========================================================================
  // Full Flow Tests
  // ==========================================================================

  describe('full upload flow', () => {
    it('should call getUploadUrl with correct parameters', async () => {
      const file = createMockFile({ name: 'drawing.pdf', size: 2048, type: 'application/pdf' });
      const input = createValidInput({ flowId: 5, nodeId: 'my-node', file });

      await uploadAttachment(input);

      expect(mockGetUploadUrl).toHaveBeenCalledWith({
        flowId: 5,
        nodeId: 'my-node',
        fileName: 'drawing.pdf',
        fileSize: 2048,
        contentType: 'application/pdf',
      });
    });

    it('should use application/octet-stream when file type is empty', async () => {
      const file = createMockFile({ type: '' });
      const input = createValidInput({ file });

      await uploadAttachment(input);

      expect(mockGetUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'application/octet-stream',
        })
      );
    });

    it('should upload file directly to MinIO using presigned URL', async () => {
      const file = createMockFile({ type: 'application/pdf' });
      const input = createValidInput({ file });

      await uploadAttachment(input);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://minio.example.com/bucket/blueprints/flow-1/node-1/blueprint.pdf?presigned',
        {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': 'application/pdf',
          },
        }
      );
    });

    it('should call registerAttachment with correct parameters after upload', async () => {
      const file = createMockFile({ name: 'design.pdf', size: 4096 });
      const input = createValidInput({ flowId: 10, nodeId: 'target-node', file });

      mockGetUploadUrl.mockResolvedValue({
        uploadUrl: 'https://minio.example.com/presigned',
        objectKey: 'blueprints/flow-10/node-target-node/design.pdf',
      });

      await uploadAttachment(input);

      expect(mockRegisterAttachment).toHaveBeenCalledWith({
        flowId: 10,
        nodeId: 'target-node',
        fileName: 'design.pdf',
        fileSize: 4096,
        objectKey: 'blueprints/flow-10/node-target-node/design.pdf',
      });
    });

    it('should return CommandResult on successful upload', async () => {
      const expectedResult = {
        id: 42,
        message: 'Upload complete',
      };
      mockRegisterAttachment.mockResolvedValue(expectedResult);

      const input = createValidInput();
      const result = await uploadAttachment(input);

      expect(result).toEqual(expectedResult);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should propagate getUploadUrl errors', async () => {
      const error = new Error('Failed to get upload URL');
      mockGetUploadUrl.mockRejectedValue(error);

      const input = createValidInput();

      await expect(uploadAttachment(input)).rejects.toThrow('Failed to get upload URL');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRegisterAttachment).not.toHaveBeenCalled();
    });

    it('should throw error when MinIO upload fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      const input = createValidInput();

      await expect(uploadAttachment(input)).rejects.toThrow('Direct upload to storage failed: 403 Forbidden');
      expect(mockRegisterAttachment).not.toHaveBeenCalled();
    });

    it('should throw error when MinIO returns 500', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const input = createValidInput();

      await expect(uploadAttachment(input)).rejects.toThrow('Direct upload to storage failed: 500 Internal Server Error');
    });

    it('should propagate registerAttachment errors', async () => {
      const error = new Error('File not found in storage');
      mockRegisterAttachment.mockRejectedValue(error);

      const input = createValidInput();

      await expect(uploadAttachment(input)).rejects.toThrow('File not found in storage');
    });

    it('should handle network errors during MinIO upload', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const input = createValidInput();

      await expect(uploadAttachment(input)).rejects.toThrow('Network error');
      expect(mockRegisterAttachment).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Execution Order Tests
  // ==========================================================================

  describe('execution order', () => {
    it('should execute steps in correct order', async () => {
      const callOrder: string[] = [];

      mockGetUploadUrl.mockImplementation(async () => {
        callOrder.push('getUploadUrl');
        return createUploadUrlResponse();
      });

      mockFetch.mockImplementation(async () => {
        callOrder.push('fetch');
        return { ok: true };
      });

      mockRegisterAttachment.mockImplementation(async () => {
        callOrder.push('registerAttachment');
        return createCommandResult();
      });

      const input = createValidInput();
      await uploadAttachment(input);

      expect(callOrder).toEqual(['getUploadUrl', 'fetch', 'registerAttachment']);
    });

    it('should not call fetch if getUploadUrl fails', async () => {
      mockGetUploadUrl.mockRejectedValue(new Error('API error'));

      const input = createValidInput();

      try {
        await uploadAttachment(input);
      } catch {
        // Expected error
      }

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRegisterAttachment).not.toHaveBeenCalled();
    });

    it('should not call registerAttachment if fetch fails', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request' });

      const input = createValidInput();

      try {
        await uploadAttachment(input);
      } catch {
        // Expected error
      }

      expect(mockGetUploadUrl).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
      expect(mockRegisterAttachment).not.toHaveBeenCalled();
    });
  });
});
