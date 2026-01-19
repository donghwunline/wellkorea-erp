# MinIO Presigned URL Implementation Plan

## Overview

Refactor the blueprint attachment upload/download flow to use presigned URLs for direct client-to-MinIO communication, eliminating the inefficient backend proxy pattern.

## Current Architecture (Problem)

```
┌──────────┐    multipart    ┌──────────┐    stream    ┌──────────┐
│  Client  │ ──────────────> │ Backend  │ ──────────> │  MinIO   │
│ (React)  │                 │ (Spring) │              │          │
└──────────┘                 └──────────┘              └──────────┘
```

**Issues:**
- Backend proxies entire file content (memory/CPU overhead)
- Double network transfer (client→backend→MinIO)
- Blocking request during upload
- Not scalable for large files

## Target Architecture (Solution)

```
┌──────────┐  1. GET upload URL   ┌──────────┐
│  Client  │ ──────────────────> │ Backend  │
│ (React)  │ <────────────────── │ (Spring) │
│          │  { uploadUrl, key } │          │
│          │                     └──────────┘
│          │
│          │  2. PUT file (direct)
│          │ ─────────────────────────────────> ┌──────────┐
│          │                                    │  MinIO   │
│          │                                    │          │
│          │  3. POST register                  └──────────┘
│          │ ──────────────────> ┌──────────┐
│          │ <────────────────── │ Backend  │
└──────────┘  { id, message }    └──────────┘
```

## Design Decisions (from user)

| Decision | Choice |
|----------|--------|
| Upload flow | Single callback: get URL → upload → register |
| Validation | Client-side only (before requesting presigned URL) |
| Migration | Remove old proxy endpoint immediately |
| Download auth | Backend generates URL on demand (validates auth first) |

---

## Backend Changes

### 1. Fix MinioFileStorage.java (Use publicMinioClient for presigned URLs)

**File:** `backend/src/main/java/com/wellkorea/backend/document/infrastructure/storage/MinioFileStorage.java`

**Change:** Replace `minioClient` with `publicMinioClient` in both presigned URL methods.

```java
// Line 248: generatePresignedUrl() - change minioClient to publicMinioClient
String url = publicMinioClient.getPresignedObjectUrl(  // was: minioClient
        GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(bucketName)
                .object(objectName)
                .expiry(expirySeconds)
                .build()
);

// Line 279: generatePresignedUploadUrl() - change minioClient to publicMinioClient
String url = publicMinioClient.getPresignedObjectUrl(  // was: minioClient
        GetPresignedObjectUrlArgs.builder()
                .method(Method.PUT)
                .bucket(bucketName)
                .object(objectName)
                .expiry(expirySeconds)
                .build()
);
```

### 2. Create New DTOs

**File:** `backend/src/main/java/com/wellkorea/backend/production/api/dto/command/UploadUrlRequest.java`

```java
package com.wellkorea.backend.production.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Request to generate a presigned upload URL.
 */
public record UploadUrlRequest(
        @NotBlank(message = "File name is required")
        String fileName,

        @Positive(message = "File size must be positive")
        Long fileSize,

        @NotBlank(message = "Content type is required")
        String contentType
) {}
```

**File:** `backend/src/main/java/com/wellkorea/backend/production/api/dto/command/UploadUrlResponse.java`

```java
package com.wellkorea.backend.production.api.dto.command;

/**
 * Response containing presigned upload URL and object key.
 */
public record UploadUrlResponse(
        String uploadUrl,
        String objectKey
) {}
```

**File:** `backend/src/main/java/com/wellkorea/backend/production/api/dto/command/RegisterAttachmentRequest.java`

```java
package com.wellkorea.backend.production.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Request to register an attachment after direct upload to MinIO.
 */
public record RegisterAttachmentRequest(
        @NotBlank(message = "File name is required")
        String fileName,

        @Positive(message = "File size must be positive")
        Long fileSize,

        @NotBlank(message = "Object key is required")
        String objectKey
) {}
```

### 3. Update BlueprintAttachmentService.java

**File:** `backend/src/main/java/com/wellkorea/backend/production/application/BlueprintAttachmentService.java`

**Add new methods:**

