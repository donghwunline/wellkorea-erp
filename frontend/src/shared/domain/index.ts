/**
 * Shared domain types.
 *
 * Types that are shared across multiple entities.
 * These live in shared/ to avoid cross-entity imports.
 */

// Entity types (approval workflow)
export {
  EntityType,
  EntityTypeConfigs,
  getEntityTypeLabel,
  type EntityTypeConfig,
} from './entity-type';

// Role types (auth/user)
export {
  type RoleName,
  ALL_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_BADGE_VARIANTS,
  type RoleBadgeVariant,
} from './role';

// User types (auth/user)
export type { User } from './user';

// Attachment types (file uploads)
export {
  type AttachmentOwnerType,
  type AttachmentFileType,
  type Attachment,
  ATTACHMENT_MAX_SIZE,
  attachmentRules,
} from './attachment';

// Project document types (unified document view)
export {
  type ProjectDocumentType,
  type ProjectDocument,
  projectDocumentRules,
} from './project-document';
