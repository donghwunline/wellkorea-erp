/**
 * Blueprint Attachment Entity - Public API
 *
 * Exports:
 * - Domain types (BlueprintAttachment, AllowedFileType)
 * - Business rules (blueprintRules, fileTypeRules)
 * - Query factory (blueprintQueries)
 * - Command functions (uploadAttachment, deleteAttachment)
 * - UI components (FileTypeBadge, AttachmentListItem, AttachmentCountBadge)
 */

// ============================================================================
// Domain Types
// ============================================================================

export type {
  BlueprintAttachment,
  NodeAttachmentSummary,
} from './model/blueprint-attachment';

export type {
  AllowedFileType,
  FileTypeInfo,
} from './model/allowed-file-type';

// ============================================================================
// Business Rules
// ============================================================================

export { blueprintRules } from './model/blueprint-attachment';
export { fileTypeRules, MAX_FILE_SIZE } from './model/allowed-file-type';

// ============================================================================
// Query Factory
// ============================================================================

export { blueprintQueries } from './api/blueprint-attachment.queries';

// ============================================================================
// Command Functions
// ============================================================================

export {
  uploadAttachment,
  type UploadAttachmentInput,
} from './api/upload-attachment';

export {
  deleteAttachment,
  type DeleteAttachmentInput,
} from './api/delete-attachment';

// Re-export CommandResult type for features
export type { CommandResult } from './api/blueprint-attachment.mapper';

// ============================================================================
// UI Components
// ============================================================================

export { FileTypeBadge } from './ui/FileTypeBadge';
export { AttachmentListItem } from './ui/AttachmentListItem';
export { AttachmentCountBadge } from './ui/AttachmentCountBadge';