```java
/**
 * Generate a presigned URL for direct upload to MinIO.
 *
 * @param flowId      TaskFlow ID
 * @param nodeId      Node ID within the TaskFlow
 * @param fileName    Original file name
 * @param fileSize    File size in bytes
 * @param contentType MIME type
 * @return UploadUrlResponse with presigned URL and object key
 */
public UploadUrlResponse generateUploadUrl(Long flowId, String nodeId,
                                            String fileName, Long fileSize, String contentType) {
    // Validate TaskFlow exists
    TaskFlow taskFlow = taskFlowRepository.findById(flowId)
            .orElseThrow(() -> new ResourceNotFoundException("TaskFlow", flowId));

    // Validate node exists in the TaskFlow
    boolean nodeExists = taskFlow.getNodes().stream()
            .anyMatch(node -> node.getNodeId().equals(nodeId));
    if (!nodeExists) {
        throw new BusinessException("Node '" + nodeId + "' not found in TaskFlow " + flowId);
    }

    // Validate file type
    if (!AllowedFileType.isAllowed(fileName)) {
        throw new BusinessException("File type not allowed. Allowed types: " + AllowedFileType.getAllowedExtensions());
    }

    // Check for duplicate file name
    if (attachmentRepository.existsByTaskFlowIdAndNodeIdAndFileName(flowId, nodeId, fileName)) {
        throw new BusinessException("A file named '" + fileName + "' already exists for this task node");
    }

    // Generate storage path
    String storagePath = generateStoragePath(flowId, nodeId, fileName);

    // Generate presigned upload URL (15 minutes expiry)
    String uploadUrl = minioFileStorage.generatePresignedUploadUrl(storagePath, 15, TimeUnit.MINUTES);

    log.info("Generated presigned upload URL for: {} in flow {} node {}", fileName, flowId, nodeId);

    return new UploadUrlResponse(uploadUrl, storagePath);
}

/**
 * Register an attachment after successful direct upload to MinIO.
 *
 * @param flowId    TaskFlow ID
 * @param nodeId    Node ID within the TaskFlow
 * @param fileName  Original file name
 * @param fileSize  File size in bytes
 * @param objectKey MinIO object key (storage path)
 * @param userId    User who uploaded the file
 * @return ID of created attachment
 */
public Long registerAttachment(Long flowId, String nodeId,
                                String fileName, Long fileSize, String objectKey, Long userId) {
    // Validate TaskFlow exists
    TaskFlow taskFlow = taskFlowRepository.findById(flowId)
            .orElseThrow(() -> new ResourceNotFoundException("TaskFlow", flowId));

    // Validate node exists
    boolean nodeExists = taskFlow.getNodes().stream()
            .anyMatch(node -> node.getNodeId().equals(nodeId));
    if (!nodeExists) {
        throw new BusinessException("Node '" + nodeId + "' not found in TaskFlow " + flowId);
    }

    // Verify file exists in MinIO
    if (!minioFileStorage.fileExists(objectKey)) {
        throw new BusinessException("File not found in storage. Upload may have failed.");
    }

    // Get user
    User uploadedBy = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

    // Create attachment entity
    BlueprintAttachment attachment = BlueprintAttachment.create(
            taskFlow,
            nodeId,
            fileName,
            fileSize,
            objectKey,
            uploadedBy
    );

    attachment = attachmentRepository.save(attachment);
    log.info("Registered blueprint attachment: {} to node {} in flow {} (id: {})",
            fileName, nodeId, flowId, attachment.getId());

    return attachment.getId();
}
```

**Remove old method:** Delete `uploadAttachment(Long flowId, String nodeId, MultipartFile file, Long userId)`

### 4. Update BlueprintAttachmentController.java

**File:** `backend/src/main/java/com/wellkorea/backend/production/api/BlueprintAttachmentController.java`

**Replace upload endpoint with new endpoints:**

```java
// Remove this import:
// import org.springframework.web.multipart.MultipartFile;

// Add new imports:
import com.wellkorea.backend.production.api.dto.command.UploadUrlRequest;
import com.wellkorea.backend.production.api.dto.command.UploadUrlResponse;
import com.wellkorea.backend.production.api.dto.command.RegisterAttachmentRequest;
import jakarta.validation.Valid;

// ========== COMMAND ENDPOINTS ==========

/**
 * Get presigned URL for direct upload to MinIO.
 * POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url
 */
@PostMapping("/task-flows/{flowId}/nodes/{nodeId}/attachments/upload-url")
@PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
public ResponseEntity<ApiResponse<UploadUrlResponse>> getUploadUrl(
        @PathVariable Long flowId,
        @PathVariable String nodeId,
        @Valid @RequestBody UploadUrlRequest request) {
    UploadUrlResponse response = attachmentService.generateUploadUrl(
            flowId, nodeId, request.fileName(), request.fileSize(), request.contentType());
    return ResponseEntity.ok(ApiResponse.success(response));
}

/**
 * Register an attachment after direct upload to MinIO.
 * POST /api/task-flows/{flowId}/nodes/{nodeId}/attachments/register
 */
@PostMapping("/task-flows/{flowId}/nodes/{nodeId}/attachments/register")
@PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION')")
public ResponseEntity<ApiResponse<BlueprintCommandResult>> registerAttachment(
        @PathVariable Long flowId,
        @PathVariable String nodeId,
        @Valid @RequestBody RegisterAttachmentRequest request,
        @AuthenticationPrincipal AuthenticatedUser user) {
    Long attachmentId = attachmentService.registerAttachment(
            flowId, nodeId, request.fileName(), request.fileSize(), request.objectKey(), user.getUserId());
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(BlueprintCommandResult.uploaded(attachmentId)));
}

// DELETE the old uploadAttachment method that accepts MultipartFile
```

**Remove proxy download endpoint (optional - keep for backward compatibility if needed):**
The `/api/blueprints/{id}/download` endpoint can be kept for internal use or removed.

---

## Frontend Changes

### 1. Update Endpoints

**File:** `frontend/src/shared/config/endpoints.ts`

```typescript
export const BLUEPRINT_ENDPOINTS = {
  /** List all attachments for a flow: GET /task-flows/:flowId/attachments */
  byFlow: (flowId: number) => `/task-flows/${flowId}/attachments`,
  /** List attachments for a node: GET /task-flows/:flowId/nodes/:nodeId/attachments */
  byNode: (flowId: number, nodeId: string) =>
    `/task-flows/${flowId}/nodes/${nodeId}/attachments`,
  /** Get presigned upload URL: POST /task-flows/:flowId/nodes/:nodeId/attachments/upload-url */
  uploadUrl: (flowId: number, nodeId: string) =>
    `/task-flows/${flowId}/nodes/${nodeId}/attachments/upload-url`,
  /** Register attachment after upload: POST /task-flows/:flowId/nodes/:nodeId/attachments/register */
  register: (flowId: number, nodeId: string) =>
    `/task-flows/${flowId}/nodes/${nodeId}/attachments/register`,
  /** Get attachment metadata: GET /blueprints/:id */
  byId: (id: number) => `/blueprints/${id}`,
  /** Get presigned download URL: GET /blueprints/:id/url */
  url: (id: number) => `/blueprints/${id}/url`,
  /** Delete attachment: DELETE /blueprints/:id */
  delete: (id: number) => `/blueprints/${id}`,
} as const;

// Remove: upload, download (no longer needed)
```

### 2. Create New API Functions

**File:** `frontend/src/entities/blueprint-attachment/api/get-upload-url.ts`

```typescript
/**
 * Get presigned upload URL for direct MinIO upload.
 */

import { httpClient, DomainValidationError, BLUEPRINT_ENDPOINTS } from '@/shared/api';
import { fileTypeRules, MAX_FILE_SIZE } from '../model/allowed-file-type';

export interface GetUploadUrlInput {
  flowId: number;
  nodeId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

function validateInput(input: GetUploadUrlInput): void {
  if (!input.flowId || input.flowId <= 0) {
    throw new DomainValidationError('REQUIRED', 'flowId', 'TaskFlow is required');
  }
  if (!input.nodeId || input.nodeId.trim().length === 0) {
    throw new DomainValidationError('REQUIRED', 'nodeId', 'Node ID is required');
  }
  if (!input.fileName || input.fileName.trim().length === 0) {
    throw new DomainValidationError('REQUIRED', 'fileName', 'File name is required');
  }
  if (!fileTypeRules.isAllowedExtension(input.fileName)) {
    throw new DomainValidationError(
      'INVALID',
      'fileName',
      `File type not allowed. Allowed types: ${fileTypeRules.getAllowedExtensionsString()}`
    );
  }
  if (input.fileSize <= 0) {
    throw new DomainValidationError('INVALID', 'fileSize', 'File is empty');
  }
  if (input.fileSize > MAX_FILE_SIZE) {
    throw new DomainValidationError(
      'OUT_OF_RANGE',
      'fileSize',
      `File size exceeds maximum of ${fileTypeRules.getMaxFileSizeFormatted()}`
    );
  }
}

export async function getUploadUrl(input: GetUploadUrlInput): Promise<UploadUrlResponse> {
  validateInput(input);

  return httpClient.post<UploadUrlResponse>(
    BLUEPRINT_ENDPOINTS.uploadUrl(input.flowId, input.nodeId),
    {
      fileName: input.fileName,
      fileSize: input.fileSize,
      contentType: input.contentType,
    }
  );
}
```

**File:** `frontend/src/entities/blueprint-attachment/api/register-attachment.ts`

```typescript
/**
 * Register attachment after successful direct upload to MinIO.
 */

import { httpClient, BLUEPRINT_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './blueprint-attachment.mapper';

export interface RegisterAttachmentInput {
  flowId: number;
  nodeId: string;
  fileName: string;
  fileSize: number;
  objectKey: string;
}

export async function registerAttachment(
  input: RegisterAttachmentInput
): Promise<CommandResult> {
  return httpClient.post<CommandResult>(
    BLUEPRINT_ENDPOINTS.register(input.flowId, input.nodeId),
    {
      fileName: input.fileName,
      fileSize: input.fileSize,
      objectKey: input.objectKey,
    }
  );
}
```

### 3. Rewrite upload-attachment.ts

**File:** `frontend/src/entities/blueprint-attachment/api/upload-attachment.ts`

```typescript
/**
 * Upload blueprint attachment using presigned URL (direct to MinIO).
 */

import { DomainValidationError, BLUEPRINT_ENDPOINTS } from '@/shared/api';
import type { CommandResult } from './blueprint-attachment.mapper';
import { fileTypeRules, MAX_FILE_SIZE } from '../model/allowed-file-type';
import { getUploadUrl } from './get-upload-url';
import { registerAttachment } from './register-attachment';

export interface UploadAttachmentInput {
  flowId: number;
  nodeId: string;
  file: File;
}

function validateUploadInput(input: UploadAttachmentInput): void {
  if (!input.flowId || input.flowId <= 0) {
    throw new DomainValidationError('REQUIRED', 'flowId', 'TaskFlow is required');
  }
  if (!input.nodeId || input.nodeId.trim().length === 0) {
    throw new DomainValidationError('REQUIRED', 'nodeId', 'Node ID is required');
  }
  if (!input.file) {
    throw new DomainValidationError('REQUIRED', 'file', 'File is required');
  }
  if (!input.file.name || input.file.name.trim().length === 0) {
    throw new DomainValidationError('REQUIRED', 'file', 'File name is required');
  }
  if (!fileTypeRules.isAllowedExtension(input.file.name)) {
    throw new DomainValidationError(
      'INVALID',
      'file',
      `File type not allowed. Allowed types: ${fileTypeRules.getAllowedExtensionsString()}`
    );
  }
  if (input.file.size <= 0) {
    throw new DomainValidationError('INVALID', 'file', 'File is empty');
  }
  if (input.file.size > MAX_FILE_SIZE) {
    throw new DomainValidationError(
      'OUT_OF_RANGE',
      'file',
      `File size exceeds maximum of ${fileTypeRules.getMaxFileSizeFormatted()}`
    );
  }
}

/**
 * Upload a blueprint attachment using presigned URL flow:
 * 1. Get presigned upload URL from backend
 * 2. Upload file directly to MinIO
 * 3. Register attachment metadata in backend
 */
export async function uploadAttachment(
  input: UploadAttachmentInput
): Promise<CommandResult> {
  validateUploadInput(input);

  // Step 1: Get presigned upload URL
  const { uploadUrl, objectKey } = await getUploadUrl({
    flowId: input.flowId,
    nodeId: input.nodeId,
    fileName: input.file.name,
    fileSize: input.file.size,
    contentType: input.file.type || 'application/octet-stream',
  });

  // Step 2: Upload directly to MinIO
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: input.file,
    headers: {
      'Content-Type': input.file.type || 'application/octet-stream',
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Direct upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }

  // Step 3: Register attachment in backend
  return registerAttachment({
    flowId: input.flowId,
    nodeId: input.nodeId,
    fileName: input.file.name,
    fileSize: input.file.size,
    objectKey,
  });
}
```

### 4. Update Entity Public API

**File:** `frontend/src/entities/blueprint-attachment/index.ts`

```typescript
// Model
export * from './model/blueprint-attachment';
export * from './model/allowed-file-type';

// API - Queries
export { blueprintAttachmentQueries } from './api/blueprint-attachment.queries';

// API - Commands
export { uploadAttachment, type UploadAttachmentInput } from './api/upload-attachment';
export { deleteAttachment, type DeleteAttachmentInput } from './api/delete-attachment';

// UI
export { AttachmentList } from './ui/AttachmentList';
export { AttachmentCountBadge } from './ui/AttachmentCountBadge';
```

---

## Testing Changes

### Backend Test Updates

**File:** `backend/src/test/java/com/wellkorea/backend/production/api/BlueprintAttachmentControllerTest.java`

Update tests to:
1. Test `POST /upload-url` endpoint
2. Test `POST /register` endpoint
3. Remove tests for old multipart upload endpoint

### MinIO CORS Configuration (if needed)

If MinIO is not configured to accept browser uploads, add CORS policy:

```bash
mc alias set myminio http://localhost:9000 minioadmin minioadmin
mc admin config set myminio cors <<EOF
{
   "cors": {
      "rules": [
         {
            "allowedHeaders": ["*"],
            "allowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
            "allowedOrigins": ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"],
            "exposeHeaders": ["ETag"],
            "maxAgeSeconds": 3600
         }
      ]
   }
}
EOF
mc admin service restart myminio
```

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `MinioFileStorage.java` | MODIFY | Use `publicMinioClient` for presigned URLs |
| `UploadUrlRequest.java` | CREATE | Request DTO for upload URL |
| `UploadUrlResponse.java` | CREATE | Response DTO with URL and key |
| `RegisterAttachmentRequest.java` | CREATE | Request DTO for registration |
| `BlueprintAttachmentService.java` | MODIFY | Add `generateUploadUrl()`, `registerAttachment()`; remove `uploadAttachment()` |
| `BlueprintAttachmentController.java` | MODIFY | Add new endpoints; remove old upload endpoint |
| `BlueprintAttachmentControllerTest.java` | MODIFY | Update tests for new flow |
| `endpoints.ts` | MODIFY | Add `uploadUrl`, `register`; remove `upload`, `download` |
| `get-upload-url.ts` | CREATE | Get presigned URL function |
| `register-attachment.ts` | CREATE | Register attachment function |
| `upload-attachment.ts` | REWRITE | Use presigned URL flow |
| `index.ts` (entity) | MODIFY | Update exports if needed |

---

## Implementation Order

1. **Backend DTOs** - Create request/response records
2. **MinioFileStorage** - Fix presigned URL client usage
3. **BlueprintAttachmentService** - Add new methods
4. **BlueprintAttachmentController** - Add new endpoints, remove old
5. **Backend Tests** - Update tests
6. **Frontend endpoints.ts** - Update endpoint definitions
7. **Frontend API functions** - Create new, rewrite upload
8. **Integration test** - End-to-end verification

---

## Rollback Plan

If issues arise:
1. Revert controller to accept MultipartFile
2. Revert service to proxy upload
3. Revert frontend to use FormData upload

Keep Git commits atomic for easy rollback.
